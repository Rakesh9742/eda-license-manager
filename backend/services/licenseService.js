import { parseLicenseData } from '../utils/parser.js';
import { fileWatcher } from './fileWatcher.js';

// Vendor configurations
const vendors = {
  cadence: {
    name: 'Cadence',
    color: '#FF6B35'
  },
  synopsys: {
    name: 'Synopsys',
    color: '#4A90E2'
  },
  mgs: {
    name: 'Mentor Graphics (Siemens)',
    color: '#7B68EE'
  }
};

// Data source tracking
const dataSources = {
  file: new Set()
};

// Cache for license data
let licenseDataCache = null;
let lastRefreshTime = null;

// Read license data from file for a vendor
async function readLicenseFile(vendor) {
  try {
    const vendorConfig = vendors[vendor];
    if (!vendorConfig) {
      throw new Error(`Unknown vendor: ${vendor}`);
    }

    console.log(`📄 Reading license data for ${vendorConfig.name} from file...`);
    const rawOutput = await fileWatcher.readVendorFile(vendor);
    console.log(`✅ Successfully read ${vendor} file, content length: ${rawOutput.length} characters`);

    dataSources.file.add(vendor);

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

// Get license data for a vendor (file-only approach)
async function getVendorLicenseData(vendor) {
  try {
    return await readLicenseFile(vendor);
  } catch (error) {
    console.error(`❌ Error getting license data for ${vendor}:`, error.message);
    
    // Return error object
    return {
      vendor: vendor,
      vendorName: vendors[vendor]?.name || vendor,
      color: vendors[vendor]?.color || '#666666',
      error: error.message,
      timestamp: new Date().toISOString(),
      dataSource: 'error'
    };
  }
}

// Get license data for all vendors or specific vendor
export async function getLicenseData(vendor = null) {
  try {
    if (vendor) {
      // Get data for specific vendor
      console.log(`🔍 Getting data for specific vendor: ${vendor}`);
      return await getVendorLicenseData(vendor);
    } else {
      // Get data for all vendors
      console.log('🔍 Getting data for all vendors...');
      const results = {};
      const vendorKeys = Object.keys(vendors);
      console.log(`📋 Processing ${vendorKeys.length} vendors:`, vendorKeys);
      
      for (const vendorKey of vendorKeys) {
        try {
          console.log(`📄 Processing vendor: ${vendorKey}`);
          results[vendorKey] = await getVendorLicenseData(vendorKey);
          console.log(`✅ Successfully processed ${vendorKey}`);
        } catch (error) {
          console.error(`❌ Failed to get data for ${vendorKey}:`, error.message);
          results[vendorKey] = {
            vendor: vendorKey,
            vendorName: vendors[vendorKey].name,
            color: vendors[vendorKey].color,
            error: error.message,
            timestamp: new Date().toISOString(),
            dataSource: 'error'
          };
        }
      }
      
      console.log(`📊 Processed all vendors. Results:`, Object.keys(results));
      
      const result = {
        timestamp: new Date().toISOString(),
        vendors: results,
        dataSources: {
          file: Array.from(dataSources.file)
        }
      };

      // Cache the result
      licenseDataCache = result;
      console.log('💾 Data cached successfully');
      
      return result;
    }
  } catch (error) {
    console.error('❌ Error in getLicenseData:', error.message);
    throw error;
  }
}

// Force refresh from files (called when user clicks refresh button)
export async function forceRefreshFromFiles(vendor = null) {
  console.log('🔄 Force refreshing from files...');
  lastRefreshTime = new Date().toISOString();
  // Clear cache to force fresh read
  licenseDataCache = null;
  return await getLicenseData(vendor);
}

// Get cached data or load from files
export async function getInitialData(vendor = null) {
  try {
    console.log('📄 Loading initial data from files...');
    
    // Clear any existing cache to ensure fresh data
    licenseDataCache = null;
    
    // Try to load fresh data from files
    const data = await getLicenseData(vendor);
    
    // If we got data successfully, cache it and return
    if (data && (!vendor || data.vendor)) {
      if (!vendor) {
        licenseDataCache = data;
      }
      console.log('✅ Initial data loaded successfully');
      return data;
    }
    
    // If no data was loaded, return empty result
    console.log('⚠️ No data available from files');
    return {
      timestamp: new Date().toISOString(),
      vendors: {},
      dataSources: {
        file: []
      }
    };
  } catch (error) {
    console.error('❌ Error getting initial data:', error.message);
    
    // Return empty result instead of throwing error
    console.log('⚠️ Returning empty result due to error');
    return {
      timestamp: new Date().toISOString(),
      vendors: {},
      dataSources: {
        file: []
      },
      error: error.message
    };
  }
}

// Initialize file watcher and set up event handlers
export async function initializeFileWatcher() {
  try {
    await fileWatcher.initialize();
    
    // Set up event handlers for file updates
    fileWatcher.on('fileUpdated', ({ vendor, filename }) => {
      console.log(`🔄 File updated for ${vendor}: ${filename}`);
      // Clear cache when files are updated
      licenseDataCache = null;
    });
    
    fileWatcher.on('fileDeleted', ({ vendor, filename }) => {
      console.log(`🗑️ File deleted for ${vendor}: ${filename}`);
      // Clear cache when files are deleted
      licenseDataCache = null;
    });
    
    console.log('✅ File watcher initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing file watcher:', error);
  }
}

// Get current data sources status
export function getDataSourcesStatus() {
  return {
    file: Array.from(dataSources.file),
    currentFiles: fileWatcher.getCurrentFiles(),
    lastRefreshTime: lastRefreshTime
  };
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  fileWatcher.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  fileWatcher.stop();
  process.exit(0);
});
