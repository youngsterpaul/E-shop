import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, TrendingDown, UserPlus, UserCheck, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface CustomerMetrics {
  totalCustomers: number;
  newThisMonth: number;
  returningRate: number;
  avgOrderValue: number;
  topCounties: { county: string; count: number }[];
  growthRate: number;
}

export const CustomerInsightsCard = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['customer-insights-metrics'],
    queryFn: async () => {
      // Get total customers
      const { count: totalCustomers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get new customers this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: newThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // Get customers with multiple orders (returning customers)
      const { data: orderCounts } = await supabase
        .from('orders')
        .select('user_id')
        .not('user_id', 'is', null);

      const userOrderCounts: Record<string, number> = {};
      orderCounts?.forEach(o => {
        if (o.user_id) {
          userOrderCounts[o.user_id] = (userOrderCounts[o.user_id] || 0) + 1;
        }
      });
      
      const uniqueCustomers = Object.keys(userOrderCounts).length;
      const returningCustomers = Object.values(userOrderCounts).filter(c => c > 1).length;
      const returningRate = uniqueCustomers > 0 ? (returningCustomers / uniqueCustomers) * 100 : 0;

      // Get average order value
      const { data: orders } = await supabase
        .from('orders')
        .select('amount')
        .not('amount', 'is', null);
      
      const avgOrderValue = orders && orders.length > 0
        ? orders.reduce((sum, o) => sum + (o.amount || 0), 0) / orders.length
        : 0;

      // Get top counties
      const { data: profiles } = await supabase
        .from('profiles')
        .select('county')
        .not('county', 'is', null);

      const countyCounts: Record<string, number> = {};
      profiles?.forEach(p => {
        if (p.county) {
          countyCounts[p.county] = (countyCounts[p.county] || 0) + 1;
        }
      });

      const topCounties = Object.entries(countyCounts)
        .map(([county, count]) => ({ county, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate growth rate (compare this month to last month)
      const lastMonthStart = new Date(startOfMonth);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      
      const { count: lastMonthCustomers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonthStart.toISOString())
        .lt('created_at', startOfMonth.toISOString());

      const growthRate = lastMonthCustomers && lastMonthCustomers > 0
        ? ((((newThisMonth || 0) - lastMonthCustomers) / lastMonthCustomers) * 100)
        : 0;

      return {
        totalCustomers: totalCustomers || 0,
        newThisMonth: newThisMonth || 0,
        returningRate,
        avgOrderValue,
        topCounties,
        growthRate
      } as CustomerMetrics;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Customer Insights
        </CardTitle>
        <CardDescription>Overview of your customer base</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Customers */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Customers</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{metrics?.totalCustomers.toLocaleString()}</p>
          </div>

          {/* New This Month */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">New This Month</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-foreground">{metrics?.newThisMonth}</p>
              {metrics && metrics.growthRate !== 0 && (
                <Badge variant={metrics.growthRate > 0 ? "default" : "destructive"} className="text-xs">
                  {metrics.growthRate > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {Math.abs(metrics.growthRate).toFixed(1)}%
                </Badge>
              )}
            </div>
          </div>

          {/* Returning Rate */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Returning Rate</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{metrics?.returningRate.toFixed(1)}%</p>
          </div>

          {/* Avg Order Value */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Avg Order Value</span>
            </div>
            <p className="text-2xl font-bold text-foreground">KES {metrics?.avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        {/* Top Counties */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Top Customer Locations</h4>
          <div className="flex flex-wrap gap-2">
            {metrics?.topCounties.map((county, index) => (
              <Badge key={county.county} variant="outline" className="text-sm">
                {index + 1}. {county.county} ({county.count})
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
