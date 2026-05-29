@echo off
REM Train the AI classifier on images in temp_images/

echo.
echo ============================================
echo TRAINING CIVIC ISSUE CLASSIFIER
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

echo [INFO] Starting training script...
echo.

python train_classifier.py

if errorlevel 1 (
    echo.
    echo [ERROR] Training failed
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo TRAINING COMPLETE!
echo ============================================
echo.
echo Next: Run start_api.bat to start the server
echo.
pause
