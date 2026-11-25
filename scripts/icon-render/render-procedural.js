'use strict';
// Renders the original procedural 3D icons (procedural.html) to transparent PNGs in icons/items/<name>.png.
// Dev tool, needs internet (three.js from jsdelivr) and Edge or Chrome. Usage: node scripts/icon-render/render-procedural.js [name ...] [--out dir]
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2); const oi = args.indexOf('--out');
const OUT = oi >= 0 ? path.resolve(args.splice(oi, 2)[1]) : path.join(ROOT, 'icons', 'items');
const si = args.indexOf('--size'); const SIZE = si >= 0 ? +args.splice(si, 2)[1] : 256;
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = http.createServer((req, res) => { const u = req.url.split('?')[0]; const f = path.join(__dirname, u === '/' ? 'procedural.html' : u.slice(1)); if (!f.startsWith(__dirname) || !fs.existsSync(f)) { res.statusCode = 404; return res.end(); } res.setHeader('Content-Type', f.endsWith('.js') ? 'text/javascript' : 'text/html'); res.end(fs.readFileSync(f)); });

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const sp = server.address().port;
  const dbg = 9500 + Math.floor(Math.random() * 100), prof = fs.mkdtempSync(path.join(os.tmpdir(), 'icp-'));
  const proc = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dbg}`, `--user-data-dir=${prof}`, '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', 'about:blank'], { stdio: 'ignore' });
  let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${dbg}/json/list`)).json(); if (t.length) break; } catch { /* starting */ } await sleep(300); }
  const ws = new WebSocket(t.find((x) => x.type === 'page').webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, (d) => (d.error ? rej(new Error(d.error.message)) : res(d.result))); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result.value;
  const waitDone = async () => { for (let i = 0; i < 80; i++) { await sleep(250); if (await ev('window.__done===true')) return true; } return false; };
  await send('Page.enable');
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  await send('Emulation.setDeviceMetricsOverride', { width: SIZE, height: SIZE, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://127.0.0.1:${sp}/?s=${SIZE}` }); await waitDone();
  const all = await ev('window.BUILDERS');
  const todo = args.length ? all.filter((n) => args.includes(n)) : all;
  fs.mkdirSync(OUT, { recursive: true });
  for (const n of todo) {
    await send('Page.navigate', { url: `http://127.0.0.1:${sp}/?k=${n}&s=${SIZE}` });
    if (!(await waitDone())) { console.log('FAILED', n); continue; }
    const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    fs.writeFileSync(path.join(OUT, n + '.png'), Buffer.from(shot.data, 'base64')); console.log('ok', n);
  }
  ws.close(); proc.kill(); server.close(); await sleep(300);
  // cut the empty margins off (see trim.js)
  require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'trim.js'), ...todo, '--dir', OUT], { stdio: 'inherit' });
  try { fs.rmSync(prof, { recursive: true, force: true }); } catch { /* ignore */ }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
