import { LicenseCard } from "./LicenseCard";
import { LicenseTable } from "./LicenseTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Server, 
  Users, 
  Activity, 
  AlertTriangle,
  Cpu,
  HardDrive,
  Zap,
  RefreshCw,
  TrendingUp,
  Shield,
  Clock,
  Database,
  FileText,
  BarChart3,
  Gauge
} from "lucide-react";
import { useLicenses, useHealthCheck, useDataSourceStatus } from "@/hooks/useLicenses";
import { useState } from "react";
import { StatusModal } from "./StatusModal";

export const Dashboard = () => {
  const { allLicenses, isLoading, error, refreshLicenses, isRefreshing } = useLicenses(
    (type, title, message) => {
      setStatusModal({
        isOpen: true,
        type,
        title,
        message
      });
    }
  );
  const { isHealthy } = useHealthCheck();
  const { dataSources, lastRefreshTime } = useDataSourceStatus();
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  // Calculate overall statistics
  const overallStats = {
    totalLicenses: 0,
    totalUsed: 0,
    totalAvailable: 0,
    totalFeatures: 0,
    activeUsers: 0,
    vendors: 0
  };

  if (allLicenses?.vendors) {
    Object.values(allLicenses.vendors).forEach((vendorData: any) => {
      if (vendorData.parsed?.summary) {
        overallStats.totalLicenses += vendorData.parsed.summary.totalLicenses;
        overallStats.totalUsed += vendorData.parsed.summary.totalUsed;
        overallStats.totalAvailable += vendorData.parsed.summary.totalAvailable;
        overallStats.totalFeatures += vendorData.parsed.summary.totalFeatures;
        overallStats.activeUsers += vendorData.parsed.features?.reduce((sum: number, feature: any) => 
          sum + feature.users.length, 0) || 0;
      }
    });
    overallStats.vendors = Object.keys(allLicenses.vendors).length;
  }

  const overallUsage = overallStats.totalLicenses > 0 
    ? Math.round((overallStats.totalUsed / overallStats.totalLicenses) * 100)
    : 0;

  const getSystemHealthStatus = () => {
    if (!isHealthy) return { status: 'error', text: 'Backend Offline', icon: <AlertTriangle className="h-4 w-4 text-destructive" /> };
    if (overallUsage >= 90) return { status: 'warning', text: 'High Usage', icon: <AlertTriangle className="h-4 w-4 text-warning" /> };
    if (overallUsage >= 75) return { status: 'warning', text: 'Medium Usage', icon: <TrendingUp className="h-4 w-4 text-warning" /> };
    return { status: 'success', text: 'Healthy', icon: <Shield className="h-4 w-4 text-success" /> };
  };

  const healthStatus = getSystemHealthStatus();

  const getDataSourceIcon = (vendor: string) => {
    if (!allLicenses?.vendors?.[vendor]) return <Database className="h-4 w-4 text-muted-foreground" />;
    
    const dataSource = allLicenses.vendors[vendor].dataSource;
    switch (dataSource) {
      case 'file':
        return <FileText className="h-4 w-4 text-warning" />;
      case 'lmstat':
        return <Server className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Database className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDataSourceBadge = (vendor: string) => {
    if (!allLicenses?.vendors?.[vendor]) return null;
    
    const vendorData = allLicenses.vendors[vendor];
    const dataSource = vendorData.dataSource;
    
    switch (dataSource) {
      case 'file':
        // If there's an lmstat error, show it's fallback data
        if (vendorData.lmstatError) {
          return <Badge variant="warning" className="text-xs premium-badge">Fallback</Badge>;
        }
        return <Badge variant="secondary" className="text-xs premium-badge">File</Badge>;
      case 'lmstat':
        return <Badge variant="default" className="text-xs premium-badge">Live</Badge>;
      case 'error':
        return <Badge variant="destructive" className="text-xs premium-badge">Error</Badge>;
      default:
        return null;
    }
  };

  const formatLastRefreshTime = () => {
    if (!lastRefreshTime) return 'Never';
    return new Date(lastRefreshTime).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Premium Header */}
      <header className="premium-header border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="premium-title text-3xl">
                EDA License Manager
              </h1>
              <p className="premium-subtitle text-sm">
                Real-time license server monitoring & analytics
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="premium-status flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 backdrop-blur-sm border">
                  <div className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-success' : 'bg-destructive'} animate-pulse`}></div>
                  <span className="font-medium">{isHealthy ? 'System Online' : 'System Offline'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusModal({
                      isOpen: true,
                      type: 'info',
                      title: 'Refreshing License Data',
                      message: 'Fetching latest information from servers...'
                    });
                    refreshLicenses();
                  }}
                  disabled={isRefreshing}
                  className="premium-button flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {isLoading && (
          <div className="premium-loading flex items-center justify-center py-16">
            <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm px-6 py-4 rounded-lg border">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span className="font-medium">Loading license data from servers...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="premium-card bg-destructive/5 border-destructive/20 rounded-xl p-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Failed to load license data. Please check your connection and try again.</span>
            </div>
          </div>
        )}

        {/* Show lmstat command errors only when fallback data is being used */}
        {allLicenses?.vendors && Object.entries(allLicenses.vendors).some(([_, vendorData]: [string, any]) => 
          vendorData.lmstatError && vendorData.dataSource === 'file'
        ) && (
          <div className="premium-card bg-warning/5 border-warning/20 rounded-xl p-6">
            <div className="flex items-start gap-3 text-warning">
              <AlertTriangle className="h-5 w-5 mt-0.5" />
              <div className="flex-1 space-y-3">
                <p className="font-medium">lmstat commands failed - using backup data from files</p>
                <div className="space-y-3">
                  {Object.entries(allLicenses.vendors).map(([vendorKey, vendorData]: [string, any]) => {
                    if (vendorData.lmstatError && vendorData.dataSource === 'file') {
                      return (
                        <div key={vendorKey} className="text-sm bg-warning/5 p-4 rounded-lg border border-warning/10">
                          <p className="font-medium mb-2">{vendorData.vendorName}:</p>
                          <p className="text-muted-foreground mb-1">Command failed: {vendorData.lmstatError.command}</p>
                          <p className="text-muted-foreground mb-2">Error: {vendorData.lmstatError.message}</p>
                          <p className="text-success text-xs font-medium">✅ Redirected to backup file data</p>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show complete failures (both lmstat and file failed) */}
        {allLicenses?.vendors && Object.entries(allLicenses.vendors).some(([_, vendorData]: [string, any]) => 
          vendorData.dataSource === 'error'
        ) && (
          <div className="premium-card bg-destructive/5 border-destructive/20 rounded-xl p-6">
            <div className="flex items-start gap-3 text-destructive">
              <AlertTriangle className="h-5 w-5 mt-0.5" />
              <div className="flex-1 space-y-3">
                <p className="font-medium">Command execution failed - unable to load data</p>
                <div className="space-y-3">
                  {Object.entries(allLicenses.vendors).map(([vendorKey, vendorData]: [string, any]) => {
                    if (vendorData.dataSource === 'error') {
                      return (
                        <div key={vendorKey} className="text-sm bg-destructive/5 p-4 rounded-lg border border-destructive/10">
                          <p className="font-medium mb-2">{vendorData.vendorName}:</p>
                          {vendorData.lmstatError && (
                            <p className="text-muted-foreground mb-1">lmstat command failed: {vendorData.lmstatError.message}</p>
                          )}
                          {vendorData.fileError && (
                            <p className="text-muted-foreground mb-2">Backup file failed: {vendorData.fileError.message}</p>
                          )}
                          <p className="text-destructive text-xs font-medium">❌ No data available</p>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show test connection results */}
        {/* This section is removed as per the edit hint */}

        {allLicenses && (
          <>
            {/* Data Source Status */}
            {dataSources && (
              <Card className="premium-card bg-gradient-to-br from-card to-secondary/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Database className="h-6 w-6 text-primary" />
                    Data Sources & Refresh Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/10">
                      <Server className="h-5 w-5 text-success" />
                      <div>
                        <span className="text-sm font-medium">Live Sources</span>
                        <Badge variant="outline" className="ml-2">{dataSources.lmstat?.length || 0}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/5 border border-warning/10">
                      <FileText className="h-5 w-5 text-warning" />
                      <div>
                        <span className="text-sm font-medium">File Sources</span>
                        <Badge variant="outline" className="ml-2">{dataSources.file?.length || 0}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <div>
                        <span className="text-sm font-medium">Errors</span>
                        <Badge variant="outline" className="ml-2">{dataSources.error?.length || 0}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                      <Database className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium">Total Vendors</span>
                        <Badge variant="outline" className="ml-2">{overallStats.vendors}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium">Last Refresh</span>
                        <span className="text-xs text-muted-foreground block">{formatLastRefreshTime()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border border-muted/50">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      💡 <strong>Tip:</strong> Data is fetched live from license servers using lmstat commands. If commands fail to execute, the system automatically redirects to backup file data. Warning messages appear when command execution fails and fallback data is used. Click "Refresh Data" to get the latest information.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Overview Cards */}
            <div className="premium-grid">
              {Object.entries(allLicenses.vendors).map(([vendorKey, vendorData]: [string, any]) => {
                const summary = vendorData.parsed?.summary;
                if (!summary) return null;

                const getStatus = (usage: number) => {
                  if (usage >= 90) return "critical";
                  if (usage >= 75) return "warning";
                  return "available";
                };

                const getIcon = (vendor: string) => {
                  switch (vendor) {
                    case 'cadence': return <Cpu className="h-6 w-6" />;
                    case 'synopsys': return <HardDrive className="h-6 w-6" />;
                    case 'mgs': return <Zap className="h-6 w-6" />;
                    default: return <Activity className="h-6 w-6" />;
                  }
                };

                // Get the earliest expiry date from all features
                const getEarliestExpiry = () => {
                  if (!vendorData.parsed?.features) return null;
                  
                  const expiryDates = vendorData.parsed.features
                    .map((feature: any) => feature.details?.expiry)
                    .filter((date: string) => date && date !== 'N/A')
                    .map((date: string) => new Date(date))
                    .filter((date: Date) => !isNaN(date.getTime()));
                  
                  if (expiryDates.length === 0) return null;
                  
                  const earliest = new Date(Math.min(...expiryDates.map(d => d.getTime())));
                  return earliest.toISOString().split('T')[0]; // Return as YYYY-MM-DD
                };

                return (
                  <LicenseCard
                    key={vendorKey}
                    title={vendorData.vendorName}
                    total={summary.totalLicenses}
                    used={summary.totalUsed}
                    status={getStatus(summary.overallUsage)}
                    icon={getIcon(vendorKey)}
                    badge={getDataSourceBadge(vendorKey)}
                    expiryDate={getEarliestExpiry()}
                  />
                );
              })}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="premium-card bg-gradient-to-br from-card to-secondary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Licenses
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground mb-1">{overallStats.totalLicenses}</div>
                  <p className="text-xs text-muted-foreground">
                    Across {overallStats.vendors} vendors
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card bg-gradient-to-br from-card to-secondary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Users
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground mb-1">{overallStats.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently using licenses
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card bg-gradient-to-br from-card to-secondary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Usage Rate
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Gauge className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground mb-1">{overallUsage}%</div>
                  <p className="text-xs text-muted-foreground">
                    {overallStats.totalUsed} of {overallStats.totalLicenses} licenses
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card bg-gradient-to-br from-card to-secondary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    System Health
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-primary/10">
                    {healthStatus.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold mb-1 ${healthStatus.status === 'error' ? 'text-destructive' : healthStatus.status === 'warning' ? 'text-warning' : 'text-success'}`}>
                    {healthStatus.text}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {allLicenses.timestamp ? new Date(allLicenses.timestamp).toLocaleTimeString() : 'Unknown'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Only Overview */}
            <div className="space-y-6">
              <LicenseTable allLicenses={allLicenses} />
            </div>
          </>
        )}
      </main>

      {/* Status Modal */}
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />
    </div>
  );
};