@echo off
rem CSS VTuber launcher - double click to start server + open controller
rem (keep this file ASCII-only: cmd.exe breaks on UTF-8 Japanese lines)
chcp 65001 >nul
title CSS VTuber
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found. Install it from https://nodejs.org
  pause
  exit /b 1
)

start "" "http://localhost:8321/"
node serve.js

echo.
pause
