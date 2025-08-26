import { readFile } from 'fs/promises';
import { parseLicenseData } from './utils/parser.js';

// Simple test data that matches the actual format
const testData = `Users of Innovus_Impl_System:  (Total of 260 licenses issued;  Total of 152 licenses in use)

  "Innovus_Impl_System" v23.1, vendor: cdslmd, expiry: 06-aug-2025
  vendor_string: J:PERM
  floating license

    sumoct22pd156 g4p4 :519 (v21.100) (yamuna/5280 16306), start Thu 6/26 16:14
    shyd2410pd006 indus :1622 (v21.100) (yamuna/5280 26402), start Thu 6/26 16:15
    shyd2407pd038 g11p11 :6838 MultiCPU (v21.100) (yamuna/5280 128738), start Wed 7/9 18:09, 3 licenses`;

// Test the actual parser
async function testParser() {
  try {
    console.log('Testing actual parser with sample data...');
    
    // Parse the data using the actual parser
    const parsed = parseLicenseData(testData, 'cadence');
    
    console.log('\n=== PARSING RESULTS ===');
    console.log(`Total features found: ${parsed.features?.length || 0}`);
    
    // Find Innovus_Impl_System feature
    const innovusFeature = parsed.features?.find(f => f.name === 'Innovus_Impl_System');
    
    if (innovusFeature) {
      console.log('\n=== INNOVUS_IMPL_SYSTEM DETAILS ===');
      console.log(`Feature name: ${innovusFeature.name}`);
      console.log(`Total licenses: ${innovusFeature.totalLicenses}`);
      console.log(`Used licenses: ${innovusFeature.usedLicenses}`);
      console.log(`Available licenses: ${innovusFeature.availableLicenses}`);
      console.log(`Usage percentage: ${innovusFeature.usagePercentage}%`);
      console.log(`Total user entries: ${innovusFeature.users?.length || 0}`);
      
      // Count unique users
      const uniqueUsers = new Set();
      innovusFeature.users?.forEach(user => {
        uniqueUsers.add(`${user.username}@${user.hostname}`);
      });
      
      console.log(`Unique users: ${uniqueUsers.size}`);
      
      // Show first few users
      console.log('\n=== FIRST 5 USERS ===');
      innovusFeature.users?.slice(0, 5).forEach((user, index) => {
        console.log(`${index + 1}. ${user.username}@${user.hostname} - ${user.startTime}`);
      });
      
      // Show unique users
      console.log('\n=== UNIQUE USERS ===');
      Array.from(uniqueUsers).slice(0, 10).forEach((userKey, index) => {
        console.log(`${index + 1}. ${userKey}`);
      });
      
    } else {
      console.log('Innovus_Impl_System feature not found!');
      console.log('Available features:');
      parsed.features?.forEach(f => {
        console.log(`- ${f.name}: ${f.users?.length || 0} users`);
      });
    }
    
  } catch (error) {
    console.error('Error testing parser:', error);
  }
}

testParser();
