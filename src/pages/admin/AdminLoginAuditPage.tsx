import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Globe, Monitor, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LoginAudit {
  id: string;
  user_id: string | null;
  email: string;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
  device_info: any;
  failure_reason: string | null;
  session_id: string | null;
  created_at: string;
}

const AdminLoginAuditPage = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');

  const { data: audits, isLoading } = useQuery({
    queryKey: ['login-audit', filter, dateRange, searchEmail],
    queryFn: async () => {
      let query = supabase
        .from('login_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'success') {
        query = query.eq('success', true);
      } else if (filter === 'failed') {
        query = query.eq('success', false);
      }

      if (dateRange !== 'all') {
        const hours = dateRange === '24h' ? 24 : dateRange === '7d' ? 168 : 720;
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', since);
      }

      if (searchEmail) {
        query = query.ilike('email', `%${searchEmail}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LoginAudit[];
    },
  });

  const stats = {
    total: audits?.length || 0,
    successful: audits?.filter(a => a.success).length || 0,
    failed: audits?.filter(a => !a.success).length || 0,
    uniqueIPs: new Set(audits?.map(a => a.ip_address).filter(Boolean)).size,
  };

  const getDeviceName = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  };

  const getBrowserName = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Login Audit Log</h1>
        <p className="text-muted-foreground">
          Track and monitor all authentication attempts
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(1) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Potential security threats
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueIPs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Different locations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Attempts</SelectItem>
                <SelectItem value="success">Successful</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Table */}
      <Card>
        <CardHeader>
          <CardTitle>Login Attempts</CardTitle>
          <CardDescription>
            Detailed log of all authentication attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading audit log...</div>
          ) : audits && audits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell>
                      {audit.success ? (
                        <Badge variant="default" className="gap-1 bg-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{audit.email}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {audit.ip_address || 'N/A'}
                    </TableCell>
                    <TableCell>{getDeviceName(audit.user_agent)}</TableCell>
                    <TableCell>{getBrowserName(audit.user_agent)}</TableCell>
                    <TableCell>{format(new Date(audit.created_at), 'PPp')}</TableCell>
                    <TableCell>
                      {audit.failure_reason && (
                        <span className="text-xs text-destructive">
                          {audit.failure_reason}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No login attempts found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginAuditPage;
