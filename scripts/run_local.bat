@echo off
REM Team Cost Calculator - Local Run Script for Windows
REM Usage: scripts\run_local.bat

echo ==========================================
echo   Team Cost Calculator - Local Startup
echo ==========================================

cd /d "%~dp0.."

REM Create data directory
if not exist "data" mkdir data

REM Install backend dependencies
echo.
echo [1/4] Installing backend dependencies...
cd backend
python -m venv venv 2>nul
call venv\Scripts\activate.bat
pip install -q -r requirements.txt

REM Install frontend dependencies
echo.
echo [2/4] Installing frontend dependencies...
cd ..\frontend
call npm install --silent

REM Start backend in new window
echo.
echo [3/4] Starting backend server...
cd ..\backend
start "Backend" cmd /k "call venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000"

REM Wait for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend in new window
echo.
echo [4/4] Starting frontend dev server...
cd ..\frontend
start "Frontend" cmd /k "npm run dev"

echo.
echo ==========================================
echo   Application started!
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo ==========================================
echo.
echo Close the Backend and Frontend windows to stop servers

pause
