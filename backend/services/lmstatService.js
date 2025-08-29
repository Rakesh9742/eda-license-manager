import { exec } from 'child_process';
import { promisify } from 'util';
import { parseLicenseData } from '../utils/parser.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

// Vendor configurations with lmstat commands
const vendors = {
  cadence: {
    name: 'Cadence',
    color: '#FF6B35',
    command: 'liccheck --cadence',
    filePath: './files/cadence'
  },
  synopsys: {
    name: 'Synopsys',
    color: '#4A90E2',
    command: 'liccheck --synopsys',
    filePath: './files/synopsys'
  },
  mgs: {
    name: 'Mentor Graphics (Siemens)',
    color: '#7B68EE',
    command: 'liccheck --mgs',
    filePath: './files/mgs'
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

// Execute lmstat command for a vendor
async function executeLmstatCommand(vendor) {
  try {
    const vendorConfig = vendors[vendor];
    if (!vendorConfig) {
      throw new Error(`Unknown vendor: ${vendor}`);
    }

    console.log(`🔄 Executing lmstat command for ${vendorConfig.name}...`);
    console.log(`📋 Command: ${vendorConfig.command}`);
    
    const { stdout, stderr } = await execAsync(vendorConfig.command);
    
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
      dataSource: 'lmstat',
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
export async function getAllLicenseData() {
  try {
    console.log('🔍 Getting license data for all vendors using lmstat commands with fallback...');
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
    
    return result;
  } catch (error) {
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

// Test connection to all license servers
export async function testLicenseServerConnections() {
  try {
    console.log('🧪 Testing license server connections...');
    const results = {};
    const vendorKeys = Object.keys(vendors);
    
    const promises = vendorKeys.map(async (vendorKey) => {
      try {
        const vendorConfig = vendors[vendorKey];
        console.log(`🧪 Testing ${vendorConfig.name} connection...`);
        
        // Use a timeout to prevent hanging
        const { stdout, stderr } = await Promise.race([
          execAsync(vendorConfig.command),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Command timeout after 10 seconds')), 10000)
          )
        ]);
        
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
      results
    };
  } catch (error) {
    console.error('❌ Error testing license server connections:', error.message);
    throw error;
  }
}
