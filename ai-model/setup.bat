@echo off
REM Setup script for AI Classification System
REM Run this once to install all dependencies

echo.
echo ============================================
echo CIVIC ISSUE CLASSIFIER - SETUP
echo ============================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org
    pause
    exit /b 1
)

REM Check pip
python -m pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pip not found
    pause
    exit /b 1
)

echo [1/3] Upgrading pip...
python -m pip install --upgrade pip

echo [2/3] Installing dependencies from requirements.txt...
if exist requirements.txt (
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo [ERROR] requirements.txt not found
    pause
    exit /b 1
)

echo [3/3] Verifying installation...
python -c "import tensorflow; import flask; import sklearn; print('[OK] All dependencies installed')" 2>nul
if errorlevel 1 (
    echo [WARNING] Some packages may not have installed correctly
    echo Try running: pip install -r requirements.txt
)

echo.
echo ============================================
echo SETUP COMPLETE!
echo ============================================
echo.
echo Next steps:
echo 1. Add training images to: temp_images/
echo 2. Run: train_classifier.py
echo 3. Run: start_api.bat
echo.
pause
