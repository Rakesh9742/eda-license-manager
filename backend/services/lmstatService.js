import { exec } from 'child_process';
import { promisify } from 'util';
import { parseLicenseData } from '../utils/parser.js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { executeRemoteCommand, testSSHConnection } from './remoteExecutor.js';

// Cache for license data to prevent repeated command execution
const licenseDataCache = {
  data: null,
  timestamp: null,
  cacheTimeout: parseInt(process.env.CACHE_TIMEOUT || '300000'), // 5 minutes default (configurable via CACHE_TIMEOUT env var)
  isRefreshing: false
};

const execAsync = promisify(exec);

// Vendor configurations with lmstat commands
const vendors = {
  cadence: {
    name: 'Cadence',
    color: '#FF6B35',
    command: '/tools/synopsys/v2/lmstat -a',
    filePath: './files/cadence',
    env: { LM_LICENSE_FILE: '5280@yamuna' }
  },
  synopsys: {
    name: 'Synopsys',
    color: '#4A90E2',
    command: '/tools/synopsys/v2/lmstat -a',
    filePath: './files/synopsys',
    env: { LM_LICENSE_FILE: '27020@yamuna' }
  },
  mgs: {
    name: 'Mentor Graphics (Siemens)',
    color: '#7B68EE',
    command: '/tools/synopsys/v2/lmstat -a',
    filePath: './files/mgs',
    env: { LM_LICENSE_FILE: '1717@yamuna' }
  }
};

// Read license data from file for a vendor
async function readLicenseFile(vendor) {
  try {
    const vendorConfig = vendors[vendor];
    if (!vendorConfig) {
      throw new Error(`Unknown vendor: ${vendor}`);
    }

    console.log(`📄 Reading license data for ${vendorConfig.name} from file...`);
    const rawOutput = await readFile(vendorConfig.filePath, 'utf8');
    console.log(`✅ Successfully read ${vendor} file, content length: ${rawOutput.length} characters`);

    return {
      vendor: vendor,
      vendorName: vendorConfig.name,
      color: vendorConfig.color,
      rawOutput: rawOutput,
      timestamp: new Date().toISOString(),
      dataSource: 'file',
      parsed: parseLicenseData(rawOutput, vendor)
    };
  } catch (error) {
    console.error(`❌ Error reading file for ${vendor}:`, error.message);
    throw error;
  }
}

// Execute lmstat command for a vendor (local or remote)
async function executeLmstatCommand(vendor) {
  try {
    const vendorConfig = vendors[vendor];
    if (!vendorConfig) {
      throw new Error(`Unknown vendor: ${vendor}`);
    }

    console.log(`🔄 Executing lmstat command for ${vendorConfig.name}...`);
    console.log(`📋 Command: ${vendorConfig.command}`);
    console.log(`🔧 Environment: LM_LICENSE_FILE=${vendorConfig.env?.LM_LICENSE_FILE || 'not set'}`);
    
    let stdout, stderr;
    
    // Check if we should use remote execution
    const useRemote = process.env.USE_VNC_SERVER === 'true' && process.env.VNC_SERVER_HOST;
    
    if (useRemote) {
      console.log(`🌐 Executing command on VNC server: ${process.env.VNC_SERVER_HOST}`);
      const result = await executeRemoteCommand(vendorConfig.command, vendorConfig.env);
      stdout = result.stdout;
      stderr = result.stderr;
    } else {
      console.log(`💻 Executing command locally`);
      // Add timeout for local commands (15 seconds max)
      const result = await Promise.race([
        execAsync(vendorConfig.command, {
          env: { ...process.env, ...vendorConfig.env },
          timeout: 15000 // 15 second timeout for local commands
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Local command timeout after 15 seconds')), 15000)
        )
      ]);
      stdout = result.stdout;
      stderr = result.stderr;
    }
    
    if (stderr) {
      console.warn(`⚠️ Warning from ${vendor} lmstat command:`, stderr);
    }
    
    console.log(`✅ Successfully executed ${vendor} lmstat command, output length: ${stdout.length} characters`);
    
    return {
      vendor: vendor,
      vendorName: vendorConfig.name,
      color: vendorConfig.color,
      rawOutput: stdout,
      timestamp: new Date().toISOString(),
      dataSource: useRemote ? 'vnc_lmstat' : 'lmstat',
      parsed: parseLicenseData(stdout, vendor)
    };
  } catch (error) {
    console.error(`❌ Error executing lmstat command for ${vendor}:`, error.message);
    throw error;
  }
}

// Get license data for a vendor using lmstat with fallback to file
async function getVendorLicenseData(vendor) {
  try {
    // First try lmstat command
    console.log(`🔄 Attempting lmstat command for ${vendor}...`);
    const lmstatResult = await executeLmstatCommand(vendor);
    console.log(`✅ Successfully got data from lmstat for ${vendor}`);
    return lmstatResult;
  } catch (lmstatError) {
    console.warn(`⚠️ lmstat command failed for ${vendor}, falling back to file:`, lmstatError.message);
    
    try {
      // Fallback to reading from file
      console.log(`📄 Falling back to file for ${vendor}...`);
      const fileResult = await readLicenseFile(vendor);
      console.log(`✅ Successfully got data from file for ${vendor}`);
      
      // Add error information to the result
      return {
        ...fileResult,
        lmstatError: {
          message: lmstatError.message,
          command: vendors[vendor].command,
          timestamp: new Date().toISOString()
        }
      };
    } catch (fileError) {
      console.error(`❌ Both lmstat and file failed for ${vendor}:`, fileError.message);
      
      // Return error object with both errors
      return {
        vendor: vendor,
        vendorName: vendors[vendor]?.name || vendor,
        color: vendors[vendor]?.color || '#666666',
        error: `lmstat command failed: ${lmstatError.message}. File read also failed: ${fileError.message}`,
        lmstatError: {
          message: lmstatError.message,
          command: vendors[vendor].command,
          timestamp: new Date().toISOString()
        },
        fileError: {
          message: fileError.message,
          filePath: vendors[vendor]?.filePath,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        dataSource: 'error'
      };
    }
  }
}

// Get license data for all vendors using lmstat commands with fallback
export async function getAllLicenseData(forceRefresh = false) {
  try {
    // Check cache first (unless force refresh is requested)
    const now = Date.now();
    if (!forceRefresh && 
        licenseDataCache.data && 
        licenseDataCache.timestamp && 
        (now - licenseDataCache.timestamp) < licenseDataCache.cacheTimeout) {
      console.log('📋 Returning cached license data');
      return licenseDataCache.data;
    }

    // Prevent multiple simultaneous refreshes
    if (licenseDataCache.isRefreshing) {
      console.log('⏳ Another refresh is in progress, waiting...');
      while (licenseDataCache.isRefreshing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (licenseDataCache.data) {
        console.log('📋 Returning cached data after waiting');
        return licenseDataCache.data;
      }
    }

    licenseDataCache.isRefreshing = true;
    console.log('🔍 Getting fresh license data for all vendors using lmstat commands with fallback...');
    
    const results = {};
    const vendorKeys = Object.keys(vendors);
    console.log(`📋 Processing ${vendorKeys.length} vendors:`, vendorKeys);
    
    // Execute all commands in parallel for better performance
    const promises = vendorKeys.map(async (vendorKey) => {
      try {
        console.log(`📄 Processing vendor: ${vendorKey}`);
        const result = await getVendorLicenseData(vendorKey);
        console.log(`✅ Successfully processed ${vendorKey}`);
        return { vendorKey, result };
      } catch (error) {
        console.error(`❌ Failed to get data for ${vendorKey}:`, error.message);
        return {
          vendorKey,
          result: {
            vendor: vendorKey,
            vendorName: vendors[vendorKey].name,
            color: vendors[vendorKey].color,
            error: error.message,
            timestamp: new Date().toISOString(),
            dataSource: 'error'
          }
        };
      }
    });
    
    const vendorResults = await Promise.all(promises);
    
    // Convert array to object
    vendorResults.forEach(({ vendorKey, result }) => {
      results[vendorKey] = result;
    });
    
    console.log(`📊 Processed all vendors. Results:`, Object.keys(results));
    
    const result = {
      timestamp: new Date().toISOString(),
      vendors: results,
      dataSources: {
        lmstat: Array.from(vendorKeys).filter(key => results[key]?.dataSource === 'lmstat'),
        file: Array.from(vendorKeys).filter(key => results[key]?.dataSource === 'file'),
        error: Array.from(vendorKeys).filter(key => results[key]?.dataSource === 'error')
      }
    };
    
    // Update cache
    licenseDataCache.data = result;
    licenseDataCache.timestamp = now;
    licenseDataCache.isRefreshing = false;
    
    return result;
  } catch (error) {
    licenseDataCache.isRefreshing = false;
    console.error('❌ Error in getAllLicenseData:', error.message);
    throw error;
  }
}

// Get license data for specific vendor using lmstat with fallback
export async function getVendorLicenseDataByVendor(vendor) {
  try {
    console.log(`🔍 Getting data for specific vendor: ${vendor}`);
    return await getVendorLicenseData(vendor);
  } catch (error) {
    console.error(`❌ Error getting vendor data for ${vendor}:`, error.message);
    throw error;
  }
}

// Lightweight health check that uses cached data or minimal checks
export async function getSystemHealthStatus() {
  try {
    // If we have recent cached data, use it for health check
    const now = Date.now();
    if (licenseDataCache.data && 
        licenseDataCache.timestamp && 
        (now - licenseDataCache.timestamp) < licenseDataCache.cacheTimeout) {
      
      const cachedData = licenseDataCache.data;
      const hasErrors = Object.values(cachedData.vendors).some((vendor) => 
        vendor.dataSource === 'error' || vendor.lmstatError
      );
      
      const usingFileFallback = Object.values(cachedData.vendors).some((vendor) => 
        vendor.dataSource === 'file' && vendor.lmstatError
      );
      
      return {
        hasErrors,
        usingFileFallback,
        dataSource: usingFileFallback ? 'file' : 'lmstat',
        timestamp: cachedData.timestamp
      };
    }
    
    // If no recent cache, do a quick test of one vendor
    console.log('🔍 Quick health check - testing one vendor...');
    const testVendor = Object.keys(vendors)[0]; // Test first vendor
    const testResult = await getVendorLicenseData(testVendor);
    
    const hasErrors = testResult.dataSource === 'error' || testResult.lmstatError;
    const usingFileFallback = testResult.dataSource === 'file' && testResult.lmstatError;
    
    return {
      hasErrors,
      usingFileFallback,
      dataSource: usingFileFallback ? 'file' : 'lmstat',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return {
      hasErrors: true,
      usingFileFallback: false,
      dataSource: 'unknown',
      timestamp: new Date().toISOString()
    };
  }
}

// Test connection to all license servers
export async function testLicenseServerConnections() {
  try {
    console.log('🧪 Testing license server connections...');
    const results = {};
    const vendorKeys = Object.keys(vendors);
    
    // First test SSH connection if using VNC server
    const useRemote = process.env.USE_VNC_SERVER === 'true' && process.env.VNC_SERVER_HOST;
    if (useRemote) {
      console.log('🧪 Testing SSH connection to VNC server...');
      try {
        const sshTest = await testSSHConnection();
        results['ssh_connection'] = sshTest;
        console.log(`✅ SSH connection test: ${sshTest.status}`);
      } catch (error) {
        results['ssh_connection'] = {
          status: 'error',
          message: `SSH connection failed: ${error.message}`,
          output: null
        };
        console.error(`❌ SSH connection test failed:`, error.message);
      }
    }
    
    const promises = vendorKeys.map(async (vendorKey) => {
      try {
        const vendorConfig = vendors[vendorKey];
        console.log(`🧪 Testing ${vendorConfig.name} connection...`);
        
        let stdout, stderr;
        
        if (useRemote) {
          // Test remote execution
          const result = await executeRemoteCommand(vendorConfig.command, vendorConfig.env);
          stdout = result.stdout;
          stderr = result.stderr;
        } else {
          // Test local execution with timeout
          const result = await Promise.race([
            execAsync(vendorConfig.command, { env: { ...process.env, ...vendorConfig.env } }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Command timeout after 10 seconds')), 10000)
            )
          ]);
          stdout = result.stdout;
          stderr = result.stderr;
        }
        
        results[vendorKey] = {
          status: 'success',
          message: 'Connection successful',
          output: stdout.substring(0, 200) + '...' // Truncate for display
        };
        
        console.log(`✅ ${vendorConfig.name} connection successful`);
      } catch (error) {
        results[vendorKey] = {
          status: 'error',
          message: error.message,
          command: vendors[vendorKey].command,
          output: null
        };
        console.error(`❌ ${vendors[vendorKey].name} connection failed:`, error.message);
      }
    });
    
    await Promise.all(promises);
    
    return {
      timestamp: new Date().toISOString(),
      results,
      connectionType: useRemote ? 'remote_vnc' : 'local'
    };
  } catch (error) {
    console.error('❌ Error testing license server connections:', error.message);
    throw error;
  }
}
