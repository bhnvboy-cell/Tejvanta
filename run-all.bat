@echo off
title Tejvanta
echo ========================================
echo  Tejvanta (तेजवन्त) - Starting All
echo ========================================
echo.

cd /d "%~dp0Tejvanta.Api"
echo [1] Starting Backend on http://localhost:5000
start "Tejvanta API" cmd /c "title Tejvanta API && echo Swagger: http://localhost:5000/swagger && dotnet run"

timeout /t 8 /nobreak >nul

cd /d "%~dp0tejvanta-ui"
echo [2] Starting Frontend on http://localhost:3000
start "Tejvanta UI" cmd /c "title Tejvanta UI && echo URL: http://localhost:3000 && npm run dev"

echo.
echo Both servers started. Close this window to keep them running.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo Swagger: http://localhost:5000/swagger
echo.
pause
