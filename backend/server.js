import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getAllLicenseData, getVendorLicenseDataByVendor, testLicenseServerConnections } from './services/lmstatService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const SERVER_IP = process.env.SERVER_IP || 'localhost';
const FRONTEND_PORT = process.env.FRONTEND_PORT || '3002';
const BACKEND_PORT = process.env.BACKEND_PORT || PORT;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const ALLOWED_ORIGINS = CORS_ORIGIN.split(',').map(origin => origin.trim());
const API_BASE_PATH = process.env.API_BASE_PATH || '/api';

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port for development
    if (origin.match(/^https?:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    
    // Allow the configured CORS origins
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.get(`${API_BASE_PATH}/health`, async (req, res) => {
  try {
    console.log('🔍 Health check requested...');
    
    // Use lightweight health check instead of full license data fetch
    const { getSystemHealthStatus } = await import('./services/lmstatService.js');
    const healthStatus = await getSystemHealthStatus();
    
    console.log(`🔍 Health check results - hasErrors: ${healthStatus.hasErrors}, usingFileFallback: ${healthStatus.usingFileFallback}`);
    
    let status = 'OK';
    let message = 'System is live - All license commands working';
    
    if (healthStatus.hasErrors) {
      status = 'ERROR';
      message = 'System offline - License commands failed';
    } else if (healthStatus.usingFileFallback) {
      status = 'WARNING';
      message = 'System degraded - Using file fallback data';
    }
    
    console.log(`🏥 Health status: ${status} - ${message}`);
    
    res.json({ 
      status, 
      message,
      systemStatus: {
        backend: 'OK',
        licenseCommands: healthStatus.hasErrors ? 'ERROR' : (healthStatus.usingFileFallback ? 'WARNING' : 'OK'),
        dataSource: healthStatus.dataSource,
        timestamp: healthStatus.timestamp
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'System offline - Backend error',
      systemStatus: {
        backend: 'ERROR',
        licenseCommands: 'UNKNOWN',
        dataSource: 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get data sources status
app.get(`${API_BASE_PATH}/status`, (req, res) => {
  try {
    res.json({
      status: 'OK',
      dataSources: {
        lmstat: ['cadence', 'synopsys', 'mgs'],
        lastRefreshTime: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ 
      error: 'Failed to get status', 
      details: error.message 
    });
  }
});

// Get license data (initial load from lmstat commands)
app.get(`${API_BASE_PATH}/licenses`, async (req, res) => {
  try {
    const licenseData = await getAllLicenseData();
    res.json(licenseData);
  } catch (error) {
    console.error('Error fetching license data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch license data', 
      details: error.message 
    });
  }
});

// Force refresh from lmstat commands (called when user clicks refresh button)
app.post(`${API_BASE_PATH}/licenses/refresh`, async (req, res) => {
  try {
    const { vendor } = req.body; // Optional: specific vendor to refresh
    if (vendor) {
      const licenseData = await getVendorLicenseDataByVendor(vendor);
      res.json(licenseData);
    } else {
      // Force refresh by passing true to bypass cache
      const licenseData = await getAllLicenseData(true);
      res.json(licenseData);
    }
  } catch (error) {
    console.error('Error force refreshing license data:', error);
    res.status(500).json({ 
      error: 'Failed to force refresh license data', 
      details: error.message 
    });
  }
});

// Get license data for specific vendor
app.get(`${API_BASE_PATH}/licenses/:vendor`, async (req, res) => {
  try {
    const { vendor } = req.params;
    const licenseData = await getVendorLicenseDataByVendor(vendor);
    res.json(licenseData);
  } catch (error) {
    console.error(`Error fetching ${req.params.vendor} license data:`, error);
    res.status(500).json({ 
      error: `Failed to fetch ${req.params.vendor} license data`, 
      details: error.message 
    });
  }
});

// Test license server connections
app.get(`${API_BASE_PATH}/test-connections`, async (req, res) => {
  try {
    const testResults = await testLicenseServerConnections();
    res.json(testResults);
  } catch (error) {
    console.error('Error testing license server connections:', error);
    res.status(500).json({ 
      error: 'Failed to test license server connections', 
      details: error.message 
    });
  }
});

// Test VNC server SSH connection
app.get(`${API_BASE_PATH}/test-vnc-connection`, async (req, res) => {
  try {
    const { testSSHConnection, getSSHConfig } = await import('./services/remoteExecutor.js');
    const sshTest = await testSSHConnection();
    const sshConfig = getSSHConfig();
    
    res.json({
      timestamp: new Date().toISOString(),
      sshTest,
      sshConfig,
      environment: {
        USE_VNC_SERVER: process.env.USE_VNC_SERVER,
        VNC_SERVER_HOST: process.env.VNC_SERVER_HOST,
        VNC_SERVER_PORT: process.env.VNC_SERVER_PORT,
        VNC_SERVER_USERNAME: process.env.VNC_SERVER_USERNAME
      }
    });
  } catch (error) {
    console.error('Error testing VNC connection:', error);
    res.status(500).json({ 
      error: 'Failed to test VNC connection', 
      details: error.message 
    });
  }
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting EDA License Insight Backend...');
    
    // Start server
    app.listen(PORT, HOST, () => {
      const baseUrl = `http://${SERVER_IP}:${BACKEND_PORT}`;
      const localBaseUrl = `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`;
      console.log(`🚀 EDA License Insight Backend running on ${HOST}:${PORT}`);
      console.log(`📊 Health check: ${baseUrl}${API_BASE_PATH}/health`);
      console.log(`🔗 License data: ${baseUrl}${API_BASE_PATH}/licenses`);
      console.log(`🔄 Force refresh: POST ${baseUrl}${API_BASE_PATH}/licenses/refresh`);
      console.log(`📁 Status: ${baseUrl}${API_BASE_PATH}/status`);
      console.log(`🧪 Test connections: ${baseUrl}${API_BASE_PATH}/test-connections`);
      console.log(`🌐 Test VNC connection: ${baseUrl}${API_BASE_PATH}/test-vnc-connection`);
      console.log(`📋 Using ${process.env.USE_VNC_SERVER === 'true' ? 'VNC server' : 'local'} lmstat commands for real-time license data`);
      console.log(`🌐 CORS Origins: ${ALLOWED_ORIGINS.join(', ')}`);
      console.log(`🎨 Frontend URL: http://${SERVER_IP}:${FRONTEND_PORT}`);
      
      if (process.env.USE_VNC_SERVER === 'true') {
        console.log(`🔧 VNC Server: ${process.env.VNC_SERVER_HOST}:${process.env.VNC_SERVER_PORT}`);
        console.log(`👤 VNC User: ${process.env.VNC_SERVER_USERNAME}`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
