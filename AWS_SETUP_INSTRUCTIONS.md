# AWS Server Setup Instructions

## Prerequisites for VNC Server Connection

Your AWS server needs `sshpass` installed to use password authentication with your VNC server.

### Install sshpass on AWS Server

#### For Ubuntu/Debian:
```bash
sudo apt update
sudo apt install sshpass
```

#### For Amazon Linux/CentOS/RHEL:
```bash
sudo yum install sshpass
# or for newer versions:
sudo dnf install sshpass
```

#### For Amazon Linux 2023:
```bash
sudo dnf install sshpass
```

### Verify Installation
```bash
sshpass -V
```

## Test Connection

After installing `sshpass`, test the connection:

```bash
# Test SSH connection to VNC server
sshpass -p '$ashi@123' ssh -o StrictHostKeyChecking=no sashi@192.168.92.34 "echo 'Connection successful'"
```

## Start Your Application

Once `sshpass` is installed:

```bash
# Start backend
cd backend
npm start

# Start frontend (in another terminal)
cd frontend
npm run dev
```

## Test VNC Connection via API

Visit these URLs to test the connection:

1. **VNC Connection Test**: `http://3.110.172.123:3004/api/test-vnc-connection`
2. **License Commands Test**: `http://3.110.172.123:3004/api/test-connections`
3. **Health Check**: `http://3.110.172.123:3004/api/health`

## Troubleshooting

### If sshpass installation fails:
```bash
# Alternative: Use expect script
sudo apt install expect
```

### If connection still fails:
1. Check if your AWS server can reach the VNC server:
   ```bash
   ping 192.168.92.34
   telnet 192.168.92.34 22
   ```

2. Check firewall settings on both servers

3. Verify the password is correct by testing manually:
   ```bash
   ssh sashi@192.168.92.34
   ```

## Security Note

For production use, consider:
- Using SSH key authentication instead of passwords
- Setting up VPN between AWS and VNC server
- Restricting SSH access to specific IP addresses
