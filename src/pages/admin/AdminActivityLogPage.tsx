import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { ExportButton } from '@/components/admin/ExportButton';
import { SuperadminOnly } from '@/components/admin/SuperadminOnly';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, FileText, Plus, Edit, Trash2, Clock, User, Database } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import SmartPagination from '@/components/ui/pagination';

interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string;
  action_type: 'create' | 'update' | 'delete';
  table_name: string;
  record_id: string;
  record_name: string;
  old_data: any;
  new_data: any;
  changes: any;
  created_at: string;
}

const AdminActivityLogPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [tableFilter, setTableFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['activityLogs', searchQuery, actionFilter, tableFilter, currentPage, pageSize],
    queryFn: async () => {
      // Build the base query
      let query = supabase
        .from('admin_activity_logs')
        .select('*', { count: 'exact' });

      // Apply filters
      if (searchQuery) {
        query = query.or(
          `user_email.ilike.%${searchQuery}%,record_name.ilike.%${searchQuery}%,record_id.ilike.%${searchQuery}%`
        );
      }

      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter);
      }

      if (tableFilter !== 'all') {
        query = query.eq('table_name', tableFilter);
      }

      // Apply pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        logs: data as ActivityLog[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
  });

  const activityLogs = data?.logs || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;
  const filteredLogs = activityLogs;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return Plus;
      case 'update':
        return Edit;
      case 'delete':
        return Trash2;
      default:
        return FileText;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'default';
      case 'update':
        return 'secondary';
      case 'delete':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTableIcon = (table: string) => {
    switch (table) {
      case 'products':
        return '📦';
      case 'orders':
        return '🛒';
      case 'categories':
        return '📁';
      case 'user_roles':
        return '👥';
      default:
        return '📋';
    }
  };

  const viewDetails = (log: ActivityLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const toggleSelectLog = (logId: string) => {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(logId)) {
      newSelected.delete(logId);
    } else {
      newSelected.add(logId);
    }
    setSelectedLogs(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedLogs.size === filteredLogs.length) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(filteredLogs.map(log => log.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedLogs.size === 0) {
      toast.error('No logs selected');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedLogs.size} activity log(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('admin_activity_logs')
        .delete()
        .in('id', Array.from(selectedLogs));

      if (error) throw error;

      toast.success(`Successfully deleted ${selectedLogs.size} activity log(s)`);
      setSelectedLogs(new Set());
      refetch();
    } catch (error) {
      console.error('Error deleting logs:', error);
      toast.error('Failed to delete activity logs');
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch all unique tables for filter dropdown
  const { data: tablesData } = useQuery({
    queryKey: ['activityLogTables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select('table_name');
      
      if (error) throw error;
      return [...new Set(data.map(log => log.table_name))];
    },
  });

  const tables = tablesData || [];

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedLogs(new Set()); // Clear selections on page change
  };

  return (
    <AdminLayout>
      <QuickActionsBar
        title="Activity Log"
        onRefresh={refetch}
      />

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {selectedLogs.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedLogs.size})
            </Button>
          )}
        </div>
        <SuperadminOnly>
          <ExportButton
            data={filteredLogs}
            filename="activity-log"
            headers={[
              { key: 'created_at', label: 'Date' },
              { key: 'user_email', label: 'User' },
              { key: 'action_type', label: 'Action' },
              { key: 'table_name', label: 'Table' },
              { key: 'record_name', label: 'Record' },
              { key: 'record_id', label: 'Record ID' },
            ]}
          />
        </SuperadminOnly>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Select All Checkbox */}
          {filteredLogs.length > 0 && (
            <div className="mb-4 flex items-center gap-2 pb-3 border-b">
              <Checkbox
                checked={selectedLogs.size === filteredLogs.length && filteredLogs.length > 0}
                onCheckedChange={toggleSelectAll}
                id="select-all"
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium cursor-pointer"
              >
                Select All ({filteredLogs.length} logs)
              </label>
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by user, record name, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                {tables.map(table => (
                  <SelectItem key={table} value={table}>
                    {table.charAt(0).toUpperCase() + table.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Activity Timeline */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No activity found</h3>
              <p className="text-muted-foreground">
                {searchQuery || actionFilter !== 'all' || tableFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Admin actions will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log, index) => {
                const ActionIcon = getActionIcon(log.action_type);
                const isLast = index === filteredLogs.length - 1;

                return (
                  <div key={log.id} className="relative">
                    {/* Timeline line */}
                    {!isLast && (
                      <div className="absolute left-10 top-10 w-0.5 h-full bg-border" />
                    )}

                    <div className="flex gap-4 group">
                      {/* Checkbox */}
                      <div className="relative z-10 flex items-center justify-center pt-1">
                        <Checkbox
                          checked={selectedLogs.has(log.id)}
                          onCheckedChange={() => toggleSelectLog(log.id)}
                        />
                      </div>

                      {/* Icon */}
                      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-border group-hover:border-primary transition-colors">
                        <ActionIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-8">
                        <Card className="group-hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant={getActionColor(log.action_type)} className="gap-1">
                                    <ActionIcon className="h-3 w-3" />
                                    {log.action_type.toUpperCase()}
                                  </Badge>
                                  <span className="text-sm font-medium">
                                    {getTableIcon(log.table_name)} {log.table_name}
                                  </span>
                                  {log.record_name && (
                                    <>
                                      <span className="text-muted-foreground">→</span>
                                      <span className="text-sm font-semibold">{log.record_name}</span>
                                    </>
                                  )}
                                </div>

                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span>{log.user_email}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Database className="h-3 w-3" />
                                    <span className="font-mono text-xs">{log.record_id.slice(0, 8)}</span>
                                  </div>
                                </div>

                                {/* Changes summary */}
                                {log.changes && Object.keys(log.changes).length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {Object.keys(log.changes).slice(0, 3).map(key => (
                                      <Badge key={key} variant="outline" className="text-xs">
                                        {key}
                                      </Badge>
                                    ))}
                                    {Object.keys(log.changes).length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{Object.keys(log.changes).length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewDetails(log)}
                              >
                                View Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filteredLogs.length > 0 && (
            <SmartPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={[12, 24, 48, 96]}
            />
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
            <DialogDescription>
              Full details of the selected action
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Action</p>
                  <Badge variant={getActionColor(selectedLog.action_type)}>
                    {selectedLog.action_type.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Table</p>
                  <p className="font-medium">{selectedLog.table_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">User</p>
                  <p className="font-medium">{selectedLog.user_email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Timestamp</p>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Record ID</p>
                  <p className="font-mono text-sm">{selectedLog.record_id}</p>
                </div>
              </div>

              {/* Changes */}
              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Changes</h4>
                  <div className="space-y-2">
                     {Object.entries(selectedLog.changes).map(([key, value]: [string, any]) => (
                      <div key={key} className="p-3 bg-muted rounded-lg">
                        <p className="font-medium text-sm mb-1 capitalize">{key}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground mb-1">Old Value:</p>
                            <code className="block p-2 bg-background rounded border">
                              {value && typeof value === 'object' && 'old' in value
                                ? JSON.stringify(value.old, null, 2)
                                : JSON.stringify(value, null, 2)}
                            </code>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">New Value:</p>
                            <code className="block p-2 bg-background rounded border">
                              {value && typeof value === 'object' && 'new' in value
                                ? JSON.stringify(value.new, null, 2)
                                : 'N/A'}
                            </code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Data */}
              {selectedLog.action_type !== 'create' && selectedLog.old_data && (
                <div>
                  <h4 className="font-semibold mb-2">Old Data</h4>
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.action_type !== 'delete' && selectedLog.new_data && (
                <div>
                  <h4 className="font-semibold mb-2">New Data</h4>
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminActivityLogPage;
