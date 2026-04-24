import { useMemo, useState } from 'react';
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
import {
  ResponsiveModal,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from '@/components/ui/responsive-modal';
import { CheckCircle, XCircle, ChevronDown, Eye } from 'lucide-react';
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

interface UniqueAudit {
  groupKey: string; // unique key per email+success+ip+minute
  email: string;
  success: boolean;
  failure_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  latest_at: string;
  earliest_at: string;
  attempts: number;
  audit_ids: string[];
  all_attempts: LoginAudit[];
}

// Strict de-duplication: collapse all rows sharing email+success+ip into a single entry.
// Same identity = same row (attempt count + first/last timestamps shown).
function dedupeAudits(audits: LoginAudit[]): UniqueAudit[] {
  const map = new Map<string, UniqueAudit>();

  for (const a of audits) {
    const key = `${a.email.toLowerCase()}|${a.success}|${a.ip_address || 'unknown'}`;

    const existing = map.get(key);
    if (existing) {
      existing.attempts += 1;
      existing.audit_ids.push(a.id);
      existing.all_attempts.push(a);
      const ts = new Date(a.created_at).getTime();
      if (ts > new Date(existing.latest_at).getTime()) existing.latest_at = a.created_at;
      if (ts < new Date(existing.earliest_at).getTime()) existing.earliest_at = a.created_at;
      if (!existing.failure_reason && a.failure_reason) existing.failure_reason = a.failure_reason;
      if (!existing.user_agent && a.user_agent) existing.user_agent = a.user_agent;
    } else {
      map.set(key, {
        groupKey: key,
        email: a.email,
        success: a.success,
        failure_reason: a.failure_reason,
        ip_address: a.ip_address,
        user_agent: a.user_agent,
        latest_at: a.created_at,
        earliest_at: a.created_at,
        attempts: 1,
        audit_ids: [a.id],
        all_attempts: [a],
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.latest_at).getTime() - new Date(a.latest_at).getTime(),
  );
}

const AdminLoginAuditPage = () => {
  const { toast } = useToast();
  const [searchEmail, setSearchEmail] = useState('');
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [displayedItemsCount, setDisplayedItemsCount] = useState(50);
  const [detailGroup, setDetailGroup] = useState<UniqueAudit | null>(null);

  const { data: audits, isLoading, refetch } = useQuery({
    queryKey: ['login-audit', filter, searchEmail],
    queryFn: async () => {
      let query = supabase
        .from('login_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (filter === 'success') query = query.eq('success', true);
      else if (filter === 'failed') query = query.eq('success', false);
      if (searchEmail) query = query.ilike('email', `%${searchEmail}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data as LoginAudit[];
    },
  });

  const uniqueAudits = useMemo(() => dedupeAudits(audits || []), [audits]);

  const stats = {
    total: audits?.length || 0,
    unique: uniqueAudits.length,
    successful: uniqueAudits.filter((a) => a.success).length,
    failed: uniqueAudits.filter((a) => !a.success).length,
  };

  const displayedGroups = uniqueAudits.slice(0, displayedItemsCount);
  const hasMoreGroups = uniqueAudits.length > displayedItemsCount;

  const handleSelectGroup = (key: string) => {
    setSelectedGroups((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedGroups([]);
      setIsAllSelected(false);
    } else {
      setSelectedGroups(displayedGroups.map((g) => g.groupKey));
      setIsAllSelected(true);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const idsToDelete = displayedGroups
        .filter((g) => selectedGroups.includes(g.groupKey))
        .flatMap((g) => g.audit_ids);

      if (idsToDelete.length === 0) {
        setIsDeleteDialogOpen(false);
        return;
      }

      const { error } = await supabase.from('login_audit').delete().in('id', idsToDelete);
      if (error) throw error;

      toast({
        title: 'Success',
        description: `Deleted ${idsToDelete.length} audit log(s) across ${selectedGroups.length} unique entry(ies)`,
      });

      setSelectedGroups([]);
      setIsAllSelected(false);
      setIsDeleteDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleShowMore = () => setDisplayedItemsCount((p) => Math.min(p + 50, uniqueAudits.length));
  const handleShowAll = () => setDisplayedItemsCount(uniqueAudits.length);
  const handleShowLess = () => {
    setDisplayedItemsCount(50);
    setSelectedGroups([]);
    setIsAllSelected(false);
  };

  return (
    <AdminLayout>
      <QuickActionsBar title="Login Audit Log" onRefresh={() => refetch()} />

      {selectedGroups.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedGroups.length}
          totalCount={displayedGroups.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={() => {
            setSelectedGroups([]);
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

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Records</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Unique Entries</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.unique}</div></CardContent>
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
          <p className="text-xs text-muted-foreground mt-3">
            Duplicates (same email + status + IP) are collapsed into one row. Click an email to view all attempts.
          </p>
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
                    <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Failure Reason</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedGroups.map((group) => (
                  <TableRow key={group.groupKey}>
                    <TableCell>
                      <Checkbox
                        checked={selectedGroups.includes(group.groupKey)}
                        onCheckedChange={() => handleSelectGroup(group.groupKey)}
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setDetailGroup(group)}
                        className="font-medium text-primary hover:underline inline-flex items-center gap-1.5 text-left"
                      >
                        <Eye className="h-3.5 w-3.5 opacity-60" />
                        {group.email}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={group.success ? 'default' : 'destructive'}>
                        {group.success ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {group.success ? 'Success' : 'Failed'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {group.attempts > 1 ? (
                        <Badge variant="secondary">×{group.attempts}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">1</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {group.failure_reason || (group.success ? '—' : 'Unknown')}
                    </TableCell>
                    <TableCell>{group.ip_address || 'Unknown'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{format(new Date(group.latest_at), 'PPp')}</span>
                        {group.attempts > 1 && (
                          <span className="text-xs text-muted-foreground">
                            first: {format(new Date(group.earliest_at), 'p')}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && uniqueAudits.length > 50 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {Math.min(displayedItemsCount, uniqueAudits.length)} of {uniqueAudits.length} unique entries
              </p>
              <div className="flex gap-2">
                {hasMoreGroups && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleShowMore}>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show More (50)
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShowAll}>
                      Show All ({uniqueAudits.length})
                    </Button>
                  </>
                )}
                {displayedItemsCount > 50 && (
                  <Button variant="outline" size="sm" onClick={handleShowLess}>
                    Show Less
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <ResponsiveModal open={!!detailGroup} onOpenChange={(open) => !open && setDetailGroup(null)} className="max-w-2xl">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-2">
            {detailGroup?.success ? (
              <CheckCircle className="h-5 w-5 text-foreground" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            {detailGroup?.email}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            {detailGroup?.attempts} attempt(s) · {detailGroup?.success ? 'Successful' : 'Failed'}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        {detailGroup && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-xs">IP Address</p>
                <p className="font-medium break-all">{detailGroup.ip_address || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Failure Reason</p>
                <p className="font-medium">
                  {detailGroup.failure_reason || (detailGroup.success ? '—' : 'Unknown')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">First Attempt</p>
                <p className="font-medium">{format(new Date(detailGroup.earliest_at), 'PPpp')}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Last Attempt</p>
                <p className="font-medium">{format(new Date(detailGroup.latest_at), 'PPpp')}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground text-xs">User Agent</p>
                <p className="font-medium text-xs break-all">{detailGroup.user_agent || 'Unknown'}</p>
              </div>
            </div>

            {detailGroup.all_attempts.length > 1 && (
              <div>
                <p className="text-sm font-semibold mb-2">All Attempts ({detailGroup.all_attempts.length})</p>
                <div className="border rounded-md max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailGroup.all_attempts.map((a, i) => (
                        <TableRow key={a.id}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="text-xs">{format(new Date(a.created_at), 'PPpp')}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {a.failure_reason || (a.success ? '—' : 'Unknown')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        <ResponsiveModalFooter>
          <Button variant="outline" onClick={() => setDetailGroup(null)}>Close</Button>
        </ResponsiveModalFooter>
      </ResponsiveModal>

      <ResponsiveModal open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Delete Audit Logs</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Are you sure you want to delete {selectedGroups.length} unique entry(ies)? All underlying attempts will be removed. This action cannot be undone.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>
        <ResponsiveModalFooter>
          <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleBulkDelete}>Delete</Button>
        </ResponsiveModalFooter>
      </ResponsiveModal>
    </AdminLayout>
  );
};

export default AdminLoginAuditPage;
