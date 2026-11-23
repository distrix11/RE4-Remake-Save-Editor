'use strict';
// Pure JavaScript decryption and encryption of the Steam save files of Resident Evil 4 (2023): the "DSSS / Lime" container.
// This is a port of the algorithm of LimebrellaSharp by Michal Gebicki (MIT, https://github.com/mi5hmash/LimebrellaSharp), so that neither
// .NET nor an extra executable is needed. The long-integer parts of the original (modular exponentiation and division on 2048-bit containers)
// are written with BigInt; AES-128 in OFB mode and SHA3-256 come from Node's crypto.
//
// File layout: header (0x10) + N segments (0x1220 each) + footer (0x8C).
//   segment: 4 hashed key banks (0x80 each: 8-limb header, 8-limb key fragment) + 4096 bytes of data + SHA3-256 checksum of the plain data (0x20)
//   footer : 0x80 random salt, int64 length of the plain data, uint32 Murmur3 hash of the whole file
// The AES key and the IV of a segment (4 limbs of 64 bits) come from the key banks and the Steam account id.
const crypto = require('crypto');

const M64 = (1n << 64n) - 1n;
const HEADER_SIZE = 0x10, SEGMENT_SIZE = 0x1220, FOOTER_SIZE = 0x8C, DATA_SIZE = 0x1000, BANK_SIZE = 0x80, BANKS = 4;
const MAGIC = 0x53535344, ENC_TYPE = 0x10, KEY_TYPE = 0x14n;

const fromLE = (buf) => { let v = 0n; for (let i = buf.length - 1; i >= 0; i--) v = (v << 8n) | BigInt(buf[i]); return v; };
const toLE = (v, len) => { const b = Buffer.alloc(len); for (let i = 0; i < len; i++) { b[i] = Number(v & 0xFFn); v >>= 8n; } return b; };
const PRIVATE_KEY_1 = fromLE(Buffer.from('8ztvuXKgtyUV5Fw5GCnhgq2Km9wKZNNETXnIEKuGNxc=', 'base64'));
const PRIVATE_KEY_3 = fromLE(Buffer.from('5m9USvzOaMXvB7mgeyd1hTRKHbYTdugx9zufvV9E9xU=', 'base64'));

function modPow(base, exp, mod) {
  let result = 1n; base %= mod;
  while (exp > 0n) { if (exp & 1n) result = (result * base) % mod; base = (base * base) % mod; exp >>= 1n; }
  return result;
}
// the key banks of every file carry this header (the original checks it too)
const HEADER_KEY = modPow(PRIVATE_KEY_3, KEY_TYPE, PRIVATE_KEY_1);
const SEGMENT_MAGIC = [0x5B49D50217C839BBn, 0x772BEEF5D2441867n, 0x6E236B076EEB11B8n, 0x1216F542E37CEE41n];

const notId = (accountId) => (~BigInt(accountId)) & M64;

// the 32 bytes AES key + IV of a segment, from its four key banks
function segmentKey(seg, notUser) {
  const out = Buffer.alloc(32);
  for (let i = 0; i < BANKS; i++) {
    const bank = seg.subarray(i * BANK_SIZE, (i + 1) * BANK_SIZE);
    const a = modPow(fromLE(bank.subarray(0, 64)), notUser, PRIVATE_KEY_1);
    const frag = fromLE(bank.subarray(64, 128));
    out.writeBigUInt64LE(a === 0n ? 0n : (frag / a) & M64, i * 8);
  }
  return out;
}
// AES-128 in OFB mode: the same operation encrypts and decrypts
function ofb(data, key32) {
  const c = crypto.createCipheriv('aes-128-ofb', key32.subarray(0, 16), key32.subarray(16, 32));
  return Buffer.concat([c.update(data), c.final()]);
}
const checksum = (plain) => crypto.createHash('sha3-256').update(plain).digest();

// Murmur3 (32 bit) over the 32-bit words of the file without its last word, seed 0xFFFFFFFF
function murmur(buf, end) {
  const rotl = (x, r) => ((x << r) | (x >>> (32 - r))) >>> 0;
  let h = 0xFFFFFFFF;
  for (let i = 0; i < end; i += 4) {
    let k = Math.imul(0xCC9E2D51, buf.readUInt32LE(i)) >>> 0;
    k = Math.imul(0x1B873593, rotl(k, 15)) >>> 0;
    h = (Math.imul(5, (rotl((k ^ h) >>> 0, 13) - 0x052250EC) | 0)) >>> 0;
  }
  const basis = (end ^ h) >>> 0;
  const t = Math.imul(0x85EBCA6B, (basis ^ ((basis >>> 16) & 0xFFFF)) >>> 0) >>> 0;
  const r = Math.imul(0xC2B2AE35, (t ^ (t >>> 13)) >>> 0) >>> 0;
  return (r ^ (r >>> 16)) >>> 0;
}

function isEncrypted(buf) {
  if (buf.length < HEADER_SIZE + FOOTER_SIZE + SEGMENT_SIZE || (buf.length - HEADER_SIZE - FOOTER_SIZE) % SEGMENT_SIZE !== 0) return false;
  return buf.readUInt32LE(0) === MAGIC && buf.readUInt32LE(8) === ENC_TYPE;
}

// encrypted file -> plain data
function unpack(file, accountId) {
  if (!isEncrypted(file)) throw new Error('This is not an encrypted save file');
  const notUser = notId(accountId);
  const count = (file.length - HEADER_SIZE - FOOTER_SIZE) / SEGMENT_SIZE;
  const parts = [];
  for (let s = 0; s < count; s++) {
    const seg = file.subarray(HEADER_SIZE + s * SEGMENT_SIZE, HEADER_SIZE + (s + 1) * SEGMENT_SIZE);
    if (s === 0) for (let i = 0; i < 4; i++) if (seg.readBigUInt64LE(i * 8) !== SEGMENT_MAGIC[i]) throw new Error('Invalid segment header');
    const plain = ofb(seg.subarray(BANKS * BANK_SIZE, BANKS * BANK_SIZE + DATA_SIZE), segmentKey(seg, notUser));
    if (s === 0 && !checksum(plain).equals(seg.subarray(BANKS * BANK_SIZE + DATA_SIZE, SEGMENT_SIZE))) {
      throw new Error('Decryption failed (checksum mismatch): this save belongs to another Steam account');
    }
    parts.push(plain);
  }
  const len = Number(file.readBigInt64LE(file.length - FOOTER_SIZE + 0x80));
  return Buffer.concat(parts).subarray(0, len);
}

// plain data -> encrypted file (a fresh random salt and random keys, like the original tool)
function pack(plain, accountId) {
  const notUser = notId(accountId);
  const count = Math.max(1, Math.ceil(plain.length / DATA_SIZE));
  const out = Buffer.alloc(HEADER_SIZE + count * SEGMENT_SIZE + FOOTER_SIZE);
  out.writeUInt32LE(MAGIC, 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(ENC_TYPE, 8); out.writeUInt32LE(0, 12);
  const seed = modPow(modPow(PRIVATE_KEY_3, notUser, PRIVATE_KEY_1), KEY_TYPE, PRIVATE_KEY_1);
  let rnd = crypto.randomBytes(8).readBigUInt64LE(0);
  const header = toLE(HEADER_KEY, 64);
  for (let s = 0; s < count; s++) {
    const seg = out.subarray(HEADER_SIZE + s * SEGMENT_SIZE, HEADER_SIZE + (s + 1) * SEGMENT_SIZE);
    for (let i = 0; i < BANKS; i++) {
      header.copy(seg, i * BANK_SIZE);
      toLE((seed * rnd) & ((1n << 512n) - 1n), 64).copy(seg, i * BANK_SIZE + 64);
      rnd = (rnd + 1n) & M64;
    }
    const data = Buffer.alloc(DATA_SIZE); plain.copy(data, 0, s * DATA_SIZE, Math.min(plain.length, (s + 1) * DATA_SIZE));
    checksum(data).copy(seg, BANKS * BANK_SIZE + DATA_SIZE);
    ofb(data, segmentKey(seg, notUser)).copy(seg, BANKS * BANK_SIZE);
  }
  const foot = out.length - FOOTER_SIZE;
  crypto.randomBytes(0x80).copy(out, foot);
  out.writeBigInt64LE(BigInt(plain.length), foot + 0x80);
  out.writeUInt32LE(murmur(out, out.length - 4), out.length - 4);
  return out;
}

module.exports = { unpack, pack, isEncrypted, murmur, HEADER_KEY };
