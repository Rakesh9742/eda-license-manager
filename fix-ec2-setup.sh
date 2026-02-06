#!/bin/bash

# EC2 Setup Fix Script
# This script fixes the sshpass and serve issues on EC2

set -e

echo "🔧 EC2 Setup Fix Script"
echo "======================"
echo ""

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ Cannot detect OS. Please install manually."
    exit 1
fi

echo "📦 Detected OS: $OS"
echo ""

# Install sshpass
echo "1️⃣ Installing sshpass..."
if [ "$OS" == "amzn" ] || [ "$OS" == "centos" ] || [ "$OS" == "rhel" ]; then
    # Amazon Linux 2 or CentOS/RHEL
    if command -v yum &> /dev/null; then
        sudo yum install -y epel-release 2>/dev/null || true
        sudo yum install -y sshpass
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y sshpass
    else
        echo "⚠️  Cannot install sshpass automatically. Please install manually."
    fi
elif [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
    sudo apt-get update
    sudo apt-get install -y sshpass
else
    echo "⚠️  Unknown OS. Please install sshpass manually."
fi

# Verify sshpass
if command -v sshpass &> /dev/null; then
    echo "✅ sshpass installed successfully"
    sshpass -V
else
    echo "❌ sshpass installation failed. Please install manually."
fi

echo ""

# Install serve for frontend
echo "2️⃣ Installing serve for frontend..."
if command -v npm &> /dev/null; then
    # Try global install first
    sudo npm install -g serve 2>/dev/null || npm install -g serve
    
    # Also install locally in frontend directory
    if [ -d "/var/www/eda-license-manager/frontend" ]; then
        cd /var/www/eda-license-manager/frontend
        npm install --save-dev serve 2>/dev/null || true
        cd - > /dev/null
    fi
    
    # Verify serve
    if command -v serve &> /dev/null; then
        echo "✅ serve installed successfully"
        serve --version
    else
        echo "⚠️  serve may not be in PATH. Checking local installation..."
        if [ -f "/var/www/eda-license-manager/frontend/node_modules/.bin/serve" ]; then
            echo "✅ serve installed locally in frontend/node_modules"
        else
            echo "❌ serve installation may have failed"
        fi
    fi
else
    echo "❌ npm not found. Please install Node.js first."
fi

echo ""

# Check backend .env
echo "3️⃣ Checking backend .env configuration..."
if [ -f "/var/www/eda-license-manager/backend/.env" ]; then
    if grep -q "VNC_SERVER_PASSWORD=YOUR_PASSWORD_HERE" /var/www/eda-license-manager/backend/.env; then
        echo "⚠️  WARNING: VNC_SERVER_PASSWORD is still set to placeholder value!"
        echo "   Please update /var/www/eda-license-manager/backend/.env with your actual password"
    else
        echo "✅ Backend .env file exists and password appears to be configured"
    fi
else
    echo "⚠️  Backend .env file not found at /var/www/eda-license-manager/backend/.env"
fi

echo ""

# Test SSH connection if password is configured
echo "4️⃣ Testing SSH connection..."
if [ -f "/var/www/eda-license-manager/backend/.env" ]; then
    VNC_HOST=$(grep "^VNC_SERVER_HOST=" /var/www/eda-license-manager/backend/.env | cut -d'=' -f2 | tr -d ' ')
    VNC_USER=$(grep "^VNC_SERVER_USERNAME=" /var/www/eda-license-manager/backend/.env | cut -d'=' -f2 | tr -d ' ')
    VNC_PASS=$(grep "^VNC_SERVER_PASSWORD=" /var/www/eda-license-manager/backend/.env | cut -d'=' -f2 | tr -d ' ')
    
    if [ -n "$VNC_HOST" ] && [ -n "$VNC_USER" ] && [ -n "$VNC_PASS" ] && [ "$VNC_PASS" != "YOUR_PASSWORD_HERE" ]; then
        if command -v sshpass &> /dev/null; then
            echo "Testing connection to $VNC_USER@$VNC_HOST..."
            if sshpass -p "$VNC_PASS" ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$VNC_USER@$VNC_HOST" "echo 'SSH connection successful'" 2>/dev/null; then
                echo "✅ SSH connection test successful!"
            else
                echo "⚠️  SSH connection test failed. Please verify:"
                echo "   - Password is correct"
                echo "   - Network connectivity to $VNC_HOST"
                echo "   - SSH service is running on remote server"
            fi
        else
            echo "⚠️  sshpass not available, skipping SSH test"
        fi
    else
        echo "⚠️  SSH credentials not fully configured, skipping test"
    fi
else
    echo "⚠️  Cannot test SSH - .env file not found"
fi

echo ""

# PM2 instructions
echo "5️⃣ PM2 Restart Instructions"
echo "============================"
echo ""
echo "After fixing the issues, restart your PM2 processes:"
echo ""
echo "  # Option 1: Use ecosystem config (recommended)"
echo "  cd /var/www/eda-license-manager"
echo "  pm2 delete all"
echo "  pm2 start ecosystem.config.js"
echo "  pm2 save"
echo ""
echo "  # Option 2: Manual restart"
echo "  pm2 restart backend"
echo "  pm2 restart frontend"
echo ""
echo "  # Check status"
echo "  pm2 status"
echo "  pm2 logs"
echo ""

echo "✅ Setup fix script completed!"
echo ""
echo "Next steps:"
echo "1. Update VNC_SERVER_PASSWORD in backend/.env if needed"
echo "2. Restart PM2 processes using the commands above"
echo "3. Check PM2 logs to verify everything is working"



