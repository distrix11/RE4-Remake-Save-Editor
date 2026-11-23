'use strict';
// Records the layout hash (HashValue) of every top-level save section found in decrypted slot files, so the editor can warn
// when a game update changes the format.
// Usage: node scripts/make-known-format.js <folder with decrypted *Slot.bin files>   (writes app/known-format.json)
const fs = require('fs');
const path = require('path');
const P = require('../app/parser');
const I = require('../app/inventory');

const dir = process.argv[2];
if (!dir) { console.error('Usage: node scripts/make-known-format.js <folder with decrypted *Slot.bin files>'); process.exit(1); }
const known = {};
for (const f of fs.readdirSync(dir).filter((x) => /Slot\.bin$/.test(x))) {
  const b = fs.readFileSync(path.join(dir, f)); const S = { buf: b, parsed: P.parse(b) };
  for (const o of I.sections(S)) {
    const h = o.f.find((x) => x[0] === 'HashValue'); if (!h) continue;
    const v = String(P.readValue(b, S.parsed.nodes[h[1]]));
    const e = (known[o.c] = known[o.c] || { hashes: [] });
    if (!e.hashes.includes(v)) e.hashes.push(v);
  }
}
fs.writeFileSync(path.join(__dirname, '..', 'app', 'known-format.json'), JSON.stringify(known, null, 1));
console.log('wrote app/known-format.json with', Object.keys(known).length, 'sections;', Object.values(known).filter((e) => e.hashes.length > 1).length, 'with several hashes');
