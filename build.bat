@echo off
setlocal enabledelayedexpansion
set "ROOT=%~dp0"

echo.
echo  Home Office Tracker  ^|  Distribution Build
echo  ============================================

:: ── Prereq checks ────────────────────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Python not found.
    echo         Install from https://python.org ^(tick "Add to PATH"^)
    pause & exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js not found.
    echo         Install from https://nodejs.org
    pause & exit /b 1
)

:: ── Step 1: React build ───────────────────────────────────────────────────────
echo.
echo  [1/3]  Building React frontend...
cd /d "%ROOT%frontend"

if not exist "node_modules\" (
    echo         Installing Node dependencies...
    npm install
    if errorlevel 1 (
        echo  ERROR: npm install failed.
        pause & exit /b 1
    )
)

npm run build
if errorlevel 1 (
    echo  ERROR: React build failed.
    pause & exit /b 1
)
echo         Done  ^>  frontend\dist\

:: ── Step 2: Python dependencies ──────────────────────────────────────────────
echo.
echo  [2/3]  Installing Python dependencies...
cd /d "%ROOT%"
python -m pip install -r backend\requirements.txt -q
if errorlevel 1 (
    echo  ERROR: pip install failed.
    pause & exit /b 1
)

:: ── Step 3: PyInstaller ───────────────────────────────────────────────────────
echo.
echo  [3/3]  Running PyInstaller  ^(this may take a minute^)...
cd /d "%ROOT%"

:: Clean previous output so we never ship a stale build
if exist "build\"                rmdir /s /q "build"
if exist "dist\HomeOfficeTracker.exe"  del /q "dist\HomeOfficeTracker.exe"
if exist "HomeOfficeTracker.spec"      del /q "HomeOfficeTracker.spec"

pyinstaller ^
    --onefile ^
    --name "HomeOfficeTracker" ^
    --add-data "frontend/dist;dist" ^
    --collect-all uvicorn ^
    --collect-all starlette ^
    --collect-all fastapi ^
    --hidden-import anyio._backends._asyncio ^
    --hidden-import email.mime.text ^
    --hidden-import email.mime.multipart ^
    app.py

if errorlevel 1 (
    echo.
    echo  ERROR: PyInstaller failed. See output above for details.
    pause & exit /b 1
)

:: ── Done ─────────────────────────────────────────────────────────────────────
echo.
echo  ============================================
echo   Build complete!
echo.
echo   Executable :  dist\HomeOfficeTracker.exe
echo   Data file  :  work_hours.csv is created
echo                 next to the .exe on first run
echo.
echo   To distribute: copy  dist\HomeOfficeTracker.exe
echo   to any Windows PC and double-click to launch.
echo   No Python or Node installation required.
echo  ============================================
pause