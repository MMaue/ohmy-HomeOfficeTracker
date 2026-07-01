@echo off
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"

echo.
echo  Home Office Tracker
echo  ======================================

:: ── Prerequisite checks ────────────────────────────────────────────────────

python --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Python not found.
    echo  Install Python 3 from https://python.org and tick
    echo  "Add Python to PATH" during setup.
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js not found.
    echo  Install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: ── Backend ────────────────────────────────────────────────────────────────
echo  ^> Starting backend...
cd /d "%SCRIPT_DIR%backend"

:: python -c "import uvicorn" >nul 2>&1
:: if errorlevel 1 (
::     echo    Installing Python dependencies...
::     python -m pip install -r requirements.txt -q
:: )

start "HOT-Backend" /D "%SCRIPT_DIR%backend" /MIN cmd /k ^
    "   "
echo    Backend running  ^>  http://localhost:8000  ^(minimised window^)

:: ── Frontend ───────────────────────────────────────────────────────────────
echo  ^> Starting frontend...
cd /d "%SCRIPT_DIR%frontend"

:: if not exist "node_modules\" (
::     echo    Installing Node dependencies ^(first run, may take a moment^)...
::     npm install
:: )

start "HOT-Frontend" /D "%SCRIPT_DIR%frontend" /MIN cmd /k "npm run dev"
echo    Frontend running ^>  http://localhost:5173  ^(minimised window^)

:: ── Open browser ───────────────────────────────────────────────────────────
echo  Waiting for services to start...
timeout /t 5 /nobreak >nul

start "" "http://localhost:5173"

echo.
echo  ======================================
echo   App is live at http://localhost:5173
echo.
echo   Both services run in minimised windows.
echo   Edit backend/work_hours.csv directly -
echo   changes appear in the app within 3 s.
echo.
echo   Press any key to STOP all services.
echo  ======================================
pause >nul

:: ── Cleanup ────────────────────────────────────────────────────────────────
echo  Stopping services...

for /f "tokens=5" %%a in (
    'netstat -aon ^| findstr ":8000 " ^| findstr "LISTENING"'
) do (
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in (
    'netstat -aon ^| findstr ":5173 " ^| findstr "LISTENING"'
) do (
    taskkill /F /PID %%a >nul 2>&1
)

echo  Goodbye.
timeout /t 2 /nobreak >nul