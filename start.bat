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

REM Start servers in background and check if they're running
start /b cmd /c "bun run start"

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
curl -s http://localhost:4000/api/products >nul 2>nul
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
curl -s http://localhost:8080 >nul 2>nul
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
bun run start
goto :end

:servers_ready
echo.
echo ✅ All servers are running and browser opened!
echo Press Ctrl+C to stop the servers, or close this window.
echo.
REM Wait for user to stop the servers
:wait_loop
timeout /t 5 /nobreak >nul 2>nul
if not defined _exit goto :wait_loop
goto :cleanup

:cleanup
echo.
echo Cleaning up any remaining background processes...
REM Kill processes on specific ports used by this application
for /f "tokens=5" %%a in ('netstat -aon ^| find ":4000" ^| find "LISTENING" 2^>nul') do (
    taskkill /f /pid %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING" 2^>nul') do (
    taskkill /f /pid %%a >nul 2>nul
)
REM Wait a moment for cleanup
timeout /t 1 /nobreak >nul 2>nul
echo.
echo ✅ Application has been stopped.
echo.

:end
echo Press any key to exit...
pause > nul
popd
