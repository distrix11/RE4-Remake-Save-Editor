@echo off
setlocal
cd /d "%~dp0"

rem Starts the editor in its own window (start.js: uses runtime\node.exe or the installed Node.js, and offers to download Node.js if there is none).
if not exist "app\names.json" (
  echo The project is not built yet. Run build.bat first, or use a release package.
  pause
  exit /b 1
)
start "" wscript.exe "%~dp0start.js"
exit /b 0
