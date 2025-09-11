import { lazy, Suspense, ComponentType, ReactElement } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface LazyLoadingWrapperProps {
  importFunc: () => Promise<{ default: ComponentType<any> }>;
  fallback?: ReactElement;
  [key: string]: any;
}

export const LazyLoadingWrapper = ({ 
  importFunc, 
  fallback = <LoadingSpinner />, 
  ...props 
}: LazyLoadingWrapperProps) => {
  const LazyComponent = lazy(importFunc);
  
  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};