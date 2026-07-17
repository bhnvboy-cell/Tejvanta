@echo off
title Tejvanta Frontend
cd /d "%~dp0tejvanta-ui"
echo Starting Tejvanta UI dev server...
echo URL: http://localhost:3000
echo.
call npm run dev
pause
