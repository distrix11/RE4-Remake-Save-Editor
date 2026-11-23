'use strict';
// Estimates item footprints (in cells) inside the attaché case from the layouts found in decrypted save files,
// and writes app/footprints.json. The result is an UPPER BOUND: no other item's anchor may lie inside the rectangle.
//
// Usage: node scripts/make-footprints.js <folder with decrypted *Slot.bin files>
// (decrypt your saves first, e.g. with require("../app/lime").unpack(file, accountId); never commit them)
const fs = require('fs');
const path = require('path');
const P = require('../app/parser');
const I = require('../app/inventory');

const dir = process.argv[2];
if (!dir) { console.error('Usage: node scripts/make-footprints.js <folder with decrypted *Slot.bin files>'); process.exit(1); }

const feas = {}; const cats = {};
for (const f of fs.readdirSync(dir).filter((x) => /Slot\.bin$/.test(x))) {
  const b = fs.readFileSync(path.join(dir, f)); const S = { buf: b, parsed: P.parse(b) };
  const m = I.model(S)[0]; if (!m || !m.size || !I.CASE_DIMS[m.size.value]) continue;
  const [W, H] = I.CASE_DIMS[m.size.value];
  const items = m.items.filter((i) => i.slot);
  for (const it of items) {
    const id = it.itemId.value; cats[id] = it.cat || 'other'; const rot = it.dir % 2 === 1; const set = new Set();
    for (let w = 1; w <= W; w++) for (let h = 1; h <= H; h++) {
      const [rw, rh] = rot ? [h, w] : [w, h];
      if (it.slot.x + rw > W || it.slot.y + rh > H) continue;
      const hit = items.some((o) => o !== it && o.slot.x >= it.slot.x && o.slot.x < it.slot.x + rw && o.slot.y >= it.slot.y && o.slot.y < it.slot.y + rh);
      if (!hit) set.add(w + ',' + h);
    }
    if (!feas[id]) feas[id] = set; else for (const k of [...feas[id]]) if (!set.has(k)) feas[id].delete(k);
  }
}

const out = {};
for (const id of Object.keys(feas)) {
  const all = [...feas[id]].map((s) => s.split(',').map(Number));
  if (!all.length) continue;
  const pareto = all.filter(([w, h]) => !all.some(([w2, h2]) => (w2 > w || h2 > h) && w2 >= w && h2 >= h));
  let [w, h] = pareto.sort((a, b) => Math.abs(a[0] - a[1]) - Math.abs(b[0] - b[1]) || b[0] * b[1] - a[0] * a[1])[0];
  const isW = cats[id] === 'weapon' || (/^27[0-8]/.test(id) && !/^277/.test(id)); const p4 = id.slice(0, 4);
  // known: knives take 3 cells, starting handguns 6; throwables 1; everything else at most 2 cells
  const cap = p4 === '2764' || (p4 === '2782' && /^2782(06|08)/.test(id)) ? 3 : p4 === '2748' ? 6 : isW ? 12 : cats[id] === 'throw' || /^2770/.test(id) ? 1 : 2;
  while (w * h > cap) { if (w >= h && w > 1) w--; else if (h > 1) h--; else break; }
  out[id] = [w, h];
}
fs.writeFileSync(path.join(__dirname, '..', 'app', 'footprints.json'), JSON.stringify(out));
console.log('wrote app/footprints.json with', Object.keys(out).length, 'items');
