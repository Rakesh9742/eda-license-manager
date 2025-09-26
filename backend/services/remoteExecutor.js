import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

// SSH connection configuration
const SSH_CONFIG = {
  host: process.env.VNC_SERVER_HOST || 'localhost',
  port: process.env.VNC_SERVER_PORT || '22',
  username: process.env.VNC_SERVER_USERNAME || 'root',
  password: process.env.VNC_SERVER_PASSWORD || '',
  keyPath: process.env.VNC_SERVER_KEY_PATH || '',
  timeout: parseInt(process.env.VNC_SSH_TIMEOUT || '30000') // 30 seconds
};

/**
 * Execute a command on the VNC server via SSH
 * @param {string} command - The command to execute
 * @param {Object} env - Environment variables to set
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
export async function executeRemoteCommand(command, env = {}) {
  try {
    console.log(`🌐 Executing remote command on VNC server: ${SSH_CONFIG.host}`);
    console.log(`📋 Command: ${command}`);
    
    // Build SSH command with environment variables
    let sshCommand = `ssh -o ConnectTimeout=${SSH_CONFIG.timeout / 1000} -o StrictHostKeyChecking=no`;
    
    // Use key authentication if key path is provided, otherwise use password
    if (SSH_CONFIG.keyPath && SSH_CONFIG.keyPath.trim()) {
      sshCommand += ` -i ${SSH_CONFIG.keyPath}`;
    } else {
      // For password authentication, we'll use sshpass
      sshCommand = `sshpass -p '${SSH_CONFIG.password}' ssh -o ConnectTimeout=${SSH_CONFIG.timeout / 1000} -o StrictHostKeyChecking=no`;
    }
    
    sshCommand += ` -p ${SSH_CONFIG.port}`;
    sshCommand += ` ${SSH_CONFIG.username}@${SSH_CONFIG.host}`;
    
    // Add environment variables if provided
    let remoteCommand = command;
    if (Object.keys(env).length > 0) {
      const envString = Object.entries(env)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      remoteCommand = `${envString} ${command}`;
    }
    
    // Escape the command for SSH
    const escapedCommand = remoteCommand.replace(/"/g, '\\"');
    sshCommand += ` "${escapedCommand}"`;
    
    console.log(`🔧 Full SSH command: ${sshCommand}`);
    
    const { stdout, stderr } = await execAsync(sshCommand, {
      timeout: SSH_CONFIG.timeout
    });
    
    if (stderr && !stderr.includes('Warning: Permanently added')) {
      console.warn(`⚠️ SSH stderr:`, stderr);
    }
    
    console.log(`✅ Remote command executed successfully, output length: ${stdout.length} characters`);
    return { stdout, stderr };
    
  } catch (error) {
    console.error(`❌ Error executing remote command:`, error.message);
    throw new Error(`SSH execution failed: ${error.message}`);
  }
}

/**
 * Test SSH connection to VNC server
 * @returns {Promise<{status: string, message: string}>}
 */
export async function testSSHConnection() {
  try {
    console.log(`🧪 Testing SSH connection to VNC server: ${SSH_CONFIG.host}`);
    
    let sshTestCommand;
    
    if (SSH_CONFIG.keyPath && SSH_CONFIG.keyPath.trim()) {
      // Use key authentication
      sshTestCommand = `ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o BatchMode=yes`;
      sshTestCommand += ` -i ${SSH_CONFIG.keyPath}`;
    } else {
      // Use password authentication
      sshTestCommand = `sshpass -p '${SSH_CONFIG.password}' ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no`;
    }
    
    sshTestCommand += ` -p ${SSH_CONFIG.port}`;
    sshTestCommand += ` ${SSH_CONFIG.username}@${SSH_CONFIG.host}`;
    sshTestCommand += ` "echo 'SSH connection successful'"`;
    
    const { stdout, stderr } = await execAsync(sshTestCommand, {
      timeout: 15000
    });
    
    console.log(`✅ SSH connection test successful`);
    return {
      status: 'success',
      message: 'SSH connection to VNC server is working',
      output: stdout.trim()
    };
    
  } catch (error) {
    console.error(`❌ SSH connection test failed:`, error.message);
    return {
      status: 'error',
      message: `SSH connection failed: ${error.message}`,
      output: null
    };
  }
}

/**
 * Copy file from VNC server to local
 * @param {string} remotePath - Path on VNC server
 * @param {string} localPath - Local path to save file
 * @returns {Promise<void>}
 */
export async function copyFileFromRemote(remotePath, localPath) {
  try {
    console.log(`📁 Copying file from VNC server: ${remotePath} -> ${localPath}`);
    
    let scpCommand;
    
    if (SSH_CONFIG.keyPath && SSH_CONFIG.keyPath.trim()) {
      // Use key authentication
      scpCommand = `scp -o ConnectTimeout=${SSH_CONFIG.timeout / 1000} -o StrictHostKeyChecking=no`;
      scpCommand += ` -i ${SSH_CONFIG.keyPath}`;
    } else {
      // Use password authentication
      scpCommand = `sshpass -p '${SSH_CONFIG.password}' scp -o ConnectTimeout=${SSH_CONFIG.timeout / 1000} -o StrictHostKeyChecking=no`;
    }
    
    scpCommand += ` -P ${SSH_CONFIG.port}`;
    scpCommand += ` ${SSH_CONFIG.username}@${SSH_CONFIG.host}:${remotePath}`;
    scpCommand += ` ${localPath}`;
    
    console.log(`🔧 SCP command: ${scpCommand}`);
    
    await execAsync(scpCommand, {
      timeout: SSH_CONFIG.timeout
    });
    
    console.log(`✅ File copied successfully from VNC server`);
    
  } catch (error) {
    console.error(`❌ Error copying file from VNC server:`, error.message);
    throw new Error(`SCP copy failed: ${error.message}`);
  }
}

/**
 * Get SSH configuration for debugging
 * @returns {Object}
 */
export function getSSHConfig() {
  return {
    host: SSH_CONFIG.host,
    port: SSH_CONFIG.port,
    username: SSH_CONFIG.username,
    keyPath: SSH_CONFIG.keyPath ? '***configured***' : 'not set',
    password: SSH_CONFIG.password ? '***configured***' : 'not set',
    timeout: SSH_CONFIG.timeout
  };
}
