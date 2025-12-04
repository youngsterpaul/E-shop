import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: 'default' | 'compact';
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = 'default'
}: EmptyStateProps) => {
  const isCompact = variant === 'compact';
  
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isCompact ? "py-8 px-4" : "py-16 px-6",
        className
      )}
    >
      <div 
        className={cn(
          "rounded-full bg-muted flex items-center justify-center mb-4",
          isCompact ? "w-12 h-12" : "w-16 h-16"
        )}
      >
        <Icon className={cn("text-muted-foreground", isCompact ? "w-6 h-6" : "w-8 h-8")} />
      </div>
      
      <h3 className={cn(
        "font-semibold text-foreground mb-2",
        isCompact ? "text-base" : "text-lg"
      )}>
        {title}
      </h3>
      
      <p className={cn(
        "text-muted-foreground max-w-sm",
        isCompact ? "text-sm mb-3" : "text-sm mb-4"
      )}>
        {description}
      </p>
      
      {action && (
        <Button
          onClick={action.onClick}
          size={isCompact ? "sm" : "default"}
          className="mt-2"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
