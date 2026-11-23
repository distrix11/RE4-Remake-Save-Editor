@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto :nonode
if not exist "ref\LimebrellaSharp\limebrella-sharp-cli\bin\Release\net10.0\limebrella-sharp-cli.dll" goto :needbuild
if not exist "tools\dotnet\dotnet.exe" goto :needbuild
if not exist "app\names.json" goto :needbuild
echo RE4 Save Editor: http://localhost:4784
echo Close this window to stop the editor.
start "" http://localhost:4784
node app\server.js
pause
exit /b 0

:nonode
echo [ERROR] Node.js not found. Install it from https://nodejs.org
pause
exit /b 1

:needbuild
echo The project is not built yet. Run build.bat first.
pause
exit /b 1
