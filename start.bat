@echo off
chcp 65001 >nul

echo 🚀 Starting EDA License Insight...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available

echo 📦 Installing backend dependencies...
cd backend
if not exist "node_modules" (
    npm install
)

echo 📦 Installing frontend dependencies...
cd ..\frontend
if not exist "node_modules" (
    npm install
)

echo 🔧 Checking configuration...

REM Check if backend .env exists
if not exist "..\backend\.env" (
    echo ⚠️  Backend .env file not found. Please create it from .env.example
    echo    cd backend ^&^& copy .env.example .env
    echo    Then edit .env with your SSH connection details
)

REM Check if frontend .env exists
if not exist ".env" (
    echo 📝 Creating frontend .env file from .env.example...
    if exist ".env.example" (
        copy .env.example .env
    ) else (
        echo VITE_API_URL=http://192.168.92.34:8001/api > .env
        echo VITE_APP_NAME=EDA License Insight >> .env
        echo VITE_APP_VERSION=1.0.0 >> .env
    )
)

echo 🚀 Starting services...

REM Start backend in a new window
echo 🔧 Starting backend server...
start "EDA License Backend" cmd /k "cd /d %~dp0backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in a new window
echo 🎨 Starting frontend server...
start "EDA License Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo ✅ Services started successfully!
echo.
echo 📊 Backend: http://localhost:8001
echo 🎨 Frontend: http://localhost:3003
echo 🔍 Health Check: http://localhost:8001/api/health
echo.
echo Services are running in separate windows.
echo Close those windows to stop the services.
echo.
pause
