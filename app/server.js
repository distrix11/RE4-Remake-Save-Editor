'use strict';
// Local web server for the RE4 Remake save editor.
// Decryption and encryption of the save files is done in JavaScript (lime.js, a port of LimebrellaSharp): no .NET or other program is needed.
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile, spawn } = require('child_process');
const { parse, readValue, writeValue, isEditable } = require('./parser');
const INV = require('./inventory');
const { hashName } = require('./murmur');
const LIME = require('./lime');
const STEAM = require('./steam');
const { buildHints } = require('./achievements');
const QUEST_INFO = JSON.parse(fs.readFileSync(path.join(__dirname, 'quests.json'), 'utf8'));
const readJsonSafe = (p, dflt) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return dflt; } };
const UPD = require('./updater');
const KNOWN = readJsonSafe(path.join(__dirname, 'known-format.json'), {}); // class name -> { hashes: [...] } of the supported save layouts
const VERSION = (readJsonSafe(path.join(__dirname, '..', 'package.json'), {}).version) || '0.0.0';

const ROOT = path.join(__dirname, '..');
const CFG_PATH = path.join(__dirname, 'config.json');
const SAVE_RE = /^data[0-9-]+(Slot)?\.bin$/;
const isSeparateWaysSlot = (n) => Number((/^data(\d+)Slot\.bin$/.exec(n || '') || [])[1]) >= 100; // slots 100 and up are Separate Ways
const DEFAULT_CFG = {
  saveDir: null, // auto-detected when empty, see detectSaveDir()
  port: 4784,
};

// Find every <Steam>/userdata/<account>/2050650/remote/win64_save that contains saves (newest first).
function detectSaveDirs() {
  const roots = [];
  try {
    const out = require('child_process').execFileSync('reg', ['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath'], { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
    const m = /SteamPath\s+REG_SZ\s+(.+)/.exec(out); if (m) roots.push(m[1].trim());
  } catch { /* Steam not registered */ }
  roots.push('C:/Program Files (x86)/Steam', 'C:/Program Files/Steam');
  const found = []; const seen = new Set();
  for (const r of roots) {
    const ud = path.join(r, 'userdata'); if (!fs.existsSync(ud)) continue;
    for (const acc of fs.readdirSync(ud)) {
      const dir = path.join(ud, acc, '2050650', 'remote', 'win64_save');
      if (seen.has(dir.toLowerCase())) continue;
      try {
        const files = fs.readdirSync(dir).filter((x) => SAVE_RE.test(x));
        if (files.length) { seen.add(dir.toLowerCase()); found.push({ dir, account: acc, mtime: Math.max(...files.map((x) => fs.statSync(path.join(dir, x)).mtimeMs)) }); }
      } catch { /* no saves for this account */ }
    }
  }
  return found.sort((x, y) => y.mtime - x.mtime);
}
function detectSaveDir() { const f = detectSaveDirs(); return f.length ? f[0].dir : null; }

const cfg = Object.assign({}, DEFAULT_CFG, readJsonSafe(CFG_PATH, {}));
if (process.env.PORT) cfg.port = Number(process.env.PORT);
if (!cfg.saveDir) cfg.saveDir = detectSaveDir();
const STEAM_BASE = 76561197960265728n;
let accountId = null, steamId64 = null;
const WORK = path.join(ROOT, 'work');
const BACKUPS = path.join(ROOT, 'backup', 'auto');
const INITIAL_ROOT = path.join(ROOT, 'backup', 'initial');
const OUTPUT = path.join(ROOT, 'output');

const sessions = new Map(); // file name -> {buf, parsed, loadedAt}

// ---------------------------------------------------------------- CLI helpers
function rmrf(p) { try { fs.rmSync(p, { recursive: true, force: true }); } catch { /* ignore */ } }

const unpackCache = new Map(); // name -> {mtime, buf}
// Switch to another save folder: recompute the Steam id, drop open files and make the one-time first-run backup.
function applySaveDir(dir) {
  cfg.saveDir = dir || null;
  accountId = dir ? path.basename(path.resolve(dir, '..', '..', '..')) : null;
  steamId64 = accountId && /^\d+$/.test(accountId) ? String(STEAM_BASE + BigInt(accountId)) : null;
  sessions.clear(); unpackCache.clear();
  if (!dir || !accountId) return;
  const ini = path.join(INITIAL_ROOT, accountId);
  if (fs.existsSync(ini)) return;
  try { // one-time copy of every save file, so there is always a way back to how things were before the first edit
    fs.mkdirSync(ini, { recursive: true });
    for (const f of fs.readdirSync(dir).filter((x) => SAVE_RE.test(x))) fs.copyFileSync(path.join(dir, f), path.join(ini, f));
    console.log('First run: a copy of all your save files was made in backup/initial.');
  } catch (e) { console.log('[WARNING] Could not make the first-run backup: ' + e.message); }
}
applySaveDir(cfg.saveDir);
async function unpackCached(name) {
  const mtime = fs.statSync(path.join(cfg.saveDir, name)).mtimeMs;
  const c = unpackCache.get(name);
  if (c && c.mtime === mtime) return Buffer.from(c.buf);
  const buf = await unpackFile(name);
  unpackCache.set(name, { mtime, buf: Buffer.from(buf) });
  return buf;
}
// modification time and size of a save file in the game folder (null when it is gone)
function diskStamp(name) { try { const st = fs.statSync(path.join(cfg.saveDir, name)); return { mtime: st.mtimeMs, size: st.size }; } catch { return null; } }
// true when the file was changed (by the game, Steam Cloud, another tool) after the slot was opened in the editor
function changedOnDisk(S) { if (!S || !S.stamp) return false; const now = diskStamp(S.name); return !now || now.mtime !== S.stamp.mtime || now.size !== S.stamp.size; }
function needAccount() {
  if (!accountId || !/^\d+$/.test(accountId)) throw new Error('The Steam account of this folder is unknown (the folder must look like <Steam>/userdata/<account>/2050650/remote/win64_save)');
  return accountId;
}
async function unpackFile(name, srcPath) {
  const src = srcPath || path.join(cfg.saveDir, name);
  try { return LIME.unpack(fs.readFileSync(src), needAccount()); }
  catch (e) { throw new Error('Cannot decrypt ' + name + ': ' + e.message); }
}
async function packBuffer(name, plain) { return LIME.pack(plain, needAccount()); }
// Writes `packed` to `dest` only after proving it decrypts back to exactly `plain`; the swap is atomic (temp file + rename).
async function writeVerified(name, plain, packed, dest) {
  const tmp = path.join(WORK, 'verify-' + Date.now()); fs.mkdirSync(tmp, { recursive: true });
  try {
    const probe = path.join(tmp, name); fs.writeFileSync(probe, packed);
    const back = await unpackFile(name, probe);
    if (Buffer.compare(back, plain) !== 0) throw new Error('Safety check failed: the encrypted file does not decrypt back to the edited data. Nothing was written.');
  } finally { rmrf(tmp); }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const part = dest + '.re4tmp'; fs.writeFileSync(part, packed); fs.renameSync(part, dest);
  if (Buffer.compare(fs.readFileSync(dest), packed) !== 0) throw new Error('Safety check failed: the written file differs from the prepared one. Restore it from the backup.');
}
let gameCache = { t: 0, v: false };
function gameRunning() {
  if (Date.now() - gameCache.t < 2000) return Promise.resolve(gameCache.v);
  return new Promise((resolve) => {
    execFile('tasklist', ['/FI', 'IMAGENAME eq re4.exe', '/NH'], { windowsHide: true }, (e, so) => {
      const v = !e && /re4\.exe/i.test(so); gameCache = { t: Date.now(), v }; resolve(v);
    });
  });
}

// ---------------------------------------------------------------- format guard
function formatWarnings(S) {
  if (!Object.keys(KNOWN).length) return [];
  const out = [];
  for (const o of INV.sections(S)) {
    const k = KNOWN[o.c]; const label = o.c.split('.').slice(-2).join('.');
    if (!k) { out.push('New section: ' + label); continue; }
    const h = o.f.find((x) => x[0] === 'HashValue');
    if (h && !k.hashes.includes(String(readValue(S.buf, S.parsed.nodes[h[1]])))) out.push('Changed layout: ' + label);
  }
  return out.slice(0, 12);
}
function guard(S) {
  if (S.warnings && S.warnings.length && !cfg.allowUnknownFormat) {
    throw new Error('This save has an unrecognised format version (' + S.warnings[0] + '). Adding, moving and removing items is disabled to protect your file. ' +
      'Money and simple values can still be edited. To override, set "allowUnknownFormat": true in app/config.json.');
  }
}

// ---------------------------------------------------------------- diagnostics (no personal data)
const LOG = [];
for (const m of ['log', 'error']) { const orig = console[m].bind(console); console[m] = (...a) => { LOG.push(a.map(String).join(' ')); if (LOG.length > 300) LOG.shift(); orig(...a); }; }
function mask(text) {
  let t = String(text).replace(/(userdata[\\/])\d+/gi, '$1<account>').replace(/(Users[\\/])[^\\/\s"']+/gi, '$1<user>');
  if (steamId64) t = t.split(steamId64).join('<steamid>');
  for (const r of [ROOT, ROOT.split('\\').join('/')]) t = t.split(r).join('<editor>'); // the folder the editor is installed in
  return t;
}
function diagnostics() {
  const lines = [
    'RE4 Save Editor ' + VERSION, 'Node ' + process.version + ' on ' + os.platform() + ' ' + os.release() + ' ' + os.arch(),
    'Encryption: built-in (JavaScript)',
    'Save folder: ' + mask(cfg.saveDir || '(not found)'),
    'Files: ' + (cfg.saveDir ? fileList().map((x) => x.name + ' ' + x.size).join(', ') : '-'),
    'Known-format sections: ' + Object.keys(KNOWN).length + ', allowUnknownFormat: ' + !!cfg.allowUnknownFormat,
    'Open sessions: ' + ([...sessions.values()].map((x) => x.name + (x.warnings && x.warnings.length ? ' [' + x.warnings.join('; ') + ']' : '')).join(', ') || 'none'),
    '', '--- last log lines ---', ...LOG.slice(-60),
  ];
  return Promise.resolve(mask(lines.join('\n')));
}

// ---------------------------------------------------------------- model building
function describe(S, id) {
  const n = S.parsed.nodes[id];
  const out = { id, name: n.n, kind: n.k, path: [] };
  for (let q = n; q && q.p >= 0; q = S.parsed.nodes[q.p]) out.path.unshift({ id: q.id, name: q.n });
  if (n.k === 'o') {
    out.cls = n.c;
    out.children = n.f.map(([name, cid]) => childRow(S, name, cid));
  } else if (n.k === 'a') {
    out.info = { et: n.et, esz: n.esz, cnt: n.cnt, blob: !!n.blob };
    if (n.et === 0x11) out.children = n.items.map((cid, i) => childRow(S, '[' + i + ']', cid));
    else out.children = rawArrayRows(S, n);
  }
  return out;
}
function rawArrayRows(S, n) {
  if (n.blob || !n.cnt || (n.esz !== 4 && n.esz !== 1)) return [];
  const rows = [];
  for (let i = 0; i < Math.min(n.cnt, 500); i++) {
    const off = n.off + i * n.esz;
    const v = n.esz === 1 ? S.buf[off] : (n.et === 0xb ? Number(S.buf.readFloatLE(off).toPrecision(8)) : S.buf.readInt32LE(off));
    rows.push({ name: '[' + i + ']', kind: 'e', value: v, off, esz: n.esz, et: n.et, editable: true });
  }
  return rows;
}
function childRow(S, name, cid) {
  const c = S.parsed.nodes[cid];
  const r = { id: cid, name, kind: c.k };
  if (c.k === 'o') { r.cls = c.c; r.count = c.f.length; }
  else if (c.k === 'a') { r.count = c.cnt; r.et = c.et; }
  else { r.tag = c.tag; r.sz = c.sz; r.value = readValue(S.buf, c); r.editable = isEditable(c); }
  return r;
}

// ---------------------------------------------------------------- HTTP
function send(res, code, body, type) {
  const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(code, { 'Content-Type': type || 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(data);
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let s = ''; req.on('data', (c) => { s += c; if (s.length > 25e6) req.destroy(); });
    req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } });
  });
}
function fresh(S) { return { overview: INV.overview(S), inventories: INV.model(S), quests: INV.quests(S), treasures: INV.treasures(S), nodes: S.parsed.nodes.length, root: S.parsed.root, dirty: S.dirty, undo: (S.undo || []).length }; }
function need(name) {
  if (!SAVE_RE.test(name || '')) throw new Error('Invalid file name');
  const S = sessions.get(name);
  if (!S) throw new Error('File is not open');
  return S;
}
function fileList() {
  if (!cfg.saveDir) return [];
  return fs.readdirSync(cfg.saveDir).filter((f) => SAVE_RE.test(f)).map((f) => {
    const st = fs.statSync(path.join(cfg.saveDir, f));
    return { name: f, size: st.size, mtime: st.mtimeMs, open: sessions.has(f), dirty: !!(sessions.get(f) && sessions.get(f).dirty) };
  });
}

function listBackups(name) {
  const out = [];
  if (fs.existsSync(BACKUPS)) {
    for (const d of fs.readdirSync(BACKUPS).sort().reverse()) {
      const p = path.join(BACKUPS, d, name);
      if (!fs.existsSync(p)) continue;
      const st = fs.statSync(p);
      out.push({ id: 'auto/' + d, label: backupLabel(d), when: st.mtimeMs, size: st.size, path: p });
    }
  }
  const o = path.join(INITIAL_ROOT, accountId || '_', name);
  if (fs.existsSync(o)) { const st = fs.statSync(o); out.push({ id: 'initial', label: 'First-run copy (state before any edit)', when: st.mtimeMs, size: st.size, path: o }); }
  return out;
}
function backupLabel(d) {
  return d.endsWith('_before-restore') ? 'State before restore' : d.endsWith('_before-copy') ? 'State before slot copy' : 'Backup before writing to the game';
}
// every backup of every file, newest first (for the backup manager)
function allBackups() {
  const out = [];
  if (fs.existsSync(BACKUPS)) {
    for (const d of fs.readdirSync(BACKUPS)) {
      const dp = path.join(BACKUPS, d);
      let isDir = false; try { isDir = fs.statSync(dp).isDirectory(); } catch { /* ignore */ }
      if (!isDir) continue;
      for (const file of fs.readdirSync(dp).filter((x) => SAVE_RE.test(x))) {
        const st = fs.statSync(path.join(dp, file));
        out.push({ id: 'auto/' + d, file, label: backupLabel(d), when: st.mtimeMs, size: st.size, protected: false });
      }
    }
  }
  const ini = path.join(INITIAL_ROOT, accountId || '_');
  if (fs.existsSync(ini)) for (const file of fs.readdirSync(ini).filter((x) => SAVE_RE.test(x))) {
    const st = fs.statSync(path.join(ini, file));
    out.push({ id: 'initial', file, label: 'First-run copy (state before any edit)', when: st.mtimeMs, size: st.size, protected: true });
  }
  return out.sort((x, y) => y.when - x.when);
}
async function restoreFrom(name, srcPath, force) {
  if (!force && await gameRunning()) return { running: true };
  // validate: it must decrypt with this account and parse
  const plain = await unpackFile(name, srcPath);
  parse(plain);
  const dest = path.join(cfg.saveDir, name);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-') + '_before-restore';
  const bk = path.join(BACKUPS, stamp);
  fs.mkdirSync(bk, { recursive: true });
  if (fs.existsSync(dest)) fs.copyFileSync(dest, path.join(bk, name));
  const part = dest + '.re4tmp'; fs.copyFileSync(srcPath, part); fs.renameSync(part, dest); // atomic swap
  sessions.delete(name); unpackCache.delete(name);
  return { ok: true, backup: bk };
}

// ---- copy a slot into another slot --------------------------------------------
const SLOT_RE = /^data(\d{3})Slot\.bin$/;
function slotFamily(name) { const m = SLOT_RE.exec(name); return m ? m[1][0] : null; }
// Patch the trailer (SaveFileDetail): numeric Slot field and the slot number in the Detail text.
function retargetSlot(plain, parsed, targetNo) {
  const t = parsed.end;
  const slotHash = hashName('Slot');
  for (let i = t; i + 16 <= plain.length; i += 4) {
    if (plain.readUInt32LE(i) === slotHash && plain.readUInt32LE(i + 4) === 7 && plain.readUInt32LE(i + 8) === 4) { plain.writeUInt32LE(targetNo, i + 12); break; }
  }
  // every UTF-16 string record in the trailer: [tag=15][chars][text]; fix the "slot N / MODE / CHAPTER" label
  for (let i = t; i + 8 <= plain.length; i += 4) {
    if (plain.readUInt32LE(i) !== 15) continue;
    const chars = plain.readUInt32LE(i + 4); const start = i + 8;
    if (chars < 3 || chars > 400 || start + chars * 2 > plain.length) continue;
    const str = plain.subarray(start, start + chars * 2).toString('utf16le');
    const m = /(\d+)(?= \/ )/.exec(str);
    if (m && String(targetNo).length === m[1].length) Buffer.from(String(targetNo), 'utf16le').copy(plain, start + m.index * 2);
  }
}
async function copySlot(from, to, force) {
  if (!SLOT_RE.test(from) || !SLOT_RE.test(to) || from === to) throw new Error('Invalid files');
  if (slotFamily(from) !== slotFamily(to)) throw new Error('You can only copy between slots of the same kind (regular 0xx or 1xx)');
  if (!fs.existsSync(path.join(cfg.saveDir, to))) throw new Error('The target slot does not exist in the save folder - choose an existing one');
  if (!force && await gameRunning()) return { running: true };
  const S0 = sessions.get(from);
  const plain = S0 && S0.dirty ? Buffer.from(S0.buf) : await unpackCached(from);
  const parsed = parse(plain);
  retargetSlot(plain, parsed, Number(SLOT_RE.exec(to)[1]));
  parse(plain); // sanity
  const packed = await packBuffer(to, plain);
  const dest = path.join(cfg.saveDir, to);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-') + '_before-copy';
  const bk = path.join(BACKUPS, stamp); fs.mkdirSync(bk, { recursive: true });
  fs.copyFileSync(dest, path.join(bk, to));
  await writeVerified(to, plain, packed, dest);
  sessions.delete(to); unpackCache.delete(to);
  return { ok: true, backup: bk };
}

// the bullet points of "## <version> ..." in CHANGELOG.md; none if that version has no section
function releaseNotes(version) {
  let text = ''; try { text = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8'); } catch { return []; }
  const lines = text.split(/\r?\n/); const start = lines.findIndex((l) => l === '## ' + version || l.startsWith('## ' + version + ' '));
  if (start < 0) return [];
  const out = [];
  for (const l of lines.slice(start + 1)) { if (l.startsWith('## ')) break; if (l.startsWith('- ')) out.push(l.slice(2).trim()); }
  return out;
}

// [min, max, what] for the fields that the normal tabs edit. The maximum of money is a safe limit, not one read from the game.
const FIELD_LIMITS = {
  PTAS: [0, 99999999, 'Pesetas'], SpinelCount: [0, 999, 'Spinel'],
  _CurrentItemCount: [1, 9999, 'Count'], _CurrentAmmoCount: [0, 999, 'Ammo'], _CurrentDurability: [0, 10000, 'Durability'],
};

const routes = {
  'POST /api/achievements': async (b) => {
    const steam = STEAM.readAchievements(cfg.saveDir);
    const S = b.name && /Slot\.bin$/.test(b.name) ? sessions.get(b.name) : null;
    let stats = null, hints = {};
    if (S) { stats = { game: INV.gameStats(S), range: INV.rangeStats(S), weapons: INV.weaponStatus(S) }; hints = buildHints(S, stats); }
    return { steam, stats, hints };
  },
  'POST /api/copy-targets': async (b) => {
    if (!SLOT_RE.test(b.name || '')) throw new Error('Only save slots can be copied');
    const fam = slotFamily(b.name);
    return { targets: fileList().filter((x) => x.name !== b.name && SLOT_RE.test(x.name) && slotFamily(x.name) === fam).map((x) => ({ name: x.name, size: x.size, mtime: x.mtime })) };
  },
  'POST /api/copy-slot': async (b) => copySlot(b.name, b.to, b.force),
  'POST /api/diff': async (b) => {
    const S = need(b.name);
    const changes = INV.describeChanges(S, S.orig, (id) => (QUEST_INFO[id] ? QUEST_INFO[id].n.replace(/ \(.*\)$/, '') : ''));
    return { changes, dirty: !!S.dirty, rawEdits: Object.keys(S.edits || {}).length };
  },
  'POST /api/move': async (b) => { const S = need(b.name); guard(S); INV.moveItem(S, Number(b.inv), Number(b.idx), b.x, b.y, b.dir); S.dirty = true; return fresh(S); },
  'POST /api/sort': async (b) => { const S = need(b.name); guard(S); const r = INV.sortCase(S, Number(b.inv)); S.dirty = true; return { ...r, ...fresh(S) }; },
  'POST /api/case-skin': async (b) => { const S = need(b.name); guard(S); const r = INV.setCaseSkin(S, b.skin); S.dirty = true; return { ...r, ...fresh(S) }; },
  'POST /api/repair-knives': async (b) => { const S = need(b.name); guard(S); const r = INV.repairKnives(S); if (r.changed) S.dirty = true; return { ...r, ...fresh(S) }; },
  'POST /api/fill-stacks': async (b) => { const S = need(b.name); guard(S); const r = INV.fillStacks(S); if (r.changed) S.dirty = true; return { ...r, ...fresh(S) }; },
  'POST /api/case-size': async (b) => { const S = need(b.name); guard(S); INV.setCaseSize(S, b.level); S.dirty = true; return fresh(S); },
  'POST /api/upgrade': async (b) => { const S = need(b.name); guard(S); const r = INV.setUpgrade(S, Number(b.inv), Number(b.idx), b.key, b.level); S.dirty = true; return { ...r, ...fresh(S) }; },
  'POST /api/upgrade-all': async (b) => { const S = need(b.name); guard(S); const r = INV.setAllUpgrades(S, Number(b.inv), Number(b.idx), b.level); S.dirty = true; return { ...r, ...fresh(S) }; },
  'POST /api/backups': async (b) => {
    if (!SAVE_RE.test(b.name || '')) throw new Error('Invalid file name');
    return { backups: listBackups(b.name).map(({ path: _p, ...rest }) => rest) };
  },
  'POST /api/restore': async (b) => {
    if (!SAVE_RE.test(b.name || '')) throw new Error('Invalid file name');
    const item = listBackups(b.name).find((x) => x.id === b.id);
    if (!item) throw new Error('Backup not found');
    return restoreFrom(b.name, item.path, b.force);
  },
  'POST /api/restore-upload': async (b) => {
    if (!SAVE_RE.test(b.name || '')) throw new Error('Invalid file name');
    const buf = Buffer.from(String(b.data || ''), 'base64');
    if (buf.length < 1000 || buf.readUInt32LE(0) !== 0x53535344) throw new Error('This is not an RE4 save file (no DSSS header)');
    const tmp = path.join(WORK, 'upload-' + Date.now()); fs.mkdirSync(tmp, { recursive: true });
    const p = path.join(tmp, b.name); fs.writeFileSync(p, buf);
    try { return await restoreFrom(b.name, p, b.force); }
    catch (e) { throw new Error('The file does not fit (another Steam account or corrupted): ' + e.message); }
    finally { rmrf(tmp); }
  },
  // update check (once a day, can be turned off in About)
  'GET /api/update': async () => ({ enabled: cfg.updateCheck !== false, repo: UPD.REPO, ...UPD.cached(VERSION) }),
  'POST /api/update': async (b) => {
    if (typeof b.enabled === 'boolean') {
      cfg.updateCheck = b.enabled; const conf = readJsonSafe(CFG_PATH, {}); conf.updateCheck = b.enabled; fs.writeFileSync(CFG_PATH, JSON.stringify(conf, null, 2));
    }
    const enabled = cfg.updateCheck !== false;
    // a manual check works even when the daily check is off
    const r = b.check ? await UPD.check(VERSION, true) : (enabled ? await UPD.check(VERSION, false) : UPD.cached(VERSION));
    return { enabled, repo: UPD.REPO, ...r };
  },
  // "What's new": the notes of this version from CHANGELOG.md, offered once (the version seen is kept in config.json)
  'GET /api/whatsnew': async () => ({ version: VERSION, items: releaseNotes(VERSION), seen: cfg.seenVersion === VERSION }),
  'POST /api/whatsnew-seen': async () => { cfg.seenVersion = VERSION; const conf = readJsonSafe(CFG_PATH, {}); conf.seenVersion = VERSION; fs.writeFileSync(CFG_PATH, JSON.stringify(conf, null, 2)); return { ok: true }; },
  // the one-time "Advanced is for experienced users" confirmation is remembered in config.json
  'POST /api/advanced-accept': async () => { cfg.advancedAccepted = true; const conf = readJsonSafe(CFG_PATH, {}); conf.advancedAccepted = true; fs.writeFileSync(CFG_PATH, JSON.stringify(conf, null, 2)); return { ok: true }; },
  'POST /api/update-dismiss': async (b) => { UPD.dismiss(b.version); return { ok: true }; },
  'GET /api/settings': async () => ({ saveDir: cfg.saveDir, candidates: detectSaveDirs().map((c) => ({ dir: c.dir, account: c.account, mtime: c.mtime })), configFile: CFG_PATH, version: VERSION }),
  'POST /api/settings': async (b) => {
    const dir = path.resolve(String(b.saveDir || ''));
    let ok = false; try { ok = fs.statSync(dir).isDirectory() && fs.readdirSync(dir).some((x) => SAVE_RE.test(x)); } catch { /* not a folder */ }
    if (!ok) throw new Error('That folder does not exist or contains no RE4 save files (data001Slot.bin and similar).');
    const conf = readJsonSafe(CFG_PATH, {}); conf.saveDir = dir; fs.writeFileSync(CFG_PATH, JSON.stringify(conf, null, 2));
    applySaveDir(dir);
    return { ok: true, saveDir: dir };
  },
  // desktop shortcut with an icon (a .js file itself cannot have one): done by Windows Script Host, only when the button is pressed
  'POST /api/shortcut': async () => new Promise((resolve, reject) => {
    const wscript = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'wscript.exe');
    execFile(wscript, ['//B', '//Nologo', path.join(__dirname, 'make-shortcut.js')], { timeout: 20000, windowsHide: true },
      (e) => (e ? reject(new Error('The shortcut could not be created' + (e.code === 2 ? ': "Start RE4 Save Editor.js" was not found in the editor folder.' : '. Create it by hand: right-click "Start RE4 Save Editor.js" > Send to > Desktop.'))) : resolve({ ok: true })));
  }),
  'POST /api/browse': async () => new Promise((resolve, reject) => { // native folder dialog
    const ps = "Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.FolderBrowserDialog; $d.Description = 'Select the folder that contains your RE4 save files (data001Slot.bin ...)'; $d.ShowNewFolderButton = $false; if ($d.ShowDialog() -eq 'OK') { $d.SelectedPath }";
    execFile('powershell', ['-NoProfile', '-STA', '-Command', ps], { timeout: 300000 }, (e, out) => (e ? reject(new Error('Could not open the folder dialog: ' + e.message)) : resolve({ dir: String(out).trim() || null })));
  }),
  'GET /api/diagnostics': async () => ({ text: await diagnostics() }),
  'GET /api/backups-all': async () => {
    const list = allBackups();
    return { backups: list, total: list.reduce((a, x) => a + x.size, 0) };
  },
  'POST /api/backup-delete': async (b) => {
    if (!SAVE_RE.test(b.file || '') || !/^auto\/[A-Za-z0-9._-]+$/.test(b.id || '')) throw new Error('This backup cannot be deleted (the first-run copy is protected).');
    const dir = path.resolve(BACKUPS, b.id.slice(5)); const p = path.join(dir, b.file);
    if (!dir.startsWith(path.resolve(BACKUPS) + path.sep) || !fs.existsSync(p)) throw new Error('Backup not found');
    fs.rmSync(p, { force: true });
    if (!fs.readdirSync(dir).length) fs.rmSync(dir, { recursive: true, force: true });
    return { ok: true };
  },
  'POST /api/backup-cleanup': async (b) => { // keep the newest N automatic backups of every file
    const keep = Math.max(1, Math.min(100, Number(b.keep) || 5)); const perFile = {}; let removed = 0;
    for (const x of allBackups().filter((y) => !y.protected)) {
      const n = (perFile[x.file] = (perFile[x.file] || 0) + 1);
      if (n > keep) {
        const dir = path.resolve(BACKUPS, x.id.slice(5)); fs.rmSync(path.join(dir, x.file), { force: true }); removed++;
        if (fs.existsSync(dir) && !fs.readdirSync(dir).length) fs.rmSync(dir, { recursive: true, force: true });
      }
    }
    return { removed };
  },
  'POST /api/open-folder': async (b) => {
    const dir = b.which === 'save' ? cfg.saveDir : path.join(ROOT, 'backup');
    if (!dir) throw new Error('Folder not found');
    fs.mkdirSync(dir, { recursive: true });
    spawn('explorer.exe', [dir], { detached: true, stdio: 'ignore' }).unref();
    return { ok: true };
  },
  // has the file of an open slot been changed on disk since it was opened? (polled by the editor)
  'POST /api/changed': async (b) => { const S = sessions.get(b.name); const now = S && diskStamp(b.name); return { changed: changedOnDisk(S), stamp: now ? now.mtime : null, dirty: !!(S && S.dirty) }; },
  'GET /api/status': async () => ({ gameRunning: await gameRunning() }),
  'GET /api/config': async () => ({ version: VERSION, advancedAccepted: cfg.advancedAccepted === true, noSaveDir: !cfg.saveDir, files: fileList(), catalog: INV.CATALOG, categories: INV.CATEGORIES, questInfo: QUEST_INFO }),
  'POST /api/summary': async (b) => {
    if (!/Slot.bin$/.test(b.name || '') || !SAVE_RE.test(b.name)) throw new Error('Invalid file name');
    const S = { buf: await unpackCached(b.name) }; S.parsed = parse(S.buf);
    const ov = INV.overview(S);
    return { ptas: ov.ptas && ov.ptas.value, playTime: ov.playTime && ov.playTime.value, saveCount: ov.saveCount && ov.saveCount.value, difficulty: ov.difficulty && ov.difficulty.value, difficultyName: ov.difficultyName, slotInfo: ov.slotInfo };
  },
  'POST /api/open': async (b) => {
    if (!SAVE_RE.test(b.name || '')) throw new Error('Invalid file name');
    const buf = await unpackCached(b.name);
    const parsed = parse(buf);
    const S = { name: b.name, buf, orig: Buffer.from(buf), parsed, dirty: false, edits: {}, undo: [] };
    S.warnings = /Slot\.bin$/.test(b.name) ? formatWarnings(S) : [];
    S.stamp = diskStamp(b.name);
    sessions.set(b.name, S);
    const isSlot = /Slot\.bin$/.test(b.name);
    return { name: b.name, isSlot, warnings: S.warnings, size: buf.length, nodes: parsed.nodes.length, root: parsed.root,
      overview: isSlot ? INV.overview(S) : {}, inventories: isSlot ? INV.model(S) : [], quests: isSlot ? INV.quests(S) : [], treasures: isSlot ? INV.treasures(S) : null };
  },
  'POST /api/node': async (b) => { const S = need(b.name); return describe(S, b.id); },
  // fields of the normal tabs: values the game itself uses (the Advanced tab only keeps to the type of the field)
  'POST /api/set': async (b) => {
    const S = need(b.name);
    let value;
    if (b.id !== undefined) {
      const n = S.parsed.nodes[b.id];
      if (!n || n.k !== 'v') throw new Error('Invalid node');
      const lim = b.raw ? null : FIELD_LIMITS[n.n];
      if (lim) { const v = Number(String(b.value).trim()); if (!Number.isInteger(v) || v < lim[0] || v > lim[1]) throw new Error(lim[2] + ': a whole number from ' + lim[0].toLocaleString('en-US') + ' to ' + lim[1].toLocaleString('en-US')); }
      value = writeValue(S.buf, n, b.value);
      S.edits[n.off] = true;
    } else if (b.off !== undefined) { // raw array element
      const off = Number(b.off), esz = Number(b.esz);
      if (!(off >= 0 && off + esz <= S.buf.length) || ![1, 4].includes(esz)) throw new Error('Invalid offset');
      const v = Number(b.value);
      if (esz === 1) { if (!Number.isInteger(v) || v < 0 || v > 255) throw new Error('Allowed range: 0..255'); S.buf[off] = v; value = v; }
      else if (Number(b.et) === 0xb) { if (!Number.isFinite(v)) throw new Error('A number is required'); S.buf.writeFloatLE(v, off); value = v; }
      else { if (!Number.isInteger(v) || v < -2147483648 || v > 4294967295) throw new Error('Allowed range: -2147483648..4294967295'); v < 0 ? S.buf.writeInt32LE(v, off) : S.buf.writeUInt32LE(v, off); value = v; }
      S.edits[off] = true;
    } else throw new Error('No target');
    S.dirty = true;
    return { value, dirty: true };
  },
  // one step back: the file as it was before the last change (see withUndo)
  'POST /api/undo': async (b) => {
    const S = need(b.name); const step = S.undo.pop();
    if (!step) return { nothing: true, ...fresh(S) };
    S.buf = step.buf; S.parsed = parse(S.buf); S.edits = step.edits; S.dirty = !S.buf.equals(S.orig);
    return { ok: true, ...fresh(S) };
  },
  'POST /api/revert': async (b) => {
    const S = need(b.name); S.buf = Buffer.from(S.orig); S.parsed = parse(S.buf); S.dirty = false; S.edits = {};
    return { ok: true, ...fresh(S) };
  },
  'POST /api/search': async (b) => {
    const S = need(b.name); const q = String(b.q || '').toLowerCase(); if (q.length < 2) return { results: [] };
    const out = [];
    for (const n of S.parsed.nodes) {
      if (((n.n && n.n.toLowerCase().includes(q)) || (n.c && n.c.toLowerCase().includes(q))) && n.p >= 0) {
        out.push({ id: n.id, parent: n.p, name: n.n, kind: n.k, cls: n.c, value: n.k === 'v' ? readValue(S.buf, n) : undefined });
        if (out.length >= 150) break;
      }
    }
    return { results: out };
  },
  'POST /api/add': async (b) => { const S = need(b.name); guard(S); const r = INV.addItem(S, { itemId: b.itemId, count: b.count }); S.dirty = true; return { ...r, ...fresh(S) }; },
  'POST /api/remove': async (b) => { const S = need(b.name); guard(S); INV.removeItem(S, Number(b.inv), Number(b.idx)); S.dirty = true; return fresh(S); },
  // weapons found in the OTHER slots of the SAME campaign (as saved in the game folder): the least upgraded copy of every weapon.
  // The game removes weapons of the other campaign (a Handcannon put into a Separate Ways slot disappeared), so those are not offered.
  'POST /api/weapon-sources': async (b) => {
    const dst = need(b.name);
    const best = new Map();
    for (const f of fileList().map((x) => x.name).filter((n) => /^data\d+Slot\.bin$/.test(n) && n !== b.name && isSeparateWaysSlot(n) === isSeparateWaysSlot(b.name))) {
      let src; try { const buf = await unpackCached(f); src = { name: f, buf, parsed: parse(buf) }; } catch (e) { continue; }
      for (const w of INV.listWeapons(src)) {
        const lv = w.upg.reduce((t, u) => t + u.level, 0), old = best.get(w.itemId);
        if (!old || lv < old.lv) best.set(w.itemId, { ...w, slot: f, lv });
      }
    }
    return { weapons: [...best.values()].sort((x, y) => String(x.name || x.itemId).localeCompare(String(y.name || y.itemId))).map((w) => ({ ...w, ...INV.weaponFit(dst, w.itemId) })) };
  },
  // ready-made weapons (app/weapons.json) of the campaign of this slot
  'POST /api/weapon-library': async (b) => { const S = need(b.name); return { weapons: INV.libraryList(isSeparateWaysSlot(b.name)).map((w) => ({ ...w, ...INV.weaponFit(S, w.itemId) })) }; },
  'POST /api/add-weapon': async (b) => {
    const S = need(b.name); guard(S);
    if (b.lib) { const r = INV.addWeaponFromLibrary(S, String(b.lib), isSeparateWaysSlot(b.name)); S.dirty = true; return { ...r, ...fresh(S) }; }
    if (!SAVE_RE.test(b.from || '') || !/Slot\.bin$/.test(b.from) || b.from === b.name) throw new Error('Invalid source slot');
    if (isSeparateWaysSlot(b.from) !== isSeparateWaysSlot(b.name)) throw new Error('The game removes weapons of the other campaign (Separate Ways and the main game do not share weapons), so this copy would be lost. Take the weapon from a slot of the same campaign.');
    const buf = await unpackCached(b.from); const src = { name: b.from, buf, parsed: parse(buf) };
    const r = INV.addWeaponFrom(S, src, Number(b.idx)); S.dirty = true; return { ...r, ...fresh(S) };
  },
  'POST /api/dup': async (b) => { const S = need(b.name); guard(S); const r = INV.duplicateItem(S, Number(b.inv), Number(b.idx)); S.dirty = true; return { ...r, ...fresh(S) }; },
  'POST /api/quest-complete': async (b) => { const S = need(b.name); const r = INV.completeQuest(S, b.idx === 'all' ? 'all' : Number(b.idx)); if (r.changed) S.dirty = true; return { ...r, ...fresh(S) }; },
  'POST /api/refresh': async (b) => fresh(need(b.name)),
  'POST /api/save': async (b) => {
    const S = need(b.name);
    const target = b.target === 'game' ? 'game' : 'output';
    if (target === 'game' && !b.force && await gameRunning()) return { running: true };
    if (target === 'game' && !b.forceChanged && changedOnDisk(S)) return { changed: true };
    // sanity: the edited buffer must still parse and keep its length
    parse(S.buf);
    const packed = await packBuffer(b.name, S.buf);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    if (target === 'game') {
      const dest = path.join(cfg.saveDir, b.name);
      const bk = path.join(BACKUPS, stamp);
      fs.mkdirSync(bk, { recursive: true });
      fs.copyFileSync(dest, path.join(bk, b.name));
      await writeVerified(b.name, S.buf, packed, dest);
      S.orig = Buffer.from(S.buf); S.dirty = false; S.edits = {}; S.stamp = diskStamp(b.name);
      unpackCache.set(b.name, { mtime: fs.statSync(dest).mtimeMs, buf: Buffer.from(S.buf) });
      return { ok: true, path: dest, backup: bk };
    }
    fs.mkdirSync(OUTPUT, { recursive: true });
    const dest = path.join(OUTPUT, b.name);
    await writeVerified(b.name, S.buf, packed, dest);
    return { ok: true, path: dest };
  },
};

// Every request that changes the open file remembers how it was before, for "Undo". A request that fails half way is rolled back.
const UNDOABLE = new Set(['set', 'add', 'remove', 'dup', 'move', 'sort', 'case-skin', 'case-size', 'upgrade', 'upgrade-all', 'add-weapon', 'quest-complete', 'repair-knives', 'fill-stacks', 'revert'].map((n) => 'POST /api/' + n));
const UNDO_STEPS = 30;
async function withUndo(key, body) {
  const S = UNDOABLE.has(key) ? sessions.get(body.name) : null;
  if (!S) return routes[key](body);
  const before = { buf: Buffer.from(S.buf), edits: { ...S.edits }, dirty: S.dirty };
  let result;
  try { result = await routes[key](body); } catch (e) {
    if (!S.buf.equals(before.buf)) { S.buf = before.buf; S.parsed = parse(S.buf); S.edits = before.edits; S.dirty = before.dirty; }
    throw e;
  }
  if (!S.buf.equals(before.buf)) { S.undo.push(before); if (S.undo.length > UNDO_STEPS) S.undo.shift(); }
  return { ...result, undo: S.undo.length };
}
const NO_SAVE_OK = new Set(['POST /api/shortcut', 'POST /api/advanced-accept', 'GET /api/whatsnew', 'POST /api/whatsnew-seen', 'GET /api/update', 'POST /api/update', 'POST /api/update-dismiss', 'GET /api/config', 'GET /api/status', 'GET /api/settings', 'POST /api/settings', 'POST /api/browse', 'GET /api/diagnostics']);
const MIME = { '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
// Every open window of the editor holds one connection to /api/live. Started by a launcher (EXIT_WITH_WINDOW), the server stops by itself a few
// seconds after the last window is gone (or when none ever appears). The launcher cannot tell reliably: Edge may hand a new window to an old
// process or stay alive in the background.
const windows = new Set();
let exitTimer = null;
function stopWithoutWindows(ms) {
  if (!process.env.EXIT_WITH_WINDOW) return;
  clearTimeout(exitTimer);
  exitTimer = setTimeout(() => { if (!windows.size) process.exit(0); }, ms);
}
function holdWindow(req, res) {
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store' });
  res.write('retry: 1000\n\n');
  windows.add(res); clearTimeout(exitTimer);
  res.on('close', () => { windows.delete(res); if (!windows.size) stopWithoutWindows(8000); });
}
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (req.headers.host && !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host)) return send(res, 403, { error: 'forbidden' });
    const key = req.method + ' ' + url.pathname;
    if (key === 'GET /api/live') return holdWindow(req, res);
    if (routes[key]) {
      if (!cfg.saveDir && !NO_SAVE_OK.has(key)) throw new Error('Save folder not found. Choose it in Settings (gear button) or set saveDir in app/config.json.');
      if (req.method === 'POST' && !(req.headers['content-type'] || '').startsWith('application/json')) return send(res, 415, { error: 'json only' });
      const body = req.method === 'POST' ? await readJson(req) : {};
      return send(res, 200, await withUndo(key, body));
    }
    // pictures: icons/weapons (bundled, original 3D models), icons/items (bundled, original 3D renders) and icons/user (your own, named <item id>.png)
    const im = new RegExp('^/icons/(weapons|items|user|images)/([\\w.-]+\\.(png|webp|jpg))$', 'i').exec(url.pathname);
    if (im) { const ip = path.join(__dirname, '..', 'icons', im[1].toLowerCase(), im[2]); if (!fs.existsSync(ip)) return send(res, 404, 'not found', 'text/plain'); return send(res, 200, fs.readFileSync(ip), MIME['.' + im[3].toLowerCase()]); }
    const f = path.join(__dirname, 'public', url.pathname === '/' ? 'index.html' : url.pathname);
    if (!f.startsWith(path.join(__dirname, 'public')) || !fs.existsSync(f)) return send(res, 404, 'not found', 'text/plain');
    send(res, 200, fs.readFileSync(f), MIME[path.extname(f)] || 'application/octet-stream');
  } catch (e) {
    console.error('[api] ' + e.message);
    send(res, 400, { error: e.message });
  }
});
fs.mkdirSync(WORK, { recursive: true });
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.log('\n[ERROR] Port ' + cfg.port + ' is already in use. The editor may already be running: open http://localhost:' + cfg.port + ' or close the other window.\n');
  else console.log('\n[ERROR] ' + e.message + '\n');
  process.exit(1);
});
server.listen(cfg.port, '127.0.0.1', () => {
  const url = 'http://localhost:' + cfg.port;
  console.log('RE4 Save Editor: ' + url + (cfg.saveDir ? '' : '  (save folder not found, see README)'));
  console.log('Close this window to stop the editor.');
  stopWithoutWindows(90000);
  setTimeout(() => { if (cfg.updateCheck !== false) UPD.check(VERSION, false).catch(() => {}); }, 4000);
  setInterval(() => { if (cfg.updateCheck !== false) UPD.check(VERSION, false).catch(() => {}); }, 6 * 3600 * 1000).unref();
  if (!process.env.NO_BROWSER) { // open the default browser (set NO_BROWSER=1 to disable)
    try { spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore', windowsHide: true }).unref(); } catch { /* the address is printed above */ }
  }
});
