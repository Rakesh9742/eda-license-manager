import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "lucide-react";
import { memo } from "react";

interface LicenseCardProps {
  title: string;
  total: number;
  used: number;
  status: "available" | "warning" | "critical";
  icon: React.ReactNode;
  onClick?: () => void;
  badge?: React.ReactNode;
  expiryDate?: string;
}

export const LicenseCard = memo(({ title, total, used, status, icon, onClick, badge, expiryDate }: LicenseCardProps) => {
  const percentage = (used / total) * 100;
  
  const getStatusColor = () => {
    switch (status) {
      case "available": return "success";
      case "warning": return "warning";
      case "critical": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "available": return "Available";
      case "warning": return "Low Stock";
      case "critical": return "Critical";
      default: return "Unknown";
    }
  };

  const getStatusGradient = () => {
    switch (status) {
      case "available": return "from-success/20 to-success/5";
      case "warning": return "from-warning/20 to-warning/5";
      case "critical": return "from-destructive/20 to-destructive/5";
      default: return "from-secondary/20 to-secondary/5";
    }
  };

  const getExpiryStatus = () => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', text: 'Expired', color: 'destructive' };
    if (daysUntilExpiry <= 30) return { status: 'warning', text: `${daysUntilExpiry} days`, color: 'warning' };
    return { status: 'valid', text: `${daysUntilExpiry} days`, color: 'success' };
  };

  const expiryStatus = getExpiryStatus();

  return (
    <Card 
      className={`premium-card relative overflow-hidden bg-gradient-to-br from-card to-secondary/20 hover:from-card hover:to-secondary/30 transition-all duration-500 ${onClick ? 'cursor-pointer group' : ''}`}
      onClick={onClick}
    >
      {/* Premium border effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${getStatusGradient()} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
      
      {/* Icon background glow */}
      <div className="absolute top-4 right-4 w-12 h-12 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors duration-300"></div>
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors duration-300">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2 relative z-10">
          {badge && badge}
          <div className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
            {used}/{total}
          </div>
          <Badge variant={getStatusColor() as any} className="premium-badge text-xs font-medium px-3 py-1">
            {getStatusText()}
          </Badge>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Usage</span>
            <span className="font-bold">{percentage.toFixed(1)}%</span>
          </div>
          <div className="relative">
            <Progress 
              value={percentage} 
              className="premium-progress h-3"
              style={{
                background: `hsl(var(--muted))`,
              }}
            />
            {/* Progress bar glow effect */}
            <div className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${
              status === 'critical' ? 'bg-destructive' : 
              status === 'warning' ? 'bg-warning' : 'bg-success'
            }`}></div>
          </div>
        </div>
        
        {/* Available licenses info */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Available</span>
            <span className="font-semibold text-foreground">{total - used} licenses</span>
          </div>
        </div>

        {/* Expiry information */}
        {expiryDate && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Expiry</span>
              </div>
              <div className="flex items-center gap-2">
                {expiryStatus && (
                  <Badge 
                    variant={expiryStatus.color as any} 
                    className={`text-xs font-bold ${
                      expiryStatus.color === 'success' 
                        ? 'text-black bg-white border shadow-sm' 
                        : 'premium-badge'
                    }`}
                  >
                    {expiryStatus.text}
                  </Badge>
                )}
                <span className="font-bold text-black text-xs bg-white px-2 py-1 rounded shadow-sm border">
                  {new Date(expiryDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
    </Card>
  );
});