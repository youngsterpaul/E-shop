import { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, DollarSign, ShoppingCart, Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';

const AdminDailySalesPage = () => {
  const { toast } = useToast();
  const { useDailySalesMetrics } = useAdminDashboard();
  const { data: dailySales, isLoading, refetch } = useDailySalesMetrics();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    total_revenue: '',
    total_orders: '',
    total_customers: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('daily_sales')
        .insert({
          date: formData.date,
          total_revenue: parseFloat(formData.total_revenue),
          total_orders: parseInt(formData.total_orders),
          total_customers: parseInt(formData.total_customers)
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Daily sales record added successfully",
      });

      setIsAddDialogOpen(false);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        total_revenue: '',
        total_orders: '',
        total_customers: ''
      });
      refetch();
    } catch (error) {
      console.error('Error adding daily sales:', error);
      toast({
        title: "Error",
        description: "Failed to add daily sales record",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (sale: any) => {
    setEditingDate(sale.date);
    setFormData({
      date: sale.date,
      total_revenue: sale.total_revenue?.toString() || '',
      total_orders: sale.total_orders?.toString() || '',
      total_customers: sale.total_customers?.toString() || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingDate) {
      toast({
        title: "Error",
        description: "No record selected for update",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('daily_sales')
        .update({
          total_revenue: parseFloat(formData.total_revenue),
          total_orders: parseInt(formData.total_orders),
          total_customers: parseInt(formData.total_customers),
        })
        .eq('date', editingDate); // ✅ Now TypeScript knows it's a string

      if (error) throw error;

      toast({
        title: "Success",
        description: "Daily sales record updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingDate(null);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        total_revenue: '',
        total_orders: '',
        total_customers: ''
      });
      refetch();
    } catch (error) {
      console.error('Error updating daily sales:', error);
      toast({
        title: "Error",
        description: "Failed to update daily sales record",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (date: string) => {
    if (!confirm('Are you sure you want to delete this sales record?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('daily_sales')
        .delete()
        .eq('date', date);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Daily sales record deleted successfully",
      });

      refetch();
    } catch (error) {
      console.error('Error deleting daily sales:', error);
      toast({
        title: "Error",
        description: "Failed to delete daily sales record",
        variant: "destructive",
      });
    }
  };

  const calculateTotals = () => {
    if (!dailySales) return { revenue: 0, orders: 0, customers: 0 };
    
    return dailySales.reduce((acc, sale) => ({
      revenue: acc.revenue + (sale.total_revenue || 0),
      orders: acc.orders + (sale.total_orders || 0),
      customers: acc.customers + (sale.total_customers || 0)
    }), { revenue: 0, orders: 0, customers: 0 });
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="ml-0 md:ml-64 p-4 md:p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Daily Sales</h1>
            <p className="text-muted-foreground">Monitor and manage daily sales records</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Daily Sales
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Daily Sales Record</DialogTitle>
                <DialogDescription>
                  Enter the sales data for a specific date
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_revenue">Total Revenue (KSH)</Label>
                    <Input
                      id="total_revenue"
                      name="total_revenue"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.total_revenue}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_orders">Total Orders</Label>
                    <Input
                      id="total_orders"
                      name="total_orders"
                      type="number"
                      placeholder="0"
                      value={formData.total_orders}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_customers">Total Customers</Label>
                    <Input
                      id="total_customers"
                      name="total_customers"
                      type="number"
                      placeholder="0"
                      value={formData.total_customers}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Record</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Daily Sales Record</DialogTitle>
                <DialogDescription>
                  Update the sales data for {editingDate && format(new Date(editingDate), 'MMM dd, yyyy')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdate}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_total_revenue">Total Revenue (KSH)</Label>
                    <Input
                      id="edit_total_revenue"
                      name="total_revenue"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.total_revenue}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_total_orders">Total Orders</Label>
                    <Input
                      id="edit_total_orders"
                      name="total_orders"
                      type="number"
                      placeholder="0"
                      value={formData.total_orders}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_total_customers">Total Customers</Label>
                    <Input
                      id="edit_total_customers"
                      name="total_customers"
                      type="number"
                      placeholder="0"
                      value={formData.total_customers}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Record</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KSH {totals.revenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all recorded days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totals.orders.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all recorded days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totals.customers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all recorded days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Records</CardTitle>
            <CardDescription>
              View all daily sales records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : !dailySales || dailySales.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No sales records found</p>
                <p className="text-sm text-muted-foreground">
                  Add your first daily sales record to get started
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Revenue (KSH)</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Customers</TableHead>
                      <TableHead className="text-right">Avg Order Value</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailySales.map((sale) => (
                      <TableRow key={sale.date}>
                        <TableCell className="font-medium">
                          {format(new Date(sale.date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          {(sale.total_revenue || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {sale.total_orders || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {sale.total_customers || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {sale.total_orders 
                            ? ((sale.total_revenue || 0) / sale.total_orders).toLocaleString(undefined, { maximumFractionDigits: 2 })
                            : '0'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(sale)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(sale.date)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDailySalesPage;
