# Quick SSH Setup Summary

## Configuration for sashi@192.168.92.34

### Step 1: Update backend/.env file

The `.env` file has been created with the following configuration:

```bash
USE_VNC_SERVER=true
VNC_SERVER_HOST=192.168.92.34
VNC_SERVER_PORT=22
VNC_SERVER_USERNAME=sashi
VNC_SERVER_PASSWORD=YOUR_PASSWORD_HERE  # ← Replace with your actual password
VNC_SERVER_KEY_PATH=  # Leave empty for password authentication
```

### Step 2: Install sshpass on AWS Server

Since you're using password authentication, you need `sshpass` installed on your AWS server:

```bash
# On Ubuntu/Debian
sudo apt-get update
sudo apt-get install sshpass

# On CentOS/RHEL/Amazon Linux
sudo yum install sshpass
```

### Step 3: Test SSH Connection

Test the connection from your AWS server:

```bash
sshpass -p 'your-password' ssh sashi@192.168.92.34 "echo 'Connection successful'"
```

### Step 4: Test License Commands

Verify the license commands work on the VNC server:

```bash
# Test Cadence license
sshpass -p 'your-password' ssh sashi@192.168.92.34 "LM_LICENSE_FILE=5280@yamuna /tools/synopsys/v2/lmstat -a"

# Test Synopsys license
sshpass -p 'your-password' ssh sashi@192.168.92.34 "LM_LICENSE_FILE=27020@yamuna /tools/synopsys/v2/lmstat -a"

# Test MGS license
sshpass -p 'your-password' ssh sashi@192.168.92.34 "LM_LICENSE_FILE=1717@yamuna /tools/synopsys/v2/lmstat -a"
```

### Step 5: Start the Application

Once configured, start your application:

```bash
# On AWS server
cd backend
npm start
```

### Step 6: Test via API

Test the connection via the API endpoint:

```bash
curl http://13.126.19.34:3002/api/test-vnc-connection
```

Or visit in browser:
- `http://13.126.19.34:3002/api/test-vnc-connection` - Test SSH connection
- `http://13.126.19.34:3002/api/test-connections` - Test all license connections
- `http://13.126.19.34:3002/api/licenses` - Get license data

## Important Notes

1. **Security**: The password is stored in plain text in `.env`. For production, consider:
   - Using SSH key authentication instead
   - Using environment variables or secrets management
   - Restricting `.env` file permissions: `chmod 600 backend/.env`

2. **Password Authentication**: The system uses `sshpass` for password authentication. Make sure it's installed on your AWS server.

3. **Network**: Ensure your AWS server can reach `192.168.92.34` on port 22 (SSH).

## Troubleshooting

If SSH connection fails:
- Check if `sshpass` is installed: `which sshpass`
- Verify password is correct
- Test manual SSH: `sshpass -p 'password' ssh sashi@192.168.92.34`
- Check firewall rules on VNC server
- Verify network connectivity: `ping 192.168.92.34`

