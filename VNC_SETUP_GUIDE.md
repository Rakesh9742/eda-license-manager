# VNC Server Connection Setup Guide

This guide explains how to connect your AWS-hosted EDA License Insight application to your VNC server for remote license command execution.

## Overview

Your EDA License Insight application can now execute license commands (`lmstat`) on a remote VNC server via SSH, allowing you to:
- Host your web application on AWS
- Execute license commands on your VNC server where the license tools are installed
- Get real-time license data from your VNC server

## Prerequisites

1. **VNC Server Access**: You need SSH access to your VNC server
2. **SSH Key**: SSH key pair for authentication (recommended) or password authentication
3. **License Tools**: License management tools (`lmstat`) installed on the VNC server
4. **Network Access**: AWS server must be able to reach your VNC server

## Configuration Steps

### 1. Update Backend Environment Configuration

Edit `backend/.env` file:

```bash
# VNC Server Configuration (for remote license command execution)
USE_VNC_SERVER=true
VNC_SERVER_HOST=your-vnc-server-ip-or-hostname
VNC_SERVER_PORT=22
VNC_SERVER_USERNAME=your-username
VNC_SERVER_KEY_PATH=/path/to/your/ssh/private/key
VNC_SSH_TIMEOUT=30000
```

### 2. SSH Key Setup (Recommended)

#### Option A: Use Existing SSH Key
1. Copy your private key to the AWS server
2. Set proper permissions: `chmod 600 /path/to/your/ssh/private/key`
3. Update `VNC_SERVER_KEY_PATH` in `.env`

#### Option B: Generate New SSH Key Pair
```bash
# On AWS server
ssh-keygen -t rsa -b 4096 -f ~/.ssh/vnc_server_key

# Copy public key to VNC server
ssh-copy-id -i ~/.ssh/vnc_server_key.pub your-username@your-vnc-server-ip

# Update .env
VNC_SERVER_KEY_PATH=~/.ssh/vnc_server_key
```

### 3. Test SSH Connection

Test the SSH connection manually first:
```bash
ssh -i /path/to/your/ssh/private/key your-username@your-vnc-server-ip
```

### 4. Verify License Commands on VNC Server

Ensure these commands work on your VNC server:
```bash
# Test Cadence license
LM_LICENSE_FILE=5280@yamuna /tools/synopsys/v2/lmstat -a

# Test Synopsys license  
LM_LICENSE_FILE=27020@yamuna /tools/synopsys/v2/lmstat -a

# Test MGS license
LM_LICENSE_FILE=1717@yamuna /tools/synopsys/v2/lmstat -a
```

## Testing the Connection

### 1. Start Your Application
```bash
# Start the backend
cd backend
npm start

# Start the frontend
cd frontend  
npm run dev
```

### 2. Test VNC Connection via API
Visit: `http://your-aws-server:3004/api/test-vnc-connection`

This will test:
- SSH connection to VNC server
- License command execution
- Return connection status and configuration

### 3. Test License Data Retrieval
Visit: `http://your-aws-server:3004/api/test-connections`

This will test all license server connections and show:
- SSH connection status
- Individual vendor license connections
- Command execution results

## Troubleshooting

### Common Issues

#### 1. SSH Connection Failed
- **Check**: SSH key permissions (`chmod 600`)
- **Check**: VNC server IP/hostname is correct
- **Check**: SSH service is running on VNC server
- **Check**: Firewall allows SSH connections

#### 2. License Commands Not Found
- **Check**: License tools are installed on VNC server
- **Check**: License server paths are correct
- **Check**: Environment variables (LM_LICENSE_FILE) are set correctly

#### 3. Permission Denied
- **Check**: User has permission to execute license commands
- **Check**: License files are accessible
- **Check**: SSH key is authorized on VNC server

#### 4. Timeout Issues
- **Increase**: `VNC_SSH_TIMEOUT` value in `.env`
- **Check**: Network connectivity between AWS and VNC server
- **Check**: VNC server performance

### Debug Commands

#### Test SSH Connection
```bash
ssh -v -i /path/to/key your-username@your-vnc-server-ip
```

#### Test License Commands Manually
```bash
# On VNC server
export LM_LICENSE_FILE=5280@yamuna
/tools/synopsys/v2/lmstat -a
```

#### Check Application Logs
```bash
# Backend logs will show detailed connection attempts
tail -f backend/logs/app.log
```

## Security Considerations

1. **SSH Key Security**: Store SSH keys securely, use proper permissions
2. **Network Security**: Use VPN or secure network connection if possible
3. **User Permissions**: Use dedicated user account with minimal required permissions
4. **Firewall**: Restrict SSH access to specific IP addresses
5. **Regular Updates**: Keep SSH keys and access credentials updated

## Environment Variables Reference

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `USE_VNC_SERVER` | Enable/disable VNC server usage | `false` | `true` |
| `VNC_SERVER_HOST` | VNC server IP or hostname | - | `192.168.1.100` |
| `VNC_SERVER_PORT` | SSH port on VNC server | `22` | `22` |
| `VNC_SERVER_USERNAME` | SSH username | - | `root` |
| `VNC_SERVER_KEY_PATH` | Path to SSH private key | - | `~/.ssh/id_rsa` |
| `VNC_SSH_TIMEOUT` | SSH connection timeout (ms) | `30000` | `60000` |

## API Endpoints

- `GET /api/test-vnc-connection` - Test SSH connection to VNC server
- `GET /api/test-connections` - Test all license server connections
- `GET /api/health` - Application health check
- `GET /api/licenses` - Get license data (uses VNC if configured)

## Support

If you encounter issues:
1. Check the application logs for detailed error messages
2. Test SSH connection manually
3. Verify license commands work on VNC server
4. Check network connectivity and firewall settings
