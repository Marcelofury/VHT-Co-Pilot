@echo off
REM VHT Co-Pilot Backend Setup Script for Windows

echo ========================================
echo VHT Co-Pilot Backend Setup
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.11+
    pause
    exit /b 1
)

echo [1/7] Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)

echo [2/7] Activating virtual environment...
call venv\Scripts\activate

echo [3/7] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [4/7] Setting up environment file...
if not exist .env (
    copy .env.example .env
    echo Created .env file - PLEASE EDIT IT TO ADD YOUR OPENAI API KEY
)

echo [5/7] Running database migrations...
python manage.py makemigrations
python manage.py migrate
if errorlevel 1 (
    echo ERROR: Database migration failed
    pause
    exit /b 1
)

echo [6/7] Creating superuser...
echo Please enter superuser credentials:
python manage.py createsuperuser

echo [7/7] Creating logs directory...
if not exist logs mkdir logs

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo IMPORTANT: Edit .env file and add your OPENAI_API_KEY
echo.
echo To start the server:
echo   1. venv\Scripts\activate
echo   2. python manage.py runserver
echo.
echo Admin: http://127.0.0.1:8000/admin/
echo API: http://127.0.0.1:8000/api/
echo.
pause
