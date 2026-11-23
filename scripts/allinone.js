'use strict';
// Builds the all-in-one Windows archive (used by make-dist.js with --allinone yes):
// launcher exe + official Node.js (SHA-256 checked against nodejs.org) + self-contained encryptor. Nothing to install.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = async function allInOne(c) {
  const { args, ROOT, DIST, TMP, FOLDER, ref, dotnet, env, run, walk, stageSnapshot, zip, names, version } = c;
  const NODE_VER = args.node || 'v24.22.3';
  const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  const cache = path.join(DIST, 'cache'); fs.mkdirSync(cache, { recursive: true });
  const zipName = `node-${NODE_VER}-win-x64.zip`; const nodeZip = path.join(cache, zipName);
  const sums = await (await fetch(`https://nodejs.org/dist/${NODE_VER}/SHASUMS256.txt`)).text();
  const line = sums.split(/\r?\n/).find((l) => l.endsWith('  ' + zipName));
  if (!line) throw new Error('No checksum found for ' + zipName);
  const want = line.split(/\s+/)[0];
  if (!fs.existsSync(nodeZip) || sha(nodeZip) !== want) fs.writeFileSync(nodeZip, Buffer.from(await (await fetch(`https://nodejs.org/dist/${NODE_VER}/${zipName}`)).arrayBuffer()));
  if (sha(nodeZip) !== want) throw new Error('Node.js download failed the SHA-256 check');

  const tar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
  const nx = path.join(TMP, 'nodex'); fs.mkdirSync(nx);
  run(fs.existsSync(tar) ? tar : 'tar', ['-xf', nodeZip, '-C', nx]);
  const nodeDir = path.join(nx, `node-${NODE_VER}-win-x64`);

  const sc = path.join(TMP, 'selfcontained');
  run(dotnet, ['publish', path.join(ref, 'LimebrellaSharp', 'limebrella-sharp-cli'), '-c', 'Release', '-r', 'win-x64', '--self-contained', 'true',
    '-p:PublishSingleFile=true', '-p:EnableCompressionInSingleFile=true', '-p:IncludeNativeLibrariesForSelfExtract=true', '-p:DebugType=None', '-o', sc, '-v', 'quiet'], { env });

  // the launcher needs only the C# compiler that ships with Windows (.NET Framework 4)
  const csc = path.join(process.env.WINDIR || 'C:\\Windows', 'Microsoft.NET', 'Framework64', 'v4.0.30319', 'csc.exe');
  const launcher = path.join(TMP, 'RE4SaveEditor.exe');
  run(csc, ['/nologo', '/target:exe', '/optimize', '/win32icon:' + path.join(ROOT, 'launcher', 'icon.ico'), '/out:' + launcher, path.join(ROOT, 'launcher', 'Launcher.cs')]);

  const stage = path.join(TMP, 'allinone'); const root = path.join(stage, FOLDER);
  stageSnapshot(root, false);
  fs.mkdirSync(path.join(root, 'encryptor'), { recursive: true }); fs.mkdirSync(path.join(root, 'runtime'), { recursive: true });
  fs.copyFileSync(path.join(sc, 'limebrella-sharp-cli.exe'), path.join(root, 'encryptor', 'limebrella-sharp-cli.exe'));
  fs.copyFileSync(path.join(ref, 'LimebrellaSharp', 'LICENSE'), path.join(root, 'encryptor', 'LICENSE-LimebrellaSharp.txt'));
  fs.copyFileSync(path.join(nodeDir, 'node.exe'), path.join(root, 'runtime', 'node.exe'));
  fs.copyFileSync(path.join(nodeDir, 'LICENSE'), path.join(root, 'runtime', 'LICENSE-Node.txt'));
  fs.copyFileSync(launcher, path.join(root, 'RE4SaveEditor.exe'));
  fs.mkdirSync(path.join(root, 'launcher'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'launcher', 'Launcher.cs'), path.join(root, 'launcher', 'Launcher.cs'));
  fs.copyFileSync(names, path.join(root, 'app', 'names.json'));
  fs.writeFileSync(path.join(root, 'README-FIRST.txt'), [
    'RE4 Save Editor (unofficial) - all-in-one', '',
    'Nothing to install.',
    '  1. Close Resident Evil 4. Consider turning off Steam Cloud for the game.',
    '  2. Extract this folder anywhere and double-click RE4SaveEditor.exe.',
    '     The editor opens in your browser at http://localhost:4784. Close the black window to stop it.', '',
    'Windows SmartScreen may warn about the launcher because it is not code-signed. Its full source is launcher/Launcher.cs',
    '(about 40 lines: it just starts runtime\\node.exe with app\\server.js).',
    'runtime\\node.exe is the unmodified official Node.js build (checked against the SHA-256 list from nodejs.org).',
    'encryptor\\limebrella-sharp-cli.exe is LimebrellaSharp (MIT) with the .NET runtime inside.',
    'Source code and details: https://github.com/distrix11/RE4-Remake-Save-Editor', '',
    'Unofficial fan tool, not affiliated with Capcom or Valve. Use at your own risk and keep backups.', ''].join('\r\n'));
  const all = walk(stage);
  return { ...zip(stage, `RE4SaveEditor-${version}-windows-allinone.zip`), files: all.map((f) => path.relative(stage, f).split(path.sep).join('/').replace(FOLDER + '/', '')) };
};
