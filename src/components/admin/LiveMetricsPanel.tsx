import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Zap,
  Pause,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveMetrics {
  todayRevenue: number;
  todayOrders: number;
  avgOrderValue: number;
  conversionRate: number;
  pendingOrders: number;
  processingOrders: number;
}

interface WeeklyComparison {
  thisWeekRevenue: number;
  lastWeekRevenue: number;
  revenueChange: number;
  thisWeekOrders: number;
  lastWeekOrders: number;
  ordersChange: number;
}

interface LiveMetricsPanelProps {
  liveMetrics: LiveMetrics | undefined;
  weeklyComparison: WeeklyComparison | undefined;
  isLoading: boolean;
  isLive: boolean;
  onToggleLive: () => void;
}

export const LiveMetricsPanel = ({
  liveMetrics,
  weeklyComparison,
  isLoading,
  isLive,
  onToggleLive
}: LiveMetricsPanelProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: "Today's Revenue",
      value: `KSH ${liveMetrics?.todayRevenue?.toLocaleString() || '0'}`,
      change: weeklyComparison?.revenueChange,
      icon: DollarSign,
      color: 'text-primary'
    },
    {
      title: "Today's Orders",
      value: liveMetrics?.todayOrders?.toString() || '0',
      change: weeklyComparison?.ordersChange,
      icon: ShoppingCart,
      color: 'text-blue-500'
    },
    {
      title: 'Avg Order Value',
      value: `KSH ${liveMetrics?.avgOrderValue?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}`,
      icon: TrendingUp,
      color: 'text-purple-500'
    },
    {
      title: 'Conversion Rate',
      value: `${liveMetrics?.conversionRate?.toFixed(1) || '0'}%`,
      icon: Zap,
      color: 'text-amber-500'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Live indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge 
            variant={isLive ? "default" : "secondary"}
            className={cn(
              "gap-1.5",
              isLive && "bg-green-500 hover:bg-green-600"
            )}
          >
            <span className={cn(
              "w-2 h-2 rounded-full",
              isLive ? "bg-white animate-pulse" : "bg-muted-foreground"
            )} />
            {isLive ? 'Live' : 'Paused'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {isLive ? 'Auto-refreshing every 30s' : 'Updates paused'}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleLive}
          className="gap-2"
        >
          {isLive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isLive ? 'Pause' : 'Resume'}
        </Button>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className={cn("h-4 w-4", metric.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  {metric.change >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={cn(
                    "text-xs font-medium",
                    metric.change >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}% vs last week
                  </span>
                </div>
              )}
            </CardContent>
            {/* Subtle gradient overlay */}
            <div 
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                background: `linear-gradient(135deg, transparent 0%, currentColor 100%)`
              }}
            />
          </Card>
        ))}
      </div>

      {/* Pending orders alert */}
      {(liveMetrics?.pendingOrders || 0) > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">
                  {liveMetrics?.pendingOrders} pending order{liveMetrics?.pendingOrders !== 1 ? 's' : ''} awaiting payment
                </span>
              </div>
              {(liveMetrics?.processingOrders || 0) > 0 && (
                <Badge variant="secondary">
                  {liveMetrics?.processingOrders} processing
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};