const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
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
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`🌐 Making API request to: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });
      
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
        console.error(`❌ Error details: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`✅ API request successful:`, data);
      return data;
    } catch (error) {
      console.error('❌ API request failed:', error);
      throw error;
    }
  }

  async getHealth(): Promise<{ status: string; message: string }> {
    return this.request('/health');
  }

  async getStatus(): Promise<StatusResponse> {
    return this.request('/status');
  }

  async getAllLicenses(): Promise<AllLicenseData> {
    return this.request('/licenses');
  }

  async getVendorLicenses(vendor: string): Promise<LicenseData> {
    return this.request(`/licenses/${vendor}`);
  }

  async forceRefresh(vendor?: string): Promise<AllLicenseData> {
    return this.request('/licenses/refresh', {
      method: 'POST',
      body: JSON.stringify({ vendor }),
    });
  }

  async testConnections(): Promise<{
    timestamp: string;
    results: {
      [key: string]: {
        status: 'success' | 'error';
        message: string;
        output?: string;
      };
    };
  }> {
    return this.request('/test-connections');
  }
}

export const apiService = new ApiService();
