'use strict';
// Cuts the empty margins off the item pictures (icons/items/*.png), so that a picture fills its cells in the case and can be told
// apart as "lying" or "standing" by its own shape. Run after rendering; a picture that is already trimmed stays as it is.
// usage: node scripts/icon-render/trim.js [name ...] [--dir <folder>]     (needs Edge or Chrome)
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const args = process.argv.slice(2); const di = args.indexOf('--dir');
const DIR = di >= 0 ? path.resolve(args.splice(di, 2)[1]) : path.join(__dirname, '..', '..', 'icons', 'items');
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// runs in the page: the same picture without its fully transparent border (2% of the longer side is left around it)
const TRIM = `async (data) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + data; await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;
  const a = document.createElement('canvas'); a.width = W; a.height = H; const x = a.getContext('2d'); x.drawImage(img, 0, 0);
  const px = x.getImageData(0, 0, W, H).data; let l = W, t = H, r = -1, b = -1;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (px[(j * W + i) * 4 + 3] > 12) { if (i < l) l = i; if (i > r) r = i; if (j < t) t = j; if (j > b) b = j; }
  if (r < 0) return null;
  const pad = Math.round(Math.max(r - l, b - t) * 0.02);
  l = Math.max(0, l - pad); t = Math.max(0, t - pad); r = Math.min(W - 1, r + pad); b = Math.min(H - 1, b + pad);
  const w = r - l + 1, h = b - t + 1; if (w >= W - 1 && h >= H - 1) return null;
  const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(a, l, t, w, h, 0, 0, w, h);
  return { data: c.toDataURL('image/png').split(',')[1], w, h };
}`;

(async () => {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.png') && (!args.length || args.includes(f.slice(0, -4))));
  const dbg = 9300 + Math.floor(Math.random() * 100), prof = fs.mkdtempSync(path.join(os.tmpdir(), 'trim-'));
  const proc = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dbg}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
  let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${dbg}/json/list`)).json(); if (t.length) break; } catch { /* starting */ } await sleep(300); }
  const ws = new WebSocket(t.find((x) => x.type === 'page').webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, (d) => (d.error ? rej(new Error(d.error.message)) : res(d.result))); ws.send(JSON.stringify({ id: i, method, params })); });
  let n = 0;
  for (const f of files) {
    const p = path.join(DIR, f);
    const r = await send('Runtime.evaluate', { expression: `(${TRIM})('${fs.readFileSync(p).toString('base64')}')`, awaitPromise: true, returnByValue: true });
    const v = r.result.value; if (v) { fs.writeFileSync(p, Buffer.from(v.data, 'base64')); n++; }
  }
  console.log('trimmed', n, 'of', files.length);
  ws.close(); proc.kill(); await sleep(300);
  try { fs.rmSync(prof, { recursive: true, force: true }); } catch { /* ignore */ }
  process.exit(0);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
