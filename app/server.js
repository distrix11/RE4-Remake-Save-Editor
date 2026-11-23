'use strict';
// Local web server for the RE4 Remake save editor.
// Decrypt/encrypt is delegated to the LimebrellaSharp CLI (ref/LimebrellaSharp), the rest is done here.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile, spawn } = require('child_process');
const { parse, readValue, writeValue, isEditable } = require('./parser');
const INV = require('./inventory');
const { hashName } = require('./murmur');
const STEAM = require('./steam');
const { buildHints } = require('./achievements');
const QUEST_INFO = JSON.parse(fs.readFileSync(path.join(__dirname, 'quests.json'), 'utf8'));

const ROOT = path.join(__dirname, '..');
const CFG_PATH = path.join(__dirname, 'config.json');
const SAVE_RE = /^data[0-9-]+(Slot)?\.bin$/;
const DEFAULT_CFG = {
  saveDir: null, // auto-detected when empty, see detectSaveDir()
  // portable SDK from build.bat if present, otherwise the system-wide .NET 10 runtime
  dotnet: fs.existsSync(path.join(ROOT, 'tools', 'dotnet', 'dotnet.exe')) ? path.join(ROOT, 'tools', 'dotnet', 'dotnet.exe') : 'dotnet',
  // release layout (encryptor/) first, then the build.bat layout (ref/)
  cli: fs.existsSync(path.join(ROOT, 'encryptor', 'limebrella-sharp-cli.dll'))
    ? path.join(ROOT, 'encryptor', 'limebrella-sharp-cli.dll')
    : path.join(ROOT, 'ref', 'LimebrellaSharp', 'limebrella-sharp-cli', 'bin', 'Release', 'net10.0', 'limebrella-sharp-cli.dll'),
  port: 4784,
};

// Find <Steam>/userdata/<account>/2050650/remote/win64_save (RE4 Remake); newest save folder wins if several accounts exist.
function detectSaveDir() {
  const roots = [];
  try {
    const out = require('child_process').execFileSync('reg', ['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath'], { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
    const m = /SteamPath\s+REG_SZ\s+(.+)/.exec(out); if (m) roots.push(m[1].trim());
  } catch { /* Steam not registered */ }
  roots.push('C:/Program Files (x86)/Steam', 'C:/Program Files/Steam');
  const found = [];
  for (const r of roots) {
    const ud = path.join(r, 'userdata'); if (!fs.existsSync(ud)) continue;
    for (const acc of fs.readdirSync(ud)) {
      const dir = path.join(ud, acc, '2050650', 'remote', 'win64_save');
      try {
        const files = fs.readdirSync(dir).filter((x) => SAVE_RE.test(x));
        if (files.length) found.push({ dir, mtime: Math.max(...files.map((x) => fs.statSync(path.join(dir, x)).mtimeMs)) });
      } catch { /* no saves for this account */ }
    }
  }
  found.sort((x, y) => y.mtime - x.mtime);
  return found.length ? found[0].dir : null;
}

const cfg = Object.assign({}, DEFAULT_CFG, fs.existsSync(CFG_PATH) ? JSON.parse(fs.readFileSync(CFG_PATH, 'utf8')) : {});
if (process.env.PORT) cfg.port = Number(process.env.PORT);
if (!cfg.saveDir) cfg.saveDir = detectSaveDir();
const STEAM_BASE = 76561197960265728n;
const accountId = cfg.saveDir ? path.basename(path.resolve(cfg.saveDir, '..', '..', '..')) : null;
const steamId64 = accountId && /^\d+$/.test(accountId) ? String(STEAM_BASE + BigInt(accountId)) : null;
const WORK = path.join(ROOT, 'work');
const BACKUPS = path.join(ROOT, 'backup', 'auto');
const OUTPUT = path.join(ROOT, 'output');

const sessions = new Map(); // file name -> {buf, parsed, loadedAt}

// ---------------------------------------------------------------- CLI helpers
function runCli(mode, dir, steam) {
  if (!fs.existsSync(cfg.cli)) return Promise.reject(new Error('The encryptor was not found (' + path.basename(path.dirname(cfg.cli)) + '). Run build.bat or use a release package.'));
  const outRoot = path.join(path.dirname(cfg.cli), '_OUTPUT');
  const before = new Set(fs.existsSync(outRoot) ? fs.readdirSync(outRoot) : []);
  return new Promise((resolve, reject) => {
    execFile(cfg.dotnet, [cfg.cli, '-m', mode, '-p', dir, '-s', steam, '-q'],
      { env: Object.assign({}, process.env, path.isAbsolute(cfg.dotnet) ? { DOTNET_ROOT: path.dirname(cfg.dotnet) } : {}, { DOTNET_CLI_TELEMETRY_OPTOUT: '1' }), timeout: 300000, windowsHide: true },
      (err, stdout, stderr) => {
        if (err) {
          const text = String(stdout || '') + String(stderr || '');
          const hint = 'Install the .NET 10 Runtime (x64) from https://dotnet.microsoft.com/download/dotnet/10.0 and restart the editor.';
          if (err.code === 'ENOENT') return reject(new Error('.NET was not found. ' + hint));
          if (/You must install|framework.*(was )?not found|No frameworks were found/i.test(text)) return reject(new Error('The required .NET 10 Runtime is missing. ' + hint));
          return reject(new Error('CLI: ' + err.message));
        }
        if (/\[(Error|Critical)\]/.test(stdout)) return reject(new Error('CLI: ' + stdout.split('\n').filter((l) => /Error|Critical/.test(l)).join(' ')));
        const fresh = fs.readdirSync(outRoot).filter((d) => !before.has(d));
        if (fresh.length !== 1) return reject(new Error('CLI: result folder not found'));
        resolve(path.join(outRoot, fresh[0]));
      });
  });
}
function findFile(dir, name) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { const r = findFile(p, name); if (r) return r; }
    else if (e.name === name) return p;
  }
  return null;
}
function rmrf(p) { try { fs.rmSync(p, { recursive: true, force: true }); } catch { /* ignore */ } }

const unpackCache = new Map(); // name -> {mtime, buf}
async function unpackCached(name) {
  const mtime = fs.statSync(path.join(cfg.saveDir, name)).mtimeMs;
  const c = unpackCache.get(name);
  if (c && c.mtime === mtime) return Buffer.from(c.buf);
  const buf = await unpackFile(name);
  unpackCache.set(name, { mtime, buf: Buffer.from(buf) });
  return buf;
}
async function unpackFile(name, srcPath) {
  const src = srcPath || path.join(cfg.saveDir, name);
  const tmp = path.join(WORK, 'in-' + Date.now());
  fs.mkdirSync(tmp, { recursive: true });
  fs.copyFileSync(src, path.join(tmp, name));
  let out;
  try { out = await runCli('u', tmp, steamId64); } finally { rmrf(tmp); }
  const plain = fs.readFileSync(findFile(out, name));
  rmrf(out);
  return plain;
}
async function packBuffer(name, plain) {
  const tmp = path.join(WORK, 'pack-' + Date.now());
  fs.mkdirSync(tmp, { recursive: true });
  fs.writeFileSync(path.join(tmp, name), plain);
  let out;
  try { out = await runCli('p', tmp, steamId64); } finally { rmrf(tmp); }
  const packed = fs.readFileSync(findFile(out, name));
  rmrf(out);
  return packed;
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
function fresh(S) { return { overview: INV.overview(S), inventories: INV.model(S), quests: INV.quests(S), treasures: INV.treasures(S), nodes: S.parsed.nodes.length, root: S.parsed.root, dirty: S.dirty }; }
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
      out.push({ id: 'auto/' + d, label: d.endsWith('_before-restore') ? 'State before restore' : 'Backup before writing to the game', when: st.mtimeMs, size: st.size, path: p });
    }
  }
  const o = path.join(ROOT, 'backup', 'original', name);
  if (fs.existsSync(o)) { const st = fs.statSync(o); out.push({ id: 'original', label: 'Original file (first backup)', when: st.mtimeMs, size: st.size, path: o }); }
  return out;
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
  fs.copyFileSync(srcPath, dest);
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
  fs.writeFileSync(dest, packed);
  sessions.delete(to); unpackCache.delete(to);
  return { ok: true, backup: bk };
}

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
  'POST /api/move': async (b) => { const S = need(b.name); INV.moveItem(S, Number(b.inv), Number(b.idx), b.x, b.y, b.dir); S.dirty = true; return fresh(S); },
  'POST /api/case-size': async (b) => { const S = need(b.name); INV.setCaseSize(S, b.level); S.dirty = true; return fresh(S); },
  'POST /api/upgrade': async (b) => { const S = need(b.name); INV.setUpgrade(S, Number(b.inv), Number(b.idx), b.key, b.level); S.dirty = true; return fresh(S); },
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
  'GET /api/status': async () => ({ gameRunning: await gameRunning() }),
  'GET /api/config': async () => ({ noSaveDir: !cfg.saveDir, steamId64, files: fileList(), catalog: INV.CATALOG, categories: INV.CATEGORIES, questInfo: QUEST_INFO }),
  'POST /api/summary': async (b) => {
    if (!/Slot.bin$/.test(b.name || '') || !SAVE_RE.test(b.name)) throw new Error('Invalid file name');
    const S = { buf: await unpackCached(b.name) }; S.parsed = parse(S.buf);
    const ov = INV.overview(S);
    return { ptas: ov.ptas && ov.ptas.value, playTime: ov.playTime && ov.playTime.value, saveCount: ov.saveCount && ov.saveCount.value, difficulty: ov.difficulty && ov.difficulty.value };
  },
  'POST /api/open': async (b) => {
    if (!SAVE_RE.test(b.name || '')) throw new Error('Invalid file name');
    const buf = await unpackCached(b.name);
    const parsed = parse(buf);
    const S = { name: b.name, buf, orig: Buffer.from(buf), parsed, dirty: false, edits: {} };
    sessions.set(b.name, S);
    const isSlot = /Slot\.bin$/.test(b.name);
    return { name: b.name, isSlot, size: buf.length, nodes: parsed.nodes.length, root: parsed.root,
      overview: isSlot ? INV.overview(S) : {}, inventories: isSlot ? INV.model(S) : [], quests: isSlot ? INV.quests(S) : [], treasures: isSlot ? INV.treasures(S) : null };
  },
  'POST /api/node': async (b) => { const S = need(b.name); return describe(S, b.id); },
  'POST /api/set': async (b) => {
    const S = need(b.name);
    let value;
    if (b.id !== undefined) {
      const n = S.parsed.nodes[b.id];
      if (!n || n.k !== 'v') throw new Error('Invalid node');
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
  'POST /api/add': async (b) => { const S = need(b.name); const r = INV.addItem(S, { itemId: b.itemId, count: b.count }); S.dirty = true; return { ...r, ...fresh(S) }; },
  'POST /api/remove': async (b) => { const S = need(b.name); INV.removeItem(S, Number(b.inv), Number(b.idx)); S.dirty = true; return fresh(S); },
  'POST /api/dup': async (b) => { const S = need(b.name); const r = INV.duplicateItem(S, Number(b.inv), Number(b.idx)); S.dirty = true; return { ...r, ...fresh(S) }; },
  'POST /api/quest-complete': async (b) => { const S = need(b.name); const r = INV.completeQuest(S, b.idx === 'all' ? 'all' : Number(b.idx)); if (r.changed) S.dirty = true; return { ...r, ...fresh(S) }; },
  'POST /api/refresh': async (b) => fresh(need(b.name)),
  'POST /api/save': async (b) => {
    const S = need(b.name);
    const target = b.target === 'game' ? 'game' : 'output';
    if (target === 'game' && !b.force && await gameRunning()) return { running: true };
    // sanity: the edited buffer must still parse and keep its length
    parse(S.buf);
    const packed = await packBuffer(b.name, S.buf);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    if (target === 'game') {
      const dest = path.join(cfg.saveDir, b.name);
      const bk = path.join(BACKUPS, stamp);
      fs.mkdirSync(bk, { recursive: true });
      fs.copyFileSync(dest, path.join(bk, b.name));
      fs.writeFileSync(dest, packed);
      S.orig = Buffer.from(S.buf); S.dirty = false; S.edits = {};
      unpackCache.set(b.name, { mtime: fs.statSync(dest).mtimeMs, buf: Buffer.from(S.buf) });
      return { ok: true, path: dest, backup: bk };
    }
    fs.mkdirSync(OUTPUT, { recursive: true });
    const dest = path.join(OUTPUT, b.name);
    fs.writeFileSync(dest, packed);
    return { ok: true, path: dest };
  },
};

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (req.headers.host && !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host)) return send(res, 403, { error: 'forbidden' });
    const key = req.method + ' ' + url.pathname;
    if (routes[key]) {
      if (!cfg.saveDir && key !== 'GET /api/config' && key !== 'GET /api/status') throw new Error('Save folder not found. Set it in app/config.json (field saveDir).');
      if (req.method === 'POST' && !(req.headers['content-type'] || '').startsWith('application/json')) return send(res, 415, { error: 'json only' });
      const body = req.method === 'POST' ? await readJson(req) : {};
      return send(res, 200, await routes[key](body));
    }
    const f = path.join(__dirname, 'public', url.pathname === '/' ? 'index.html' : url.pathname);
    if (!f.startsWith(path.join(__dirname, 'public')) || !fs.existsSync(f)) return send(res, 404, 'not found', 'text/plain');
    send(res, 200, fs.readFileSync(f), MIME[path.extname(f)] || 'application/octet-stream');
  } catch (e) {
    send(res, 400, { error: e.message });
  }
});
fs.mkdirSync(WORK, { recursive: true });
function checkRuntime() {
  execFile(cfg.dotnet, ['--list-runtimes'], { windowsHide: true }, (err, out) => {
    if (err || !/Microsoft\.NETCore\.App 10\./.test(String(out))) {
      console.log('\n[WARNING] The .NET 10 Runtime was not found. Install it from https://dotnet.microsoft.com/download/dotnet/10.0');
      console.log('          (the Runtime for Windows x64, not the SDK) and restart the editor.\n');
    }
  });
}
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.log('\n[ERROR] Port ' + cfg.port + ' is already in use. The editor may already be running: open http://localhost:' + cfg.port + ' or close the other window.\n');
  else console.log('\n[ERROR] ' + e.message + '\n');
  process.exit(1);
});
server.listen(cfg.port, '127.0.0.1', () => {
  const url = 'http://localhost:' + cfg.port;
  console.log('RE4 Save Editor: ' + url + (cfg.saveDir ? '' : '  (save folder not found, see README)'));
  console.log('Close this window to stop the editor.');
  checkRuntime();
  if (!process.env.NO_BROWSER) { // open the default browser (set NO_BROWSER=1 to disable)
    try { spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore', windowsHide: true }).unref(); } catch { /* the address is printed above */ }
  }
});
