
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'skeleton';
  className?: string;
}

const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'spinner',
  className = '' 
}: LoadingSpinnerProps) => {
  if (variant === 'skeleton') {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-8 w-8', 
      lg: 'h-12 w-12'
    };
    
    return <Skeleton className={`${sizeClasses[size]} ${className}`} />;
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
};

export default LoadingSpinner;
