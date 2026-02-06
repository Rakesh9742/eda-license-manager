# EDA License Insight

A comprehensive License Manager UI for EDA tools (Cadence, Synopsys, Mentor Graphics/Siemens) that provides real-time monitoring and management of license usage with dual data source support.

## 🚀 Features

- **Dual Data Sources**: SSH connection to Linux VNC machine OR local file reading
- **Automatic Fallback**: Seamlessly falls back to file-based data when SSH fails
- **File Watcher**: Monitors `backend/files/` directory for new license files
- **Real-time License Monitoring**: Live updates of license usage across all EDA vendors
- **Multi-Vendor Support**: Unified interface for Cadence, Synopsys, and Mentor Graphics/Siemens
- **Interactive Dashboard**: Beautiful, modern UI with real-time statistics and charts
- **Auto-refresh**: Automatic data updates every 30 seconds
- **Search & Filter**: Advanced filtering and search capabilities
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🏗️ Architecture

```
EDA License Insight
├── backend/                 # Node.js Express server
│   ├── files/              # License data files (fallback source)
│   ├── services/           # License service with SSH + file integration
│   │   ├── licenseService.js
│   │   └── fileWatcher.js  # File monitoring service
│   ├── utils/              # Data parsing utilities
│   └── server.js           # Main server file
└── frontend/               # React TypeScript application
    ├── src/
    │   ├── components/     # shadcn/ui components
    │   ├── frontend/
    │   │   └── components/ # Custom license components
    │   ├── hooks/          # React Query hooks
    │   └── services/       # API service layer
    └── package.json
```

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- SSH access to your Linux VNC machine (optional)
- License files in `backend/files/` directory (optional)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd eda-license-insight
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Edit `.env` with your SSH connection details:
```env
SSH_HOST=your-octoes-vnc-host
SSH_PORT=22
SSH_USERNAME=your-username
SSH_PASSWORD=your-password
# Or use SSH key authentication
SSH_PRIVATE_KEY_PATH=/path/to/private/key

PORT=3001
NODE_ENV=development
```

### 3. Prepare License Files (Optional)

Place your license files in the `backend/files/` directory:
```
backend/files/
├── cadence    # Cadence license data
├── synopsys   # Synopsys license data
└── mgs        # Mentor Graphics/Siemens license data
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env if you need to change the API URL
```

## 🚀 Running the Application

### Development Mode

1. **Start the Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will be available at `http://localhost:3001`

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`

### Production Mode

1. **Build the Frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start the Backend:**
   ```bash
   cd backend
   npm start
   ```

### Production with PM2 (server)

On your production server, use PM2 to run both backend and frontend and keep them running.

1. **From the project root** (e.g. `/var/www/eda-license-manager` or wherever you cloned):

   ```bash
   # Install backend and frontend dependencies
   cd backend && npm install --production && cd ..
   cd frontend && npm install && npm run build && cd ..

   # Install PM2 globally if needed
   npm install -g pm2

   # Start both apps with the ecosystem file
   pm2 start ecosystem.config.js
   ```

2. **Ports (from ecosystem.config.js):**
   - **Backend (API):** `http://<server>:3002` — e.g. `http://65.2.143.55:3002/api/health`
   - **Frontend (UI):** `http://<server>:3001` — e.g. `http://65.2.143.55:3001`

3. **Useful PM2 commands:**
   ```bash
   pm2 list              # Status of backend + frontend
   pm2 logs              # All logs
   pm2 logs backend      # Backend only
   pm2 logs frontend     # Frontend only
   pm2 restart all       # Restart both
   pm2 stop all          # Stop both
   pm2 delete all        # Remove from PM2 (then start again with ecosystem.config.js)
   pm2 save && pm2 startup   # Persist process list across reboots
   ```

4. **Frontend must call the backend:** When building the frontend, set the API URL so the browser hits your backend (port 3002). For example:
   ```bash
   cd frontend
   VITE_API_URL=http://YOUR_SERVER_IP:3002/api npm run build
   ```
   Or set `VITE_API_URL` in `frontend/.env` before `npm run build`. Then restart the frontend (or just rebuild and `pm2 restart frontend`).

## 📊 Data Sources

### SSH Connection (Primary)
- **Real-time data**: Direct connection to license servers
- **Automatic execution**: Runs `lmstat` commands on your Linux VNC machine
- **Live updates**: Gets the most current license information
- **Fallback support**: Automatically switches to file-based data if SSH fails

### File-Based (Fallback)
- **Local files**: Reads from `backend/files/` directory
- **File watcher**: Automatically detects new files and updates
- **Automatic cleanup**: Removes old files when new ones arrive
- **Offline support**: Works without SSH connection

### Data Source Priority
1. **SSH Connection**: Attempts first for real-time data
2. **File Fallback**: Used when SSH is unavailable
3. **Error Handling**: Graceful degradation with clear status indicators

## 📊 Dashboard Features

### Overview Dashboard
- **License Cards**: Visual representation of each vendor's license status
- **Data Source Indicators**: Shows whether data comes from SSH or files
- **System Statistics**: Total licenses, active users, usage rates
- **Health Monitoring**: Real-time system health indicators
- **Auto-refresh**: Data updates every 30 seconds

### Vendor-Specific Views
- **Server Status**: License server health and configuration
- **Vendor Daemons**: Status of license daemon processes
- **Feature Breakdown**: Detailed view of each license feature
- **Active Users**: Real-time user sessions and usage
- **Data Source Info**: Clear indication of data source (SSH/File)

### Advanced Features
- **Search & Filter**: Find specific features or vendors quickly
- **Usage Analytics**: Visual progress bars and percentage indicators
- **Status Indicators**: Color-coded status badges (Available, Warning, Critical)
- **Responsive Design**: Optimized for all screen sizes

## 🔧 Configuration

### Environment Variables

The application uses environment variables for configuration. Both frontend and backend have their own `.env` files.

#### Backend Environment Variables (`backend/.env`)

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# API Configuration
API_BASE_PATH=/api

# Logging Configuration
LOG_LEVEL=info
```

#### Frontend Environment Variables (`frontend/.env`)

```bash
# API Configuration
VITE_API_URL=http://localhost:3001/api

# Frontend Configuration
VITE_APP_NAME=EDA License Insight
VITE_APP_VERSION=1.0.0
```

#### Setting Up Environment Files

1. **Backend Setup:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env if you need to change the API URL
   ```

### Backend Configuration

The backend supports multiple vendors with different lmstat commands:

```javascript
const vendors = {
  cadence: {
    name: 'Cadence',
    command: 'lmstat -a -c 5280@yamuna',
    color: '#FF6B35'
  },
  synopsys: {
    name: 'Synopsys', 
    command: 'lmstat -a -c 5280@yamuna',
    color: '#4A90E2'
  },
  mgs: {
    name: 'Mentor Graphics (Siemens)',
    command: 'lmstat -a -c 1717@yamuna',
    color: '#7B68EE'
  }
};
```

### File Watcher Configuration

The file watcher automatically:
- Monitors the `backend/files/` directory
- Recognizes vendor files by name
- Replaces old files when new ones arrive
- Supports flexible naming conventions

### Frontend Configuration

The frontend can be configured via environment variables:

```env
VITE_API_URL=http://localhost:3001/api
```

## 🔌 API Endpoints

### Health Check
```
GET /api/health
```

### Data Source Status
```
GET /api/status
```
Returns information about which vendors are using SSH vs file data sources.

### Get All License Data
```
GET /api/licenses
```

### Get Specific Vendor Data
```
GET /api/licenses/:vendor
```

## 🎨 UI Components

### LicenseCard
Displays individual vendor license information with:
- Usage statistics
- Progress indicators
- Status badges
- Data source indicators (SSH/File)
- Interactive hover effects

### LicenseTable
Comprehensive table showing:
- All license features
- Usage percentages
- Search and filter capabilities
- Real-time updates
- Data source information

### VendorDetails
Detailed vendor view with:
- Data source information
- Server status
- Feature breakdown
- Active user sessions
- Daemon status

## 🔒 Security

- SSH key authentication support
- Environment variable configuration
- Secure API communication
- Input validation and sanitization
- File-based data is read-only

## 🐛 Troubleshooting

### Common Issues

1. **SSH Connection Failed**
   - Verify SSH credentials in `.env`
   - Check network connectivity
   - Ensure SSH key permissions are correct
   - System will automatically fall back to file-based data

2. **No License Data**
   - Verify lmstat command availability (for SSH)
   - Check license server status (for SSH)
   - Ensure license files exist in `backend/files/` directory (for file-based)
   - Review SSH connection logs

3. **Frontend Not Loading**
   - Verify backend is running
   - Check API URL configuration
   - Review browser console for errors

4. **File Watcher Issues**
   - Ensure `backend/files/` directory exists
   - Check file permissions
   - Verify file naming convention
   - Monitor console logs for file events

### Logs

Backend logs are displayed in the console with emoji indicators:
- 🔌 SSH connection status
- 📄 File reading operations
- 📊 License data fetching
- 👀 File watcher events
- ❌ Error messages
- ✅ Success confirmations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review the API documentation
- Open an issue on GitHub

---

**Built with ❤️ for EDA License Management**
