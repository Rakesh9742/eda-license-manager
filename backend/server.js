import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getAllLicenseData, getVendorLicenseDataByVendor, testLicenseServerConnections } from './services/lmstatService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
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
app.get(`${API_BASE_PATH}/health`, (req, res) => {
  res.json({ status: 'OK', message: 'EDA License Insight Backend is running' });
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
      const licenseData = await getAllLicenseData();
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

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting EDA License Insight Backend...');
    
    // Start server
    app.listen(PORT, HOST, () => {
      const baseUrl = `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`;
      console.log(`🚀 EDA License Insight Backend running on ${HOST}:${PORT}`);
      console.log(`📊 Health check: ${baseUrl}${API_BASE_PATH}/health`);
      console.log(`🔗 License data: ${baseUrl}${API_BASE_PATH}/licenses`);
      console.log(`🔄 Force refresh: POST ${baseUrl}${API_BASE_PATH}/licenses/refresh`);
      console.log(`📁 Status: ${baseUrl}${API_BASE_PATH}/status`);
      console.log(`🧪 Test connections: ${baseUrl}${API_BASE_PATH}/test-connections`);
      console.log(`📋 Using lmstat commands for real-time license data`);
      console.log(`🌐 CORS Origins: ${ALLOWED_ORIGINS.join(', ')}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
