'use strict';
// Re-emits a parsed tree into a fresh buffer, recomputing alignment padding for the new layout.
// This is what makes structural edits (adding/removing array elements) possible.
// Padding bytes (stack garbage in the original) are written as zeros.

function serialize(parsed, buf) {
  const nodes = parsed.nodes;
  const chunks = [];
  let pos = 0;
  const pads = []; // [start, length] of padding regions, for verification

  const w32 = (v) => { const c = Buffer.alloc(4); c.writeUInt32LE(v >>> 0); chunks.push(c); pos += 4; };
  const raw = (b) => { chunks.push(b); pos += b.length; };
  const zeros = (n) => { if (n > 0) { chunks.push(Buffer.alloc(n)); pads.push([pos, n]); pos += n; } };
  // alignment is relative to the original file, which has a 16-byte DSSS header before our buffer
  const align = (sz) => {
    if (sz >= 8 && (sz & (sz - 1)) === 0) zeros((((pos + 16 + sz - 1) & ~(sz - 1)) - 16) - pos);
  };
  const pad4 = () => zeros(((pos + 3) & ~3) - pos);
  const payload = (n, len) => (n.data ? n.data : buf.subarray(n.off, n.off + len));

  function emitObj(n) {
    w32(n.f.length); w32(n.ch);
    for (const [, cid, fh] of n.f) { w32(fh); emitValue(nodes[cid], true); }
  }
  function emitValue(n, isField) {
    if (n.k === 'a') {
      w32(0xffffffff); w32(n.et); w32(n.esz); w32(n.cnt); w32(n.fl);
      if (n.et === 0x11) { for (const id of n.items) emitObj(nodes[id]); }
      else if (n.blob) {
        if (((pos - n.off) % 128) !== 0) throw new Error('The physics block would shift, so inserting at this place is not possible');
        raw(buf.subarray(n.off, n.end));
      } else {
        if (n.cnt > 0) align(n.esz);
        raw(payload(n, n.cnt * n.esz)); pad4();
      }
    } else if (n.k === 'o') {
      w32(0x11); emitObj(n);
    } else { // scalar
      w32(n.tag);
      if (n.str !== undefined) { w32(n.sz); raw(Buffer.from(n.str, 'utf16le')); pad4(); }
      else { w32(n.sz); align(n.sz); raw(payload(n, n.sz)); pad4(); }
    }
  }

  raw(parsed.head);
  const root = nodes[parsed.root];
  for (const [, cid] of root.f) emitValue(nodes[cid], true);
  raw(buf.subarray(parsed.end)); // trailer (SaveFileDetail etc.)
  return { buf: Buffer.concat(chunks), pads };
}

module.exports = { serialize };
