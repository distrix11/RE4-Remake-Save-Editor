// RE4 Save Editor: double-click this file to start the editor (Windows Script Host, no console window).
// It uses runtime\node.exe if there is one, otherwise the Node.js installed on this PC. If there is no Node.js at all, it offers to download
// the official portable build from nodejs.org once (checked against a fixed SHA-256) into the "runtime" folder. Nothing else is installed.
var NODE_VERSION = 'v24.22.3';
var NODE_ZIP_SHA256 = 'e612af99f626ab415ea225af6bce5c971feb448cb5cae250bb1c3fa50c5f7d9f';
var TITLE = 'RE4 Save Editor';

var sh = new ActiveXObject('WScript.Shell');
var fso = new ActiveXObject('Scripting.FileSystemObject');
var dir = fso.GetParentFolderName(WScript.ScriptFullName);

function say(text, icon) { sh.Popup(text, 0, TITLE, icon || 64); }
function die(text) { sh.Popup(text, 0, TITLE, 16); WScript.Quit(1); }
function exec(cmd) { // run a hidden command, return its output and exit code
  var p = sh.Exec('%ComSpec% /c ' + cmd);
  while (p.Status === 0) WScript.Sleep(100);
  return { out: p.StdOut.ReadAll(), code: p.ExitCode };
}
function nodeMajor(exe) {
  try { var r = exec('"' + exe + '" -v'); var m = /^v(\d+)\./.exec(r.out.replace(/^\s+/, '')); return r.code === 0 && m ? parseInt(m[1], 10) : 0; } catch (e) { return 0; }
}

function downloadNode(runtimeDir) {
  var zipName = 'node-' + NODE_VERSION + '-win-x64.zip';
  var zipPath = fso.BuildPath(runtimeDir, zipName);
  if (!fso.FolderExists(runtimeDir)) fso.CreateFolder(runtimeDir);
  sh.Popup('Downloading Node.js ' + NODE_VERSION + ' from nodejs.org (about 37 MB). Please wait, this can take a minute; the editor starts by itself afterwards.', 6, TITLE, 64);
  var http = new ActiveXObject('MSXML2.ServerXMLHTTP.6.0');
  http.open('GET', 'https://nodejs.org/dist/' + NODE_VERSION + '/' + zipName, false);
  http.setTimeouts(15000, 15000, 30000, 600000);
  http.send();
  if (http.status !== 200) die('The download failed (HTTP ' + http.status + '). Check the internet connection, or install Node.js LTS from https://nodejs.org and start this file again.');
  var st = new ActiveXObject('ADODB.Stream'); st.Type = 1; st.Open(); st.Write(http.responseBody); st.SaveToFile(zipPath, 2); st.Close();
  // the checksum must match the official one, otherwise nothing is used
  var h = exec('certutil -hashfile "' + zipPath + '" SHA256').out.replace(/\s+/g, '').toLowerCase();
  if (h.indexOf(NODE_ZIP_SHA256) < 0) { try { fso.DeleteFile(zipPath); } catch (e) {} die('The downloaded Node.js file does not match the official checksum, so it was deleted and not used.'); }
  var inner = 'node-' + NODE_VERSION + '-win-x64/node.exe';
  var r = exec('tar -xf "' + zipPath + '" -C "' + runtimeDir + '" --strip-components=1 ' + inner);
  try { fso.DeleteFile(zipPath); } catch (e) {}
  if (!fso.FileExists(fso.BuildPath(runtimeDir, 'node.exe'))) die('Could not unpack Node.js (' + r.code + '). Install Node.js LTS from https://nodejs.org and start this file again.');
}

if (!fso.FileExists(fso.BuildPath(dir, 'app\\launcher.js'))) die('app\\launcher.js was not found. Extract the whole zip first and start this file from the extracted folder.');

var runtimeDir = fso.BuildPath(dir, 'runtime');
var node = fso.BuildPath(runtimeDir, 'node.exe');
if (!fso.FileExists(node)) {
  node = null;
  try { var w = exec('where node.exe').out.split(/\r?\n/); if (w[0] && nodeMajor(w[0]) >= 20) node = w[0]; } catch (e) {}
  if (!node) {
    // 4 = Yes/No buttons, 32 = question icon; the answer 6 is "Yes"
    var a = sh.Popup('The editor needs Node.js (version 20 or newer), which was not found on this PC.\n\nDownload the official portable Node.js ' + NODE_VERSION + ' (about 37 MB) from nodejs.org now? It is only unpacked into the "runtime" folder next to this file; nothing is installed.', 0, TITLE, 4 + 32);
    if (a !== 6) WScript.Quit(1);
    downloadNode(runtimeDir);
    node = fso.BuildPath(runtimeDir, 'node.exe');
  }
}

// start the launcher without a window and wait for it: if it prints an error, show it
var log = fso.BuildPath(sh.ExpandEnvironmentStrings('%TEMP%'), 're4-editor-launch.log');
var code = sh.Run('%ComSpec% /c ""' + node + '" "' + fso.BuildPath(dir, 'app\\launcher.js') + '" > "' + log + '" 2>&1"', 0, true);
if (code !== 0) {
  var text = '';
  try { var f = fso.OpenTextFile(log, 1); text = f.AtEndOfStream ? '' : f.ReadAll(); f.Close(); } catch (e) {}
  die(text ? text : 'The editor stopped with code ' + code + '.');
}
