import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, Info, XCircle, Loader2 } from "lucide-react";

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
}

export const StatusModal = ({ isOpen, onClose, type, title, message }: StatusModalProps) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-8 w-8 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-8 w-8 text-warning" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-destructive" />;
      case 'info':
        return <Info className="h-8 w-8 text-info" />;
      default:
        return <Info className="h-8 w-8 text-info" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-success/5 border-success/20';
      case 'warning':
        return 'bg-warning/5 border-warning/20';
      case 'error':
        return 'bg-destructive/5 border-destructive/20';
      case 'info':
        return 'bg-info/5 border-info/20';
      default:
        return 'bg-info/5 border-info/20';
    }
  };

  const getIconBackground = () => {
    switch (type) {
      case 'success':
        return 'bg-success/10';
      case 'warning':
        return 'bg-warning/10';
      case 'error':
        return 'bg-destructive/10';
      case 'info':
        return 'bg-info/10';
      default:
        return 'bg-info/10';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-lg premium-card ${getBackgroundColor()} backdrop-blur-sm`}>
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-4 text-xl font-semibold">
            <div className={`p-3 rounded-xl ${getIconBackground()}`}>
              {getIcon()}
            </div>
            <div className="flex-1">
              {title}
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <p className="text-base text-muted-foreground leading-relaxed">{message}</p>
        </div>
        
        {/* Loading animation for info type */}
        {type === 'info' && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground font-medium">Processing...</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
