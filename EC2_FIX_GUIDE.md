# EC2 Server Fix Guide

## Issues Identified

1. **Backend SSH Issue**: `sshpass: command not found` - Required for password-based SSH authentication
2. **Frontend Serve Issue**: `serve: command not found` - Required to serve the built frontend files

## Solution

### Step 1: Install sshpass on EC2

SSH into your EC2 instance and run:

```bash
# For Amazon Linux 2 / CentOS / RHEL
sudo yum install -y sshpass

# For Amazon Linux 2023
sudo dnf install -y sshpass

# For Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y sshpass
```

**Verify installation:**
```bash
sshpass -V
```

### Step 2: Update Backend .env Password

Make sure your `backend/.env` file has the correct password:

```bash
cd /var/www/eda-license-manager/backend
nano .env
```

Update line 23:
```
VNC_SERVER_PASSWORD=$ashi@123
```

### Step 3: Install serve for Frontend

The frontend PM2 process needs `serve` to serve the built files. Install it globally:

```bash
sudo npm install -g serve
```

**Or install locally in frontend:**
```bash
cd /var/www/eda-license-manager/frontend
npm install --save-dev serve
```

### Step 4: Test SSH Connection

Test that sshpass works:

```bash
sshpass -p '$ashi@123' ssh -o StrictHostKeyChecking=no sashi@192.168.92.34 "echo 'Connection successful'"
```

### Step 5: Restart PM2 Processes

After installing the required tools:

```bash
# Stop all PM2 processes
pm2 stop all

# Delete all processes
pm2 delete all

# Restart using the ecosystem config (see Step 6)
pm2 start ecosystem.config.js

# Or restart manually:
cd /var/www/eda-license-manager/backend
pm2 start server.js --name backend

cd /var/www/eda-license-manager/frontend
pm2 start "serve -s dist -l 3001" --name frontend

# Save PM2 configuration
pm2 save
pm2 startup
```

### Step 6: Verify Everything Works

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs frontend --lines 20
pm2 logs backend --lines 20

# Test backend SSH connection
curl http://localhost:3002/api/test-vnc-connection

# Test frontend
curl http://localhost:3001
```

## Alternative: Use PM2 Ecosystem Config

Create `ecosystem.config.js` in the project root for easier management (see next section).

## Troubleshooting

### If sshpass installation fails:

Some repositories don't include sshpass. Try:

```bash
# For Amazon Linux 2
sudo yum install -y epel-release
sudo yum install -y sshpass

# Or compile from source
wget http://sourceforge.net/projects/sshpass/files/sshpass/1.06/sshpass-1.06.tar.gz
tar xvzf sshpass-1.06.tar.gz
cd sshpass-1.06
./configure
make
sudo make install
```

### If serve command still not found:

Make sure the PATH includes npm global bin:

```bash
# Add to ~/.bashrc
export PATH=$PATH:/usr/bin:/usr/local/bin:$(npm config get prefix)/bin

# Reload
source ~/.bashrc
```

### If SSH connection still fails:

1. Check network connectivity:
   ```bash
   ping 192.168.92.34
   telnet 192.168.92.34 22
   ```

2. Verify password is correct in `.env` file
3. Check if password has special characters that need escaping
4. Test manual SSH connection:
   ```bash
   ssh sashi@192.168.92.34
   ```



