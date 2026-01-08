# How Refresh Works - Simple Explanation

## When You Click "Refresh Data" Button:

### 🔄 The Complete Flow:

```
1. YOU CLICK "Refresh Data" 
   ↓
2. Frontend sends POST request to backend
   ↓
3. Backend checks: "Should I use SSH?" (YES, because USE_VNC_SERVER=true)
   ↓
4. Backend connects via SSH to: sashi@192.168.92.34
   ↓
5. Backend runs 3 commands on remote server (in parallel):
   
   For Cadence:
   ssh sashi@192.168.92.34 "LM_LICENSE_FILE=5280@yamuna /tools/synopsys/v2/lmstat -a"
   
   For Synopsys:
   ssh sashi@192.168.92.34 "LM_LICENSE_FILE=27020@yamuna /tools/synopsys/v2/lmstat -a"
   
   For MGS:
   ssh sashi@192.168.92.34 "LM_LICENSE_FILE=1717@yamuna /tools/synopsys/v2/lmstat -a"
   ↓
6. Remote server executes commands and returns output
   ↓
7. Backend receives raw text output from each command
   ↓
8. Backend parses the output to extract license information
   ↓
9. Backend sends JSON response back to frontend
   ↓
10. Frontend updates the UI with new data
    ↓
11. YOU SEE updated license information in the dashboard
```

## ⏱️ Timing:

- **SSH Connection**: 1-3 seconds
- **Command Execution**: 5-10 seconds (all 3 run in parallel)
- **Data Parsing**: < 1 second
- **Total Time**: ~6-15 seconds

## 📊 What Happens:

1. **SSH Connection First**: The system connects to `192.168.92.34` via SSH using password authentication
2. **Commands Run Remotely**: All `lmstat` commands execute on the remote server (not on AWS)
3. **Output Retrieved**: The raw output comes back through SSH
4. **Data Parsed**: Backend extracts license features, users, and usage stats
5. **UI Updated**: Frontend displays the fresh data

## 🔍 What You See:

- **Button**: Shows spinner and "Refreshing..." text
- **Toast Notification**: Shows success/warning/error message
- **License Cards**: Update with new data
- **License Table**: Shows updated information
- **Timestamp**: Updates to current time

## ⚠️ If SSH Fails:

If the SSH connection fails, the system automatically:
1. Tries to read from backup files (`backend/files/cadence`, etc.)
2. Shows data from files if available
3. Shows error message if files also fail

## 🎯 Key Point:

**YES, it does SSH FIRST, then runs commands, then shows in UI.**

The flow is:
```
SSH Connect → Run Commands → Get Output → Parse Data → Send to Frontend → Show in UI
```

All of this happens automatically when you click "Refresh Data"!

