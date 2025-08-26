import { readFile } from 'fs/promises';
import { parseLicenseData } from './utils/parser.js';

async function testParser() {
  try {
    console.log('Testing parser with actual license data...');
    
    // Read the cadence file
    const rawOutput = await readFile('./files/cadence', 'utf8');
    console.log(`File size: ${rawOutput.length} characters`);
    
    // Parse the data
    const parsed = parseLicenseData(rawOutput, 'cadence');
    
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
