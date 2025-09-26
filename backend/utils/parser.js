// Parse lmstat output into structured data
export function parseLicenseData(rawOutput, vendor) {
  try {
    const lines = rawOutput.split('\n');
    const parsed = {
      serverStatus: {},
      vendorDaemons: [],
      features: []
    };

    let currentSection = '';
    let currentFeature = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;

      // Parse server status
      if (line.includes('License server status:')) {
        const serverMatch = line.match(/License server status:\s*(\d+)@(\w+)/);
        if (serverMatch) {
          parsed.serverStatus = {
            port: serverMatch[1],
            host: serverMatch[2]
          };
        }
      }

      // Parse server UP/DOWN status
      if (line.includes('license server UP') || line.includes('license server DOWN')) {
        const statusMatch = line.match(/(\w+):\s*license server\s+(UP|DOWN)\s*\(([^)]+)\)\s*v([\d.]+)/);
        if (statusMatch) {
          parsed.serverStatus.status = statusMatch[2];
          parsed.serverStatus.role = statusMatch[3];
          parsed.serverStatus.version = statusMatch[4];
        }
      }

      // Parse vendor daemon status
      if (line.includes('Vendor daemon status')) {
        currentSection = 'vendorDaemons';
        continue;
      }

      if (currentSection === 'vendorDaemons' && line.includes(':')) {
        const daemonMatch = line.match(/(\w+):\s+(UP|DOWN)\s+v([\d.]+)/);
        if (daemonMatch) {
          parsed.vendorDaemons.push({
            name: daemonMatch[1],
            status: daemonMatch[2],
            version: daemonMatch[3]
          });
        }
      }

      // Parse feature usage
      if (line.includes('Users of') && line.includes('licenses issued')) {
        currentSection = 'features';
        const featureMatch = line.match(/Users of\s+([^:]+):\s*\(Total of\s+(\d+)\s+licenses issued;\s*Total of\s+(\d+)\s+licenses in use\)/);
        if (featureMatch) {
          currentFeature = {
            name: featureMatch[1].trim(),
            totalLicenses: parseInt(featureMatch[2]),
            usedLicenses: parseInt(featureMatch[3]),
            availableLicenses: parseInt(featureMatch[2]) - parseInt(featureMatch[3]),
            usagePercentage: Math.round((parseInt(featureMatch[3]) / parseInt(featureMatch[2])) * 100),
            details: {},
            users: []
          };
          parsed.features.push(currentFeature);
        }
      }

      // Parse feature details (version, vendor, expiry)
      if (currentFeature && line.includes('"') && line.includes('vendor:')) {
        const versionMatch = line.match(/"([^"]+)"\s+v([\d.]+),\s*vendor:\s+(\w+),\s*expiry:\s+([^,]+)/);
        if (versionMatch) {
          currentFeature.details = {
            featureName: versionMatch[1],
            version: versionMatch[2],
            vendor: versionMatch[3],
            expiry: versionMatch[4].trim()
          };
        }
      }

      // Parse user information
      if (currentFeature && line.includes('start') && !line.includes('vendor_string') && !line.includes('vendor:') && !line.includes('vendor_string:')) {
        // Skip lines that are not user entries (like vendor info lines)
        if (line.includes('vendor:') || line.includes('vendor_string:') || line.includes('floating license')) {
          continue;
        }
        
        // Handle different user line formats using a simpler approach
        const trimmedLine = line.trim();
        const parts = trimmedLine.split(/\s+/);
        
        if (parts.length >= 6) {
          const username = parts[0];
          const hostname = parts[1];
          const displayPart = parts[2];
          
          // Find the start time (everything after "start")
          const startIndex = parts.findIndex(part => part === 'start');
          if (startIndex !== -1 && startIndex + 1 < parts.length) {
            const startTime = parts.slice(startIndex + 1).join(' ');
            
            // Check if this is a MultiCPU entry
            const isMultiCPU = parts.includes('MultiCPU');
            let licenses = 1;
            
            if (isMultiCPU) {
              // Look for license count at the end
              const lastPart = parts[parts.length - 1];
              if (lastPart === 'licenses') {
                const licenseCountPart = parts[parts.length - 2];
                const licenseCount = parseInt(licenseCountPart);
                if (!isNaN(licenseCount)) {
                  licenses = licenseCount;
                }
              }
            }
            
            currentFeature.users.push({
              username: username,
              hostname: hostname,
              display: displayPart,
              displayId: displayPart,
              startTime: startTime,
              licenses: licenses
            });
            continue;
          }
        }
        
        // Debug: log lines that don't match any pattern
        // console.log('Unmatched user line:', line);
      }
    }

    // Calculate summary statistics
    parsed.summary = {
      totalFeatures: parsed.features.length,
      totalLicenses: parsed.features.reduce((sum, f) => sum + f.totalLicenses, 0),
      totalUsed: parsed.features.reduce((sum, f) => sum + f.usedLicenses, 0),
      totalAvailable: parsed.features.reduce((sum, f) => sum + f.availableLicenses, 0),
      overallUsage: parsed.features.length > 0 
        ? Math.round((parsed.features.reduce((sum, f) => sum + f.usedLicenses, 0) / 
                      parsed.features.reduce((sum, f) => sum + f.totalLicenses, 0)) * 100)
        : 0
    };

    console.log(`📊 Parsed summary for ${vendor}:`, parsed.summary);
    console.log(`📊 Features count: ${parsed.features.length}`);
    // Removed sample feature log to avoid showing user data

    return parsed;
  } catch (error) {
    console.error('Error parsing license data:', error);
    return {
      error: 'Failed to parse license data',
      rawOutput: rawOutput
    };
  }
}

// Helper function to format license data for charts
export function formatForCharts(parsedData) {
  if (!parsedData.features) return [];

  return parsedData.features.map(feature => ({
    name: feature.name,
    used: feature.usedLicenses,
    available: feature.availableLicenses,
    total: feature.totalLicenses,
    usagePercentage: feature.usagePercentage,
    color: getFeatureColor(feature.usagePercentage)
  }));
}

// Helper function to get color based on usage percentage
function getFeatureColor(usagePercentage) {
  if (usagePercentage >= 90) return '#ef4444'; // Red for high usage
  if (usagePercentage >= 75) return '#f97316'; // Orange for medium-high usage
  if (usagePercentage >= 50) return '#eab308'; // Yellow for medium usage
  return '#22c55e'; // Green for low usage
}

// Helper function to get top users by feature
export function getTopUsers(parsedData, limit = 10) {
  const allUsers = [];
  
  if (parsedData.features) {
    parsedData.features.forEach(feature => {
      feature.users.forEach(user => {
        allUsers.push({
          ...user,
          feature: feature.name
        });
      });
    });
  }

  return allUsers.slice(0, limit);
}
