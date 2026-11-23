@echo off
setlocal
cd /d "%~dp0"
echo === RE4 Save Editor: build (one time, for a copy of the source code) ===

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install it from https://nodejs.org and run build.bat again.
  goto :fail
)

rem --- 1. RE4 class templates (field names)
if not exist "ref\rsz\rszre4.json" (
  echo [1/2] Downloading RE4 class templates...
  if not exist ref\rsz mkdir ref\rsz
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest https://raw.githubusercontent.com/alphazolam/RE_RSZ/HEAD/rszre4.json -OutFile ref\rsz\rszre4.json" || goto :fail
) else (
  echo [1/2] Class templates already present.
)

rem --- 2. Name dictionary
if not exist "app\names.json" (
  echo [2/2] Generating name dictionary...
  node app\build-names.js || goto :fail
) else (
  echo [2/2] Name dictionary already present.
)

echo.
echo === Done. Run start.bat ===
pause
exit /b 0

:fail
echo.
echo [ERROR] Build failed, see messages above.
pause
exit /b 1
