'use strict';
// Builds the release archives into dist/ (not committed). All of them are plain JavaScript: the save encryption is built in (app/lime.js),
// so nothing but Node.js is needed (bundled in the all-in-one archive).
//
//   nexus      start.js (double-click, Windows Script Host) and no .exe, .dll, .bat, .cmd, .ps1 at all: Nexus Mods does not accept them.
//   github     the same plus start.bat.
//   allinone   (--allinone yes) RE4SaveEditor.exe + the official Node.js in runtime/: nothing to install and nothing to download.
//
// Usage: node scripts/make-dist.js [--ref <folder with rsz/rszre4.json>] [--version 0.9.0] [--allinone yes]
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
const ROOT = path.resolve(__dirname, '..');
const ref = args.ref ? path.resolve(args.ref) : path.join(ROOT, 'ref');
const version = args.version || 'test';
const DIST = path.join(ROOT, 'dist');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 're4dist-'));
const FOLDER = 'RE4-Save-Editor';
const FORBIDDEN = /\.(exe|dll|msi|scr|com|bat|cmd|ps1|vbs|lnk)$/i; // anything a launcher or installer could be

const run = (cmd, a, opts = {}) => execFileSync(cmd, a, Object.assign({ stdio: 'pipe', windowsHide: true, maxBuffer: 1 << 26 }, opts));
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p, out) : out.push(p); } return out; };

// the committed files of the repository, without the development-only ones
function stageSnapshot(dir, withBat) {
  const files = run('git', ['ls-files', '-z'], { cwd: ROOT }).toString('utf8').split('\0').filter(Boolean);
  for (const f of files) {
    if (f.startsWith('scripts/') || f.startsWith('.github/') || f.startsWith('icons/models/') || f.startsWith('docs/') || f.startsWith('launcher/') || f === 'build.bat') continue;
    if (f === 'start.bat' && !withBat) continue;
    const dest = path.join(dir, f); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(path.join(ROOT, f), dest);
  }
}
function zip(stagingParent, name) {
  const out = path.join(DIST, name);
  if (fs.existsSync(out)) fs.rmSync(out);
  // use the bsdtar that ships with Windows 10+ (a GNU tar from Git Bash would treat 'E:' as a remote host)
  const tar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
  run(fs.existsSync(tar) ? tar : 'tar', ['-a', '-cf', out, '-C', stagingParent, FOLDER]);
  const buf = fs.readFileSync(out);
  return { name, size: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
}

const FOOT = `
Everything in this package is plain JavaScript you can read. The save encryption (app/lime.js) is a JavaScript port of the
open-source LimebrellaSharp (MIT); see THIRD_PARTY_NOTICES.md.
Source code and details: https://github.com/distrix11/RE4-Remake-Save-Editor

Unofficial fan tool, not affiliated with Capcom or Valve. Use at your own risk and keep backups.
`;
const START = (bat) => `How to start:
  1. Preferably close Resident Evil 4. Consider turning off Steam Cloud for the game.
  2. Extract the whole zip anywhere and double-click ${bat ? 'start.bat (or start.js)' : 'start.js'}.
     The editor opens in its own window. Closing that window stops the editor.
     - Windows may ask once whether you want to run the script (it came from the internet): choose Open / Run.
     - If start.js opens in a text editor instead, right-click it, "Open with", "Microsoft Windows Based Script Host".
  3. This needs Node.js (version 20 or newer). If it is not installed, a message offers to open the Node.js download page:
     install the "LTS" version (Windows Installer, Next, Next, Finish), then double-click start.js again. This script downloads nothing itself.
     (The all-in-one zip on GitHub already contains Node.js and needs nothing: https://github.com/distrix11/RE4-Remake-Save-Editor/releases)

If you have Node.js and prefer a terminal:  node app/server.js   (the editor opens in your browser at http://localhost:4784).
`;

fs.mkdirSync(DIST, { recursive: true });
const names = path.join(TMP, 'names.json');
run(process.execPath, [path.join(ROOT, 'app', 'build-names.js'), path.join(ref, 'rsz', 'rszre4.json'), names]);

function build(variant, withBat, readme, zipName) {
  const stage = path.join(TMP, variant); const root = path.join(stage, FOLDER);
  stageSnapshot(root, withBat);
  fs.copyFileSync(names, path.join(root, 'app', 'names.json'));
  fs.writeFileSync(path.join(root, 'README-FIRST.txt'), `RE4 Save Editor (unofficial)\n\n${readme}${FOOT}`);
  const all = walk(stage);
  const bad = all.filter((f) => FORBIDDEN.test(f) && !(withBat && /[\\/]start\.bat$/i.test(f)));
  if (bad.length) throw new Error(`${variant} must not contain: ${bad.join(', ')}`);
  return { ...zip(stage, zipName), files: all.map((f) => path.relative(stage, f).split(path.sep).join('/').replace(FOLDER + '/', '')) };
}

const nexus = build('nexus', false, START(false), `RE4SaveEditor-${version}-nexus.zip`);
const github = build('github', true, START(true), `RE4SaveEditor-${version}-github.zip`);
(async () => {
  // --allinone yes  also builds the Windows archive with launcher exe + bundled Node.js (needs internet and the C# compiler of Windows)
  const extra = args.allinone === 'yes'
    ? [await require('./allinone')({ args, ROOT, DIST, TMP, FOLDER, run, walk, stageSnapshot, zip, names, version })] : [];
  fs.rmSync(TMP, { recursive: true, force: true });
  for (const r of [nexus, github, ...extra]) {
    const ext = {}; for (const f of r.files) { const e = path.extname(f).toLowerCase() || '(none)'; ext[e] = (ext[e] || 0) + 1; }
    console.log(`${r.name}\n   ${(r.size / 1048576).toFixed(2)} MB   sha256 ${r.sha256}\n   ${r.files.length} files by type: ${JSON.stringify(ext)}`);
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
