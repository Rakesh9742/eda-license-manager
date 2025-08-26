#!/bin/bash

# EDA License Insight Startup Script

echo "🚀 Starting EDA License Insight..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Check if backend port is available
if ! check_port 8001; then
    echo "❌ Backend port 8001 is already in use. Please stop the existing service."
    exit 1
fi

# Check if frontend port is available
if ! check_port 3003; then
    echo "⚠️  Frontend port 3003 is already in use. Using alternative port."
fi

echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "📦 Installing frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "🔧 Checking configuration..."

# Check if backend .env exists
if [ ! -f "../backend/.env" ]; then
    echo "⚠️  Backend .env file not found. Please create it from .env.example"
    echo "   cd backend && cp .env.example .env"
    echo "   Then edit .env with your SSH connection details"
fi

# Check if frontend .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating frontend .env file from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        echo "VITE_API_URL=http://192.168.92.34:8001/api" > .env
        echo "VITE_APP_NAME=EDA License Insight" >> .env
        echo "VITE_APP_VERSION=1.0.0" >> .env
    fi
fi

echo "🚀 Starting services..."

# Start backend in background
echo "🔧 Starting backend server..."
cd ../backend
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo "🎨 Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Services started successfully!"
echo ""
echo "📊 Backend: http://192.168.92.34:8001"
echo "🎨 Frontend: http://192.168.92.34:3003"
echo "🔍 Health Check: http://192.168.92.34:8001/api/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for background processes
wait
