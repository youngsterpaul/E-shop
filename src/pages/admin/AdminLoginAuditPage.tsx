import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { ExportButton } from '@/components/admin/ExportButton';
import { SuperadminOnly } from '@/components/admin/SuperadminOnly';
import { BulkActionsBar } from '@/components/admin/BulkActionsBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Monitor, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface LoginAudit {
  id: string;
  email: string;
  success: boolean;
  failure_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const AdminLoginAuditPage = () => {
  const { toast } = useToast();
  const [searchEmail, setSearchEmail] = useState('');
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [selectedAudits, setSelectedAudits] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [displayedItemsCount, setDisplayedItemsCount] = useState(50);

  const { data: audits, isLoading, refetch } = useQuery({
    queryKey: ['login-audit', filter, searchEmail],
    queryFn: async () => {
      let query = supabase.from('login_audit').select('*').order('created_at', { ascending: false }).limit(500);
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

  const displayedAudits = audits?.slice(0, displayedItemsCount) || [];
  const hasMoreAudits = (audits?.length || 0) > displayedItemsCount;

  const handleSelectAudit = (id: string) => {
    setSelectedAudits(prev =>
      prev.includes(id) ? prev.filter(auditId => auditId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedAudits([]);
      setIsAllSelected(false);
    } else {
      setSelectedAudits(displayedAudits.map(a => a.id));
      setIsAllSelected(true);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const { error } = await supabase
        .from('login_audit')
        .delete()
        .in('id', selectedAudits);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Deleted ${selectedAudits.length} audit log(s)`,
      });

      setSelectedAudits([]);
      setIsAllSelected(false);
      setIsDeleteDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleShowMore = () => {
    setDisplayedItemsCount(prev => Math.min(prev + 50, audits?.length || 0));
  };

  const handleShowAll = () => {
    setDisplayedItemsCount(audits?.length || 0);
  };

  const handleShowLess = () => {
    setDisplayedItemsCount(50);
    setSelectedAudits([]);
    setIsAllSelected(false);
  };

  return (
    <AdminLayout>
      <QuickActionsBar title="Login Audit Log" onRefresh={() => refetch()} />

      {selectedAudits.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedAudits.length}
          totalCount={displayedAudits.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={() => {
            setSelectedAudits([]);
            setIsAllSelected(false);
          }}
          onDelete={() => setIsDeleteDialogOpen(true)}
        />
      )}

      <SuperadminOnly>
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
      </SuperadminOnly>

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
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Failure Reason</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedAudits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedAudits.includes(audit.id)}
                        onCheckedChange={() => handleSelectAudit(audit.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{audit.email}</TableCell>
                    <TableCell>
                      <Badge variant={audit.success ? "default" : "destructive"}>
                        {audit.success ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {audit.success ? 'Success' : 'Failed'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {audit.failure_reason || (audit.success ? '—' : 'Unknown')}
                    </TableCell>
                    <TableCell>{audit.ip_address || 'Unknown'}</TableCell>
                    <TableCell>{format(new Date(audit.created_at), 'PPp')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination Controls */}
          {!isLoading && audits && audits.length > 50 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {displayedItemsCount} of {audits.length} audit logs
              </p>
              <div className="flex gap-2">
                {hasMoreAudits && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShowMore}
                    >
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show More (50)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShowAll}
                    >
                      Show All ({audits.length})
                    </Button>
                  </>
                )}
                {displayedItemsCount > 50 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShowLess}
                  >
                    Show Less
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Audit Logs</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedAudits.length} audit log(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminLoginAuditPage;
