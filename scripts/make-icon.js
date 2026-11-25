'use strict';
// Builds app/icon.ico (the icon of the desktop shortcut) from the 3D herb: renders it at several sizes with scripts/icon-render and
// packs the PNGs into one .ico (PNG-compressed entries, Windows Vista and later). Dev tool, needs internet and Edge/Chrome.
// Usage: node scripts/make-icon.js [item]      (default item: herb_logo)
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const item = process.argv[2] || 'herb_logo';
const sizes = [16, 24, 32, 48, 64, 128, 256];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 're4ico-'));
const pngs = sizes.map((s) => {
  const out = path.join(tmp, String(s));
  const r = spawnSync(process.execPath, [path.join(__dirname, 'icon-render', 'render-procedural.js'), item, '--size', String(s), '--out', out], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('render failed for size ' + s);
  return fs.readFileSync(path.join(out, item + '.png'));
});

const head = Buffer.alloc(6); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
const dir = Buffer.alloc(16 * sizes.length);
let offset = 6 + dir.length;
sizes.forEach((s, i) => {
  const o = i * 16;
  dir[o] = s === 256 ? 0 : s; dir[o + 1] = s === 256 ? 0 : s; // 0 means 256
  dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6); dir.writeUInt32LE(pngs[i].length, o + 8); dir.writeUInt32LE(offset, o + 12);
  offset += pngs[i].length;
});
const dest = path.join(ROOT, 'app', 'icon.ico');
fs.writeFileSync(dest, Buffer.concat([head, dir, ...pngs]));
fs.rmSync(tmp, { recursive: true, force: true });
console.log('wrote', dest, offset, 'bytes');
