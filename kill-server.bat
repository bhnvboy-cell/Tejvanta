@echo off
title Killing Tejvanta Servers
echo Stopping Tejvanta servers...
echo.

:: Kill dotnet processes on port 5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R ":5000"') do (
    taskkill /F /PID %%a 2>nul
)

:: Kill node processes on port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R ":3000"') do (
    taskkill /F /PID %%a 2>nul
)

:: Kill any remaining dotnet or node processes started by our scripts
taskkill /F /IM dotnet.exe 2>nul
taskkill /F /IM node.exe 2>nul

echo Servers stopped.
timeout /t 2 /nobreak >nul
