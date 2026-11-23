@echo off
setlocal
cd /d "%~dp0"
echo === RE4 Save Editor: build ===

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install it from https://nodejs.org and run build.bat again.
  goto :fail
)

rem --- 1. Portable .NET SDK (used to build the save encryptor)
if not exist "tools\dotnet\dotnet.exe" (
  echo [1/4] Downloading portable .NET SDK 10...
  if not exist tools mkdir tools
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest https://dot.net/v1/dotnet-install.ps1 -OutFile tools\dotnet-install.ps1" || goto :fail
  powershell -NoProfile -ExecutionPolicy Bypass -File tools\dotnet-install.ps1 -Channel 10.0 -InstallDir "%~dp0tools\dotnet" || goto :fail
) else (
  echo [1/4] .NET SDK already present.
)

rem --- 2. LimebrellaSharp (save encryption)
if not exist "ref\LimebrellaSharp\limebrella-sharp-cli\limebrella-sharp-cli.csproj" (
  echo [2/4] Downloading LimebrellaSharp...
  where git >nul 2>nul
  if errorlevel 1 (
    echo [ERROR] git is required to download LimebrellaSharp.
    goto :fail
  )
  git clone --depth 1 https://github.com/mi5hmash/LimebrellaSharp.git ref\LimebrellaSharp || goto :fail
) else (
  echo [2/4] LimebrellaSharp already present.
)
set "DOTNET_ROOT=%~dp0tools\dotnet"
set "DOTNET_CLI_TELEMETRY_OPTOUT=1"
echo       Building encryptor...
"%~dp0tools\dotnet\dotnet.exe" build "ref\LimebrellaSharp\limebrella-sharp-cli" -c Release -v quiet || goto :fail

rem --- 3. RE4 class templates (field names)
if not exist "ref\rsz\rszre4.json" (
  echo [3/4] Downloading RE4 class templates...
  if not exist ref\rsz mkdir ref\rsz
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest https://raw.githubusercontent.com/alphazolam/RE_RSZ/HEAD/rszre4.json -OutFile ref\rsz\rszre4.json" || goto :fail
) else (
  echo [3/4] Class templates already present.
)

rem --- 4. Name dictionary
if not exist "app\names.json" (
  echo [4/4] Generating name dictionary...
  node app\build-names.js || goto :fail
) else (
  echo [4/4] Name dictionary already present.
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
