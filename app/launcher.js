'use strict';
// Starts the editor server and shows it in its own app-style window (Edge or Chrome in "--app" mode: no tabs, no address bar).
// Closing that window stops the editor. Started by start.js / start.bat; it prints errors to stdout (start.js shows them in a message box).
// Run by hand:  node app/launcher.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; } };
const port = Number(readJson(path.join(__dirname, 'config.json')).port) || 4784;
const url = `http://127.0.0.1:${port}/`;
const ownVersion = readJson(path.join(ROOT, 'package.json')).version || null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = (msg) => { console.log('[ERROR] ' + msg); process.exit(1); };

// the version of the editor that answers on our port (null when nothing does)
function runningVersion() {
  return new Promise((resolve) => {
    const req = http.get(url + 'api/config', { timeout: 1500 }, (res) => {
      let s = ''; res.on('data', (d) => (s += d));
      res.on('end', () => { try { resolve(JSON.parse(s).version || ''); } catch { resolve(''); } });
    });
    req.on('error', () => resolve(null)); req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}
function findBrowser() {
  const pf86 = process.env['ProgramFiles(x86)'] || '', pf = process.env.ProgramFiles || '';
  return [
    path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'), path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'), path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ].find((p) => p && fs.existsSync(p)) || null;
}

(async () => {
  let server = null;
  const running = await runningVersion();
  if (running === null) {
    server = spawn(process.execPath, [path.join(__dirname, 'server.js')], { cwd: ROOT, env: { ...process.env, NO_BROWSER: '1' }, windowsHide: true, stdio: 'ignore' });
    let exited = null; server.on('exit', (code) => { exited = code; });
    for (let i = 0; i < 60 && exited === null && (await runningVersion()) === null; i++) await sleep(250);
    if (exited !== null) fail(`The editor stopped right after starting (code ${exited}). Another program may be using port ${port}; close it or change "port" in app/config.json.`);
    if ((await runningVersion()) === null) { server.kill(); fail('The editor did not start in time.'); }
  } else if (ownVersion && running && running !== ownVersion) {
    fail(`Another copy of the editor (version ${running}) is already running on port ${port}, this folder is version ${ownVersion}.\nClose the other editor window and start this one again.`);
  }

  const browser = findBrowser();
  if (!browser) {
    // no Edge/Chrome: use the default browser; the server keeps running until it is stopped (Task Manager: node.exe)
    spawn('cmd', ['/c', 'start', '', url], { windowsHide: true, stdio: 'ignore', detached: true }).unref();
    if (server) server.unref();
    console.log(`Edge or Chrome was not found, the editor was opened in your default browser at ${url}`);
    process.exit(0);
  }
  // an own profile folder keeps this window apart from the normal browser, so we can tell when it is closed
  const profile = path.join(process.env.LOCALAPPDATA || os.tmpdir(), 'RE4SaveEditor', 'window');
  const win = spawn(browser, [`--app=${url}`, `--user-data-dir=${profile}`, '--window-size=1240,900', '--no-first-run', '--no-default-browser-check'], { stdio: 'ignore' });
  win.on('error', (e) => { if (server) server.kill(); fail('Could not open the window: ' + e.message); });
  win.on('exit', () => { if (server) server.kill(); process.exit(0); });
})().catch((e) => fail(e.message));
