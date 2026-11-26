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
// (278197056 Chicago Sweeper and 278214656 Punisher MC of Separate Ways were here once: the "incompatible save data" of that test was
// the game's own cache, see the README, so they are offered again)
const EXCLUDE = new Set([]);
// weapons only (grenades and eggs are weapon entries too: they have no upgrade blocks); the rocket launchers (2762…) and the boot,
// kitchen and primal knives (2764…) have no upgrades either, nor the rocket launcher of Separate Ways (a weapon of the catalogue)
const keep = (it) => it.cls === 'WeaponItem' && (it.upg || /^276(2|4)/.test(String(it.itemId.value)) || (INV.CATALOG[String(it.itemId.value)] || {}).c === 'weapon');
const found = new Map(); // itemId -> { sw, samples: [{S, idx, parts, dura}] }

for (const a of args) {
  const cut = a.lastIndexOf(':'); const dir = a.slice(0, cut), acc = a.slice(cut + 1);
  for (const f of fs.readdirSync(dir).filter((x) => /^data\d+Slot\.bin$/.test(x))) {
    let S; try { const buf = LIME.unpack(fs.readFileSync(path.join(dir, f)), acc); S = { buf, parsed: parse(buf) }; } catch (e) { console.log('skip', f, e.message.slice(0, 50)); continue; }
    const sw = Number(/\d+/.exec(f)[0]) >= 100;
    let m = INV.model(S)[0]; if (!m) continue;
    // weapons in the storage: each is moved into the case of its own copy of the save, so it has a case entry like the others
    const st = INV.storage(S) || [];
    for (let k = 0; k < st.length; k++) {
      const id = String(st[k].itemId.value); if (st[k].cls !== 'WeaponItem' || m.items.some((x) => String(x.itemId.value) === id)) continue;
      const S2 = { buf: Buffer.from(S.buf), parsed: parse(S.buf) };
      try { INV.storageToCase(S2, k, true); } catch (e) { console.log('skip storage', id, e.message.slice(0, 60)); continue; }
      const it = INV.model(S2)[0].items.slice(-1)[0];
      if (!keep(it)) continue;
      const e = found.get(id) || { sw, samples: [] }; if (e.sw !== sw) { e.both = true; found.set(id, e); continue; }
      e.samples.push({ S: S2, idx: it.idx, dura: it.durability ? Number(it.durability.value) : null }); found.set(id, e);
    }
    for (const it of m.items) {
      if (!keep(it)) continue;
      const id = String(it.itemId.value); const key = id;
      if (EXCLUDE.has(id)) continue;
      const e = found.get(key) || { sw, samples: [] };
      if (e.sw !== sw) { e.both = true; continue; } // the same weapon in both campaigns (Boot Knife): the sample of the first one, offered in both
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
  try { INV.setAllUpgrades(S, 0, idx, 0); } catch { /* a weapon without upgrades (rocket launcher) */ } // no upgrades, no exclusive upgrade
  const entryId = INV.caseEntry(S, idx);
  const it = INV.itemObj(S, entryId);
  const set = (name, v) => { const n = it.f.find((x) => x[0] === name); if (n) writeValue(S.buf, S.parsed.nodes[n[1]], String(v)); };
  set('_CurrentAmmoCount', 0); set('_CurrentTacticalAmmoCount', 0);
  const g = it.f.find((x) => x[0] === '_ID'); if (g) S.buf.fill(0, S.parsed.nodes[g[1]].off, S.parsed.nodes[g[1]].off + 16);
  const model = INV.model(S)[0].items[idx];
  const prev = old[id] || {};
  weapons[id] = { ...(prev.name ? { name: prev.name } : {}), sw: e.sw, ...(e.both || prev.both ? { both: true } : {}), upg: (model.upg || []).map((u) => u.key), tree: INV.exportTemplate(S, entryId.id) };
  console.log(id, (INV.CATALOG[id] || {}).n || '(not in the catalogue)', e.sw ? 'SW' : 'main', 'upgrades:', weapons[id].upg.join(','));
}
fs.writeFileSync(out, JSON.stringify({ about: 'Clean weapon entries taken from real saves (see scripts/build-weapon-library.js). No personal data.', weapons }));
console.log('written', Object.keys(weapons).length, 'weapons,', (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
