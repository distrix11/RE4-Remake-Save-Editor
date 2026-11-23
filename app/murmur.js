// Murmur3 x86 32-bit (RE Engine name hashing: UTF-8, seed 0xFFFFFFFF)
function mm3(buf, seed) {
  const c1 = 0xcc9e2d51, c2 = 0x1b873593;
  let h = seed >>> 0;
  const n = buf.length >> 2;
  for (let i = 0; i < n; i++) {
    let k = buf.readUInt32LE(i * 4);
    k = Math.imul(k, c1); k = (k << 15) | (k >>> 17); k = Math.imul(k, c2);
    h ^= k; h = (h << 13) | (h >>> 19); h = (Math.imul(h, 5) + 0xe6546b64) >>> 0;
  }
  let k = 0; const t = n * 4;
  switch (buf.length & 3) {
    case 3: k ^= buf[t + 2] << 16;
    case 2: k ^= buf[t + 1] << 8;
    case 1: k ^= buf[t]; k = Math.imul(k, c1); k = (k << 15) | (k >>> 17); k = Math.imul(k, c2); h ^= k;
  }
  h ^= buf.length; h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}
module.exports = { hashName: (s) => mm3(Buffer.from(s, 'utf8'), 0xffffffff) };
