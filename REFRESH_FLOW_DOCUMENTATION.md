# Refresh Data Flow - Complete Process

## Overview
When you click "Refresh Data" in the UI, here's exactly what happens step-by-step:

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "Refresh Data" BUTTON                            │
│    Location: Dashboard.tsx (line 211)                           │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND: Shows "Refreshing..." toast notification            │
│    - Button shows spinner animation                              │
│    - Button disabled during refresh                              │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. FRONTEND: Calls refreshLicenses() hook                        │
│    Location: useLicenses.ts (line 70)                           │
│    - Calls apiService.forceRefresh()                             │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. FRONTEND: Makes HTTP POST Request                             │
│    Endpoint: POST /api/licenses/refresh                          │
│    Location: api.ts (line 166-172)                               │
│    Timeout: 60 seconds                                           │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. BACKEND: Receives POST Request                                │
│    Location: server.js (line 153)                                │
│    - Calls getAllLicenseData(true) with forceRefresh=true        │
│    - This bypasses cache and forces fresh data                   │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. BACKEND: Checks Configuration                                 │
│    Location: lmstatService.js (line 85)                           │
│    - Checks: USE_VNC_SERVER === 'true'                            │
│    - Checks: VNC_SERVER_HOST is set                              │
│    - If YES → Use SSH/Remote execution                            │
│    - If NO  → Use local execution                                 │
└────────────────────────┬──────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │         │
          ┌─────────▼───┐   ┌─▼──────────────┐
          │ REMOTE PATH │   │ LOCAL PATH      │
          │ (SSH)       │   │ (Direct)        │
          └─────┬───────┘   └─┬──────────────┘
                │             │
                │             │
┌───────────────▼─────────────▼───────────────────────────────────┐
│ 7A. REMOTE EXECUTION (SSH)                                      │
│    Location: remoteExecutor.js (line 25)                        │
│                                                                  │
│    Builds SSH Command:                                          │
│    sshpass -p 'password' ssh                                    │
│      -o ConnectTimeout=10                                        │
│      -o StrictHostKeyChecking=no                                 │
│      -p 22                                                       │
│      sashi@192.168.92.34                                         │
│      "LM_LICENSE_FILE=5280@yamuna /tools/synopsys/v2/lmstat -a" │
│                                                                  │
│    For each vendor (Cadence, Synopsys, MGS):                     │
│    - Connects via SSH to 192.168.92.34                           │
│    - Executes lmstat command remotely                            │
│    - Gets output back via SSH                                    │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. BACKEND: Executes Commands (Parallel for all 3 vendors)      │
│    Location: lmstatService.js (line 220-235)                    │
│                                                                  │
│    For each vendor:                                              │
│    ├─ Cadence:   LM_LICENSE_FILE=5280@yamuna /tools/.../lmstat -a│
│    ├─ Synopsys:  LM_LICENSE_FILE=27020@yamuna /tools/.../lmstat -a│
│    └─ MGS:       LM_LICENSE_FILE=1717@yamuna /tools/.../lmstat -a│
│                                                                  │
│    All commands run in parallel (Promise.allSettled)             │
│    Timeout: 20 seconds per vendor                                │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. BACKEND: Receives Command Output                              │
│    - Raw text output from lmstat command                         │
│    - Contains license usage information                          │
│    Example output format:                                        │
│      "Users of cadence_feature: ..."                             │
│      "Users of synopsys_feature: ..."                            │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. BACKEND: Parses License Data                                │
│     Location: parser.js                                          │
│     - Extracts license features                                  │
│     - Extracts user information                                  │
│     - Extracts usage statistics                                  │
│     - Structures data for frontend                               │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 11. BACKEND: Handles Errors (if any)                            │
│     - If SSH fails → Falls back to file reading                  │
│     - If command fails → Falls back to file reading              │
│     - If file fails → Returns error status                       │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 12. BACKEND: Builds Response JSON                               │
│     Structure:                                                   │
│     {                                                            │
│       timestamp: "2024-...",                                     │
│       vendors: {                                                  │
│         cadence: { ...parsed data... },                          │
│         synopsys: { ...parsed data... },                         │
│         mgs: { ...parsed data... }                               │
│       },                                                         │
│       dataSources: {                                             │
│         lmstat: ["cadence", "synopsys", "mgs"],                  │
│         file: [],                                                │
│         error: []                                                 │
│       }                                                          │
│     }                                                            │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 13. BACKEND: Sends HTTP Response                                │
│     - Status: 200 OK                                             │
│     - Body: JSON with all license data                           │
│     - Time taken: ~5-15 seconds (depending on network)           │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 14. FRONTEND: Receives Response                                  │
│     Location: useLicenses.ts (line 42)                           │
│     - Updates React Query cache                                  │
│     - Triggers UI re-render                                      │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 15. FRONTEND: Shows Success/Error Toast                          │
│     - Success: "All 3 vendors connected live via lmstat"        │
│     - Warning: "Using backup data for X vendors"                  │
│     - Error: "Failed to refresh"                                  │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 16. FRONTEND: Updates UI                                         │
│     - License cards show new data                                │
│     - License table shows updated information                    │
│     - Timestamp updated                                          │
│     - Refresh button stops spinning                              │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Step-by-Step with Code

### Step 1-3: Frontend Trigger
```typescript
// Dashboard.tsx - User clicks button
<Button onClick={async () => {
  toast({ title: 'Refreshing Data', ... });
  await refreshLicenses();  // Calls hook
}}>
```

### Step 4: API Call
```typescript
// api.ts
forceRefresh = async () => {
  return this.request('/licenses/refresh', {
    method: 'POST',
    timeout: 60000  // 60 seconds
  });
}
```

### Step 5-6: Backend Route
```javascript
// server.js
app.post('/api/licenses/refresh', async (req, res) => {
  const licenseData = await getAllLicenseData(true);  // Force refresh
  res.json(licenseData);
});
```

### Step 7: SSH Execution (Remote Path)
```javascript
// remoteExecutor.js
// Builds command:
sshpass -p 'password' ssh sashi@192.168.92.34 "LM_LICENSE_FILE=5280@yamuna /tools/synopsys/v2/lmstat -a"

// Executes and gets output
const { stdout } = await execAsync(sshCommand);
```

### Step 8: Command Execution
```javascript
// lmstatService.js
// For each vendor, executes:
executeRemoteCommand('/tools/synopsys/v2/lmstat -a', { 
  LM_LICENSE_FILE: '5280@yamuna' 
});
```

### Step 9-10: Parse & Structure
```javascript
// parser.js
const parsed = parseLicenseData(stdout, vendor);
// Returns structured data with features, users, stats
```

### Step 11-12: Response
```javascript
// Returns JSON:
{
  timestamp: "2024-01-01T12:00:00Z",
  vendors: {
    cadence: { parsed: {...}, rawOutput: "...", dataSource: "vnc_lmstat" },
    synopsys: { parsed: {...}, rawOutput: "...", dataSource: "vnc_lmstat" },
    mgs: { parsed: {...}, rawOutput: "...", dataSource: "vnc_lmstat" }
  }
}
```

## Timing Breakdown

| Step | Action | Time |
|------|--------|------|
| 1-4 | Frontend → Backend request | < 100ms |
| 5-6 | Backend routing & config check | < 10ms |
| 7 | SSH connection | 1-3 seconds |
| 8 | Execute 3 lmstat commands (parallel) | 5-10 seconds |
| 9-10 | Parse data | < 1 second |
| 11-12 | Build response | < 10ms |
| 13-16 | Backend → Frontend → UI update | < 100ms |
| **Total** | **Complete refresh** | **~6-15 seconds** |

## What You See in the UI

1. **Click "Refresh Data"** → Button shows spinner, text changes to "Refreshing..."
2. **During refresh** → Button is disabled, spinner animates
3. **After refresh** → 
   - Toast notification appears (success/warning/error)
   - License cards update with new data
   - License table shows updated information
   - Timestamp updates
   - Button returns to normal state

## Error Handling

If SSH fails:
1. Backend tries to read from backup files (`backend/files/cadence`, etc.)
2. If files exist → Shows data from files
3. If files don't exist → Shows error message
4. Frontend shows appropriate toast notification

## Key Points

✅ **SSH happens FIRST** - Before showing any data, the system connects via SSH  
✅ **Commands run in PARALLEL** - All 3 vendors are queried simultaneously  
✅ **Real-time data** - Fresh data from live license servers  
✅ **Automatic fallback** - If SSH fails, tries backup files  
✅ **User feedback** - Toast notifications show what happened  

