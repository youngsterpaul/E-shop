import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface County {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

interface City {
  id: string;
  county_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  counties?: { name: string };
}

const AdminLocationsPage = () => {
  const { toast } = useToast();
  
  // Fetch counties
  const { data: counties, isLoading: countiesLoading, refetch: refetchCounties } = useQuery({
    queryKey: ['admin-counties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('counties')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as County[];
    }
  });

  // Fetch cities with county info
  const { data: cities, isLoading: citiesLoading, refetch: refetchCities } = useQuery({
    queryKey: ['admin-cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*, counties(name)')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as City[];
    }
  });

  // County states
  const [isAddCountyOpen, setIsAddCountyOpen] = useState(false);
  const [isEditCountyOpen, setIsEditCountyOpen] = useState(false);
  const [editingCountyId, setEditingCountyId] = useState<string | null>(null);
  const [countyForm, setCountyForm] = useState({ name: '', slug: '' });

  // City states
  const [isAddCityOpen, setIsAddCityOpen] = useState(false);
  const [isEditCityOpen, setIsEditCityOpen] = useState(false);
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [cityForm, setCityForm] = useState({ name: '', slug: '', county_id: '' });

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  // County handlers
  const handleCountyNameChange = (name: string) => {
    setCountyForm({ name, slug: generateSlug(name) });
  };

  const handleAddCounty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('counties')
        .insert({ name: countyForm.name, slug: countyForm.slug });

      if (error) throw error;

      toast({ title: "Success", description: "County added successfully" });
      setIsAddCountyOpen(false);
      setCountyForm({ name: '', slug: '' });
      refetchCounties();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add county",
        variant: "destructive",
      });
    }
  };

  const handleEditCounty = (county: County) => {
    setEditingCountyId(county.id);
    setCountyForm({ name: county.name, slug: county.slug });
    setIsEditCountyOpen(true);
  };

  const handleUpdateCounty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCountyId) return;

    try {
      const { error } = await supabase
        .from('counties')
        .update({ name: countyForm.name, slug: countyForm.slug })
        .eq('id', editingCountyId);

      if (error) throw error;

      toast({ title: "Success", description: "County updated successfully" });
      setIsEditCountyOpen(false);
      setEditingCountyId(null);
      setCountyForm({ name: '', slug: '' });
      refetchCounties();
      refetchCities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update county",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCounty = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? All cities in this county will also be deleted.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('counties')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Success", description: "County deleted successfully" });
      refetchCounties();
      refetchCities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete county",
        variant: "destructive",
      });
    }
  };

  const handleToggleCountyStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('counties')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({ 
        title: "Success", 
        description: `County ${!currentStatus ? 'activated' : 'deactivated'} successfully` 
      });
      refetchCounties();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update county status",
        variant: "destructive",
      });
    }
  };

  // City handlers
  const handleCityNameChange = (name: string) => {
    setCityForm(prev => ({ ...prev, name, slug: generateSlug(name) }));
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('cities')
        .insert({
          name: cityForm.name,
          slug: cityForm.slug,
          county_id: cityForm.county_id
        });

      if (error) throw error;

      toast({ title: "Success", description: "City added successfully" });
      setIsAddCityOpen(false);
      setCityForm({ name: '', slug: '', county_id: '' });
      refetchCities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add city",
        variant: "destructive",
      });
    }
  };

  const handleEditCity = (city: City) => {
    setEditingCityId(city.id);
    setCityForm({
      name: city.name,
      slug: city.slug,
      county_id: city.county_id
    });
    setIsEditCityOpen(true);
  };

  const handleUpdateCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCityId) return;

    try {
      const { error } = await supabase
        .from('cities')
        .update({
          name: cityForm.name,
          slug: cityForm.slug,
          county_id: cityForm.county_id
        })
        .eq('id', editingCityId);

      if (error) throw error;

      toast({ title: "Success", description: "City updated successfully" });
      setIsEditCityOpen(false);
      setEditingCityId(null);
      setCityForm({ name: '', slug: '', county_id: '' });
      refetchCities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update city",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCity = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Success", description: "City deleted successfully" });
      refetchCities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete city",
        variant: "destructive",
      });
    }
  };

  const handleToggleCityStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('cities')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({ 
        title: "Success", 
        description: `City ${!currentStatus ? 'activated' : 'deactivated'} successfully` 
      });
      refetchCities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update city status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="ml-0 md:ml-64 p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Delivery Locations</h1>
          <p className="text-muted-foreground">Manage counties and cities for delivery</p>
        </div>

        <Tabs defaultValue="counties" className="space-y-6">
          <TabsList>
            <TabsTrigger value="counties">Counties</TabsTrigger>
            <TabsTrigger value="cities">Cities</TabsTrigger>
          </TabsList>

          {/* Counties Tab */}
          <TabsContent value="counties" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Counties</h2>
                <p className="text-sm text-muted-foreground">
                  {counties?.length || 0} counties available
                </p>
              </div>
              
              <Dialog open={isAddCountyOpen} onOpenChange={setIsAddCountyOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add County
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New County</DialogTitle>
                    <DialogDescription>
                      Enter the county information
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddCounty}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="county_name">County Name*</Label>
                        <Input
                          id="county_name"
                          value={countyForm.name}
                          onChange={(e) => handleCountyNameChange(e.target.value)}
                          placeholder="e.g., Nairobi"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="county_slug">Slug (auto-generated)</Label>
                        <Input
                          id="county_slug"
                          value={countyForm.slug}
                          onChange={(e) => setCountyForm(prev => ({ ...prev, slug: e.target.value }))}
                          placeholder="e.g., nairobi"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddCountyOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Add County</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Edit County Dialog */}
              <Dialog open={isEditCountyOpen} onOpenChange={setIsEditCountyOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit County</DialogTitle>
                    <DialogDescription>
                      Update the county information
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateCounty}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit_county_name">County Name*</Label>
                        <Input
                          id="edit_county_name"
                          value={countyForm.name}
                          onChange={(e) => handleCountyNameChange(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_county_slug">Slug*</Label>
                        <Input
                          id="edit_county_slug"
                          value={countyForm.slug}
                          onChange={(e) => setCountyForm(prev => ({ ...prev, slug: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsEditCountyOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Update County</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>County List</CardTitle>
                <CardDescription>View and manage all counties</CardDescription>
              </CardHeader>
              <CardContent>
                {countiesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : !counties || counties.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No counties found</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {counties.map((county) => (
                          <TableRow key={county.id}>
                            <TableCell className="font-medium">{county.name}</TableCell>
                            <TableCell>{county.slug}</TableCell>
                            <TableCell>
                              <Button
                                variant={county.is_active ? "default" : "secondary"}
                                size="sm"
                                onClick={() => handleToggleCountyStatus(county.id, county.is_active)}
                              >
                                {county.is_active ? 'Active' : 'Inactive'}
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditCounty(county)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteCounty(county.id, county.name)}
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
          </TabsContent>

          {/* Cities Tab */}
          <TabsContent value="cities" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Cities</h2>
                <p className="text-sm text-muted-foreground">
                  {cities?.length || 0} cities available
                </p>
              </div>
              
              <Dialog open={isAddCityOpen} onOpenChange={setIsAddCityOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add City
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New City</DialogTitle>
                    <DialogDescription>
                      Enter the city information
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddCity}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="city_county">County*</Label>
                        <Select
                          value={cityForm.county_id}
                          onValueChange={(value) => setCityForm(prev => ({ ...prev, county_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select county" />
                          </SelectTrigger>
                          <SelectContent>
                            {counties?.map((county) => (
                              <SelectItem key={county.id} value={county.id}>
                                {county.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city_name">City Name*</Label>
                        <Input
                          id="city_name"
                          value={cityForm.name}
                          onChange={(e) => handleCityNameChange(e.target.value)}
                          placeholder="e.g., Westlands"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city_slug">Slug (auto-generated)</Label>
                        <Input
                          id="city_slug"
                          value={cityForm.slug}
                          onChange={(e) => setCityForm(prev => ({ ...prev, slug: e.target.value }))}
                          placeholder="e.g., westlands"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddCityOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Add City</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Edit City Dialog */}
              <Dialog open={isEditCityOpen} onOpenChange={setIsEditCityOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit City</DialogTitle>
                    <DialogDescription>
                      Update the city information
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateCity}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit_city_county">County*</Label>
                        <Select
                          value={cityForm.county_id}
                          onValueChange={(value) => setCityForm(prev => ({ ...prev, county_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select county" />
                          </SelectTrigger>
                          <SelectContent>
                            {counties?.map((county) => (
                              <SelectItem key={county.id} value={county.id}>
                                {county.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_city_name">City Name*</Label>
                        <Input
                          id="edit_city_name"
                          value={cityForm.name}
                          onChange={(e) => handleCityNameChange(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_city_slug">Slug*</Label>
                        <Input
                          id="edit_city_slug"
                          value={cityForm.slug}
                          onChange={(e) => setCityForm(prev => ({ ...prev, slug: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsEditCityOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Update City</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>City List</CardTitle>
                <CardDescription>View and manage all cities</CardDescription>
              </CardHeader>
              <CardContent>
                {citiesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : !cities || cities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No cities found</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>County</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cities.map((city) => (
                          <TableRow>                      
                            <TableCell className="font-medium">{city.name}</TableCell>
                            <TableCell>{city.counties?.name || 'N/A'}</TableCell>
                            <TableCell>{city.slug}</TableCell>
                            <TableCell>
                              <Button
                                variant={city.is_active ? "default" : "secondary"}
                                size="sm"
                                onClick={() => handleToggleCityStatus(city.id, city.is_active)}
                              >
                                {city.is_active ? 'Active' : 'Inactive'}
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditCity(city)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteCity(city.id, city.name)}
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminLocationsPage;