import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ArrowDown, TrendingUp } from 'lucide-react';

interface FunnelStage {
  stage: string;
  value: number;
  percentage: number;
  color: string;
}

interface ConversionFunnelProps {
  data: FunnelStage[] | undefined;
  isLoading: boolean;
}

export const ConversionFunnel = ({ data, isLoading }: ConversionFunnelProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...(data?.map(d => d.value) || [1]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Conversion Funnel
        </CardTitle>
        <CardDescription>Last 30 days customer journey</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data?.map((stage, index) => {
            const width = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
            const dropOff = index > 0 && data[index - 1].value > 0
              ? ((data[index - 1].value - stage.value) / data[index - 1].value) * 100
              : 0;

            return (
              <div key={stage.stage} className="relative">
                {/* Drop-off indicator */}
                {index > 0 && dropOff > 0 && (
                  <div className="flex items-center justify-center gap-1 py-1 text-xs text-muted-foreground">
                    <ArrowDown className="h-3 w-3" />
                    <span className="text-destructive font-medium">
                      -{dropOff.toFixed(1)}% drop-off
                    </span>
                  </div>
                )}
                
                {/* Funnel bar */}
                <div className="relative">
                  <div 
                    className="h-14 rounded-lg transition-all duration-500 flex items-center justify-between px-4"
                    style={{ 
                      width: `${Math.max(width, 20)}%`,
                      backgroundColor: `${stage.color}20`,
                      borderLeft: `4px solid ${stage.color}`,
                      marginLeft: `${(100 - Math.max(width, 20)) / 2}%`
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground text-sm">
                        {stage.stage}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {stage.percentage.toFixed(1)}% conversion
                      </span>
                    </div>
                    <span 
                      className="font-bold text-lg"
                      style={{ color: stage.color }}
                    >
                      {stage.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {data && data.length >= 4 && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">
                  {data[0].value > 0 
                    ? ((data[3].value / data[0].value) * 100).toFixed(1)
                    : '0'}%
                </p>
                <p className="text-xs text-muted-foreground">Overall Conversion</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-destructive">
                  {data[0].value > 0 
                    ? ((data[0].value - data[3].value) / data[0].value * 100).toFixed(1)
                    : '0'}%
                </p>
                <p className="text-xs text-muted-foreground">Cart Abandonment</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};