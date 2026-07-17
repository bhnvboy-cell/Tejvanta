@echo off
title Tejvanta Build
echo ========================================
echo  Tejvanta (तेजवन्त) - Production Build
echo ========================================
echo.

cd /d "%~dp0tejvanta-ui"
echo [1/2] Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo FAILED
    pause
    exit /b 1
)
echo Frontend build: OK (output in tejvanta-ui/dist/)
echo.

cd /d "%~dp0Tejvanta.Api"
echo [2/2] Publishing backend...
dotnet publish -c Release -o publish --verbosity quiet
if %errorlevel% neq 0 (
    echo FAILED
    pause
    exit /b 1
)
echo Backend publish: OK (output in Tejvanta.Api/publish/)
echo.

echo ========================================
echo  Build complete!
echo.
echo  Frontend: tejvanta-ui/dist/
echo  Backend:  Tejvanta.Api/publish/
echo.
echo  Copy both to your deployment server.
echo ========================================
pause
