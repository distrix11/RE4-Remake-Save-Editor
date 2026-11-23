'use strict';
// Builds two archives into dist/ (not committed):
//   A  scripts only       a snapshot of the tracked files (the user runs build.bat to get the encryptor)
//   B  scripts + encryptor the same plus names.json and the encryptor as framework-dependent DLLs (no .exe at all);
//                          the user needs Node.js and the .NET 10 Runtime installed
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

const run = (cmd, a, opts = {}) => execFileSync(cmd, a, Object.assign({ stdio: 'pipe', windowsHide: true, maxBuffer: 1 << 26 }, opts));
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p, out) : out.push(p); } return out; };

function stageSnapshot(dir) {
  const files = run('git', ['ls-files', '-z'], { cwd: ROOT }).toString('utf8').split('\0').filter(Boolean);
  for (const f of files) {
    if (f === 'scripts/make-dist.js' || f.startsWith('docs/')) continue; // dev-only files are not needed by users
    const dest = path.join(dir, f); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(path.join(ROOT, f), dest);
  }
}
function zip(stagingParent, name) {
  const out = path.join(DIST, name);
  if (fs.existsSync(out)) fs.rmSync(out);
  // use the bsdtar that ships with Windows 10+ (a GNU tar from Git Bash would treat 'E:' as a remote host)
  const tar = path.join(process.env.SystemRoot || 'C:\Windows', 'System32', 'tar.exe');
  run(fs.existsSync(tar) ? tar : 'tar', ['-a', '-cf', out, '-C', stagingParent, FOLDER]);
  const buf = fs.readFileSync(out);
  return { name, size: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
}

fs.mkdirSync(DIST, { recursive: true });

// ---------------- A: scripts only
const stageA = path.join(TMP, 'A'); stageSnapshot(path.join(stageA, FOLDER));
const exeA = walk(stageA).filter((f) => /\.(exe|dll|msi|scr|com)$/i.test(f));
if (exeA.length) throw new Error('Variant A must not contain binaries: ' + exeA.join(', '));
const a = zip(stageA, `RE4SaveEditor-${version}-A-scripts-only.zip`);

// ---------------- B: scripts + encryptor DLLs
const stageB = path.join(TMP, 'B'); const rootB = path.join(stageB, FOLDER); stageSnapshot(rootB);
fs.rmSync(path.join(rootB, 'build.bat'), { force: true }); // not needed when the encryptor is bundled
const pub = path.join(TMP, 'publish');
const env = Object.assign({}, process.env, { DOTNET_CLI_TELEMETRY_OPTOUT: '1' }, path.isAbsolute(dotnet) ? { DOTNET_ROOT: path.dirname(dotnet) } : {});
run(dotnet, ['publish', path.join(ref, 'LimebrellaSharp', 'limebrella-sharp-cli'), '-c', 'Release', '--self-contained', 'false', '-p:UseAppHost=false', '-p:DebugType=None', '-o', pub, '-v', 'quiet'], { env });
const enc = path.join(rootB, 'encryptor'); fs.mkdirSync(enc, { recursive: true });
for (const f of fs.readdirSync(pub)) if (/\.(dll|json)$/i.test(f)) fs.copyFileSync(path.join(pub, f), path.join(enc, f));
fs.copyFileSync(path.join(ref, 'LimebrellaSharp', 'LICENSE'), path.join(enc, 'LICENSE-LimebrellaSharp.txt'));
run(process.execPath, [path.join(ROOT, 'app', 'build-names.js'), path.join(ref, 'rsz', 'rszre4.json'), path.join(rootB, 'app', 'names.json')]);
fs.writeFileSync(path.join(rootB, 'README-FIRST.txt'), `RE4 Save Editor (unofficial)

Requirements (install once, both are official installers):
  1. Node.js, LTS version:            https://nodejs.org
  2. .NET Runtime 10, Windows x64:    https://dotnet.microsoft.com/download/dotnet/10.0   (the "Runtime", not the SDK)

How to start:
  1. Close Resident Evil 4. Consider turning off Steam Cloud for the game.
  2. Extract this folder anywhere and double-click start.bat. The editor opens in your browser.

This package contains no .exe files. The encryptor in the encryptor/ folder is the open-source
LimebrellaSharp (MIT) compiled as .NET libraries; the rest is plain JavaScript you can read.
Source code and details: https://github.com/distrix11/RE4-Remake-Save-Editor

Unofficial fan tool, not affiliated with Capcom or Valve. Use at your own risk and keep backups.
`);
const found = walk(stageB).filter((f) => /\.(exe|msi|scr|com|dll)$/i.test(f));
const exes = found.filter((f) => /\.(exe|msi|scr|com)$/i.test(f));
if (exes.length) throw new Error('Variant B must not contain executables: ' + exes.join(', '));
const b = zip(stageB, `RE4SaveEditor-${version}-B-with-dlls.zip`);

fs.rmSync(TMP, { recursive: true, force: true });
for (const r of [a, b]) console.log(`${r.name}\n   ${(r.size / 1048576).toFixed(2)} MB   sha256 ${r.sha256}`);
console.log('B binary files:', found.map((f) => path.relative(stageB, f).replace(/\\/g, '/').replace(FOLDER + '/', '')).join(', '));
