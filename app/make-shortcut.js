// Creates the "RE4 Save Editor" shortcut with the herb icon (Windows Script Host; started by the "Create desktop shortcut" button).
// The shortcut starts "Start RE4 Save Editor.js" of this folder, so it has to be created again if the folder is moved.
// Optional argument: the folder to put the shortcut into (default: the desktop of the current user).
var sh = WScript.CreateObject('WScript.Shell');
var fso = WScript.CreateObject('Scripting.FileSystemObject');
var app = fso.GetParentFolderName(WScript.ScriptFullName);
var root = fso.GetParentFolderName(app);
var start = fso.BuildPath(root, 'Start RE4 Save Editor.js');
if (!fso.FileExists(start)) WScript.Quit(2);
var folder = WScript.Arguments.length ? WScript.Arguments(0) : sh.SpecialFolders('Desktop');
try {
  var link = sh.CreateShortcut(fso.BuildPath(folder, 'RE4 Save Editor.lnk'));
  link.TargetPath = sh.ExpandEnvironmentStrings('%SystemRoot%\\System32\\wscript.exe');
  link.Arguments = '"' + start + '"';
  link.WorkingDirectory = root;
  link.IconLocation = fso.BuildPath(app, 'icon.ico') + ',0';
  link.Description = 'RE4 Save Editor (unofficial)';
  link.Save();
} catch (e) { WScript.Quit(1); }
WScript.Quit(0);
