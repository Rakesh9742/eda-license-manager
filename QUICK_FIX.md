# Quick Fix for EC2 Issues

## Problem Summary
- ❌ `sshpass: command not found` - Backend can't SSH to VNC server
- ❌ `serve: command not found` - Frontend can't serve built files

## Quick Solution (Run on EC2)

### 1. Install sshpass
```bash
# For Amazon Linux 2
sudo yum install -y epel-release
sudo yum install -y sshpass

# For Amazon Linux 2023
sudo dnf install -y sshpass

# For Ubuntu
sudo apt-get update && sudo apt-get install -y sshpass
```

### 2. Install serve
```bash
# Install globally
sudo npm install -g serve

# OR install locally in frontend
cd /var/www/eda-license-manager/frontend
npm install --save-dev serve
```

### 3. Update Backend .env Password
```bash
cd /var/www/eda-license-manager/backend
nano .env
```
Change line 23 from:
```
VNC_SERVER_PASSWORD=YOUR_PASSWORD_HERE
```
To:
```
VNC_SERVER_PASSWORD=$ashi@123
```
(Note: The `$` character may need to be escaped as `\$` in some shells)

### 4. Restart PM2
```bash
# Option A: Use ecosystem config (recommended)
cd /var/www/eda-license-manager
pm2 delete all
pm2 start ecosystem.config.js
pm2 save

# Option B: Manual restart
pm2 restart backend
pm2 restart frontend
```

### 5. Verify
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs --lines 20

# Test SSH connection
curl http://localhost:3002/api/test-vnc-connection
```

## Or Use the Automated Script

Upload `fix-ec2-setup.sh` to your EC2 instance and run:
```bash
chmod +x fix-ec2-setup.sh
./fix-ec2-setup.sh
```

## Why This Happens

1. **sshpass**: Required for non-interactive SSH password authentication. When you manually SSH, you type the password. The application needs `sshpass` to provide it automatically.

2. **serve**: PM2 is trying to run `serve` to serve your built frontend files, but it's not installed. Installing it (globally or locally) fixes this.

## Alternative: Use SSH Keys Instead

If you prefer not to use passwords, you can set up SSH key authentication:

1. Generate SSH key on EC2:
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/vnc_server_key -N ""
   ```

2. Copy public key to VNC server:
   ```bash
   ssh-copy-id -i ~/.ssh/vnc_server_key.pub sashi@192.168.92.34
   ```

3. Update `backend/.env`:
   ```
   VNC_SERVER_KEY_PATH=/home/ec2-user/.ssh/vnc_server_key
   VNC_SERVER_PASSWORD=
   ```

This way you won't need `sshpass`!



