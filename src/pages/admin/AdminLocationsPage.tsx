import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { ExportButton } from '@/components/admin/ExportButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/admin/EmptyState';

interface County {
  id: string;
  name: string;
  slug: string;
}

interface City {
  id: string;
  name: string;
  slug: string;
  county_id: string;
}

const AdminLocationsPage = () => {
  const { toast } = useToast();
  
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

  const [countyForm, setCountyForm] = useState({ name: '', slug: '' });
  const [cityForm, setCityForm] = useState({ name: '', slug: '', county_id: '' });
  const [isAddCountyOpen, setIsAddCountyOpen] = useState(false);
  const [isAddCityOpen, setIsAddCityOpen] = useState(false);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleAddCounty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('counties').insert(countyForm);
      if (error) throw error;
      toast({ title: "Success", description: "County added" });
      setIsAddCountyOpen(false);
      setCountyForm({ name: '', slug: '' });
      refetchCounties();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('cities').insert(cityForm);
      if (error) throw error;
      toast({ title: "Success", description: "City added" });
      setIsAddCityOpen(false);
      setCityForm({ name: '', slug: '', county_id: '' });
      refetchCities();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

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
            <Dialog open={isAddCountyOpen} onOpenChange={setIsAddCountyOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add County</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add County</DialogTitle></DialogHeader>
                <form onSubmit={handleAddCounty}>
                  <div className="space-y-4">
                    <div><Label>County Name *</Label><Input value={countyForm.name} onChange={(e) => setCountyForm({ name: e.target.value, slug: generateSlug(e.target.value) })} required /></div>
                    <div><Label>Slug</Label><Input value={countyForm.slug} onChange={(e) => setCountyForm({ ...countyForm, slug: e.target.value })} required /></div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsAddCountyOpen(false)}>Cancel</Button>
                    <Button type="submit">Add</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <ExportButton data={counties || []} filename="counties" headers={[{ key: 'name', label: 'County' }, { key: 'slug', label: 'Slug' }]} />
          </div>

          <Card>
            <CardContent className="p-6">
              {countiesLoading ? <div className="text-center py-8">Loading...</div> : !counties || counties.length === 0 ? (
                <EmptyState icon={MapPin} title="No counties" description="Add your first county" actionLabel="Add County" onAction={() => setIsAddCountyOpen(true)} />
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>County Name</TableHead><TableHead>Slug</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {counties.map((county) => (
                      <TableRow key={county.id}>
                        <TableCell className="font-medium">{county.name}</TableCell>
                        <TableCell>{county.slug}</TableCell>
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
            <Dialog open={isAddCityOpen} onOpenChange={setIsAddCityOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add City</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add City</DialogTitle></DialogHeader>
                <form onSubmit={handleAddCity}>
                  <div className="space-y-4">
                    <div><Label>City Name *</Label><Input value={cityForm.name} onChange={(e) => setCityForm({ ...cityForm, name: e.target.value, slug: generateSlug(e.target.value) })} required /></div>
                    <div><Label>Slug</Label><Input value={cityForm.slug} onChange={(e) => setCityForm({ ...cityForm, slug: e.target.value })} required /></div>
                    <div><Label>County *</Label><select className="w-full p-2 border rounded" value={cityForm.county_id} onChange={(e) => setCityForm({ ...cityForm, county_id: e.target.value })} required>{counties?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsAddCityOpen(false)}>Cancel</Button>
                    <Button type="submit">Add</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <ExportButton data={cities || []} filename="cities" headers={[{ key: 'name', label: 'City' }, { key: 'slug', label: 'Slug' }]} />
          </div>

          <Card>
            <CardContent className="p-6">
              {citiesLoading ? <div className="text-center py-8">Loading...</div> : !cities || cities.length === 0 ? (
                <EmptyState icon={MapPin} title="No cities" description="Add your first city" actionLabel="Add City" onAction={() => setIsAddCityOpen(true)} />
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>City Name</TableHead><TableHead>Slug</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {cities.map((city) => (
                      <TableRow key={city.id}>
                        <TableCell className="font-medium">{city.name}</TableCell>
                        <TableCell>{city.slug}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminLocationsPage;
