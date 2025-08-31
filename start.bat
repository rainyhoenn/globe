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

REM Check if node_modules exists, if not, run setup
if not exist "node_modules" (
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

REM Run the start command and capture its exit code
bun run start
set START_EXIT_CODE=%errorlevel%

REM If bun run start was interrupted (Ctrl+C), clean up any remaining processes
if %START_EXIT_CODE% neq 0 (
    echo.
    echo Cleaning up any remaining background processes...
    REM Kill processes on specific ports used by this application
    for /f "tokens=5" %%a in ('netstat -aon ^| find ":4000" ^| find "LISTENING"') do (
        taskkill /f /pid %%a >nul 2>nul
    )
    for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING"') do (
        taskkill /f /pid %%a >nul 2>nul
    )
    REM Wait a moment for cleanup
    timeout /t 1 /nobreak >nul 2>nul
)

echo.
echo ✅ Application has been stopped.
echo.

:end
echo Press any key to exit...
pause > nul
popd
