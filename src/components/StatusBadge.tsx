import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: 'Active' | 'Delinquent' | 'Paid Off' | 'In Review' | 'Action Required' | 'Updated' | 'No Change' | 'Error';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'Active':
      case 'Updated':
        return 'bg-success-light text-success border-success/20';
      case 'Delinquent':
      case 'Action Required':
        return 'bg-warning-light text-warning border-warning/20';
      case 'Error':
        return 'bg-destructive-light text-destructive border-destructive/20';
      case 'Paid Off':
        return 'bg-secondary text-muted-foreground border-muted-foreground/20';
      case 'In Review':
      case 'No Change':
        return 'bg-accent/10 text-accent border-accent/20';
      default:
        return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        getStatusStyles(),
        className
      )}
    >
      {status}
    </span>
  );
}
