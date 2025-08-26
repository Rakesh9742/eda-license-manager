# EDA License Insight Backend

Node.js backend for managing EDA tool licenses (Cadence, Synopsys, Mentor Graphics/Siemens) with file-based data source support.

## Features

- **File-Based Data Source**: Reads license data from local files
- **File Watcher**: Monitors `files/` directory for new license files
- **Parse and structure license data** from lmstat output
- **RESTful API endpoints**
- **Real-time license status monitoring**

## Data Sources

### File-Based
- Reads license data from local files in `backend/files/` directory
- Automatic file watching and updates
- Supports file replacement (deletes old files when new ones arrive)
- File naming convention: `cadence`, `synopsys`, `mgs`

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your server configuration:
   ```env
   PORT=3001
   NODE_ENV=development
   ```

3. **Prepare license files:**
   Place your license files in the `backend/files/` directory:
   ```
   backend/files/
   ├── cadence    # Cadence license data
   ├── synopsys   # Synopsys license data
   └── mgs        # Mentor Graphics/Siemens license data
   ```

4. **Start the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## File Watcher

The file watcher automatically:
- Scans existing files on startup
- Monitors for new files in the `files/` directory
- Replaces old files when new ones arrive
- Deletes old files automatically
- Supports vendor detection from filenames

### File Naming Convention
The system recognizes vendor files by:
- Exact matches: `cadence`, `synopsys`, `mgs`
- Partial matches: `cadence_license`, `synopsys_data`, `mentor_mgs`

## API Endpoints

### Health Check
```
GET /api/health
```

### Data Source Status
```
GET /api/status
```
Returns information about which vendors are using file data sources.

### Get All License Data
```
GET /api/licenses
```

### Get Specific Vendor License Data
```
GET /api/licenses/:vendor
```
Where `:vendor` can be:
- `cadence`
- `synopsys`
- `mgs`

### Force Refresh from Files
```
POST /api/licenses/refresh
```
Optionally include vendor in request body: `{ "vendor": "cadence" }`

## Response Format

```json
{
  "timestamp": "2025-01-20T10:30:00.000Z",
  "vendors": {
    "cadence": {
      "vendor": "cadence",
      "vendorName": "Cadence",
      "color": "#FF6B35",
      "timestamp": "2025-01-20T10:30:00.000Z",
      "dataSource": "file",
      "parsed": {
        "serverStatus": {
          "port": "5280",
          "host": "yamuna",
          "status": "UP",
          "role": "MASTER",
          "version": "11.19.5"
        },
        "vendorDaemons": [
          {
            "name": "cdslmd",
            "status": "UP",
            "version": "11.19.5"
          }
        ],
        "features": [
          {
            "name": "111",
            "totalLicenses": 2580,
            "usedLicenses": 183,
            "availableLicenses": 2397,
            "usagePercentage": 7,
            "details": {
              "featureName": "111",
              "version": "23.1",
              "vendor": "cdslmd",
              "expiry": "06-aug-2025"
            },
            "users": [...]
          }
        ],
        "summary": {
          "totalFeatures": 1,
          "totalLicenses": 2580,
          "totalUsed": 183,
          "totalAvailable": 2397,
          "overallUsage": 7
        }
      }
    }
  },
  "dataSources": {
    "file": ["cadence", "synopsys", "mgs"]
  }
}
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `500`: Server error with error details

## Security Notes

- File-based data is read-only and doesn't require authentication
- Implement rate limiting for production use
- Consider using environment-specific configuration files

## Troubleshooting

### File Reading Issues
- Ensure files exist in `backend/files/` directory
- Check file permissions
- Verify file naming convention

### File Watcher Issues
- Check if the `files/` directory exists
- Ensure proper file system permissions
- Monitor console logs for file events
