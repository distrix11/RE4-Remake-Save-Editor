'use strict';
// Renders the CC0 gun models in icons/models to transparent PNG icons (icons/weapons/<name>.png) with headless Edge/Chrome + three.js.
// Dev tool, needs internet (three.js from jsdelivr) and Edge or Chrome.
// Usage: node scripts/icon-render/render-icons.js [ModelName ...]     (env FLIP='["Pistol_2"]' mirrors models that point the other way)
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const MODELS = path.join(ROOT, 'icons', 'models'), OUT = path.join(ROOT, 'icons', 'weapons');
const FLIP = new Set(JSON.parse(process.env.FLIP || '[]'));
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const want = process.argv.slice(2);
const list = [];
for (const d of fs.readdirSync(MODELS, { withFileTypes: true })) {
  if (!d.isDirectory() || d.name === 'accessories') continue;
  for (const f of fs.readdirSync(path.join(MODELS, d.name))) if (f.endsWith('.obj')) list.push({ dir: d.name, name: f.slice(0, -4) });
}
const todo = list.filter((m) => !want.length || want.includes(m.name));
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const f = u === '/render.html' ? path.join(__dirname, 'render.html') : path.join(MODELS, u.replace(/^\/m\//, ''));
  if (!fs.existsSync(f)) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', f.endsWith('.html') ? 'text/html' : 'text/plain'); res.end(fs.readFileSync(f));
});

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const sp = server.address().port;
  const dbg = 9500 + Math.floor(Math.random() * 100), prof = fs.mkdtempSync(path.join(os.tmpdir(), 'icr-'));
  const proc = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dbg}`, `--user-data-dir=${prof}`, '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', 'about:blank'], { stdio: 'ignore' });
  let t;
  for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${dbg}/json/list`)).json(); if (t.length) break; } catch { /* starting */ } await sleep(300); }
  const ws = new WebSocket(t.find((x) => x.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, (d) => (d.error ? rej(new Error(d.error.message)) : res(d.result))); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable');
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  await send('Emulation.setDeviceMetricsOverride', { width: 384, height: 192, deviceScaleFactor: 1, mobile: false });
  fs.mkdirSync(OUT, { recursive: true });
  for (const m of todo) {
    await send('Page.navigate', { url: `http://127.0.0.1:${sp}/render.html?m=/m/${m.dir}/${m.name}&flip=${FLIP.has(m.name) ? 1 : 0}` });
    let ok = false;
    for (let i = 0; i < 60; i++) { await sleep(250); const r = await send('Runtime.evaluate', { expression: 'window.__done === true', returnByValue: true }); if (r.result.value) { ok = true; break; } }
    if (!ok) { console.log('FAILED', m.name); continue; }
    const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    fs.writeFileSync(path.join(OUT, m.name.toLowerCase() + '.png'), Buffer.from(shot.data, 'base64'));
    console.log('ok', m.name);
  }
  ws.close(); proc.kill(); server.close(); await sleep(300);
  try { fs.rmSync(prof, { recursive: true, force: true }); } catch { /* ignore */ }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
