import { useState, useEffect, useMemo, Fragment } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Search, Filter, Users, Clock, BarChart3, TrendingUp, Monitor, User, Calendar, Server, Package, CheckCircle, AlertCircle, XCircle, Activity, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

interface LicenseTableProps {
  allLicenses: any;
  selectedVendorFilter?: string;
  onVendorFilterChange?: (vendor: string) => void;
}

interface UserDetail {
  username: string;
  hostname: string;
  startTime: string;
  usageCount: number;
  timestamps: string[];
}

export const LicenseTable = ({ allLicenses, selectedVendorFilter, onVendorFilterChange }: LicenseTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVendor, setFilterVendor] = useState<string>(selectedVendorFilter || "all");
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  
  // Pagination state for license overview table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  
  // Sorting state for main table
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Sorting state for user details table
  const [userSortColumn, setUserSortColumn] = useState<string | null>(null);
  const [userSortDirection, setUserSortDirection] = useState<"asc" | "desc">("asc");
  
  // User details modal filters
  const [userFilterUsername, setUserFilterUsername] = useState("");
  const [userFilterUsageCount, setUserFilterUsageCount] = useState("");
  const [userFilterDays, setUserFilterDays] = useState("");
  const [userFilterVersion, setUserFilterVersion] = useState("");
  const [selectedUserRow, setSelectedUserRow] = useState<any>(null);

  // Helper function to get unique user count
  const getUniqueUserCount = (feature: any): number => {
    if (!feature || !feature.users || !Array.isArray(feature.users)) {
      return 0;
    }
    
    const userMap = new Map<string, boolean>();
    
    feature.users.forEach((user: any) => {
      if (user && user.username && user.hostname) {
        const key = `${user.username}@${user.hostname}`;
        userMap.set(key, true);
      }
    });
    
    return userMap.size;
  };

  // Flatten all features from all vendors - memoized for performance
  const allFeatures = useMemo(() => {
    return Object.entries(allLicenses?.vendors || {}).flatMap(([vendorKey, vendorData]: [string, any]) => {
      if (!vendorData.parsed?.features) return [];
      
      return vendorData.parsed.features.map((feature: any) => ({
        ...feature,
        vendor: vendorData.vendorName,
        vendorKey,
        vendorColor: vendorData.color
      }));
    });
  }, [allLicenses]);

  // Filter and sort features - memoized for performance
  const filteredFeatures = useMemo(() => {
    let filtered = allFeatures.filter(feature => {
      const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           feature.vendor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterVendor === "all" || feature.vendorKey === filterVendor;
      return matchesSearch && matchesFilter;
    });
    
    // Apply sorting if a column is selected
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: number;
        let bValue: number;
        
        switch (sortColumn) {
          case "totalLicenses":
            aValue = a.totalLicenses || 0;
            bValue = b.totalLicenses || 0;
            break;
          case "usedLicenses":
            aValue = a.usedLicenses || 0;
            bValue = b.usedLicenses || 0;
            break;
          case "availableLicenses":
            aValue = a.availableLicenses || 0;
            bValue = b.availableLicenses || 0;
            break;
          case "userCount":
            aValue = getUniqueUserCount(a);
            bValue = getUniqueUserCount(b);
            break;
          default:
            return 0;
        }
        
        if (sortDirection === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }
    
    return filtered;
  }, [allFeatures, searchTerm, filterVendor, sortColumn, sortDirection]);

  // Pagination: slice of filtered features for current page
  const totalFiltered = filteredFeatures.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const paginatedFeatures = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFeatures.slice(start, start + pageSize);
  }, [filteredFeatures, currentPage, pageSize]);

  // Reset to page 1 when search or vendor filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterVendor]);

  // Clamp current page if it's out of range (e.g. after changing page size)
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const getStatusVariant = (usagePercentage: number) => {
    if (usagePercentage >= 90) return "destructive";
    if (usagePercentage >= 75) return "warning";
    return "success";
  };

  const getStatusText = (usagePercentage: number) => {
    if (usagePercentage >= 90) return "Critical";
    if (usagePercentage >= 75) return "Warning";
    return "Available";
  };

  const vendors = Object.keys(allLicenses.vendors);

  // Sync filter state with parent component
  useEffect(() => {
    if (selectedVendorFilter && selectedVendorFilter !== filterVendor) {
      setFilterVendor(selectedVendorFilter);
    }
  }, [selectedVendorFilter, filterVendor]);

  // Handle filter change and notify parent
  const handleFilterChange = (vendor: string) => {
    setFilterVendor(vendor);
    if (onVendorFilterChange) {
      onVendorFilterChange(vendor);
    }
  };

  const handleFeatureClick = (feature: any) => {
    setSelectedFeature(feature);
    setIsUserModalOpen(true);
    // Reset filters when opening modal
    setUserFilterUsername("");
    setUserFilterUsageCount("");
    setUserFilterDays("");
    setUserFilterVersion("");
    // Reset user table sorting
    setUserSortColumn(null);
    setUserSortDirection("asc");
  };

  const getUserDetails = (feature: any): UserDetail[] => {
    if (!feature || !feature.users || !Array.isArray(feature.users)) {
      return [];
    }
    
    const userMap = new Map<string, UserDetail>();
    
    feature.users.forEach((user: any) => {
      if (user && user.username && user.hostname) {
        const key = `${user.username}@${user.hostname}`;
        
        if (userMap.has(key)) {
          const existing = userMap.get(key)!;
          existing.usageCount++;
          existing.timestamps.push(user.startTime);
        } else {
          userMap.set(key, {
            username: user.username,
            hostname: user.hostname,
            startTime: user.startTime,
            usageCount: 1,
            timestamps: [user.startTime]
          });
        }
      }
    });
    
    return Array.from(userMap.values()).sort((a, b) => b.usageCount - a.usageCount);
  };

  // Calculate days since license was opened
  const calculateDaysSince = (startTime: string): number => {
    try {
      // Handle format like "Thu 6/26 16:12" or "Wed 7/16 14:10"
      const timeMatch = startTime.match(/(\w+)\s+(\d+)\/(\d+)\s+(\d+):(\d+)/);
      if (timeMatch) {
        const [, dayName, month, day, hour, minute] = timeMatch;
        const currentYear = new Date().getFullYear();
        
        // Create date object (assuming current year)
        const startDate = new Date(currentYear, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        const currentDate = new Date();
        
        // If the calculated date is in the future, it's from last year
        if (startDate > currentDate) {
          startDate.setFullYear(currentYear - 1);
        }
        
        const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
      }
      
      // Fallback to standard date parsing
      const startDate = new Date(startTime);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  };

  // Get detailed user data with all license instances
  const getDetailedUserData = (feature: any): any[] => {
    if (!feature || !feature.users || !Array.isArray(feature.users)) {
      return [];
    }
    
    return feature.users.map((user: any) => ({
      username: user.username,
      hostname: user.hostname,
      startTime: user.startTime,
      version: feature.details?.version || 'N/A',
      daysSince: calculateDaysSince(user.startTime)
    }));
  };

  // Filter and sort detailed user data
  const getFilteredUserData = (feature: any): any[] => {
    const userData = getDetailedUserData(feature);
    
    let filtered = userData.filter(user => {
      // Calculate usage count for this specific user
      const userUsageCount = userData.filter(u => 
        u.username === user.username && u.hostname === user.hostname
      ).length;
      
      const matchesUsername = !userFilterUsername.trim() || 
        user.username.toLowerCase().includes(userFilterUsername.toLowerCase().trim());
      
      const matchesUsageCount = !userFilterUsageCount.trim() || 
        userUsageCount === parseInt(userFilterUsageCount.trim());
      
      const matchesDays = !userFilterDays.trim() || 
        user.daysSince === parseInt(userFilterDays.trim());
      
      const matchesVersion = !userFilterVersion.trim() || 
        user.version.toLowerCase().includes(userFilterVersion.toLowerCase().trim());
      
      return matchesUsername && matchesUsageCount && matchesDays && matchesVersion;
    });
    
    // Apply sorting if a column is selected
    if (userSortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: number;
        let bValue: number;
        
        switch (userSortColumn) {
          case "usageCount":
            const aUsageCount = userData.filter(u => 
              u.username === a.username && u.hostname === a.hostname
            ).length;
            const bUsageCount = userData.filter(u => 
              u.username === b.username && u.hostname === b.hostname
            ).length;
            aValue = aUsageCount;
            bValue = bUsageCount;
            break;
          case "daysSince":
            aValue = a.daysSince || 0;
            bValue = b.daysSince || 0;
            break;
          default:
            return 0;
        }
        
        if (userSortDirection === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }
    
    return filtered;
  };
  
  // Handle main table column sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };
  
  // Handle user details table column sort
  const handleUserSort = (column: string) => {
    if (userSortColumn === column) {
      // Toggle direction if same column
      setUserSortDirection(userSortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setUserSortColumn(column);
      setUserSortDirection("asc");
    }
  };
  
  // Get sort icon for main table
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortDirection === "asc" ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };
  
  // Get sort icon for user details table
  const getUserSortIcon = (column: string) => {
    if (userSortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return userSortDirection === "asc" ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6" data-license-table>
      {/* Main Filters */}
      <Card className="premium-card bg-gradient-to-br from-card to-secondary/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            License Overview ({allFeatures.length} features)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by feature or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 premium-button"
              />
            </div>
            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterVendor} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-[200px] premium-button">
                  <SelectValue placeholder="Select tool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tools</SelectItem>
                  {vendors.map(vendor => (
                    <SelectItem key={vendor} value={vendor}>
                      {allLicenses.vendors[vendor].vendorName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* License Table */}
      <Card className="premium-card bg-gradient-to-br from-card to-secondary/20">
        <CardContent className="p-0">
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
                  <TableHead 
                    className="font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("totalLicenses")}
                  >
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Total Licenses
                      {getSortIcon("totalLicenses")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("usedLicenses")}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      License in Use
                      {getSortIcon("usedLicenses")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("availableLicenses")}
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      License Available
                      {getSortIcon("availableLicenses")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("userCount")}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      User Count
                      {getSortIcon("userCount")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeatures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                        <p className="font-medium">No features found matching your search criteria</p>
                        <p className="text-sm">Try adjusting your search terms or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedFeatures.map((feature, index) => (
                    <TableRow 
                      key={`${feature.vendorKey}-${feature.name}-${index}`} 
                      className="hover:bg-muted/30 transition-all duration-200 group cursor-pointer border-l-4 border-l-transparent hover:border-l-primary/20"
                      onClick={() => handleFeatureClick(feature)}
                    >
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="group-hover:text-primary transition-colors duration-200 flex items-center gap-2">
                            {feature.name}
                            <Monitor className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {feature.details?.featureName && feature.details.featureName !== feature.name && (
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
                            <AlertCircle className="h-4 w-4 text-green-500" />
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
                          <span className="text-sm font-medium">{getUniqueUserCount(feature)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Summary footer with pagination */}
          <div className="p-4 bg-muted/20 border-t space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Showing {totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalFiltered)} of {totalFiltered} features
                  {totalFiltered !== allFeatures.length && ` (${allFeatures.length} total)`}
                </span>
                {searchTerm && (
                  <span className="text-primary font-medium">Filtered by: &quot;{searchTerm}&quot;</span>
                )}
                {filterVendor !== "all" && (
                  <span className="text-primary font-medium">
                    Tool: {allLicenses.vendors[filterVendor]?.vendorName}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground whitespace-nowrap">Rows per page</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      setPageSize(Number(v));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px] h-8 premium-button">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Users className="h-4 w-4" />
                  <span>Total active users: {allFeatures.reduce((sum, feature) => sum + getUniqueUserCount(feature), 0)}</span>
                </div>
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage((p) => Math.max(1, p - 1));
                          }}
                          className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => {
                          if (totalPages <= 7) return true;
                          if (p === 1 || p === totalPages) return true;
                          if (Math.abs(p - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((p, i, arr) => (
                          <Fragment key={p}>
                            {i > 0 && arr[i - 1] !== p - 1 && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(p);
                                }}
                                isActive={currentPage === p}
                                className="cursor-pointer"
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          </Fragment>
                        ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage((p) => Math.min(totalPages, p + 1));
                          }}
                          className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <Monitor className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-semibold">{selectedFeature?.name}</div>
                <div className="text-sm text-muted-foreground font-normal">
                  {selectedFeature?.vendor} • {selectedFeature ? getUniqueUserCount(selectedFeature) : 0} active users
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedFeature && (
            <div className="space-y-6">
              {/* Feature Summary */}
              <Card className="premium-card bg-gradient-to-br from-card to-secondary/20">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Active Users</div>
                        <div className="text-lg font-bold">{selectedFeature ? getUniqueUserCount(selectedFeature) : 0}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <BarChart3 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Usage</div>
                        <div className="text-lg font-bold">{selectedFeature.usedLicenses}/{selectedFeature.totalLicenses}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Version</div>
                        <div className="text-lg font-bold">{selectedFeature.details?.version || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Total Instances</div>
                        <div className="text-lg font-bold">{selectedFeature.users?.length || 0}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filters */}
              <Card className="premium-card bg-gradient-to-br from-card to-secondary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-primary" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Username</label>
                      <Input
                        placeholder="Filter by username..."
                        value={userFilterUsername}
                        onChange={(e) => setUserFilterUsername(e.target.value)}
                        className="premium-button"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Usage Count</label>
                      <Input
                        placeholder="Filter by usage count..."
                        value={userFilterUsageCount}
                        onChange={(e) => setUserFilterUsageCount(e.target.value)}
                        className="premium-button"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Days Since Opened</label>
                      <Input
                        placeholder="Filter by days..."
                        value={userFilterDays}
                        onChange={(e) => setUserFilterDays(e.target.value)}
                        className="premium-button"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Version</label>
                      <Input
                        placeholder="Filter by version..."
                        value={userFilterVersion}
                        onChange={(e) => setUserFilterVersion(e.target.value)}
                        className="premium-button"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed User Table */}
              <Card className="premium-card bg-gradient-to-br from-card to-secondary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Detailed License Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="font-semibold">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Username
                            </div>
                          </TableHead>
                          <TableHead 
                            className="font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleUserSort("usageCount")}
                          >
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Usage Count
                              {getUserSortIcon("usageCount")}
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold">
                            <div className="flex items-center gap-2">
                              <Server className="h-4 w-4" />
                              Hostname
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Start Time
                            </div>
                          </TableHead>
                          <TableHead 
                            className="font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleUserSort("daysSince")}
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Days Since Opened
                              {getUserSortIcon("daysSince")}
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Version
                            </div>
                          </TableHead>

                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredUserData(selectedFeature).map((user, index) => {
                          // Count how many licenses this user is using
                          const userUsageCount = getDetailedUserData(selectedFeature)
                            .filter(u => u.username === user.username && u.hostname === user.hostname)
                            .length;
                          
                          const isUsingMultipleLicenses = userUsageCount > 2;
                          
                          return (
                            <TableRow 
                              key={index} 
                              className={`hover:bg-muted/30 transition-all duration-200 cursor-pointer ${
                                isUsingMultipleLicenses ? 'bg-red-50 border-l-4 border-l-red-500' : ''
                              }`}
                              onClick={() => {
                                if (userUsageCount > 1) {
                                  setSelectedUserRow(user);
                                }
                              }}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-primary" />
                                  {user.username}
                                  {isUsingMultipleLicenses && (
                                    <Badge variant="destructive" className="text-xs">
                                      {userUsageCount} licenses
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={userUsageCount > 2 ? "destructive" : "secondary"}
                                  className="premium-badge font-medium"
                                >
                                  {userUsageCount}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Server className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{user.hostname}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">{user.startTime}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">{user.daysSince} days</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Package className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">{user.version}</span>
                                </div>
                              </TableCell>
                              
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Multiple License Details Modal */}
                  {selectedUserRow && (
                    <Dialog open={!!selectedUserRow} onOpenChange={() => setSelectedUserRow(null)}>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-destructive" />
                            Multiple License Details for {selectedUserRow.username}@{selectedUserRow.hostname}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Card className="premium-card bg-gradient-to-br from-card to-secondary/20">
                            <CardContent className="p-4">
                              <div className="rounded-lg border overflow-auto max-h-[60vh]">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/30">
                                      <TableHead className="font-semibold">Start Time</TableHead>
                                      <TableHead className="font-semibold">Days Since Opened</TableHead>
                                      <TableHead className="font-semibold">Version</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {getDetailedUserData(selectedFeature)
                                      .filter(u => u.username === selectedUserRow.username && u.hostname === selectedUserRow.hostname)
                                      .map((license, index) => (
                                        <TableRow key={index} className="hover:bg-muted/30">
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              <Calendar className="h-3 w-3 text-muted-foreground" />
                                              <span className="text-sm">{license.startTime}</span>
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              <Clock className="h-3 w-3 text-muted-foreground" />
                                              <span className="text-sm">{license.daysSince} days</span>
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              <Package className="h-3 w-3 text-muted-foreground" />
                                              <span className="text-sm">{license.version}</span>
                                            </div>
                                          </TableCell>
                                          
                                        </TableRow>
                                      ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};