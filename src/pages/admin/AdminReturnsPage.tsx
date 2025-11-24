import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Search, 
  Package, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  DollarSign,
  Eye,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { format } from 'date-fns';

interface Return {
  id: string;
  return_number: string;
  order_id: string;
  user_id: string;
  items: any;
  return_reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded' | 'completed';
  refund_amount: number;
  refund_method: string | null;
  tracking_number: string | null;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  order?: any;
  profile?: any;
}

export default function AdminReturnsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [processAction, setProcessAction] = useState<'approve' | 'reject'>('approve');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('original_payment');
  const [adminNotes, setAdminNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const queryClient = useQueryClient();

  // Fetch returns with order and user details
  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['admin-returns', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('returns')
        .select('*, order:orders(*), profile:profiles!returns_user_id_fkey(*)')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`return_number.ilike.%${searchTerm}%,order_id.ilike.%${searchTerm}%,return_reason.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Return[];
    }
  });

  // Analytics
  const analytics = {
    total: returns.length,
    pending: returns.filter(r => r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
    rejected: returns.filter(r => r.status === 'rejected').length,
    refunded: returns.filter(r => r.status === 'refunded').length,
    totalRefunded: returns
      .filter(r => r.status === 'refunded')
      .reduce((sum, r) => sum + (r.refund_amount || 0), 0)
  };

  // Process return mutation
  const processReturnMutation = useMutation({
    mutationFn: async ({ 
      returnId, 
      action,
      refundAmt,
      refundMtd,
      notes,
      tracking
    }: { 
      returnId: string; 
      action: 'approve' | 'reject';
      refundAmt?: number;
      refundMtd?: string;
      notes?: string;
      tracking?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updates: any = {
        status: action === 'approve' ? 'approved' : 'rejected',
        processed_by: user?.id,
        processed_at: new Date().toISOString(),
        admin_notes: notes || null
      };

      if (action === 'approve' && refundAmt) {
        updates.refund_amount = refundAmt;
        updates.refund_method = refundMtd;
        updates.tracking_number = tracking || null;
      }

      const { error } = await supabase
        .from('returns')
        .update(updates)
        .eq('id', returnId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-returns'] });
      toast.success('Return processed successfully');
      setShowProcessDialog(false);
      setShowDetailsDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to process return: ${error.message}`);
    }
  });

  // Mark as refunded mutation
  const markAsRefundedMutation = useMutation({
    mutationFn: async (returnId: string) => {
      const { error } = await supabase
        .from('returns')
        .update({ status: 'refunded' })
        .eq('id', returnId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-returns'] });
      toast.success('Return marked as refunded');
      setShowDetailsDialog(false);
    },
    onError: (error) => {
      toast.error(`Failed to update return: ${error.message}`);
    }
  });

  const resetForm = () => {
    setRefundAmount('');
    setRefundMethod('original_payment');
    setAdminNotes('');
    setTrackingNumber('');
  };

  const handleProcessReturn = () => {
    if (!selectedReturn) return;

    if (processAction === 'approve' && !refundAmount) {
      toast.error('Please enter refund amount');
      return;
    }

    processReturnMutation.mutate({
      returnId: selectedReturn.id,
      action: processAction,
      refundAmt: processAction === 'approve' ? parseFloat(refundAmount) : undefined,
      refundMtd: processAction === 'approve' ? refundMethod : undefined,
      notes: adminNotes,
      tracking: trackingNumber
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      refunded: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Returns Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage product returns and refund requests
          </p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Returns</p>
                <p className="text-2xl font-bold text-foreground">{analytics.total}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{analytics.pending}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{analytics.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{analytics.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Refunded</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.refunded}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Refunded</p>
                <p className="text-2xl font-bold text-foreground">
                  KSh {analytics.totalRefunded.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by return number, order ID, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Returns Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return #</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading returns...
                    </TableCell>
                  </TableRow>
                ) : returns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No returns found
                    </TableCell>
                  </TableRow>
                ) : (
                  returns.map((returnItem) => (
                    <TableRow key={returnItem.id}>
                      <TableCell className="font-medium">
                        {returnItem.return_number}
                      </TableCell>
                      <TableCell>{returnItem.order_id.substring(0, 8)}...</TableCell>
                      <TableCell>
                        {returnItem.profile?.first_name} {returnItem.profile?.last_name}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {returnItem.return_reason}
                      </TableCell>
                      <TableCell>
                        {returnItem.refund_amount 
                          ? `KSh ${returnItem.refund_amount.toLocaleString()}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(returnItem.status)}>
                          {returnItem.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(returnItem.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReturn(returnItem);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {returnItem.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedReturn(returnItem);
                                  setProcessAction('approve');
                                  setRefundAmount(returnItem.order?.amount?.toString() || '');
                                  setShowProcessDialog(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedReturn(returnItem);
                                  setProcessAction('reject');
                                  setShowProcessDialog(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {returnItem.status === 'approved' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRefundedMutation.mutate(returnItem.id)}
                            >
                              <DollarSign className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Return Details</DialogTitle>
              <DialogDescription>
                Complete information about this return request
              </DialogDescription>
            </DialogHeader>
            {selectedReturn && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Return Number</Label>
                    <p className="font-medium">{selectedReturn.return_number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Order ID</Label>
                    <p className="font-medium">{selectedReturn.order_id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={getStatusColor(selectedReturn.status)}>
                      {selectedReturn.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Refund Amount</Label>
                    <p className="font-medium">
                      {selectedReturn.refund_amount 
                        ? `KSh ${selectedReturn.refund_amount.toLocaleString()}`
                        : 'Not set'
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Return Reason</Label>
                  <p className="mt-1">{selectedReturn.return_reason}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Items</Label>
                  <div className="mt-2 space-y-2">
                    {Array.isArray(selectedReturn.items) && selectedReturn.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">Qty: {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedReturn.admin_notes && (
                  <div>
                    <Label className="text-muted-foreground">Admin Notes</Label>
                    <p className="mt-1">{selectedReturn.admin_notes}</p>
                  </div>
                )}

                {selectedReturn.tracking_number && (
                  <div>
                    <Label className="text-muted-foreground">Tracking Number</Label>
                    <p className="mt-1">{selectedReturn.tracking_number}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Process Dialog */}
        <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {processAction === 'approve' ? 'Approve Return' : 'Reject Return'}
              </DialogTitle>
              <DialogDescription>
                {processAction === 'approve' 
                  ? 'Enter refund details to approve this return'
                  : 'Provide a reason for rejecting this return'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {processAction === 'approve' && (
                <>
                  <div>
                    <Label>Refund Amount (KSh)</Label>
                    <Input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="Enter refund amount"
                    />
                  </div>

                  <div>
                    <Label>Refund Method</Label>
                    <Select value={refundMethod} onValueChange={setRefundMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original_payment">Original Payment Method</SelectItem>
                        <SelectItem value="store_credit">Store Credit</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tracking Number (Optional)</Label>
                    <Input
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number if applicable"
                    />
                  </div>
                </>
              )}

              <div>
                <Label>Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about this return..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowProcessDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProcessReturn}
                disabled={processReturnMutation.isPending}
              >
                {processReturnMutation.isPending ? 'Processing...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}