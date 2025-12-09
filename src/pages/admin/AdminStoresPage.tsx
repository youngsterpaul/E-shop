import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { ExportButton } from '@/components/admin/ExportButton';
import { EmptyState } from '@/components/admin/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Store, Plus, Pencil, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';

interface StoreData {
  id: number;
  name: string;
  phone: number | null;
  address: string | null;
  email: string | null;
}

const AdminStoresPage = () => {
  const { toast } = useToast();
  
  const { data: stores, isLoading, refetch } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as StoreData[];
    }
  });
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', email: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', address: '', email: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase.from('store').insert({
        name: formData.name,
        phone: parseInt(formData.phone) || null,
        address: formData.address || null,
        email: formData.email || null
      });

      if (error) throw error;
      toast({ title: "Success", description: "Store added successfully" });
      setIsAddDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add store", variant: "destructive" });
    }
  };

  const handleEdit = (store: StoreData) => {
    setEditingId(store.id);
    setFormData({
      name: store.name,
      phone: store.phone?.toString() || '',
      address: store.address || '',
      email: store.email || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const { error } = await supabase.from('store').update({
        name: formData.name,
        phone: parseInt(formData.phone) || null,
        address: formData.address || null,
        email: formData.email || null
      }).eq('id', editingId);

      if (error) throw error;
      toast({ title: "Success", description: "Store updated successfully" });
      setIsEditDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update store", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      const { error } = await supabase.from('store').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "Store deleted successfully" });
      refetch();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete store", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <QuickActionsBar
        title="Stores"
        onRefresh={() => refetch()}
        customActions={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Store</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Store</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div><Label>Store Name *</Label><Input name="name" value={formData.name} onChange={handleInputChange} required /></div>
                  <div><Label>Phone</Label><Input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} /></div>
                  <div><Label>Address</Label><Input name="address" value={formData.address} onChange={handleInputChange} /></div>
                  <div><Label>Email</Label><Input name="email" type="email" value={formData.email} onChange={handleInputChange} /></div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Add Store</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex justify-end mb-4">
        <ExportButton data={stores || []} filename="stores" headers={[
          { key: 'name', label: 'Store Name' },
          { key: 'phone', label: 'Phone' },
          { key: 'email', label: 'Email' },
          { key: 'address', label: 'Address' },
        ]} />
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : !stores || stores.length === 0 ? (
            <EmptyState icon={Store} title="No stores yet" description="Add your first store location" actionLabel="Add Store" onAction={() => setIsAddDialogOpen(true)} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell>{typeof store.phone === 'number' ? <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{store.phone}</div> : '-'}</TableCell>
                    <TableCell>{store.email ? <div className="flex items-center gap-2"><Mail className="h-4 w-4" />{store.email}</div> : '-'}</TableCell>
                    <TableCell>{store.address ? <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{store.address}</div> : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(store)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(store.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Store</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="space-y-4">
              <div><Label>Store Name *</Label><Input name="name" value={formData.name} onChange={handleInputChange} required /></div>
              <div><Label>Phone</Label><Input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} /></div>
              <div><Label>Address</Label><Input name="address" value={formData.address} onChange={handleInputChange} /></div>
              <div><Label>Email</Label><Input name="email" type="email" value={formData.email} onChange={handleInputChange} /></div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Update</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminStoresPage;
