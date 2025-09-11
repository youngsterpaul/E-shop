
import { lazy, Suspense, ComponentType } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface LazyComponentProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const LazyWrapper = ({ fallback, children }: LazyComponentProps) => {
  const defaultFallback = (
    <LoadingSpinner 
      variant="spinner" 
      size="md" 
      text="Loading component..." 
    />
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

export const createLazyComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(importFunc);
  
  return (props: React.ComponentProps<T>) => (
    <LazyWrapper fallback={fallback}>
      <LazyComponent {...props} />
    </LazyWrapper>
  );
};

export default LazyWrapper;
