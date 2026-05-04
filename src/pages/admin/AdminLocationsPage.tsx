import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { ExportButton } from '@/components/admin/ExportButton';
import { SuperadminOnly } from '@/components/admin/SuperadminOnly';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Plus, Edit, Trash } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/admin/EmptyState';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface County {
  id: string;
  name: string;
  slug: string;
  delivery_fee?: number;
}

interface City {
  id: string;
  name: string;
  slug: string;
  county_id: string;
  delivery_fee?: number;
}

/** Responsive modal: Drawer on mobile, Dialog on desktop. */
const ResponsiveModal = ({
  open,
  onOpenChange,
  title,
  children,
  isMobile,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: React.ReactNode;
  isMobile: boolean;
}) => {
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

const AdminLocationsPage = () => {
  const { toast } = useToast();
  const isMobile = isMobileUserAgent();

  const { data: counties, isLoading: countiesLoading, refetch: refetchCounties } = useQuery({
    queryKey: ['admin-counties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('counties').select('*').order('name');
      if (error) throw error;
      return data as County[];
    }
  });

  const { data: cities, isLoading: citiesLoading, refetch: refetchCities } = useQuery({
    queryKey: ['admin-cities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cities').select('*').order('name');
      if (error) throw error;
      return data as City[];
    }
  });

  const [countyForm, setCountyForm] = useState({ name: '', slug: '', delivery_fee: 0 });
  const [cityForm, setCityForm] = useState({ name: '', slug: '', county_id: '', delivery_fee: 0 });
  const [isAddCountyOpen, setIsAddCountyOpen] = useState(false);
  const [isAddCityOpen, setIsAddCityOpen] = useState(false);
  const [isEditCountyOpen, setIsEditCountyOpen] = useState(false);
  const [isEditCityOpen, setIsEditCityOpen] = useState(false);
  const [editingCounty, setEditingCounty] = useState<County | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [deleteCountyId, setDeleteCountyId] = useState<string | null>(null);
  const [deleteCityId, setDeleteCityId] = useState<string | null>(null);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleAddCounty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('counties').insert({
        name: countyForm.name,
        slug: countyForm.slug,
        delivery_fee: Number(countyForm.delivery_fee) || 0,
      });
      if (error) throw error;
      toast({ title: "Success", description: "County added" });
      setIsAddCountyOpen(false);
      setCountyForm({ name: '', slug: '', delivery_fee: 0 });
      refetchCounties();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('cities').insert({
        name: cityForm.name,
        slug: cityForm.slug,
        county_id: cityForm.county_id,
        delivery_fee: Number(cityForm.delivery_fee) || 0,
      });
      if (error) throw error;
      toast({ title: "Success", description: "City added" });
      setIsAddCityOpen(false);
      setCityForm({ name: '', slug: '', county_id: '', delivery_fee: 0 });
      refetchCities();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEditCounty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCounty) return;
    try {
      const { error } = await supabase.from('counties').update({
        name: editingCounty.name,
        slug: editingCounty.slug,
        delivery_fee: Number(editingCounty.delivery_fee) || 0,
      }).eq('id', editingCounty.id);
      if (error) throw error;
      toast({ title: "Success", description: "County updated" });
      setIsEditCountyOpen(false);
      setEditingCounty(null);
      refetchCounties();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEditCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCity) return;
    try {
      const { error } = await supabase.from('cities').update({
        name: editingCity.name,
        slug: editingCity.slug,
        county_id: editingCity.county_id,
        delivery_fee: Number(editingCity.delivery_fee) || 0,
      }).eq('id', editingCity.id);
      if (error) throw error;
      toast({ title: "Success", description: "City updated" });
      setIsEditCityOpen(false);
      setEditingCity(null);
      refetchCities();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteCounty = async () => {
    if (!deleteCountyId) return;
    try {
      const { error } = await supabase.from('counties').delete().eq('id', deleteCountyId);
      if (error) throw error;
      toast({ title: "Success", description: "County deleted" });
      setDeleteCountyId(null);
      refetchCounties();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteCity = async () => {
    if (!deleteCityId) return;
    try {
      const { error } = await supabase.from('cities').delete().eq('id', deleteCityId);
      if (error) throw error;
      toast({ title: "Success", description: "City deleted" });
      setDeleteCityId(null);
      refetchCities();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const formActions = (cancelFn: () => void, submitLabel: string) => (
    <div className="flex gap-2 justify-end mt-6">
      <Button type="button" variant="outline" onClick={cancelFn}>Cancel</Button>
      <Button type="submit">{submitLabel}</Button>
    </div>
  );

  return (
    <AdminLayout>
      <QuickActionsBar title="Locations" onRefresh={() => { refetchCounties(); refetchCities(); }} />

      <Tabs defaultValue="counties" className="space-y-4">
        <TabsList>
          <TabsTrigger value="counties">Counties</TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
        </TabsList>

        <TabsContent value="counties">
          <div className="flex justify-between mb-4">
            <Button size="sm" onClick={() => setIsAddCountyOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Add County
            </Button>
            <SuperadminOnly>
              <ExportButton data={counties || []} filename="counties" headers={[{ key: 'name', label: 'County' }, { key: 'slug', label: 'Slug' }, { key: 'delivery_fee', label: 'Delivery Fee' }]} />
            </SuperadminOnly>
          </div>

          <Card>
            <CardContent className="p-6">
              {countiesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : !counties || counties.length === 0 ? (
                <EmptyState icon={MapPin} title="No counties" description="Add your first county" actionLabel="Add County" onAction={() => setIsAddCountyOpen(true)} />
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>County Name</TableHead><TableHead>Slug</TableHead><TableHead>Delivery Fee</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {counties.map((county) => (
                      <TableRow key={county.id}>
                        <TableCell className="font-medium">{county.name}</TableCell>
                        <TableCell>{county.slug}</TableCell>
                        <TableCell>KES {Number(county.delivery_fee || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => { setEditingCounty(county); setIsEditCountyOpen(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteCountyId(county.id)}>
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cities">
          <div className="flex justify-between mb-4">
            <Button size="sm" onClick={() => setIsAddCityOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Add City
            </Button>
            <SuperadminOnly>
              <ExportButton data={cities || []} filename="cities" headers={[{ key: 'name', label: 'City' }, { key: 'slug', label: 'Slug' }, { key: 'delivery_fee', label: 'Delivery Fee' }]} />
            </SuperadminOnly>
          </div>

          <Card>
            <CardContent className="p-6">
              {citiesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : !cities || cities.length === 0 ? (
                <EmptyState icon={MapPin} title="No cities" description="Add your first city" actionLabel="Add City" onAction={() => setIsAddCityOpen(true)} />
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>City Name</TableHead><TableHead>Slug</TableHead><TableHead>County</TableHead><TableHead>Delivery Fee</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {cities.map((city) => {
                      const county = counties?.find(c => c.id === city.county_id);
                      return (
                        <TableRow key={city.id}>
                          <TableCell className="font-medium">{city.name}</TableCell>
                          <TableCell>{city.slug}</TableCell>
                          <TableCell className="text-muted-foreground">{county?.name || '—'}</TableCell>
                          <TableCell>KES {Number(city.delivery_fee || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => { setEditingCity(city); setIsEditCityOpen(true); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setDeleteCityId(city.id)}>
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add County */}
      <ResponsiveModal open={isAddCountyOpen} onOpenChange={setIsAddCountyOpen} title="Add County" isMobile={isMobile}>
        <form onSubmit={handleAddCounty}>
          <div className="space-y-4">
            <div><Label>County Name *</Label><Input value={countyForm.name} onChange={(e) => setCountyForm({ ...countyForm, name: e.target.value, slug: generateSlug(e.target.value) })} required /></div>
            <div><Label>Slug</Label><Input value={countyForm.slug} onChange={(e) => setCountyForm({ ...countyForm, slug: e.target.value })} required /></div>
            <div><Label>Default Delivery Fee (KES)</Label><Input type="number" min="0" step="1" value={countyForm.delivery_fee} onChange={(e) => setCountyForm({ ...countyForm, delivery_fee: Number(e.target.value) })} placeholder="0" /></div>
          </div>
          {formActions(() => setIsAddCountyOpen(false), 'Add')}
        </form>
      </ResponsiveModal>

      {/* Add City */}
      <ResponsiveModal open={isAddCityOpen} onOpenChange={setIsAddCityOpen} title="Add City" isMobile={isMobile}>
        <form onSubmit={handleAddCity}>
          <div className="space-y-4">
            <div><Label>City Name *</Label><Input value={cityForm.name} onChange={(e) => setCityForm({ ...cityForm, name: e.target.value, slug: generateSlug(e.target.value) })} required /></div>
            <div><Label>Slug</Label><Input value={cityForm.slug} onChange={(e) => setCityForm({ ...cityForm, slug: e.target.value })} required /></div>
            <div><Label>County *</Label><select className="w-full p-2 border rounded bg-background" value={cityForm.county_id} onChange={(e) => setCityForm({ ...cityForm, county_id: e.target.value })} required><option value="">Select county</option>{counties?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><Label>Delivery Fee (KES) *</Label><Input type="number" min="0" step="1" value={cityForm.delivery_fee} onChange={(e) => setCityForm({ ...cityForm, delivery_fee: Number(e.target.value) })} placeholder="0" /><p className="text-xs text-muted-foreground mt-1">Leave 0 to use the county default.</p></div>
          </div>
          {formActions(() => setIsAddCityOpen(false), 'Add')}
        </form>
      </ResponsiveModal>

      {/* Edit County */}
      <ResponsiveModal open={isEditCountyOpen} onOpenChange={setIsEditCountyOpen} title="Edit County" isMobile={isMobile}>
        <form onSubmit={handleEditCounty}>
          <div className="space-y-4">
            <div><Label>County Name *</Label><Input value={editingCounty?.name || ''} onChange={(e) => setEditingCounty(prev => prev ? { ...prev, name: e.target.value, slug: generateSlug(e.target.value) } : null)} required /></div>
            <div><Label>Slug</Label><Input value={editingCounty?.slug || ''} onChange={(e) => setEditingCounty(prev => prev ? { ...prev, slug: e.target.value } : null)} required /></div>
            <div><Label>Default Delivery Fee (KES)</Label><Input type="number" min="0" step="1" value={editingCounty?.delivery_fee ?? 0} onChange={(e) => setEditingCounty(prev => prev ? { ...prev, delivery_fee: Number(e.target.value) } : null)} /></div>
          </div>
          {formActions(() => setIsEditCountyOpen(false), 'Save Changes')}
        </form>
      </ResponsiveModal>

      {/* Edit City */}
      <ResponsiveModal open={isEditCityOpen} onOpenChange={setIsEditCityOpen} title="Edit City" isMobile={isMobile}>
        <form onSubmit={handleEditCity}>
          <div className="space-y-4">
            <div><Label>City Name *</Label><Input value={editingCity?.name || ''} onChange={(e) => setEditingCity(prev => prev ? { ...prev, name: e.target.value, slug: generateSlug(e.target.value) } : null)} required /></div>
            <div><Label>Slug</Label><Input value={editingCity?.slug || ''} onChange={(e) => setEditingCity(prev => prev ? { ...prev, slug: e.target.value } : null)} required /></div>
            <div><Label>County *</Label><select className="w-full p-2 border rounded bg-background" value={editingCity?.county_id || ''} onChange={(e) => setEditingCity(prev => prev ? { ...prev, county_id: e.target.value } : null)} required>{counties?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><Label>Delivery Fee (KES)</Label><Input type="number" min="0" step="1" value={editingCity?.delivery_fee ?? 0} onChange={(e) => setEditingCity(prev => prev ? { ...prev, delivery_fee: Number(e.target.value) } : null)} /><p className="text-xs text-muted-foreground mt-1">Leave 0 to use the county default.</p></div>
          </div>
          {formActions(() => setIsEditCityOpen(false), 'Save Changes')}
        </form>
      </ResponsiveModal>

      {/* Delete County Confirmation */}
      <AlertDialog open={!!deleteCountyId} onOpenChange={(open) => !open && setDeleteCountyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete County</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This will also delete all cities in this county.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCounty} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete City Confirmation */}
      <AlertDialog open={!!deleteCityId} onOpenChange={(open) => !open && setDeleteCityId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete City</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this city?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCity} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminLocationsPage;
