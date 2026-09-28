@echo off
setlocal EnableExtensions
cd /d "%~dp0"

title Friends Included - Upload to GitHub
echo =========================================================
echo   FRIENDS INCLUDED - ONE CLICK GITHUB UPLOAD
echo =========================================================
echo.
echo Repository: https://github.com/QAZAQ7/DS4.git
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo ERROR: Git for Windows is not installed.
  echo.
  echo Install it from:
  echo https://git-scm.com/download/win
  echo.
  pause
  exit /b 1
)

echo [1/7] Checking project structure...
if not exist "package.json" goto :badstructure
if not exist "pages\index.tsx" goto :badstructure
if not exist "pages\api\index.ts" goto :badstructure
if not exist "pages\api\telegram.ts" goto :badstructure
echo Structure OK.
echo.

echo [2/7] Creating a clean Git repository...
if exist ".git" rmdir /s /q ".git"
git init
if errorlevel 1 goto :fail

echo [3/7] Configuring Git identity...
git config user.name "Denis Shuvayev"
git config user.email "denisshuvayev48@gmail.com"

echo [4/7] Adding project files...
git add .
if errorlevel 1 goto :fail

echo [5/7] Creating commit...
git commit -m "Final Friends Included Day 4 project"
if errorlevel 1 goto :fail

echo [6/7] Connecting GitHub repository...
git branch -M main
git remote add origin https://github.com/QAZAQ7/DS4.git
if errorlevel 1 goto :fail

echo [7/7] Uploading to GitHub...
echo A GitHub sign-in window may open. Sign in if requested.
echo.
git push -u origin main --force
if errorlevel 1 (
  echo.
  echo =========================================================
  echo UPLOAD FAILED
  echo =========================================================
  echo If GitHub asked you to sign in, complete the browser login
  echo and run this file one more time.
  echo.
  pause
  exit /b 1
)

echo.
echo =========================================================
echo UPLOAD COMPLETE
echo =========================================================
echo.
echo Now open:
echo https://github.com/QAZAQ7/DS4
echo.
echo You MUST see the folder "pages" next to package.json.
echo Vercel should then rebuild automatically.
echo.
pause
exit /b 0

:badstructure
echo.
echo =========================================================
echo PROJECT STRUCTURE IS WRONG
echo =========================================================
echo This BAT file must be run from the extracted project folder.
echo Required:
echo   pages\index.tsx
echo   pages\api\index.ts
echo   pages\api\telegram.ts
echo   package.json
echo.
pause
exit /b 1

:fail
echo.
echo =========================================================
echo GIT COMMAND FAILED
echo =========================================================
echo Take a screenshot of this window and send it to ChatGPT.
echo.
pause
exit /b 1
