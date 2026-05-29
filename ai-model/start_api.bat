@echo off
REM Start the Civic Issue Classifier API

echo.
echo ============================================
echo STARTING CLASSIFIER API
echo ============================================
echo.

cd /d "%~dp0"

REM Check if Python exists
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found
    pause
    exit /b 1
)

echo [INFO] Starting Flask server...
echo [INFO] API will be available at: http://localhost:8000
echo.

python app.py

if errorlevel 1 (
    echo.
    echo [ERROR] API failed to start
    echo Check that port 8000 is not already in use
    echo.
    pause
    exit /b 1
)
