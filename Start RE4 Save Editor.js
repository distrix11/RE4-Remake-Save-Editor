// RE4 Save Editor: double-click this file to start the editor (Windows Script Host, no console window).
// The editor can make a desktop shortcut with an icon for it: Settings > Create desktop shortcut.
// It uses runtime\node.exe if there is one, otherwise the Node.js installed on this PC (version 20 or newer).
// If there is no Node.js, it offers to open the download page of Node.js (https://nodejs.org). This script downloads nothing itself.
var TITLE = 'RE4 Save Editor';
var sh = new ActiveXObject('WScript.Shell');
var fso = new ActiveXObject('Scripting.FileSystemObject');
var dir = fso.GetParentFolderName(WScript.ScriptFullName);

function die(text) { sh.Popup(text, 0, TITLE, 16); WScript.Quit(1); }

// the first node.exe in the folders of the PATH variable or in the usual install folders
function findNode() {
  var dirs = sh.ExpandEnvironmentStrings('%PATH%').split(';');
  dirs.push(sh.ExpandEnvironmentStrings('%ProgramFiles%\\nodejs'), sh.ExpandEnvironmentStrings('%LocalAppData%\\Programs\\nodejs'));
  for (var i = 0; i < dirs.length; i++) {
    if (!dirs[i]) continue;
    var p = fso.BuildPath(dirs[i].replace(/"/g, ''), 'node.exe');
    if (fso.FileExists(p)) return p;
  }
  return null;
}

var launcher = fso.BuildPath(dir, 'app\\launcher.js');
if (!fso.FileExists(launcher)) die('app\\launcher.js was not found. Extract the whole zip first and start this file from the extracted folder.');

var node = fso.BuildPath(dir, 'runtime\\node.exe');
if (!fso.FileExists(node)) node = findNode();
if (!node) {
  // 4 = Yes/No buttons, 32 = question icon; the answer 6 is "Yes"
  var a = sh.Popup('The editor needs Node.js (version 20 or newer), which was not found on this PC.\n\nOpen the Node.js download page now? Install the "LTS" version (Windows Installer), then start this file again.', 0, TITLE, 4 + 32);
  if (a === 6) sh.Run('https://nodejs.org/en/download', 1, false);
  WScript.Quit(1);
}

// start the launcher without a window and wait for it: if it prints an error, show it
var log = fso.BuildPath(sh.ExpandEnvironmentStrings('%TEMP%'), 're4-editor-launch.log');
var code = sh.Run('%ComSpec% /c ""' + node + '" "' + launcher + '" > "' + log + '" 2>&1"', 0, true);
if (code !== 0) {
  var text = '';
  try { var f = fso.OpenTextFile(log, 1); text = f.AtEndOfStream ? '' : f.ReadAll(); f.Close(); } catch (e) {}
  die(text ? text : 'The editor stopped with code ' + code + '.');
}
