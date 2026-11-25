'use strict';
// Builds the all-in-one Windows archive (used by make-dist.js with --allinone yes):
// the editor + the official Node.js (SHA-256 checked against nodejs.org), started with start.js. Nothing to install, nothing to download.
// No program of our own is in it: an unsigned launcher .exe was flagged by Windows Defender and several other scanners.
// (Nexus Mods does not accept executables, so this archive is for GitHub; the Nexus one needs an installed Node.js.)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = async function allInOne(c) {
  const { args, ROOT, DIST, TMP, FOLDER, run, walk, stageSnapshot, zip, names, version } = c;
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

  const stage = path.join(TMP, 'allinone'); const root = path.join(stage, FOLDER);
  stageSnapshot(root, false);
  fs.mkdirSync(path.join(root, 'runtime'), { recursive: true });
  fs.copyFileSync(path.join(nodeDir, 'node.exe'), path.join(root, 'runtime', 'node.exe'));
  fs.copyFileSync(path.join(nodeDir, 'LICENSE'), path.join(root, 'runtime', 'LICENSE-Node.txt'));
  fs.copyFileSync(names, path.join(root, 'app', 'names.json'));
  fs.writeFileSync(path.join(root, 'README-FIRST.txt'), [
    'RE4 Save Editor (unofficial) - all-in-one', '',
    'Nothing to install.',
    '  1. Preferably close Resident Evil 4. Consider turning off Steam Cloud for the game.',
    '  2. Extract this folder anywhere and double-click start.js.',
    '     The editor opens in its own window. Closing that window stops the editor.',
    '     - Windows may ask whether to run the script (it came from the internet): choose Open / Run.',
    '     - If start.js opens in a text editor, right-click it, "Open with", "Microsoft Windows Based Script Host".', '',
    'runtime\\node.exe is the unmodified official Node.js build (checked against the SHA-256 list from nodejs.org),',
    'signed by the OpenJS Foundation. The package contains no other programs.',
    'The save encryption (app/lime.js) is a JavaScript port of the open-source LimebrellaSharp (MIT).',
    'Source code and details: https://github.com/distrix11/RE4-Remake-Save-Editor', '',
    'Unofficial fan tool, not affiliated with Capcom or Valve. Use at your own risk and keep backups.', ''].join('\r\n'));
  const all = walk(stage);
  return { ...zip(stage, `RE4SaveEditor-${version}-windows-allinone.zip`), files: all.map((f) => path.relative(stage, f).split(path.sep).join('/').replace(FOLDER + '/', '')) };
};
