@echo off
title Tejvanta Backend
cd /d "%~dp0Tejvanta.Api"
echo Starting Tejvanta API server...
echo Swagger: http://localhost:5000/swagger
echo.
dotnet run
pause
