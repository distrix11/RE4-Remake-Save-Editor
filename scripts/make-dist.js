'use strict';
// Builds two archives into dist/ (not committed). Both contain the editor, the generated name dictionary and the
// encryptor as framework-dependent .NET libraries (encryptor/*.dll). Neither contains an .exe.
//
//   nexus   NO launcher file at all (.bat/.cmd/.ps1 uploads are quarantined by Nexus Mods).
//           Start: open a terminal in the folder and run  node app/server.js  (README-FIRST.txt explains it).
//   github  the same plus start.bat for a double-click start (for GitHub Releases).
//
// Usage: node scripts/make-dist.js --ref <folder containing LimebrellaSharp/ and rsz/rszre4.json>
//                                  [--dotnet <path to dotnet.exe>] [--version 0.1.0]
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
const ROOT = path.resolve(__dirname, '..');
const ref = args.ref ? path.resolve(args.ref) : path.join(ROOT, 'ref');
const dotnet = args.dotnet || (fs.existsSync(path.join(ROOT, 'tools', 'dotnet', 'dotnet.exe')) ? path.join(ROOT, 'tools', 'dotnet', 'dotnet.exe') : 'dotnet');
const version = args.version || 'test';
const DIST = path.join(ROOT, 'dist');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 're4dist-'));
const FOLDER = 'RE4-Save-Editor';
const FORBIDDEN = /\.(exe|msi|scr|com|bat|cmd|ps1|vbs|lnk)$/i; // anything a launcher or installer could be

const run = (cmd, a, opts = {}) => execFileSync(cmd, a, Object.assign({ stdio: 'pipe', windowsHide: true, maxBuffer: 1 << 26 }, opts));
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p, out) : out.push(p); } return out; };

function stageSnapshot(dir, withLauncher) {
  const files = run('git', ['ls-files', '-z'], { cwd: ROOT }).toString('utf8').split('\0').filter(Boolean);
  for (const f of files) {
    if (f === 'scripts/make-dist.js' || f.startsWith('docs/') || f === 'build.bat') continue; // dev-only files
    if (f === 'start.bat' && !withLauncher) continue;
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

const REQ = `Requirements (install once, both are official installers):
  1. Node.js, LTS version:            https://nodejs.org
  2. .NET Runtime 10, Windows x64:    https://dotnet.microsoft.com/download/dotnet/10.0   (the "Runtime", not the SDK)
`;
const FOOT = `
This package contains no .exe files. The encryptor in the encryptor/ folder is the open-source
LimebrellaSharp (MIT) compiled as .NET libraries; the rest is plain JavaScript you can read.
Source code and details: https://github.com/distrix11/RE4-Remake-Save-Editor

Unofficial fan tool, not affiliated with Capcom or Valve. Use at your own risk and keep backups.
`;
const NEXUS_START = `${REQ}
How to start (there is no launcher file in this package on purpose):
  1. Close Resident Evil 4. Consider turning off Steam Cloud for the game.
  2. Open this folder in Windows Explorer, click the address bar, type  cmd  and press Enter.
  3. In the black window type:   node app/server.js   and press Enter.
     Your browser opens the editor at http://localhost:4784. Close the black window to stop the editor.

Optional, to start with a double-click: create a text file in this folder, save it as start.bat
(choose "All files" as the type) with these three lines:

    @echo off
    node app\\server.js
    pause
${FOOT}`;
const GITHUB_START = `${REQ}
How to start:
  1. Close Resident Evil 4. Consider turning off Steam Cloud for the game.
  2. Extract this folder anywhere and double-click start.bat. The editor opens in your browser at http://localhost:4784.
${FOOT}`;

fs.mkdirSync(DIST, { recursive: true });

// the encryptor and the name dictionary are shared by both variants
const pub = path.join(TMP, 'publish');
const env = Object.assign({}, process.env, { DOTNET_CLI_TELEMETRY_OPTOUT: '1' }, path.isAbsolute(dotnet) ? { DOTNET_ROOT: path.dirname(dotnet) } : {});
run(dotnet, ['publish', path.join(ref, 'LimebrellaSharp', 'limebrella-sharp-cli'), '-c', 'Release', '--self-contained', 'false', '-p:UseAppHost=false', '-p:DebugType=None', '-o', pub, '-v', 'quiet'], { env });
const names = path.join(TMP, 'names.json');
run(process.execPath, [path.join(ROOT, 'app', 'build-names.js'), path.join(ref, 'rsz', 'rszre4.json'), names]);

function build(variant, withLauncher, readme, zipName) {
  const stage = path.join(TMP, variant); const root = path.join(stage, FOLDER);
  stageSnapshot(root, withLauncher);
  const enc = path.join(root, 'encryptor'); fs.mkdirSync(enc, { recursive: true });
  for (const f of fs.readdirSync(pub)) if (/\.(dll|json)$/i.test(f)) fs.copyFileSync(path.join(pub, f), path.join(enc, f));
  fs.copyFileSync(path.join(ref, 'LimebrellaSharp', 'LICENSE'), path.join(enc, 'LICENSE-LimebrellaSharp.txt'));
  fs.copyFileSync(names, path.join(root, 'app', 'names.json'));
  fs.writeFileSync(path.join(root, 'README-FIRST.txt'), `RE4 Save Editor (unofficial)\n\n${readme}`);
  const all = walk(stage);
  const bad = all.filter((f) => FORBIDDEN.test(f) && !(withLauncher && /[\\/]start\.bat$/i.test(f)));
  if (bad.length) throw new Error(`${variant} must not contain: ${bad.join(', ')}`);
  return { ...zip(stage, zipName), files: all.map((f) => path.relative(stage, f).replace(/\\/g, '/').replace(FOLDER + '/', '')) };
}

const nexus = build('nexus', false, NEXUS_START, `RE4SaveEditor-${version}-nexus.zip`);
const github = build('github', true, GITHUB_START, `RE4SaveEditor-${version}-github.zip`);
fs.rmSync(TMP, { recursive: true, force: true });
for (const r of [nexus, github]) {
  const ext = {}; for (const f of r.files) { const e = path.extname(f).toLowerCase() || '(none)'; ext[e] = (ext[e] || 0) + 1; }
  console.log(`${r.name}\n   ${(r.size / 1048576).toFixed(2)} MB   sha256 ${r.sha256}\n   ${r.files.length} files by type: ${JSON.stringify(ext)}`);
}
