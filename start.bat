@echo off
setlocal
cd /d "%~dp0"

rem Starts the editor in its own window (Start RE4 Save Editor.js: uses runtime\node.exe or the installed Node.js, and offers to download Node.js if there is none).
if not exist "app\names.json" (
  echo The project is not built yet. Run build.bat first, or use a release package.
  pause
  exit /b 1
)
start "" wscript.exe "%~dp0Start RE4 Save Editor.js"
exit /b 0
