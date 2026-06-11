@echo off
title Justice AI - Dev Launcher
echo.
echo  ============================================================
echo   Justice AI - Starting Development Servers
echo  ============================================================
echo.

REM Start Backend (FastAPI)
echo [1/2] Starting FastAPI backend on http://127.0.0.1:8000 ...
start "Justice AI - Backend" cmd /k "cd /d "%~dp0backend" && uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

REM Wait a moment for backend to boot
timeout /t 3 /nobreak > nul

REM Start Frontend (Next.js)
echo [2/2] Starting Next.js frontend on http://localhost:3000 ...
start "Justice AI - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo  ============================================================
echo   Both servers launching in separate windows!
echo   Backend:  http://127.0.0.1:8000
echo   Frontend: http://localhost:3000
echo  ============================================================
echo.
echo  Open http://localhost:3000/app/voice in your browser.
echo  Press any key to open the browser now...
pause > nul
start http://localhost:3000/app/voice
