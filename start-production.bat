@echo off
chcp 65001 >nul

echo 🚀 Starting EDA License Insight in PRODUCTION mode...

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

echo 🔧 Checking production configuration...

REM Check if backend .env exists
if not exist "..\backend\.env" (
    echo ❌ Backend .env file not found. Please create it from .env.example
    echo    cd backend ^&^& copy .env.example .env
    pause
    exit /b 1
)

REM Check if frontend .env exists
if not exist ".env" (
    echo ❌ Frontend .env file not found. Please create it from .env.example
    echo    cd frontend ^&^& copy .env.example .env
    pause
    exit /b 1
)

echo 🚀 Starting production services...

REM Start backend in a new window
echo 🔧 Starting backend server (Production Mode)...
start "EDA License Backend (Production)" cmd /k "cd /d %~dp0backend && set NODE_ENV=production && npm start"

REM Wait a moment for backend to start
timeout /t 5 /nobreak >nul

REM Start frontend in a new window
echo 🎨 Starting frontend server (Production Mode)...
start "EDA License Frontend (Production)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo ✅ Production services started successfully!
echo.
REM Read environment variables from .env files
for /f "tokens=2 delims==" %%a in ('findstr "SERVER_IP=" ..\backend\.env 2^>nul') do set SERVER_IP=%%a
for /f "tokens=2 delims==" %%a in ('findstr "BACKEND_PORT=" ..\backend\.env 2^>nul') do set BACKEND_PORT=%%a
for /f "tokens=2 delims==" %%a in ('findstr "VITE_FRONTEND_PORT=" .env 2^>nul') do set FRONTEND_PORT=%%a
for /f "tokens=2 delims==" %%a in ('findstr "VITE_SERVER_IP=" .env 2^>nul') do set VITE_SERVER_IP=%%a

REM Set defaults if not found
if not defined SERVER_IP set SERVER_IP=3.110.172.123
if not defined BACKEND_PORT set BACKEND_PORT=3004
if not defined FRONTEND_PORT set FRONTEND_PORT=3002
if not defined VITE_SERVER_IP set VITE_SERVER_IP=3.110.172.123

echo 📊 Backend API: http://%SERVER_IP%:%BACKEND_PORT%
echo 🎨 Frontend UI: http://%VITE_SERVER_IP%:%FRONTEND_PORT%
echo 🔍 Health Check: http://%SERVER_IP%:%BACKEND_PORT%/api/health
echo.
echo 🌐 Access from other machines using: http://%VITE_SERVER_IP%:%FRONTEND_PORT%
echo.
echo Services are running in separate windows.
echo Close those windows to stop the services.
echo.
echo ⚠️  Production Mode: NODE_ENV=production
echo 📋 Using liccheck commands: --synopsys, --cadence, --mgs
echo.
pause
