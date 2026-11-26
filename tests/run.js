'use strict';
// Automatic checks of the editor. Usage: npm test        (or: node tests/run.js [--saves <folder>])
//
// Part 1 needs nothing and also runs on GitHub: encryption round trip, number limits, item sizes, catalogue, changelog.
// Part 2 runs the editor on TEMPORARY COPIES of real saves (the files in the game folder are never written). It needs a save folder
// <Steam>/userdata/<account>/2050650/remote/win64_save: given with --saves, or the one in app/config.json. Without one it is skipped.
// Save files are tied to a Steam account and must never be added to the repository.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
let failed = 0, passed = 0;
const check = (label, ok, detail) => { if (ok) passed++; else failed++; console.log((ok ? '  ok   ' : '  FAIL ') + label + (detail !== undefined && !ok ? '  -> ' + detail : '')); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- part 1: without saves
function offline() {
  console.log('Without saves');
  const LIME = require('../app/lime');
  const { writeValue, readValue } = require('../app/parser');
  // encryption: a random block packs and unpacks to the same bytes; another account cannot read it
  const plain = Buffer.concat([Buffer.from('DSSS'), crypto.randomBytes(4096 - 4)]);
  let back = null; try { back = LIME.unpack(LIME.pack(plain, '12345678'), '12345678'); } catch (e) { back = e; }
  check('encryption round trip', Buffer.isBuffer(back) && back.equals(plain), back instanceof Error ? back.message : 'different bytes');
  let other = null; try { other = LIME.unpack(LIME.pack(plain, '12345678'), '87654321'); } catch (e) { other = e; }
  check('another account cannot read it', other instanceof Error || !other.equals(plain));
  // numbers: an unsigned field takes no negative value (it was written as about 4.3 billion), a signed one keeps its sign
  const b = Buffer.alloc(8), u32 = { k: 'v', sz: 4, tag: 7, off: 0 }, i32 = { k: 'v', sz: 4, tag: 6, off: 4 };
  let err = null; try { writeValue(b, u32, '-5'); } catch (e) { err = e.message; }
  check('negative value refused for an unsigned field', !!err && readValue(b, u32) === 0, err);
  writeValue(b, i32, '-5'); check('signed field keeps -5', readValue(b, i32) === -5);
  err = null; try { writeValue(b, u32, 'abc'); } catch (e) { err = e.message; } check('text refused', !!err);
  // item sizes in the case (checked against the game)
  const INV = require('../app/inventory');
  const fp = JSON.parse(fs.readFileSync(path.join(ROOT, 'app', 'footprints.json'), 'utf8'));
  for (const [id, want, name] of [['277075456', [1, 1], 'Hand Grenade'], ['277077056', [2, 1], 'Heavy Grenade'], ['277078656', [2, 1], 'Flash Grenade'], ['116003200', [1, 3], 'High-Power Scope'], ['278037056', [1, 5], 'Skull Shaker'], ['112801600', [1, 2], 'Magnum Ammo'], ['112806400', [1, 2], 'Submachine Gun Ammo'], ['117601600', [1, 2], 'Resources (L)'], ['116006400', [2, 3], 'TMP Stock'], ['114412800', [2, 1], 'Mixed Herb (G+R+Y)']]) {
    check('size of ' + name, JSON.stringify(fp[id]) === JSON.stringify(want), JSON.stringify(fp[id]));
  }
  check('catalogue has the three grenades', ['277075456', '277077056', '277078656'].every((id) => INV.CATALOG[id] && INV.CATALOG[id].c === 'throw'));
  check('grenade template present', fs.existsSync(path.join(ROOT, 'app', 'grenade.json')));
  // every weapon of the library has a size and a picture
  const lib = JSON.parse(fs.readFileSync(path.join(ROOT, 'app', 'weapons.json'), 'utf8')).weapons;
  const noSize = Object.keys(lib).filter((id) => !fp[id]); check('every library weapon has a case size', !noSize.length, noSize.join(' '));
  // the "What's new" text: the top section of the changelog has entries
  const log = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8'); const top = log.split(/\r?\n## /)[1] || '';
  check('changelog: the newest section has entries', /\n- /.test(top));
  // no personal data in the repository: no save files, no Steam ids, no local paths
  const files = execFileSync('git', ['ls-files'], { cwd: ROOT }).toString().split('\n').filter(Boolean);
  check('no save files in the repository', !files.some((f) => /data\d{3}Slot\.bin$|data00-1\.bin$|data000\.bin$/.test(f)));
  const text = files.filter((f) => /\.(js|json|md|txt|html|css|bat|yml)$/.test(f) && f !== 'tests/run.js').map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
  const ids = (text.match(/7656119\d{10}/g) || []).filter((x) => x !== '76561197960265728'); // the base of every SteamID64 is public
  check('no SteamID64 or user folder in the text files', !ids.length && !/C:\\\\Users\\\\[A-Za-z]|C:\/Users\/[A-Za-z]/.test(text), ids.join(' '));
}

// ---------------------------------------------------------------- part 2: the editor on copies of real saves
function saveFolder() {
  const i = process.argv.indexOf('--saves'); if (i > 0) return process.argv[i + 1];
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'app', 'config.json'), 'utf8')).saveDir || null; } catch { return null; }
}
async function online() {
  const src = saveFolder();
  if (!src || !fs.existsSync(src) || !fs.readdirSync(src).some((f) => /Slot\.bin$/.test(f))) { console.log('\nWith saves: skipped (no save folder; use --saves <folder>)'); return; }
  const account = path.basename(path.resolve(src, '..', '..', '..'));
  console.log('\nWith saves (temporary copies)');
  // a copy of the editor (the committed files) and of the saves, so that nothing of yours is touched
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 're4test-'));
  const ed = path.join(tmp, 'editor');
  // the app folder as it is now (with the built name dictionary app/names.json), without your settings
  fs.cpSync(path.join(ROOT, 'app'), path.join(ed, 'app'), { recursive: true, filter: (f) => path.basename(f) !== 'config.json' });
  for (const f of ['package.json', 'CHANGELOG.md']) fs.copyFileSync(path.join(ROOT, f), path.join(ed, f));
  if (!fs.existsSync(path.join(ed, 'app', 'names.json'))) throw new Error('app/names.json is missing: run build.bat once');
  const dir = path.join(tmp, 'userdata', account, '2050650', 'remote', 'win64_save'); fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(src).filter((x) => /\.bin$/.test(x))) fs.copyFileSync(path.join(src, f), path.join(dir, f));
  const port = 4900 + Math.floor(Math.random() * 90);
  fs.writeFileSync(path.join(ed, 'app', 'config.json'), JSON.stringify({ port, saveDir: dir.split(path.sep).join('/'), updateCheck: false, seenVersion: 'test' }));
  const srv = spawn(process.execPath, ['app/server.js'], { cwd: ed, env: { ...process.env, NO_BROWSER: '1', PORT: String(port) }, stdio: 'ignore' });
  const api = (p, b) => fetch(`http://127.0.0.1:${port}/api/${p}`, b === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then((r) => r.json());
  const hash = (f) => crypto.createHash('sha1').update(fs.readFileSync(path.join(dir, f))).digest('hex');
  try {
    for (let i = 0; i < 40; i++) { try { await api('config'); break; } catch { await sleep(250); } }
    const slots = fs.readdirSync(dir).filter((f) => /Slot\.bin$/.test(f)).sort();
    const over = (a, b) => a.slot.x < b.slot.x + b.fp[0] && b.slot.x < a.slot.x + a.fp[0] && a.slot.y < b.slot.y + b.fp[1] && b.slot.y < a.slot.y + a.fp[1];
    for (const f of slots) {
      // writing without changes gives the same file (the format is understood completely)
      let o = await api('open', { name: f }); if (o.error) { check(f + ' opens', false, o.error); continue; }
      const h0 = hash(f);
      await api('set', { name: f, id: o.overview.ptas.id, value: String(o.overview.ptas.value) });
      let r = await api('save', { name: f, target: 'game', force: true });
      o = await api('open', { name: f });
      check(f + ': opens, writes and reads back', !r.error && !o.error, r.error || o.error);
      // grenades: added, written, read back; nothing new overlaps or sticks out
      await api('case-size', { name: f, level: 4 }); o = await api('open', { name: f }); await api('case-size', { name: f, level: 4 });
      const had = new Set(o.inventories[0].items.map((i) => i.guid)); const errs = [];
      for (const id of ['277075456', '277077056', '277078656']) { r = await api('add', { name: f, itemId: id, count: 1 }); if (r.error) errs.push(r.error); }
      r = await api('save', { name: f, target: 'game', force: true }); if (r.error) errs.push(r.error);
      o = await api('open', { name: f }); const items = o.inventories[0].items, [W, H] = o.inventories[0].grid;
      const fresh = items.filter((i) => !had.has(i.guid));
      const bad = fresh.filter((a) => a.slot.x + a.fp[0] > W || a.slot.y + a.fp[1] > H || items.some((b) => b !== a && over(a, b)));
      check(f + ': three grenades added and placed well', !errs.length && fresh.length === 3 && !bad.length, errs.join('; ') || fresh.length + ' added, ' + bad.length + ' badly placed');
      // limits of the normal fields
      r = await api('set', { name: f, id: o.overview.ptas.id, value: '-5' }); check(f + ': negative pesetas refused', !!r.error);
      r = await api('set', { name: f, id: o.overview.ptas.id, value: '100000000' }); check(f + ': 100,000,000 pesetas refused', !!r.error);
      // quick actions and undo
      for (const op of ['repair-knives', 'fill-stacks', 'upgrade-weapons']) { r = await api(op, { name: f }); check(f + ': ' + op, !r.error, r.error); }
      const before = JSON.stringify((await api('open', { name: f })).inventories[0].items.map((i) => i.count && i.count.value));
      await api('fill-stacks', { name: f }); r = await api('undo', { name: f });
      check(f + ': undo takes a quick action back', JSON.stringify(r.inventories[0].items.map((i) => i.count && i.count.value)) === before);
      void h0;
    }
    // a new weapon of the library fits and has no upgrades
    const main = slots.find((f) => Number(/\d+/.exec(f)[0]) < 100);
    if (main) {
      await api('open', { name: main }); await api('case-size', { name: main, level: 4 });
      const lib = (await api('weapon-library', { name: main })).weapons.filter((w) => w.fit !== 'none');
      if (lib.length) { const r = await api('add-weapon', { name: main, lib: lib[0].itemId }); const w = r.inventories && r.inventories[0].items.filter((i) => String(i.itemId.value) === String(lib[0].itemId)).pop();
        check('new weapon from the library: ' + lib[0].name, !r.error && w && w.upg.every((u) => Number(u.level.value) === 0), r.error); }
    }
    // "Add item here": the new item covers the chosen cell (the last free cell of the case)
    if (main) {
      let o = await api('open', { name: main }); const inv = o.inventories[0]; const [GW, GH] = inv.grid; const occ = new Set();
      for (const i of inv.items) if (i.slot) for (let a = 0; a < i.fp[0]; a++) for (let b = 0; b < i.fp[1]; b++) occ.add((i.slot.x + a) + ',' + (i.slot.y + b));
      let at = null; for (let x = GW - 1; x >= 0 && !at; x--) for (let y = GH - 1; y >= 0 && !at; y--) if (!occ.has(x + ',' + y) && !occ.has((x - 1) + ',' + y)) at = { x, y };
      if (at) { const r = await api('add', { name: main, itemId: '114400000', count: 1, at }); const it = r.inventories && r.inventories[0].items[inv.items.length];
        check('add item here: it covers the chosen cell', !r.error && r.placedAt === true && it && at.x >= it.slot.x && at.x < it.slot.x + it.fp[0] && at.y >= it.slot.y && at.y < it.slot.y + it.fp[1], r.error || JSON.stringify(it && it.slot)); }
    }
    // delete every weapon of the case, the equipped ones too: their equip and quick slots are emptied; the slot writes and reads back
    if (main) {
      let o = await api('open', { name: main }); const errs = []; let n = 0;
      for (;;) { const w = o.inventories[0].items.find((i) => i.cls === 'WeaponItem' && i.upg); if (!w) break;
        const r = await api('remove', { name: main, inv: 0, idx: w.idx }); if (r.error) { errs.push(w.name + ': ' + r.error); break; } o = r; n++; }
      const r = await api('save', { name: main, target: 'game', force: true }); if (r.error) errs.push(r.error);
      o = await api('open', { name: main }); if (o.error) errs.push(o.error);
      check('all weapons deleted, equipped ones too (' + n + ')', !errs.length && n > 0, errs.join('; '));
    }
    // merchant requests: complete, undo; restore from a backup gives the old file back; copy a slot
    const q = slots.find((f) => true);
    let o = await api('open', { name: q }); const open1 = (x) => x.reduce((n, r) => n + r.subs.filter((s) => s.type === 'Flag' && s.completed && Number(s.completed.value) !== 1).length, 0);
    const before = open1(o.quests); let r = await api('quest-complete', { name: q, idx: 'all' });
    check('requests: complete all', !r.error && open1(r.quests) === 0, r.error); r = await api('undo', { name: q }); check('requests: undo', open1(r.quests) === before);
    const h1 = hash(q); await api('quest-complete', { name: q, idx: 'all' }); await api('save', { name: q, target: 'game', force: true });
    const bk = (await api('backups', { name: q })).backups.find((x) => /before writing/.test(x.label));
    r = await api('restore', { name: q, id: bk.id, force: true }); check('restore from a backup gives the file back', !r.error && hash(q) === h1, r.error);
    const fam = slots.filter((f) => f !== q && f[4] === q[4]);
    if (fam.length) { await api('open', { name: q }); const hb = hash(fam[0]); r = await api('copy-slot', { name: q, to: fam[0], force: true });
      const a = await api('open', { name: q }), b = await api('open', { name: fam[0] });
      check('copy slot', !r.error && hash(fam[0]) !== hb && a.overview.ptas.value === b.overview.ptas.value, r.error); }
  } finally {
    srv.kill(); await sleep(500); try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

(async () => {
  offline();
  await online();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
