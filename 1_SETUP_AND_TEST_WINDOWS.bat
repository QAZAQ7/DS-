@echo off
setlocal
cd /d "%~dp0"
echo ==============================================
echo Friends Included - Windows setup and test
echo ==============================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed.
  echo Install Node.js 20 LTS from https://nodejs.org/
  pause
  exit /b 1
)
echo Node:
node -v
echo npm:
npm -v
echo.
echo Installing dependencies...
call npm install
if errorlevel 1 (
  echo ERROR: npm install failed.
  pause
  exit /b 1
)
echo.
echo Running production build...
call npm run build
if errorlevel 1 (
  echo ERROR: build failed.
  echo Send ChatGPT a screenshot of the last error lines.
  pause
  exit /b 1
)
echo.
echo ==============================================
echo BUILD PASSED
 echo Project is ready for GitHub and Vercel.
echo ==============================================
pause
