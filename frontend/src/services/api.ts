const SERVER_IP = import.meta.env.VITE_SERVER_IP || 'localhost';
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '3001';
const FRONTEND_PORT = import.meta.env.VITE_FRONTEND_PORT || '3002';
const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${SERVER_IP}:${BACKEND_PORT}/api`;
const APP_NAME = import.meta.env.VITE_APP_NAME || 'EDA License Insight';
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

export interface LicenseData {
  vendor: string;
  vendorName: string;
  color: string;
  timestamp: string;
  dataSource?: 'file' | 'lmstat' | 'error';
  lmstatError?: {
    message: string;
    command: string;
    timestamp: string;
  };
  fileError?: {
    message: string;
    filePath: string;
    timestamp: string;
  };
  parsed: {
    serverStatus: {
      port: string;
      host: string;
      status: string;
      role: string;
      version: string;
    };
    vendorDaemons: Array<{
      name: string;
      status: string;
      version: string;
    }>;
    features: Array<{
      name: string;
      totalLicenses: number;
      usedLicenses: number;
      availableLicenses: number;
      usagePercentage: number;
      details: {
        featureName: string;
        version: string;
        vendor: string;
        expiry: string;
      };
      users: Array<{
        username: string;
        hostname: string;
        display: string;
        displayId: string;
        startTime: string;
      }>;
    }>;
    summary: {
      totalFeatures: number;
      totalLicenses: number;
      totalUsed: number;
      totalAvailable: number;
      overallUsage: number;
    };
  };
  error?: string;
}

export interface AllLicenseData {
  timestamp: string;
  vendors: {
    [key: string]: LicenseData;
  };
  dataSources?: {
    file?: string[];
    lmstat?: string[];
    error?: string[];
  };
}

export interface DataSourceStatus {
  file?: string[];
  lmstat?: string[];
  currentFiles?: {
    [key: string]: string;
  };
  lastRefreshTime?: string;
}

export interface StatusResponse {
  status: string;
  dataSources: DataSourceStatus;
  timestamp: string;
}

class ApiService {
  // Default timeout: 30 seconds for most requests, 60 seconds for license data
  private readonly DEFAULT_TIMEOUT = 30000;
  private readonly LICENSE_TIMEOUT = 60000;

  private async request<T>(endpoint: string, options?: RequestInit & { timeout?: number }): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        signal: controller.signal,
        ...options,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API request failed: ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error(`❌ API request timeout after ${timeout}ms: ${url}`);
        throw new Error(`Request timeout: The server took too long to respond (${timeout}ms)`);
      }
      
      console.error('❌ API request failed:', error);
      throw error;
    }
  }

  getHealth = async (): Promise<{ 
    status: string; 
    message: string;
    systemStatus?: {
      backend: string;
      licenseCommands: string;
      dataSource: string;
      timestamp: string;
    };
  }> => {
    return this.request('/health');
  }

  getStatus = async (): Promise<StatusResponse> => {
    return this.request('/status');
  }

  getAllLicenses = async (): Promise<AllLicenseData> => {
    return this.request('/licenses', { timeout: this.LICENSE_TIMEOUT });
  }

  getVendorLicenses = async (vendor: string): Promise<LicenseData> => {
    return this.request(`/licenses/${vendor}`, { timeout: this.LICENSE_TIMEOUT });
  }

  forceRefresh = async (vendor?: string): Promise<AllLicenseData> => {
    return this.request('/licenses/refresh', {
      method: 'POST',
      body: JSON.stringify({ vendor }),
      timeout: this.LICENSE_TIMEOUT,
    });
  }

  testConnections = async (): Promise<{
    timestamp: string;
    results: {
      [key: string]: {
        status: 'success' | 'error';
        message: string;
        output?: string;
      };
    };
  }> => {
    return this.request('/test-connections');
  }
}

export const apiService = new ApiService();
