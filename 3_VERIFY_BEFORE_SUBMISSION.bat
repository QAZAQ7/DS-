@echo off
setlocal
cd /d "%~dp0"
echo Checking required files...
if not exist package.json goto missing
if not exist schema.sql goto missing
if not exist pages\index.tsx goto missing
if not exist pages\api\index.ts goto missing
if not exist pages\api\telegram.ts goto missing
echo Structure OK.
if exist node_modules (
  call npm run build
) else (
  echo Run 1_SETUP_AND_TEST_WINDOWS.bat first.
)
pause
exit /b 0
:missing
echo STRUCTURE CHECK FAILED.
pause
exit /b 1
