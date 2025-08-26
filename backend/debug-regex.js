// Debug regex patterns
const testLines = [
  '    sumoct22pd156 g4p4 :519 (v21.100) (yamuna/5280 16306), start Thu 6/26 16:14',
  '    shyd2410pd006 indus :1622 (v21.100) (yamuna/5280 26402), start Thu 6/26 16:15',
  '    shyd2407pd038 g11p11 :6838 MultiCPU (v21.100) (yamuna/5280 128738), start Wed 7/9 18:09, 3 licenses'
];

console.log('Testing regex patterns...\n');

testLines.forEach((line, index) => {
  console.log(`Line ${index + 1}: "${line}"`);
  
  // Pattern 1: MultiCPU format
  let match = line.match(/^\s*(\S+)\s+(\S+)\s+(\S+):([^,]+)\s+MultiCPU\s+\([^)]+\)\s+\([^)]+\),\s*start\s+(.+?)(?:,\s*(\d+)\s+licenses)?$/);
  console.log('  MultiCPU pattern:', match ? 'MATCH' : 'NO MATCH');
  if (match) console.log('    Groups:', match.slice(1));
  
  // Pattern 2: Regular format with version
  match = line.match(/^\s*(\S+)\s+(\S+)\s+(\S+):([^,]+)\s+\([^)]+\)\s+\([^)]+\),\s*start\s+(.+)$/);
  console.log('  Regular format pattern:', match ? 'MATCH' : 'NO MATCH');
  if (match) console.log('    Groups:', match.slice(1));
  
  // Pattern 3: Flexible pattern
  match = line.match(/^\s*(\S+)\s+(\S+)\s+(\S+):([^,]+),?\s*start\s+(.+)$/);
  console.log('  Flexible pattern:', match ? 'MATCH' : 'NO MATCH');
  if (match) console.log('    Groups:', match.slice(1));
  
  // Pattern 4: Most flexible pattern
  match = line.match(/^\s*(\S+)\s+(\S+)\s+(\S+):([^,]+).*start\s+(.+)$/);
  console.log('  Most flexible pattern:', match ? 'MATCH' : 'NO MATCH');
  if (match) console.log('    Groups:', match.slice(1));
  
  console.log('');
});

// Test a simpler approach
console.log('Testing simpler approach...\n');
testLines.forEach((line, index) => {
  console.log(`Line ${index + 1}: "${line}"`);
  
  // Split by spaces and look for the pattern
  const parts = line.trim().split(/\s+/);
  console.log('  Parts:', parts);
  
  // Look for the pattern: username hostname display:port (version) (server), start time
  if (parts.length >= 6) {
    const username = parts[0];
    const hostname = parts[1];
    const displayPart = parts[2];
    
    // Find the start time (last part after "start")
    const startIndex = parts.findIndex(part => part === 'start');
    if (startIndex !== -1 && startIndex + 1 < parts.length) {
      const startTime = parts.slice(startIndex + 1).join(' ');
      console.log('  Extracted:', { username, hostname, displayPart, startTime });
    }
  }
  
  console.log('');
});
