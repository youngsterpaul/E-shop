import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { ExportButton } from '@/components/admin/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Monitor } from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LoginAudit {
  id: string;
  email: string;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const AdminLoginAuditPage = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  const { data: audits, isLoading } = useQuery({
    queryKey: ['login-audit', filter, searchEmail],
    queryFn: async () => {
      let query = supabase.from('login_audit').select('*').order('created_at', { ascending: false }).limit(100);
      if (filter === 'success') query = query.eq('success', true);
      else if (filter === 'failed') query = query.eq('success', false);
      if (searchEmail) query = query.ilike('email', `%${searchEmail}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data as LoginAudit[];
    },
  });

  const stats = {
    total: audits?.length || 0,
    successful: audits?.filter(a => a.success).length || 0,
    failed: audits?.filter(a => !a.success).length || 0,
  };

  return (
    <AdminLayout>
      <QuickActionsBar title="Login Audit Log" />

      <div className="flex justify-end mb-4">
        <ExportButton
          data={audits || []}
          filename="login-audit"
          headers={[
            { key: 'email', label: 'Email' },
            { key: 'success', label: 'Success' },
            { key: 'ip_address', label: 'IP Address' },
            { key: 'created_at', label: 'Date' },
          ]}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Attempts</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Successful</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{stats.successful}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Failed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{stats.failed}</div></CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Input
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Attempts</SelectItem>
                <SelectItem value="success">Successful</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          {isLoading ? <div className="text-center py-8">Loading...</div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits?.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium">{audit.email}</TableCell>
                    <TableCell>
                      <Badge variant={audit.success ? "default" : "destructive"}>
                        {audit.success ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {audit.success ? 'Success' : 'Failed'}
                      </Badge>
                    </TableCell>
                    <TableCell>{audit.ip_address || 'Unknown'}</TableCell>
                    <TableCell>{format(new Date(audit.created_at), 'PPp')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminLoginAuditPage;
