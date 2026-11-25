'use strict';
// Parser for decrypted RE4 Remake save data (RE Engine reflection serialization).
// Records the file offset of every scalar so values can be patched in place.
// See FORMAT.md for the format description.
const fs = require('fs');
const path = require('path');

const NAMES = JSON.parse(fs.readFileSync(path.join(__dirname, 'names.json'), 'utf8'));
const VALID_TAGS = new Set([1, 2, 4, 5, 7, 8, 9, 10, 11, 12, 15, 16, 17, 0xffffffff]);

// The end of a "blob" array (elements of irregular size) is found by scanning for something that looks like the next token.
// Random data can look like that, so when the rest of the file fails to parse, the last guess is moved on and the parse is retried.
function parse(b) {
  const skip = new Map(); // blob start offset -> first position to try
  let lastErr = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const decisions = [];
    try { return parseOnce(b, skip, decisions); } catch (e) {
      lastErr = e;
      const d = decisions[decisions.length - 1];
      if (!d) break; // no blob guess to revise
      for (const k of [...skip.keys()]) if (k > d.off) skip.delete(k); // later guesses belonged to the old context
      skip.set(d.off, d.q + 4);
    }
  }
  throw lastErr;
}

function parseOnce(b, skip, decisions) {
  const nodes = [];
  let p = 0;
  const u32 = () => { const v = b.readUInt32LE(p); p += 4; return v; };
  const nm = (h) => NAMES.f[h] || NAMES.c[h] || '0x' + h.toString(16);
  const fail = (m) => { throw new Error(m + ' @0x' + p.toString(16)); };
  const seenFields = new Map(), seenCount = new Map();
  function fieldFitsAncestors(h, parentId) {
    let known = false;
    for (let id = parentId; id >= 0; id = nodes[id].p) {
      const n = nodes[id]; if (n.k !== 'o') continue;
      if ((seenCount.get(n.ch) || 0) < 2) continue; // a class seen only once says nothing about which fields may follow
      known = true;
      const set = seenFields.get(n.ch); if (set && set.has(h)) return true;
    }
    return !known; // no class with enough history: cannot judge, accept
  }
  // a scalar record [hash][tag][size][value] whose end is exactly where a new object starts looks like a false match inside blob data
  function recordEndsAtObject(q) {
    const tag = b.readUInt32LE(q + 4); if (tag === 0xf || tag === 0x11 || tag === 0xffffffff) return false;
    const e = q + 12 + ((b.readUInt32LE(q + 8) + 3) & ~3); if (e + 8 > b.length) return false;
    const n = b.readUInt32LE(e), c = b.readUInt32LE(e + 4);
    return n > 0 && n < 4096 && !!NAMES.c[c];
  }
  // The elements of these blobs are 48 bytes: three doubles (position), 8 spare bytes and a unit quaternion of four floats.
  // Between (and before) elements there can be blocks of random-looking bytes of varying length, so the elements are found by shape.
  function elementOk(o) {
    if (o + 48 > b.length) return false;
    for (let i = 0; i < 3; i++) { const hi = b.readUInt32LE(o + i * 8 + 4); const e = (hi >>> 20) & 0x7ff; if (hi !== 0 && (e < 0x3c0 || e > 0x412)) return false; }
    let sq = 0;
    for (let i = 0; i < 4; i++) { const f = b.readFloatLE(o + 32 + i * 4); if (!(Math.abs(f) <= 1.0001)) return false; sq += f * f; }
    return sq > 0.8 && sq < 1.2;
  }
  function blobElementsEnd(start, cnt, esz) {
    const plain = (start + cnt * esz + 3) & ~3;
    if (esz !== 48) return plain;
    const limit = start + cnt * 48 + (cnt + 2) * 96 + 512;
    let pos = start, found = 0;
    while (found < cnt && pos + 48 <= b.length && pos < limit) { if (elementOk(pos)) { found++; pos += 48; } else pos += 4; }
    return found === cnt ? (pos + 3) & ~3 : plain;
  }
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
        let q = Math.max(blobElementsEnd(p, cnt, esz), skip.get(p) || 0), ok = false, firstField = -1;
        for (; q + 8 <= b.length; q += 4) {
          const w = b.readUInt32LE(q), w2 = b.readUInt32LE(q + 4);
          if (w > 0 && w < 4096 && NAMES.c[w2]) { ok = true; break; } // start of the next object
          if (NAMES.f[w] && !NAMES.c[w] && VALID_TAGS.has(w2)) {
            // random data can look like a field header: accept it only if an enclosing class is known to have such a field
            if (firstField < 0) firstField = q;
            if (fieldFitsAncestors(w, parent) || !recordEndsAtObject(q)) { ok = true; break; }
          }
        }
        if (!ok && firstField >= 0) { q = firstField; ok = true; }
        if (!ok) fail('resync failed');
        decisions.push({ off: p, q });
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
    if (!NAMES.c[ch] && n !== 0) fail('unknown class 0x' + ch.toString(16));
    const node = add({ k: 'o', n: name, p: parent, ch, c: NAMES.c[ch] || '', f: [] });
    seenCount.set(ch, (seenCount.get(ch) || 0) + 1);
    let sf = seenFields.get(ch); if (!sf) seenFields.set(ch, (sf = new Set()));
    for (let i = 0; i < n; i++) {
      const h = u32(); sf.add(h);
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
      const v = Number(s); if (!Number.isInteger(v)) throw new Error('A whole number is required');
      if (n.tag === 7) { if (v < 0 || v > 4294967295) throw new Error('Allowed range: 0..4294967295'); b.writeUInt32LE(v, n.off); }
      else { if (v < -2147483648 || v > 2147483647) throw new Error('Allowed range: -2147483648..2147483647'); b.writeInt32LE(v, n.off); }
    }
  } else if (n.sz === 8) {
    let v; try { v = BigInt(s); } catch { throw new Error('An integer is required'); }
    b.writeBigInt64LE(BigInt.asIntN(64, v), n.off);
  }
  return readValue(b, n);
}

module.exports = { parse, readValue, writeValue, isEditable, NAMES };
