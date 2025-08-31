@echo off
REM Double-click this file to start backend and frontend and open the app on Windows

REM Ensure working directory is project root
pushd "%~dp0"

echo Globe ERP - Setting up and starting the application...
echo.

REM Check if Bun is installed
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Bun is not installed or not in PATH.
    echo Please install Bun from https://bun.sh/
    echo.
    echo Press any key to exit...
    pause > nul
    goto :end
)

REM Check if node_modules exists and if it's properly configured
if not exist "node_modules" (
    set NEEDS_SETUP=1
) else (
    REM Check if core dependencies exist
    if not exist "node_modules\express" (
        echo Detected incomplete installation, running setup...
        set NEEDS_SETUP=1
    ) else (
        set NEEDS_SETUP=0
    )
)

if "%NEEDS_SETUP%"=="1" (
    echo First time setup detected. Running initial setup...
    echo.
    
    REM Set PowerShell execution policy for current user
    echo Setting PowerShell execution policy...
    powershell -Command "& {Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force}"
    
    if %errorlevel% neq 0 (
        echo Warning: Failed to set PowerShell execution policy automatically.
        echo You may need to run this manually in PowerShell as Administrator:
        echo Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
        echo.
    ) else (
        echo PowerShell execution policy set successfully.
    )
    
    echo.
    echo Installing dependencies...
    bun install
    
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies.
        echo Please check your internet connection and try again.
        echo.
        echo Press any key to exit...
        pause > nul
        goto :end
    )
    
    echo.
    echo Ensuring Windows compatibility...
    REM Clear any Bun caches that might cause issues on Windows
    echo Clearing Bun cache...
    bun pm cache rm 2>nul
    if %errorlevel% neq 0 (
        echo Cache clear had issues, but continuing...
    ) else (
        echo Cache cleared successfully
    )
    
    REM Reinstall to fix any Windows-specific module resolution issues
    echo Reinstalling dependencies for Windows compatibility...
    bun install --force
    
    if %errorlevel% neq 0 (
        echo Warning: Force reinstall had issues, but continuing...
    )
    
    REM Create a quick verification that key modules are accessible
    echo Verifying installation...
    if exist "node_modules\express" (
        echo ✅ Express found
    ) else (
        echo ❌ Express missing - this may cause server startup issues
    )
    
    if exist "node_modules\postcss" (
        echo ✅ PostCSS found
    ) else (
        echo ❌ PostCSS missing - this may cause build issues
    )
    
    echo.
    echo Setup completed successfully!
    echo.
)

echo Starting backend and frontend servers...
echo.
echo The application will be available at:
echo Frontend: http://localhost:8080
echo Backend API: http://localhost:4000/api
echo.
echo To stop the servers, close this window or press Ctrl+C
echo.

REM Start servers and monitor them
echo Starting servers...
start /min "Globe-ERP-Servers" cmd /k "bun run start"
REM Give servers time to initialize
timeout /t 3 /nobreak >nul

REM Wait for servers to start and check if they're responding
echo Waiting for servers to start...
set /a attempts=0
:check_servers
set /a attempts+=1
if %attempts% gtr 30 (
    echo Timeout: Servers took too long to start
    goto :run_normally
)

REM Check if backend server is responding
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:4000/api/products' -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Backend server is running
    goto :check_frontend
) else (
    echo Checking servers... (%attempts%/30^)
    timeout /t 2 /nobreak >nul
    goto :check_servers
)

:check_frontend
REM Check if frontend is responding
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8080' -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Frontend server is running
    echo.
    echo 🌐 Opening browser...
    start http://localhost:8080
    goto :servers_ready
) else (
    echo Frontend starting... (%attempts%/30^)
    timeout /t 2 /nobreak >nul
    goto :check_servers
)

:run_normally
echo Running servers normally...
echo.
echo If you encounter module resolution errors, try:
echo 1. Delete node_modules folder and run this script again
echo 2. Or run: bun install --force
echo.
bun run start
goto :end

:servers_ready
echo.
echo ✅ All servers are running and browser opened!
echo.
echo The servers are running in a separate window titled "Globe-ERP-Servers"
echo To stop the servers: Close that window or press Ctrl+C in it
echo.
echo This window will now close. The application will continue running
echo in the background until you stop the server window.
echo.
timeout /t 5 /nobreak >nul
goto :end


:end
echo Press any key to exit...
pause > nul
popd
