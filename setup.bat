@echo off
title Tejvanta Setup
echo ========================================
echo  Tejvanta (तेजवन्त) - Project Setup
echo ========================================
echo.

echo [1/3] Restoring backend dependencies...
cd /d "%~dp0Tejvanta.Api"
dotnet restore --verbosity quiet
if %errorlevel% neq 0 (
    echo FAILED: dotnet restore
    pause
    exit /b 1
)
echo OK
echo.

echo [2/3] Installing frontend dependencies...
cd /d "%~dp0tejvanta-ui"
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo FAILED: npm install
    pause
    exit /b 1
)
echo OK
echo.

echo [3/3] Verifying builds...
cd /d "%~dp0Tejvanta.Api"
dotnet build --no-restore --verbosity quiet
if %errorlevel% neq 0 (
    echo FAILED: Backend build
    pause
    exit /b 1
)
echo Backend: OK

cd /d "%~dp0tejvanta-ui"
call npx vite build --logLevel error
if %errorlevel% neq 0 (
    echo FAILED: Frontend build
    pause
    exit /b 1
)
echo Frontend: OK
echo.

echo ========================================
echo  Setup complete!
echo.
echo  Run run-backend.bat to start the API
echo  Run run-frontend.bat to start the UI
echo  Run run-all.bat to start both
echo ========================================
pause
