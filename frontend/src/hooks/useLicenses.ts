import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, type AllLicenseData, type LicenseData, type StatusResponse } from '@/services/api';

export const useLicenses = (onStatusUpdate?: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void) => {
  const queryClient = useQueryClient();

  const {
    data: allLicenses,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['licenses'],
    queryFn: async () => {
      console.log('🔄 Making initial license data request...');
      try {
        const data = await apiService.getAllLicenses();
        console.log('✅ Initial license data request successful:', data);
        return data;
      } catch (error) {
        console.error('❌ Initial license data request failed:', error);
        throw error;
      }
    },
    refetchInterval: false, // Disable auto-refresh, only manual refresh
    staleTime: 0, // Always consider data stale to force fresh requests
    retry: 1, // Only retry once
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      console.log('🔄 Making refresh license data request...');
      try {
        const data = await apiService.forceRefresh();
        console.log('✅ Refresh license data request successful:', data);
        return data;
      } catch (error) {
        console.error('❌ Refresh license data request failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['licenses'], data);
      
      // Show detailed status in modal
      const lmstatCount = data.dataSources?.lmstat?.length || 0;
      const fileCount = data.dataSources?.file?.length || 0;
      const errorCount = data.dataSources?.error?.length || 0;
      const totalVendors = Object.keys(data.vendors || {}).length;
      
      if (onStatusUpdate) {
        if (errorCount > 0) {
          onStatusUpdate('error', 'Command Execution Failed', `${errorCount} out of ${totalVendors} vendors failed to execute lmstat commands and could not load backup data`);
        } else if (fileCount > 0) {
          const failedVendors = Object.entries(data.vendors || {}).filter(([_, vendorData]: [string, any]) => vendorData.lmstatError).map(([key, vendorData]: [string, any]) => vendorData.vendorName);
          onStatusUpdate('warning', 'Command Failed - Using Backup Data', `lmstat commands failed for: ${failedVendors.join(', ')}. Redirecting to backup files for these vendors.`);
        } else {
          onStatusUpdate('success', 'Refresh Successful', `All ${lmstatCount} vendors connected live via lmstat commands`);
        }
      }
    },
    onError: (error) => {
      if (onStatusUpdate) {
        onStatusUpdate('error', 'Refresh Failed', 'Failed to refresh license data');
      }
      console.error('Refresh error:', error);
    },
  });

  const refreshLicenses = () => {
    refreshMutation.mutate();
  };

  return {
    allLicenses,
    isLoading,
    error,
    refreshLicenses,
    isRefreshing: refreshMutation.isPending,
  };
};

export const useVendorLicenses = (vendor: string) => {
  const {
    data: vendorData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['licenses', vendor],
    queryFn: () => apiService.getVendorLicenses(vendor),
    enabled: !!vendor,
    refetchInterval: false,
    staleTime: Infinity,
  });

  return {
    vendorData,
    isLoading,
    error,
    refetch,
  };
};

export const useHealthCheck = () => {
  const {
    data: health,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['health'],
    queryFn: apiService.getHealth,
    refetchInterval: 60000, // Check health every minute
  });

  return {
    health,
    isLoading,
    error,
    isHealthy: health?.status === 'OK',
  };
};

export const useDataSourceStatus = () => {
  const {
    data: status,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['status'],
    queryFn: apiService.getStatus,
    refetchInterval: 10000, // Check status every 10 seconds
  });

  return {
    status,
    isLoading,
    error,
    dataSources: status?.dataSources,
    lastRefreshTime: status?.dataSources?.lastRefreshTime,
  };
};

export const useTestConnections = (onStatusUpdate?: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void) => {
  const {
    data: testResults,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['test-connections'],
    queryFn: apiService.testConnections,
    enabled: false, // Only run when explicitly called
    staleTime: 0, // Always consider stale
  });

  const testConnectionsWithModal = async () => {
    try {
      await refetch();
      if (testResults && onStatusUpdate) {
        const successCount = Object.values(testResults.results).filter((r: any) => r.status === 'success').length;
        const totalCount = Object.keys(testResults.results).length;
        if (successCount === totalCount) {
          onStatusUpdate('success', 'Connection Test Successful', `All ${totalCount} license servers are accessible`);
        } else {
          onStatusUpdate('warning', 'Connection Test Results', `${successCount} out of ${totalCount} servers are accessible`);
        }
      }
    } catch (error) {
      if (onStatusUpdate) {
        onStatusUpdate('error', 'Connection Test Failed', 'Unable to test license server connections');
      }
    }
  };

  return {
    testResults,
    isLoading,
    error,
    testConnections: testConnectionsWithModal,
  };
};
