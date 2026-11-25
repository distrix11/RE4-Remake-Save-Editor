'use strict';
// Builds app/weapons.json: one clean copy of every weapon found in real saves (structure only: no upgrades, nothing loaded, no GUID).
// Weapons already in app/weapons.json are kept (and refreshed when found again).
// usage: node scripts/build-weapon-library.js <folder>:<steam account id> [<folder>:<id> ...]
// The folders hold data00xSlot.bin files. The account ids are only used to decrypt them and are not written anywhere.
const fs = require('fs');
const path = require('path');
const LIME = require('../app/lime');
const { parse, readValue, writeValue } = require('../app/parser');
const INV = require('../app/inventory');

const args = process.argv.slice(2).filter((a) => a.includes(':') && !a.startsWith('--'));
if (!args.length) { console.error('usage: node scripts/build-weapon-library.js <folder>:<account id> [...]'); process.exit(1); }
const out = path.join(__dirname, '..', 'app', 'weapons.json');
const old = (() => { try { return JSON.parse(fs.readFileSync(out, 'utf8')).weapons || {}; } catch { return {}; } })();
// not offered: tested in the game as new weapons and not accepted
const EXCLUDE = new Set([
  '278197056', // the Separate Ways weapon with the same upgrades: removed too
  '278214656', // the game refuses to load the slot ("incompatible save data")
]);
const found = new Map(); // itemId -> { sw, samples: [{S, idx, parts, dura}] }

for (const a of args) {
  const cut = a.lastIndexOf(':'); const dir = a.slice(0, cut), acc = a.slice(cut + 1);
  for (const f of fs.readdirSync(dir).filter((x) => /^data\d+Slot\.bin$/.test(x))) {
    let S; try { const buf = LIME.unpack(fs.readFileSync(path.join(dir, f)), acc); S = { buf, parsed: parse(buf) }; } catch (e) { console.log('skip', f, e.message.slice(0, 50)); continue; }
    const sw = Number(/\d+/.exec(f)[0]) >= 100;
    const m = INV.model(S)[0]; if (!m) continue;
    for (const it of m.items) {
      if (it.cls !== 'WeaponItem' || !it.upg) continue;
      const id = String(it.itemId.value); const key = id;
      if (EXCLUDE.has(id)) continue;
      const e = found.get(key) || { sw, samples: [] };
      if (e.sw !== sw) { console.log('ID', id, 'is in both campaigns: kept as', e.sw ? 'Separate Ways' : 'main game'); continue; }
      e.samples.push({ S, idx: it.idx, dura: it.durability ? Number(it.durability.value) : null });
      found.set(key, e);
    }
  }
}

// start from what the library already has: a rebuild from other saves adds to it and refreshes, it never drops weapons
const weapons = {};
for (const [id, w] of Object.entries(old)) if (!EXCLUDE.has(id)) weapons[id] = w;
for (const [id, e] of [...found].sort((x, y) => Number(x[0]) - Number(y[0]))) {
  // prefer a sample without attachments (a scope or stock refers to another item of that save by its GUID)
  let pick = null;
  for (const s of e.samples) {
    const it = INV.itemObj(s.S, INV.caseEntry(s.S, s.idx));
    const pc = it.f.find((x) => x[0] === '_CurrentWeaponPartsCustom');
    const datas = pc && s.S.parsed.nodes[pc[1]].f.find((x) => x[0] === '_Datas');
    s.parts = datas ? s.S.parsed.nodes[datas[1]].cnt : 0;
    if (!pick || (s.parts === 0 && pick.parts > 0)) pick = s;
  }
  const { S, idx } = pick;
  if (pick.parts > 0) { // take the attachments off: they point to other items of that save by GUID
    const pc0 = INV.itemObj(S, INV.caseEntry(S, idx)).f.find((x) => x[0] === '_CurrentWeaponPartsCustom');
    const d0 = S.parsed.nodes[S.parsed.nodes[pc0[1]].f.find((x) => x[0] === '_Datas')[1]]; d0.items = []; d0.cnt = 0;
  }
  INV.setAllUpgrades(S, 0, idx, 0); // no upgrades, no exclusive upgrade
  const entryId = INV.caseEntry(S, idx);
  const it = INV.itemObj(S, entryId);
  const set = (name, v) => { const n = it.f.find((x) => x[0] === name); if (n) writeValue(S.buf, S.parsed.nodes[n[1]], String(v)); };
  set('_CurrentAmmoCount', 0); set('_CurrentTacticalAmmoCount', 0);
  const g = it.f.find((x) => x[0] === '_ID'); if (g) S.buf.fill(0, S.parsed.nodes[g[1]].off, S.parsed.nodes[g[1]].off + 16);
  const model = INV.model(S)[0].items[idx];
  const prev = old[id] || {};
  weapons[id] = { ...(prev.name ? { name: prev.name } : {}), sw: e.sw, upg: model.upg.map((u) => u.key), tree: INV.exportTemplate(S, entryId.id) };
  console.log(id, (INV.CATALOG[id] || {}).n || '(not in the catalogue)', e.sw ? 'SW' : 'main', 'upgrades:', weapons[id].upg.join(','));
}
fs.writeFileSync(out, JSON.stringify({ about: 'Clean weapon entries taken from real saves (see scripts/build-weapon-library.js). No personal data.', weapons }));
console.log('written', Object.keys(weapons).length, 'weapons,', (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
