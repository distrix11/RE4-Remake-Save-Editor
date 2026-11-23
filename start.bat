@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto :nonode
if not exist "app\names.json" goto :needbuild

set "HAVE_CLI="
if exist "encryptor\limebrella-sharp-cli.dll" set "HAVE_CLI=1"
if exist "ref\LimebrellaSharp\limebrella-sharp-cli\bin\Release\net10.0\limebrella-sharp-cli.dll" set "HAVE_CLI=1"
if not defined HAVE_CLI goto :needbuild

set "HAVE_DOTNET="
if exist "tools\dotnet\dotnet.exe" set "HAVE_DOTNET=1"
if defined HAVE_DOTNET goto :run
where dotnet >nul 2>nul
if errorlevel 1 goto :nodotnet
dotnet --list-runtimes | findstr /b /c:"Microsoft.NETCore.App 10." >nul
if errorlevel 1 goto :nodotnet

:run
node app\server.js
pause
exit /b 0

:nonode
echo [ERROR] Node.js was not found. Install the LTS version from https://nodejs.org and run start.bat again.
goto :fail

:needbuild
echo The project is not built yet. Run build.bat first (needs git and internet access), or use a release package.
goto :fail

:nodotnet
echo [ERROR] The .NET 10 Runtime was not found.
echo Install ".NET Runtime 10" for Windows x64 from https://dotnet.microsoft.com/download/dotnet/10.0 and run start.bat again.
goto :fail

:fail
pause
exit /b 1
