import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface AdminTableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showFilters?: boolean;
}

export const AdminTableSkeleton = ({ 
  rows = 5, 
  columns = 6,
  showHeader = true,
  showFilters = true 
}: AdminTableSkeletonProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        {showFilters && (
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-full sm:w-[180px]" />
          </div>
        )}
        
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            {showHeader && (
              <div className="border-b bg-muted/50 p-4">
                <div className="flex gap-4">
                  {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                  ))}
                </div>
              </div>
            )}
            
            <div className="divide-y">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="flex gap-4 items-center">
                    {Array.from({ length: columns }).map((_, j) => (
                      <Skeleton 
                        key={j} 
                        className={`h-4 ${j === 0 ? 'w-8' : 'flex-1'}`} 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const AdminDashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Live Metrics Panel Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Large Chart Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>

      {/* Bottom Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full rounded-full mx-auto" style={{ maxWidth: '240px' }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const AdminStatsCardsSkeleton = ({ count = 4 }: { count?: number }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
