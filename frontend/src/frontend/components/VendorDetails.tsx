import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Server, 
  Users, 
  Activity, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  FileText,
  Database,
  Gauge,
  Monitor
} from "lucide-react";

interface VendorDetailsProps {
  vendorData: any;
}

export const VendorDetails = ({ vendorData }: VendorDetailsProps) => {
  const { parsed, vendorName, color, dataSource, error } = vendorData;
  
  if (!parsed && error) {
    return (
      <div className="text-center py-12">
        <div className="premium-card bg-destructive/5 border-destructive/20 rounded-xl p-8 max-w-md mx-auto">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-destructive mb-3">No Data Available</h3>
          <p className="text-muted-foreground mb-4">Unable to load license data for {vendorName}</p>
          <p className="text-sm text-destructive font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!parsed) {
    return (
      <div className="text-center py-12">
        <div className="premium-card bg-destructive/5 border-destructive/20 rounded-xl p-8 max-w-md mx-auto">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-destructive mb-3">No Data Available</h3>
          <p className="text-muted-foreground">Unable to load license data for {vendorName}</p>
        </div>
      </div>
    );
  }

  const { serverStatus, vendorDaemons, features, summary } = parsed;

  const getDataSourceIcon = () => {
    switch (dataSource) {
      case 'file':
        return <FileText className="h-5 w-5 text-warning" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getDataSourceBadge = () => {
    switch (dataSource) {
      case 'file':
        return <Badge variant="secondary" className="premium-badge">File</Badge>;
      case 'error':
        return <Badge variant="destructive" className="premium-badge">Error</Badge>;
      default:
        return <Badge variant="outline" className="premium-badge">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Data Source Info */}
      <Card className="premium-card bg-gradient-to-br from-card to-secondary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            Data Source Information
          </CardTitle>
          <div className="flex items-center gap-3">
            {getDataSourceIcon()}
            {getDataSourceBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {dataSource === 'file' && 'Data loaded from local license file'}
            {dataSource === 'error' && 'Failed to retrieve data from file source'}
            {!dataSource && 'Data source unknown'}
          </p>
        </CardContent>
      </Card>

      {/* Server Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="premium-card bg-gradient-to-br from-card to-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold">Server Status</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Server className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${serverStatus.status === 'UP' ? 'bg-success' : 'bg-destructive'} animate-pulse`}></div>
              <span className="font-bold text-lg">{serverStatus.status}</span>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium">Host:</span> {serverStatus.host}:{serverStatus.port}
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">Role:</span> {serverStatus.role}
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">Version:</span> {serverStatus.version}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card bg-gradient-to-br from-card to-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold">Vendor Daemons</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vendorDaemons.map((daemon: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">{daemon.name}</span>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${daemon.status === 'UP' ? 'bg-success' : 'bg-destructive'}`}></div>
                    <span className="text-xs text-muted-foreground font-medium">v{daemon.version}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card bg-gradient-to-br from-card to-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold">Overall Usage</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Gauge className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold">{summary.overallUsage}%</div>
            <p className="text-sm text-muted-foreground">
              {summary.totalUsed} of {summary.totalLicenses} licenses
            </p>
            <div className="relative">
              <Progress value={summary.overallUsage} className="premium-progress h-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Table */}
      <Card className="premium-card bg-gradient-to-br from-card to-secondary/20">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Monitor className="h-6 w-6 text-primary" />
            </div>
            License Features ({features.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Feature
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Version
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Expiry
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Total Licenses
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      License in Use
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      License Available
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      User Count
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {features.map((feature: any, index: number) => (
                  <TableRow key={index} className="hover:bg-muted/30 transition-all duration-200 group border-l-4 border-l-transparent hover:border-l-primary/20">
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div className="group-hover:text-primary transition-colors duration-200">{feature.name}</div>
                        {feature.details?.featureName && (
                          <div className="text-xs text-muted-foreground">
                            {feature.details.featureName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {feature.details?.version || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {feature.details?.expiry || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-semibold text-blue-600">
                          {feature.totalLicenses}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-semibold text-red-600">
                          {feature.usedLicenses}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {feature.availableLicenses > 0 ? (
                          <AlertTriangle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm font-semibold ${
                          feature.availableLicenses > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {feature.availableLicenses}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Users className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{feature.users.length}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Active Users */}
      {features.some((f: any) => f.users.length > 0) && (
        <Card className="premium-card bg-gradient-to-br from-card to-secondary/20">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold text-foreground">User</TableHead>
                    <TableHead className="font-semibold text-foreground">Host</TableHead>
                    <TableHead className="font-semibold text-foreground">Feature</TableHead>
                    <TableHead className="font-semibold text-foreground">Start Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {features.flatMap((feature: any) => 
                    feature.users.map((user: any, userIndex: number) => (
                      <TableRow key={`${feature.name}-${userIndex}`} className="hover:bg-muted/30 transition-colors duration-200">
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell className="font-medium">{user.hostname}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="premium-badge">{feature.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-full bg-primary/10">
                              <Clock className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-sm font-medium">{user.startTime}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
