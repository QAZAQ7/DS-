@echo off
setlocal
cd /d "%~dp0"

title Friends Included - START HERE
echo =========================================================
echo   FRIENDS INCLUDED - WINDOWS FINAL WORKFLOW
echo =========================================================
echo.
echo This package is already prepared.
echo.
echo STEP 1:
echo Run 1_SETUP_AND_TEST_WINDOWS.bat
echo You need to see: BUILD PASSED
echo.
echo STEP 2:
echo Run 2_UPLOAD_TO_GITHUB_WINDOWS.bat
echo It already knows your repository:
echo https://github.com/QAZAQ7/DS4.git
echo.
echo STEP 3:
echo Open Vercel. Wait for deployment to become READY.
echo.
echo STEP 4:
echo Add Supabase / Google Sheets / Telegram environment variables.
echo Exact names are in VERCEL_ENV_VARIABLES.txt
echo.
echo STEP 5:
echo Run Test 1 and Test 2 from README.md.
echo.
echo If Git or Node is missing, first run:
echo 0_INSTALL_GIT_AND_NODE_WINDOWS.bat
echo.
pause
