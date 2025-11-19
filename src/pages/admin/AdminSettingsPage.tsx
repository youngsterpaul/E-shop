import { useEffect } from 'react';
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

const AdminSettingsPage = () => {
  const { toast } = useToast();
  const { useAdminSettings } = useAdminDashboard();
  const { data: settings = [], refetch } = useAdminSettings();
  
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
    }
  }, [settings, form]);
  
  const onSubmit = async (data: any) => {
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
    }
  };

  return (
    <AdminLayout>
      <QuickActionsBar title="Settings" onRefresh={() => refetch()} />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
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
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
