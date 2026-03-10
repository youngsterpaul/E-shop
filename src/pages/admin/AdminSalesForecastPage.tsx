import { useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const AdminSalesForecastPage = () => {
  const { data: dailySales, isLoading, refetch } = useQuery({
    queryKey: ['forecast-daily-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_sales')
        .select('*')
        .order('date', { ascending: true })
        .limit(90);
      if (error) throw error;
      return data || [];
    },
  });

  // Simple linear regression forecast
  const forecast = useMemo(() => {
    if (!dailySales || dailySales.length < 7) return null;

    const recent = dailySales.slice(-30);
    const n = recent.length;
    
    // Calculate trend using linear regression on revenue
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    recent.forEach((d, i) => {
      const y = d.total_revenue || 0;
      sumX += i;
      sumY += y;
      sumXY += i * y;
      sumX2 += i * i;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Average metrics
    const avgRevenue = sumY / n;
    const avgOrders = recent.reduce((s, d) => s + (d.total_orders || 0), 0) / n;
    const avgCustomers = recent.reduce((s, d) => s + (d.total_customers || 0), 0) / n;
    
    // Growth rate
    const firstHalf = recent.slice(0, Math.floor(n / 2));
    const secondHalf = recent.slice(Math.floor(n / 2));
    const firstAvg = firstHalf.reduce((s, d) => s + (d.total_revenue || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, d) => s + (d.total_revenue || 0), 0) / secondHalf.length;
    const growthRate = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    
    // Forecast next 7 days
    const forecastDays: { date: string; predicted_revenue: number; is_forecast: boolean }[] = [];
    const lastDate = new Date(recent[recent.length - 1].date);
    for (let i = 1; i <= 7; i++) {
      const date = new Date(lastDate);
      date.setDate(date.getDate() + i);
      const predicted = Math.max(0, intercept + slope * (n + i - 1));
      forecastDays.push({
        date: date.toISOString().split('T')[0],
        predicted_revenue: Math.round(predicted),
        is_forecast: true,
      });
    }
    
    // Projected monthly revenue
    const projectedMonthly = avgRevenue * 30;
    
    // Day-of-week patterns
    const dowRevenue: Record<number, number[]> = {};
    recent.forEach(d => {
      const dow = new Date(d.date).getDay();
      if (!dowRevenue[dow]) dowRevenue[dow] = [];
      dowRevenue[dow].push(d.total_revenue || 0);
    });
    const dowNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayPatterns = Object.entries(dowRevenue).map(([dow, revenues]) => ({
      day: dowNames[parseInt(dow)],
      avg_revenue: Math.round(revenues.reduce((s, r) => s + r, 0) / revenues.length),
    }));
    // Sort by day of week
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    dayPatterns.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
    
    // Best/worst day
    const bestDay = dayPatterns.reduce((best, d) => d.avg_revenue > best.avg_revenue ? d : best, dayPatterns[0]);
    const worstDay = dayPatterns.reduce((worst, d) => d.avg_revenue < worst.avg_revenue ? d : worst, dayPatterns[0]);

    // Chart data: actual + forecast
    const chartData: { date: string; actual_revenue: number | null; predicted_revenue: number | null }[] = [
      ...recent.map(d => ({
        date: d.date,
        actual_revenue: (d.total_revenue || 0) as number | null,
        predicted_revenue: null as number | null,
      })),
      ...forecastDays.map(d => ({
        date: d.date,
        actual_revenue: null as number | null,
        predicted_revenue: d.predicted_revenue as number | null,
      })),
    ];

    return {
      avgRevenue, avgOrders, avgCustomers, growthRate,
      projectedMonthly, forecastDays, dayPatterns, bestDay, worstDay,
      chartData, slope,
    };
  }, [dailySales]);

  const isGrowthPositive = (forecast?.growthRate || 0) >= 0;

  return (
    <AdminLayout>
      <QuickActionsBar title="Sales Forecast" onRefresh={() => refetch()} />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-80" />
        </div>
      ) : !forecast ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Need at least 7 days of sales data to generate forecasts.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Target className="h-4 w-4" />
                  <span>Avg Daily Revenue</span>
                </div>
                <p className="text-2xl font-bold">KSH {Math.round(forecast.avgRevenue).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Projected Monthly</span>
                </div>
                <p className="text-2xl font-bold">KSH {Math.round(forecast.projectedMonthly).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  {isGrowthPositive ? <TrendingUp className="h-4 w-4 text-primary" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                  <span>Growth Rate</span>
                </div>
                <p className={`text-2xl font-bold ${isGrowthPositive ? 'text-primary' : 'text-destructive'}`}>
                  {isGrowthPositive ? '+' : ''}{forecast.growthRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span>Best Day</span>
                </div>
                <p className="text-2xl font-bold">{forecast.bestDay?.day}</p>
                <p className="text-xs text-muted-foreground">KSH {forecast.bestDay?.avg_revenue.toLocaleString()} avg</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Forecast Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Forecast (7-Day)
              </CardTitle>
              <CardDescription>Actual revenue with predicted next 7 days based on trend analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={forecast.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `KSH ${value?.toLocaleString() || 0}`,
                      name === 'actual_revenue' ? 'Actual' : 'Predicted'
                    ]}
                    labelFormatter={(d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="actual_revenue"
                    name="Actual"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                    connectNulls={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted_revenue"
                    name="Predicted"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2) / 0.15)"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Day-of-Week Patterns */}
          <Card>
            <CardHeader>
              <CardTitle>Day-of-Week Revenue Patterns</CardTitle>
              <CardDescription>
                Average revenue by day of week — best day is <Badge variant="default">{forecast.bestDay?.day}</Badge>, slowest is <Badge variant="secondary">{forecast.worstDay?.day}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={forecast.dayPatterns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 13 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`KSH ${v.toLocaleString()}`, 'Avg Revenue']} />
                  <Bar dataKey="avg_revenue" name="Avg Revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trend Indicator */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className={`rounded-full p-3 ${isGrowthPositive ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                  {isGrowthPositive ? <ArrowUpRight className="h-6 w-6 text-primary" /> : <ArrowDownRight className="h-6 w-6 text-destructive" />}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {isGrowthPositive ? 'Upward Trend' : 'Downward Trend'}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {isGrowthPositive
                      ? `Revenue is trending upward with ${forecast.growthRate.toFixed(1)}% growth. Daily revenue is increasing by approximately KSH ${Math.abs(Math.round(forecast.slope)).toLocaleString()} per day.`
                      : `Revenue is trending downward with ${Math.abs(forecast.growthRate).toFixed(1)}% decline. Consider running promotions or flash sales to boost engagement.`
                    }
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="outline">Avg {Math.round(forecast.avgOrders)} orders/day</Badge>
                    <Badge variant="outline">Avg {Math.round(forecast.avgCustomers)} customers/day</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSalesForecastPage;
