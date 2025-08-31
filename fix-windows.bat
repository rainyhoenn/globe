@echo off
REM Windows troubleshooting script for Globe ERP

echo Globe ERP - Windows Troubleshooting Script
echo.

REM Ensure working directory is project root
pushd "%~dp0"

echo This script will attempt to fix common Windows issues with Bun and dependencies.
echo.
echo Press any key to continue or close this window to cancel...
pause > nul

echo.
echo Step 1: Cleaning existing installation...
if exist "node_modules" (
    echo Removing node_modules folder...
    rmdir /s /q node_modules
)

if exist "bun.lockb" (
    echo Removing lockfile...
    del bun.lockb
)

echo.
echo Step 2: Clearing Bun caches...
bun pm cache rm 2>nul
if %errorlevel% neq 0 (
    echo Cache clearing had issues, but continuing...
) else (
    echo Cache cleared successfully
)

echo.
echo Step 3: Fresh installation with force flag...
bun install --force

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Installation failed. This might indicate:
    echo 1. Bun is not properly installed on Windows
    echo 2. Network connectivity issues
    echo 3. Windows permissions problems
    echo.
    echo Try installing Bun from: https://bun.sh/
    echo Or run as Administrator
    echo.
    echo Press any key to exit...
    pause > nul
    popd
    exit /b 1
)

echo.
echo Step 4: Verifying critical modules...
set MODULES_OK=1

if not exist "node_modules\express" (
    echo ❌ Express is missing
    set MODULES_OK=0
) else (
    echo ✅ Express found
)

if not exist "node_modules\postcss" (
    echo ❌ PostCSS is missing  
    set MODULES_OK=0
) else (
    echo ✅ PostCSS found
)

if not exist "node_modules\vite" (
    echo ❌ Vite is missing
    set MODULES_OK=0
) else (
    echo ✅ Vite found
)

echo.
if "%MODULES_OK%"=="1" (
    echo ✅ All critical modules are present!
    echo You can now try running start.bat again.
) else (
    echo ❌ Some modules are still missing. This might indicate:
    echo 1. Bun compatibility issues on your Windows version
    echo 2. Antivirus software blocking installations
    echo 3. Path or permission issues
    echo.
    echo As a fallback, you can try:
    echo 1. Installing Node.js and using npm instead
    echo 2. Running in Windows Subsystem for Linux (WSL)
)

echo.
echo Press any key to exit...
pause > nul
popd