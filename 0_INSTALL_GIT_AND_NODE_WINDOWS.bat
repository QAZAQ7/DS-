@echo off
setlocal
title Friends Included - Install Windows Tools

echo =========================================================
echo   INSTALL REQUIRED WINDOWS TOOLS
echo =========================================================
echo.

where winget >nul 2>nul
if errorlevel 1 (
  echo winget is unavailable.
  echo Please install manually:
  echo Git: https://git-scm.com/download/win
  echo Node.js 20 LTS: https://nodejs.org/
  pause
  exit /b 1
)

where git >nul 2>nul
if errorlevel 1 (
  echo Installing Git for Windows...
  winget install --id Git.Git -e --source winget
) else (
  echo Git is already installed.
)

where node >nul 2>nul
if errorlevel 1 (
  echo Installing Node.js LTS...
  winget install --id OpenJS.NodeJS.LTS -e --source winget
) else (
  echo Node.js is already installed.
)

echo.
echo Installation step finished.
echo IMPORTANT: Close this window and reopen the project folder
echo before running the other BAT files.
pause
