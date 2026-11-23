'use strict';
// Parser for decrypted RE4 Remake save data (RE Engine reflection serialization).
// Records the file offset of every scalar so values can be patched in place.
// See FORMAT.md for the format description.
const fs = require('fs');
const path = require('path');

const NAMES = JSON.parse(fs.readFileSync(path.join(__dirname, 'names.json'), 'utf8'));
const VALID_TAGS = new Set([1, 2, 4, 5, 7, 8, 9, 10, 11, 12, 15, 16, 17, 0xffffffff]);

function parse(b) {
  const nodes = [];
  let p = 0;
  const u32 = () => { const v = b.readUInt32LE(p); p += 4; return v; };
  const nm = (h) => NAMES.f[h] || NAMES.c[h] || '0x' + h.toString(16);
  const fail = (m) => { throw new Error(m + ' @0x' + p.toString(16)); };
  const add = (n) => { n.id = nodes.length; nodes.push(n); return n; };
  // alignment is computed relative to the original file (16-byte DSSS header precedes our buffer)
  const align = (sz) => { if (sz >= 8 && (sz & (sz - 1)) === 0) p = ((p + 16 + sz - 1) & ~(sz - 1)) - 16; };

  function parseValue(name, parent, fh) {
    const tag = b.readUInt32LE(p);
    if (tag === 0xffffffff) {
      p += 4;
      const et = u32(), esz = u32(), cnt = u32(), fl = u32();
      const node = add({ k: 'a', n: name, p: parent, fh, et, esz, cnt, fl, items: [] });
      if (et === 0x11) {
        for (let i = 0; i < cnt; i++) node.items.push(parseObj(String(i), node.id).id);
      } else if (et === 0x10 && cnt > 0 && ![8, 16, 32].includes(esz)) {
        // blobs (physics/transform data) have irregular padding: resync on the next known token
        let q = (p + cnt * esz + 3) & ~3, ok = false;
        for (; q + 8 <= b.length; q += 4) {
          const w = b.readUInt32LE(q), w2 = b.readUInt32LE(q + 4);
          if ((NAMES.f[w] && !NAMES.c[w] && VALID_TAGS.has(w2)) || (w > 0 && w < 4096 && NAMES.c[w2])) { ok = true; break; }
        }
        if (!ok) fail('resync failed');
        node.blob = true; node.off = p; node.end = q; p = q;
      } else {
        if (cnt > 0) align(esz);
        node.off = p; p += cnt * esz; p = (p + 3) & ~3;
      }
      return node.id;
    }
    p += 4;
    if (tag === 0x11) { const o = parseObj(name, parent); o.fh = fh; return o.id; }
    const sz = u32();
    if (tag === 0xf) {
      const str = b.subarray(p, p + sz * 2).toString('utf16le');
      const node = add({ k: 'v', n: name, p: parent, fh, tag, sz, off: p, str });
      p += sz * 2; p = (p + 3) & ~3;
      return node.id;
    }
    align(sz);
    const node = add({ k: 'v', n: name, p: parent, fh, tag, sz, off: p });
    p += sz; p = (p + 3) & ~3;
    return node.id;
  }

  function parseObj(name, parent) {
    const n = u32(), ch = u32();
    if (!NAMES.c[ch] && !(n === 0 && ch === 0)) fail('unknown class 0x' + ch.toString(16));
    const node = add({ k: 'o', n: name, p: parent, ch, c: NAMES.c[ch] || '', f: [] });
    for (let i = 0; i < n; i++) {
      const h = u32();
      const fname = nm(h);
      node.f.push([fname, parseValue(fname, node.id, h), h]);
    }
    return node;
  }

  const magic = u32(), ver = u32();
  const rootClass = u32(), fh = u32();
  const root = add({ k: 'o', n: 'root', p: -1, ch: rootClass, c: nm(rootClass), f: [] });
  root.f.push([nm(fh), parseValue(nm(fh), root.id, fh), fh]);
  return { nodes, root: root.id, magic, ver, end: p, trailer: b.length - p, head: Buffer.from(b.subarray(0, 16)) };
}

// ---- value access ---------------------------------------------------------
function readValue(b, n) {
  if (n.str !== undefined) return n.str;
  if (n.sz === 1) return b[n.off];
  if (n.sz === 4) {
    if (n.tag === 0xb) return Number(b.readFloatLE(n.off).toPrecision(8));
    if (n.tag === 7) return b.readUInt32LE(n.off);
    return b.readInt32LE(n.off);
  }
  if (n.sz === 8) return b.readBigInt64LE(n.off).toString();
  return b.subarray(n.off, n.off + n.sz).toString('hex');
}
function isEditable(n) {
  return n.k === 'v' && n.str === undefined && (n.sz === 1 || n.sz === 4 || n.sz === 8);
}
function writeValue(b, n, text) {
  if (!isEditable(n)) throw new Error('This field cannot be edited');
  const s = String(text).trim();
  if (n.sz === 1) {
    const v = Number(s); if (!Number.isInteger(v) || v < 0 || v > 255) throw new Error('Allowed range: 0..255');
    b[n.off] = v;
  } else if (n.sz === 4) {
    if (n.tag === 0xb) { const v = Number(s); if (!Number.isFinite(v)) throw new Error('A number is required'); b.writeFloatLE(v, n.off); }
    else {
      const v = Number(s); if (!Number.isInteger(v) || v < -2147483648 || v > 4294967295) throw new Error('Allowed range: -2147483648..4294967295');
      if (v < 0) b.writeInt32LE(v, n.off); else b.writeUInt32LE(v, n.off);
    }
  } else if (n.sz === 8) {
    let v; try { v = BigInt(s); } catch { throw new Error('An integer is required'); }
    b.writeBigInt64LE(BigInt.asIntN(64, v), n.off);
  }
  return readValue(b, n);
}

module.exports = { parse, readValue, writeValue, isEditable, NAMES };
