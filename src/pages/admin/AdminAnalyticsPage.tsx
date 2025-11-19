import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface RFMSegment {
  segment: string;
  customers: number;
  avgLifetimeValue: number;
  color: string;
}

export default function AdminAnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      // Fetch all customers and their orders
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, created_at');

      const { data: orders } = await supabase
        .from('orders')
        .select('order_id, user_id, amount, created_at, status')
        .order('created_at', { ascending: true });

      if (!profiles || !orders) return null;

      // Calculate RFM scores
      const now = new Date();
      const customerMetrics = profiles.map(profile => {
        const customerOrders = orders.filter(o => o.user_id === profile.user_id);
        
        if (customerOrders.length === 0 || !profile.created_at) {
          return null;
        }

        const lastOrderDate = new Date(customerOrders[customerOrders.length - 1].created_at);
        const recency = Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
        const frequency = customerOrders.length;
        const monetary = customerOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

        return {
          user_id: profile.user_id,
          email: profile.email,
          recency,
          frequency,
          monetary,
          lastOrderDate,
          firstOrderDate: new Date(customerOrders[0].created_at),
        };
      }).filter((c): c is NonNullable<typeof c> => c !== null);

      // Calculate RFM scores (1-5 scale)
      const recencyValues = customerMetrics.map(c => c.recency);
      const frequencyValues = customerMetrics.map(c => c.frequency);
      const monetaryValues = customerMetrics.map(c => c.monetary);

      const getPercentileScore = (value: number, values: number[], reverse = false) => {
        const sorted = [...values].sort((a, b) => a - b);
        const index = sorted.findIndex(v => v >= value);
        const percentile = (index / sorted.length) * 100;
        const score = Math.ceil(percentile / 20);
        return reverse ? 6 - Math.max(1, Math.min(5, score)) : Math.max(1, Math.min(5, score));
      };

      const rfmData = customerMetrics.map(c => ({
        ...c,
        R: getPercentileScore(c.recency, recencyValues, true), // Lower recency is better
        F: getPercentileScore(c.frequency, frequencyValues),
        M: getPercentileScore(c.monetary, monetaryValues),
      }));

      // Segment customers
      const segments: RFMSegment[] = [
        { segment: 'Champions', customers: 0, avgLifetimeValue: 0, color: '#10b981' },
        { segment: 'Loyal Customers', customers: 0, avgLifetimeValue: 0, color: '#3b82f6' },
        { segment: 'Potential Loyalists', customers: 0, avgLifetimeValue: 0, color: '#8b5cf6' },
        { segment: 'At Risk', customers: 0, avgLifetimeValue: 0, color: '#f59e0b' },
        { segment: 'Lost', customers: 0, avgLifetimeValue: 0, color: '#ef4444' },
      ];

      rfmData.forEach(customer => {
        const rfmScore = customer.R + customer.F + customer.M;
        let segmentIndex = 4; // Default to Lost

        if (customer.R >= 4 && customer.F >= 4 && customer.M >= 4) {
          segmentIndex = 0; // Champions
        } else if (customer.R >= 3 && customer.F >= 3 && customer.M >= 3) {
          segmentIndex = 1; // Loyal
        } else if (customer.R >= 3 && customer.F >= 2) {
          segmentIndex = 2; // Potential Loyalists
        } else if (customer.R <= 2 && customer.F >= 3) {
          segmentIndex = 3; // At Risk
        }

        segments[segmentIndex].customers++;
        segments[segmentIndex].avgLifetimeValue += customer.monetary;
      });

      segments.forEach(seg => {
        if (seg.customers > 0) {
          seg.avgLifetimeValue = seg.avgLifetimeValue / seg.customers;
        }
      });

      // Calculate monthly CLV trends
      const monthlyData: Record<string, { month: string; totalRevenue: number; customers: Set<string> }> = {};
      orders.forEach(order => {
        if (!order.user_id) return;
        const month = new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { month, totalRevenue: 0, customers: new Set() };
        }
        monthlyData[month].totalRevenue += Number(order.amount) || 0;
        monthlyData[month].customers.add(order.user_id);
      });

      const clvTrends = Object.values(monthlyData).map(d => ({
        month: d.month,
        avgCLV: d.customers.size > 0 ? d.totalRevenue / d.customers.size : 0,
        totalRevenue: d.totalRevenue,
        customers: d.customers.size,
      }));

      // Cohort analysis
      const cohorts: Record<string, { month: string; customers: number; retained: number[] }> = {};
      profiles.forEach(profile => {
        if (!profile.created_at) return;
        const cohortMonth = new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!cohorts[cohortMonth]) {
          cohorts[cohortMonth] = { month: cohortMonth, customers: 0, retained: [] };
        }
        cohorts[cohortMonth].customers++;
      });

      const cohortData = Object.values(cohorts).slice(-6).map(cohort => {
        const cohortCustomers = profiles.filter(p => {
          if (!p.created_at) return false;
          const pMonth = new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          return pMonth === cohort.month;
        });

        // Calculate retention for next 3 months
        const retentionRates = [100]; // Month 0 is always 100%
        for (let i = 1; i <= 3; i++) {
          const firstCustomer = cohortCustomers[0];
          if (!firstCustomer?.created_at) continue;
          
          const futureDate = new Date(firstCustomer.created_at);
          futureDate.setMonth(futureDate.getMonth() + i);
          
          const retained = cohortCustomers.filter(c => {
            const userOrders = orders.filter(o => o.user_id === c.user_id);
            return userOrders.some(o => {
              const orderDate = new Date(o.created_at);
              return orderDate >= futureDate && orderDate < new Date(futureDate.getTime() + 30 * 24 * 60 * 60 * 1000);
            });
          }).length;

          retentionRates.push(cohort.customers > 0 ? (retained / cohort.customers) * 100 : 0);
        }

        return {
          cohort: cohort.month,
          month0: retentionRates[0],
          month1: retentionRates[1],
          month2: retentionRates[2],
          month3: retentionRates[3],
        };
      });

      // Overall retention rate
      const customersWithMultipleOrders = customerMetrics.filter(c => c.frequency > 1).length;
      const overallRetentionRate = customerMetrics.length > 0 
        ? (customersWithMultipleOrders / customerMetrics.length) * 100 
        : 0;

      return {
        segments,
        clvTrends,
        cohortData,
        overallRetentionRate,
        totalCustomers: customerMetrics.length,
        averageCLV: customerMetrics.reduce((sum, c) => sum + c.monetary, 0) / customerMetrics.length,
      };
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Analytics</h1>
          <p className="text-muted-foreground mt-1">Advanced insights into customer behavior and value</p>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalCustomers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average CLV</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analytics?.averageCLV || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.overallRetentionRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Segments</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.segments.filter(s => s.customers > 0).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="clv" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clv">CLV Trends</TabsTrigger>
            <TabsTrigger value="rfm">RFM Segmentation</TabsTrigger>
            <TabsTrigger value="cohort">Cohort Analysis</TabsTrigger>
            <TabsTrigger value="retention">Retention</TabsTrigger>
          </TabsList>

          <TabsContent value="clv" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Lifetime Value Trends</CardTitle>
                <CardDescription>Average CLV and revenue per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={analytics?.clvTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="avgCLV"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.6}
                      name="Avg CLV"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="totalRevenue"
                      stroke="hsl(var(--chart-2))"
                      fill="hsl(var(--chart-2))"
                      fillOpacity={0.6}
                      name="Total Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rfm" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>RFM Customer Segments</CardTitle>
                  <CardDescription>Customer distribution by behavior</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics?.segments.filter(s => s.customers > 0) || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.segment}: ${entry.customers}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="customers"
                      >
                        {analytics?.segments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Segment Value</CardTitle>
                  <CardDescription>Average lifetime value by segment</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics?.segments.filter(s => s.customers > 0) || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="segment" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                      <Bar dataKey="avgLifetimeValue" name="Avg CLV">
                        {analytics?.segments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Segment Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.segments.filter(s => s.customers > 0).map((segment) => (
                    <div key={segment.segment} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        <div>
                          <h4 className="font-medium">{segment.segment}</h4>
                          <p className="text-sm text-muted-foreground">
                            {segment.customers} customers
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(segment.avgLifetimeValue)}</p>
                        <p className="text-sm text-muted-foreground">Avg CLV</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cohort" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cohort Analysis</CardTitle>
                <CardDescription>Customer retention by signup cohort</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={analytics?.cohortData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cohort" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value: any) => `${Number(value).toFixed(1)}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="month0" stroke="#10b981" name="Month 0" />
                    <Line type="monotone" dataKey="month1" stroke="#3b82f6" name="Month 1" />
                    <Line type="monotone" dataKey="month2" stroke="#8b5cf6" name="Month 2" />
                    <Line type="monotone" dataKey="month3" stroke="#f59e0b" name="Month 3" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retention" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Retention Overview</CardTitle>
                <CardDescription>Percentage of customers making repeat purchases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-primary">
                      {analytics?.overallRetentionRate.toFixed(1)}%
                    </div>
                    <p className="text-muted-foreground mt-2">Overall Retention Rate</p>
                    <p className="text-sm text-muted-foreground mt-4">
                      Based on customers with multiple orders
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
