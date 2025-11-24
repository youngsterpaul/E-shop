import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Shield, Eye, Trash, MoreVertical, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  identifier: string;
  details: any;
  acknowledged: boolean;
  created_at: string;
}

const AdminSecurityAlertsPage = () => {
  const [filter, setFilter] = useState<'all' | 'unacknowledged'>('unacknowledged');
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [deleteAlertId, setDeleteAlertId] = useState<string | null>(null);
  const [loadingAlertId, setLoadingAlertId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['security-alerts', filter],
    queryFn: async () => {
      let query = supabase.from('security_alerts').select('*').order('created_at', { ascending: false });
      if (filter === 'unacknowledged') query = query.eq('acknowledged', false);
      const { data, error } = await query;
      if (error) throw error;
      return data as SecurityAlert[];
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: string) => {
      setLoadingAlertId(alertId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('security_alerts').update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user.id,
      }).eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
      toast.success('Alert acknowledged');
      setLoadingAlertId(null);
    },
    onError: () => {
      setLoadingAlertId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase.from('security_alerts').delete().eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
      toast.success('Alert deleted');
      setDeleteAlertId(null);
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const stats = {
    total: alerts?.length || 0,
    critical: alerts?.filter(a => a.severity === 'critical').length || 0,
    unacknowledged: alerts?.filter(a => !a.acknowledged).length || 0,
  };

  return (
    <AdminLayout>
      <QuickActionsBar title="Security Alerts" />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{stats.critical}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unacknowledged</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.unacknowledged}</div></CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="unacknowledged">Unacknowledged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          {isLoading ? <div className="text-center py-8">Loading alerts...</div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Identifier</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts?.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">{alert.alert_type}</TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity === 'critical' || alert.severity === 'high' ? <AlertTriangle className="h-3 w-3 mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{alert.identifier}</TableCell>
                    <TableCell>{format(new Date(alert.created_at), 'PPp')}</TableCell>
                    <TableCell>
                      <Badge variant={alert.acknowledged ? "secondary" : "default"}>
                        {alert.acknowledged ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                        {alert.acknowledged ? 'Acknowledged' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedAlert(alert)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {!alert.acknowledged && (
                            <DropdownMenuItem onClick={() => acknowledgeMutation.mutate(alert.id)} disabled={loadingAlertId === alert.id}>
                              {loadingAlertId === alert.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              Acknowledge
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setDeleteAlertId(alert.id)} className="text-destructive">
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <p className="text-sm text-muted-foreground">{selectedAlert.alert_type}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Severity</label>
                <div className="mt-1">
                  <Badge variant={getSeverityColor(selectedAlert.severity)}>{selectedAlert.severity}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Identifier</label>
                <p className="text-sm text-muted-foreground">{selectedAlert.identifier}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Created</label>
                <p className="text-sm text-muted-foreground">{format(new Date(selectedAlert.created_at), 'PPp')}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <div className="mt-1">
                  <Badge variant={selectedAlert.acknowledged ? "secondary" : "default"}>
                    {selectedAlert.acknowledged ? 'Acknowledged' : 'Pending'}
                  </Badge>
                </div>
              </div>
              {selectedAlert.details && (
                <div>
                  <label className="text-sm font-medium">Details</label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-auto max-h-60">
                    {JSON.stringify(selectedAlert.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAlertId} onOpenChange={(open) => !open && setDeleteAlertId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alert</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this security alert? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAlertId && deleteMutation.mutate(deleteAlertId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminSecurityAlertsPage;
