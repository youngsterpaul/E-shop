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
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  Eye,
  ShieldAlert,
  Globe,
  Activity,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
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

interface IpBreakdown {
  ip: string;
  attempts: number;
  successes: number;
  failures: number;
  last_at: string;
}

interface EmailGroup {
  email: string;
  total_attempts: number;
  successes: number;
  failures: number;
  unique_ips: number;
  latest_at: string;
  earliest_at: string;
  last_status: 'success' | 'failed';
  last_failure_reason: string | null;
  last_ip: string | null;
  last_user_agent: string | null;
  ip_breakdown: IpBreakdown[];
  failure_reasons: Record<string, number>;
  audit_ids: string[];
  all_attempts: LoginAudit[];
  suspicious: boolean;
}

// Group strictly by email — one row per unique address.
function groupByEmail(audits: LoginAudit[]): EmailGroup[] {
  const map = new Map<string, EmailGroup>();

  // Sort newest-first so "last_*" is correct.
  const sorted = [...audits].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  for (const a of sorted) {
    const key = a.email.toLowerCase();
    let g = map.get(key);
    if (!g) {
      g = {
        email: a.email,
        total_attempts: 0,
        successes: 0,
        failures: 0,
        unique_ips: 0,
        latest_at: a.created_at,
        earliest_at: a.created_at,
        last_status: a.success ? 'success' : 'failed',
        last_failure_reason: a.failure_reason,
        last_ip: a.ip_address,
        last_user_agent: a.user_agent,
        ip_breakdown: [],
        failure_reasons: {},
        audit_ids: [],
        all_attempts: [],
        suspicious: false,
      };
      map.set(key, g);
    }

    g.total_attempts += 1;
    if (a.success) g.successes += 1;
    else g.failures += 1;
    g.audit_ids.push(a.id);
    g.all_attempts.push(a);

    const ts = new Date(a.created_at).getTime();
    if (ts > new Date(g.latest_at).getTime()) g.latest_at = a.created_at;
    if (ts < new Date(g.earliest_at).getTime()) g.earliest_at = a.created_at;

    if (!a.success && a.failure_reason) {
      g.failure_reasons[a.failure_reason] =
        (g.failure_reasons[a.failure_reason] || 0) + 1;
    }
  }

  // Build ip breakdown + suspicious flag.
  for (const g of map.values()) {
    const ipMap = new Map<string, IpBreakdown>();
    for (const a of g.all_attempts) {
      const ip = a.ip_address || 'Unknown';
      let b = ipMap.get(ip);
      if (!b) {
        b = { ip, attempts: 0, successes: 0, failures: 0, last_at: a.created_at };
        ipMap.set(ip, b);
      }
      b.attempts += 1;
      if (a.success) b.successes += 1;
      else b.failures += 1;
      if (new Date(a.created_at).getTime() > new Date(b.last_at).getTime()) {
        b.last_at = a.created_at;
      }
    }
    g.ip_breakdown = Array.from(ipMap.values()).sort(
      (a, b) => b.attempts - a.attempts,
    );
    g.unique_ips = g.ip_breakdown.filter((b) => b.ip !== 'Unknown').length;

    // Heuristic: many failures, or failures from multiple IPs, or burst across many IPs.
    g.suspicious =
      g.failures >= 5 ||
      g.ip_breakdown.filter((b) => b.failures > 0).length >= 3 ||
      g.unique_ips >= 5;
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.latest_at).getTime() - new Date(a.latest_at).getTime(),
  );
}

const AdminLoginAuditPage = () => {
  const { toast } = useToast();
  const [searchEmail, setSearchEmail] = useState('');
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'suspicious'>(
    'all',
  );
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [displayedItemsCount, setDisplayedItemsCount] = useState(50);
  const [detailGroup, setDetailGroup] = useState<EmailGroup | null>(null);

  const { data: audits, isLoading, refetch } = useQuery({
    queryKey: ['login-audit', searchEmail],
    queryFn: async () => {
      let query = supabase
        .from('login_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000);
      if (searchEmail) query = query.ilike('email', `%${searchEmail}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data as LoginAudit[];
    },
  });

  const allGroups = useMemo(() => groupByEmail(audits || []), [audits]);

  const filteredGroups = useMemo(() => {
    if (filter === 'all') return allGroups;
    if (filter === 'success') return allGroups.filter((g) => g.successes > 0);
    if (filter === 'failed') return allGroups.filter((g) => g.failures > 0);
    if (filter === 'suspicious') return allGroups.filter((g) => g.suspicious);
    return allGroups;
  }, [allGroups, filter]);

  const stats = {
    total: audits?.length || 0,
    uniqueUsers: allGroups.length,
    successUsers: allGroups.filter((g) => g.successes > 0).length,
    suspicious: allGroups.filter((g) => g.suspicious).length,
  };

  const displayedGroups = filteredGroups.slice(0, displayedItemsCount);
  const hasMoreGroups = filteredGroups.length > displayedItemsCount;

  const handleSelectGroup = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEmails([]);
      setIsAllSelected(false);
    } else {
      setSelectedEmails(displayedGroups.map((g) => g.email));
      setIsAllSelected(true);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const idsToDelete = displayedGroups
        .filter((g) => selectedEmails.includes(g.email))
        .flatMap((g) => g.audit_ids);

      if (idsToDelete.length === 0) {
        setIsDeleteDialogOpen(false);
        return;
      }

      const { error } = await supabase
        .from('login_audit')
        .delete()
        .in('id', idsToDelete);
      if (error) throw error;

      toast({
        title: 'Deleted',
        description: `Removed ${idsToDelete.length} audit log(s) across ${selectedEmails.length} user(s)`,
      });

      setSelectedEmails([]);
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

  const handleShowMore = () =>
    setDisplayedItemsCount((p) => Math.min(p + 50, filteredGroups.length));
  const handleShowAll = () => setDisplayedItemsCount(filteredGroups.length);
  const handleShowLess = () => {
    setDisplayedItemsCount(50);
    setSelectedEmails([]);
    setIsAllSelected(false);
  };

  return (
    <AdminLayout>
      <QuickActionsBar title="Login Audit Log" onRefresh={() => refetch()} />

      {selectedEmails.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedEmails.length}
          totalCount={displayedGroups.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={() => {
            setSelectedEmails([]);
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
              { key: 'failure_reason', label: 'Failure Reason' },
              { key: 'created_at', label: 'Date' },
            ]}
          />
        </div>
      </SuperadminOnly>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              With Successful Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.successUsers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
              Suspicious
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.suspicious}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="success">With Successes</SelectItem>
                <SelectItem value="failed">With Failures</SelectItem>
                <SelectItem value="suspicious">Suspicious only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Each email appears once. Click a row to see all login attempts, IP
            history and failure reasons. Suspicious = repeated failures, multiple
            failing IPs, or activity from many distinct IPs.
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
            <div className="overflow-x-auto">
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
                    <TableHead>Activity</TableHead>
                    <TableHead>IPs</TableHead>
                    <TableHead>Last Attempt</TableHead>
                    <TableHead>Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedGroups.map((group) => (
                    <TableRow
                      key={group.email}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setDetailGroup(group)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedEmails.includes(group.email)}
                          onCheckedChange={() => handleSelectGroup(group.email)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {group.suspicious && (
                            <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
                          )}
                          <button
                            type="button"
                            className="font-medium text-primary hover:underline inline-flex items-center gap-1.5 text-left"
                          >
                            <Eye className="h-3.5 w-3.5 opacity-60" />
                            <span className="truncate max-w-[220px]">
                              {group.email}
                            </span>
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {group.successes > 0 && (
                            <Badge
                              variant="default"
                              className="bg-green-600 hover:bg-green-600"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {group.successes}
                            </Badge>
                          )}
                          {group.failures > 0 && (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              {group.failures}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="font-normal">
                            <Activity className="h-3 w-3 mr-1" />
                            {group.total_attempts}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          <Globe className="h-3 w-3 mr-1" />
                          {group.unique_ips || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            group.last_status === 'success'
                              ? 'default'
                              : 'destructive'
                          }
                          className={
                            group.last_status === 'success'
                              ? 'bg-green-600 hover:bg-green-600'
                              : ''
                          }
                        >
                          {group.last_status === 'success' ? 'Success' : 'Failed'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {formatDistanceToNow(new Date(group.latest_at), {
                              addSuffix: true,
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(group.latest_at), 'PPp')}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {displayedGroups.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        No login activity found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {!isLoading && filteredGroups.length > 50 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {Math.min(displayedItemsCount, filteredGroups.length)} of{' '}
                {filteredGroups.length} users
              </p>
              <div className="flex flex-wrap gap-2 justify-end">
                {hasMoreGroups && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleShowMore}>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show More
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShowAll}>
                      Show All ({filteredGroups.length})
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
      <ResponsiveModal
        open={!!detailGroup}
        onOpenChange={(open) => !open && setDetailGroup(null)}
        className="max-w-3xl"
      >
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-2 break-all">
            {detailGroup?.suspicious ? (
              <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
            ) : detailGroup?.last_status === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
            )}
            <span className="truncate">{detailGroup?.email}</span>
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            {detailGroup?.total_attempts} total attempt(s) ·{' '}
            {detailGroup?.successes} success · {detailGroup?.failures} failed ·{' '}
            {detailGroup?.unique_ips} unique IP(s)
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        {detailGroup && (
          <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
            {detailGroup.suspicious && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <ShieldAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-destructive">
                    Suspicious activity detected
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Multiple failed attempts and/or activity across many IPs. Review
                    the breakdown below before taking action.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground text-xs">Total</p>
                <p className="text-lg font-semibold">{detailGroup.total_attempts}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground text-xs">Success</p>
                <p className="text-lg font-semibold text-green-600">
                  {detailGroup.successes}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground text-xs">Failed</p>
                <p className="text-lg font-semibold text-destructive">
                  {detailGroup.failures}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground text-xs">Unique IPs</p>
                <p className="text-lg font-semibold">{detailGroup.unique_ips}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">First Seen</p>
                <p className="font-medium">
                  {format(new Date(detailGroup.earliest_at), 'PPpp')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Last Seen</p>
                <p className="font-medium">
                  {format(new Date(detailGroup.latest_at), 'PPpp')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Last IP</p>
                <p className="font-medium break-all">
                  {detailGroup.last_ip || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Last Status</p>
                <p className="font-medium capitalize">{detailGroup.last_status}</p>
              </div>
              {detailGroup.last_user_agent && (
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground text-xs">Last User Agent</p>
                  <p className="font-medium text-xs break-all">
                    {detailGroup.last_user_agent}
                  </p>
                </div>
              )}
            </div>

            {Object.keys(detailGroup.failure_reasons).length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Failure Reasons</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(detailGroup.failure_reasons)
                    .sort((a, b) => b[1] - a[1])
                    .map(([reason, count]) => (
                      <Badge key={reason} variant="outline" className="font-normal">
                        {reason} ×{count}
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {detailGroup.ip_breakdown.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">
                  IP Address Breakdown ({detailGroup.ip_breakdown.length})
                </p>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Success</TableHead>
                        <TableHead className="text-right">Failed</TableHead>
                        <TableHead>Last</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailGroup.ip_breakdown.map((b) => (
                        <TableRow key={b.ip}>
                          <TableCell className="font-mono text-xs break-all">
                            {b.ip}
                          </TableCell>
                          <TableCell className="text-right">{b.attempts}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {b.successes}
                          </TableCell>
                          <TableCell className="text-right text-destructive">
                            {b.failures}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(b.last_at), 'PP p')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold mb-2">
                All Attempts ({detailGroup.all_attempts.length})
              </p>
              <div className="border rounded-md max-h-72 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailGroup.all_attempts.map((a, i) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-muted-foreground">
                          {i + 1}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={a.success ? 'default' : 'destructive'}
                            className={
                              a.success
                                ? 'bg-green-600 hover:bg-green-600'
                                : ''
                            }
                          >
                            {a.success ? 'Success' : 'Failed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs break-all">
                          {a.ip_address || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {a.failure_reason || (a.success ? '—' : 'Unknown')}
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(a.created_at), 'PP p')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        <ResponsiveModalFooter>
          <Button variant="outline" onClick={() => setDetailGroup(null)}>
            Close
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModal>

      <ResponsiveModal
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Delete Audit Logs</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Are you sure you want to delete all audit logs for {selectedEmails.length}{' '}
            user(s)? This removes their full attempt history and cannot be undone.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>
        <ResponsiveModalFooter>
          <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleBulkDelete}>
            Delete
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModal>
    </AdminLayout>
  );
};

export default AdminLoginAuditPage;
