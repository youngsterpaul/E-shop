import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { Loader2, Plus, X, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const AdminSettingsPage = () => {
  const { toast } = useToast();
  const { useAdminSettings } = useAdminDashboard();
  const { data: settings = [], refetch } = useAdminSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [newSearch, setNewSearch] = useState('');
  const [isSavingSearches, setIsSavingSearches] = useState(false);
  
  const form = useForm({
    defaultValues: {
      siteName: '',
      currency: '',
      taxRate: 0,
      shippingFee: 0,
      freeShippingThreshold: 0,
      maintenanceMode: false,
    },
  });
  
  useEffect(() => {
    if (settings?.length > 0) {
      form.reset({
        siteName: settings.find(s => s.setting_key === 'site_name')?.setting_value || 'SmartKenya',
        currency: settings.find(s => s.setting_key === 'currency')?.setting_value || 'KSH',
        taxRate: settings.find(s => s.setting_key === 'tax_rate')?.setting_value || 0.16,
        shippingFee: settings.find(s => s.setting_key === 'shipping_fee')?.setting_value || 500,
        freeShippingThreshold: settings.find(s => s.setting_key === 'free_shipping_threshold')?.setting_value || 5000,
        maintenanceMode: settings.find(s => s.setting_key === 'maintenance_mode')?.setting_value || false,
      });

      // Load popular searches
      const searchSetting = settings.find(s => s.setting_key === 'popular_searches');
      if (searchSetting?.setting_value) {
        const searches = searchSetting.setting_value as string[];
        setPopularSearches(Array.isArray(searches) ? searches : []);
      }
    }
  }, [settings, form]);
  
  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const settingsToUpdate = [
        { setting_key: 'site_name', setting_value: data.siteName, description: 'Site name' },
        { setting_key: 'currency', setting_value: data.currency, description: 'Default currency' },
        { setting_key: 'tax_rate', setting_value: data.taxRate, description: 'Tax rate percentage' },
        { setting_key: 'shipping_fee', setting_value: data.shippingFee, description: 'Default shipping fee' },
        { setting_key: 'free_shipping_threshold', setting_value: data.freeShippingThreshold, description: 'Free shipping threshold' },
        { setting_key: 'maintenance_mode', setting_value: data.maintenanceMode, description: 'Maintenance mode status' },
      ];

      for (const setting of settingsToUpdate) {
        const { error } = await supabase.from('admin_settings').upsert({
          setting_key: setting.setting_key,
          setting_value: setting.setting_value,
          description: setting.description,
        }, { onConflict: 'setting_key' });

        if (error) throw error;
      }
      
      refetch();
      toast({ title: "Success", description: "Settings saved successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const addPopularSearch = () => {
    const trimmed = newSearch.trim().toLowerCase();
    if (trimmed && !popularSearches.includes(trimmed)) {
      setPopularSearches([...popularSearches, trimmed]);
      setNewSearch('');
    }
  };

  const removePopularSearch = (search: string) => {
    setPopularSearches(popularSearches.filter(s => s !== search));
  };

  const savePopularSearches = async () => {
    setIsSavingSearches(true);
    try {
      const { error } = await supabase.from('admin_settings').upsert({
        setting_key: 'popular_searches',
        setting_value: popularSearches,
        description: 'Popular search suggestions shown to users when search input is focused',
      }, { onConflict: 'setting_key' });

      if (error) throw error;
      
      refetch();
      toast({ title: "Success", description: "Popular searches saved successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingSearches(false);
    }
  };

  return (
    <AdminLayout>
      <QuickActionsBar title="Settings" onRefresh={() => refetch()} />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Configure basic site settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Rate (%)</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shipping">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Settings</CardTitle>
                  <CardDescription>Configure shipping options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="shippingFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Shipping Fee</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="freeShippingThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Free Shipping Threshold</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormDescription>Order amount for free shipping</FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Popular Searches
                  </CardTitle>
                  <CardDescription>
                    Manage trending search suggestions shown to users when they focus on the search input
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a popular search term..."
                      value={newSearch}
                      onChange={(e) => setNewSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPopularSearch())}
                    />
                    <Button type="button" onClick={addPopularSearch} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-lg bg-muted/30">
                    {popularSearches.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No popular searches added yet</p>
                    ) : (
                      popularSearches.map((search, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1 pr-1"
                        >
                          {search}
                          <button
                            type="button"
                            onClick={() => removePopularSearch(search)}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      onClick={savePopularSearches}
                      disabled={isSavingSearches}
                    >
                      {isSavingSearches && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isSavingSearches ? 'Saving...' : 'Save Popular Searches'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>Advanced configuration options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="maintenanceMode"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Maintenance Mode</FormLabel>
                          <FormDescription>Enable to show maintenance page</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex justify-end mt-6">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
