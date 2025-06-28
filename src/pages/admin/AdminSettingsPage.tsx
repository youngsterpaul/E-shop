
import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';

const AdminSettingsPage = () => {
  const { toast } = useToast();
  const { useAdminSettings } = useAdminDashboard();
  const { data: settings = [], isLoading, refetch } = useAdminSettings();
  
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
  
  // Set form values when settings are loaded
  useEffect(() => {
    if (settings?.length > 0) {
      const siteNameSetting = settings.find(s => s.setting_key === 'site_name');
      const currencySetting = settings.find(s => s.setting_key === 'currency');
      const taxRateSetting = settings.find(s => s.setting_key === 'tax_rate');
      const shippingFeeSetting = settings.find(s => s.setting_key === 'shipping_fee');
      const freeShippingThresholdSetting = settings.find(s => s.setting_key === 'free_shipping_threshold');
      const maintenanceModeSetting = settings.find(s => s.setting_key === 'maintenance_mode');
      
      form.reset({
        siteName: siteNameSetting?.setting_value || 'SmartKenya',
        currency: currencySetting?.setting_value || 'KSH',
        taxRate: taxRateSetting?.setting_value || 0.16,
        shippingFee: shippingFeeSetting?.setting_value || 500,
        freeShippingThreshold: freeShippingThresholdSetting?.setting_value || 5000,
        maintenanceMode: maintenanceModeSetting?.setting_value || false,
      });
    }
  }, [settings, form]);
  
  const onSubmit = async (data: any) => {
    try {
      // Update or insert settings
      const settingsToUpdate = [
        { setting_key: 'site_name', setting_value: data.siteName, description: 'Site name' },
        { setting_key: 'currency', setting_value: data.currency, description: 'Default currency' },
        { setting_key: 'tax_rate', setting_value: data.taxRate, description: 'Tax rate percentage' },
        { setting_key: 'shipping_fee', setting_value: data.shippingFee, description: 'Default shipping fee' },
        { setting_key: 'free_shipping_threshold', setting_value: data.freeShippingThreshold, description: 'Free shipping threshold' },
        { setting_key: 'maintenance_mode', setting_value: data.maintenanceMode, description: 'Maintenance mode status' },
      ];

      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from('admin_settings')
          .upsert({
            setting_key: setting.setting_key,
            setting_value: setting.setting_value,
            description: setting.description,
          }, {
            onConflict: 'setting_key'
          });

        if (error) throw error;
      }
      
      // Refresh the data
      refetch();
      
      toast({
        title: "Settings saved",
        description: "Your changes have been successfully saved.",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const [notificationSettings, setNotificationSettings] = useState({
    orderConfirmations: true,
    shippingUpdates: true,
    marketingEmails: false,
    smsNotifications: false,
  });

  const updateNotificationSetting = async (key: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: `notification_${key}`,
          setting_value: value,
          description: `Notification setting for ${key}`,
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      setNotificationSettings(prev => ({
        ...prev,
        [key]: value
      }));

      toast({
        title: "Setting updated",
        description: "Notification setting has been updated.",
      });
    } catch (error: any) {
      console.error('Error updating notification setting:', error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="ml-0 md:ml-64 p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your store settings</p>
        </div>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Manage your store general settings.
                </CardDescription>
              </CardHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <>
                        <div className="h-20 w-full skeleton rounded mb-4" />
                        <div className="h-20 w-full skeleton rounded mb-4" />
                        <div className="h-20 w-full skeleton rounded mb-4" />
                      </>
                    ) : (
                      <>
                        <FormField
                          control={form.control}
                          name="siteName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Site Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                Your store name as it appears to customers.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Currency</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                The currency symbol used throughout your store.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="maintenanceMode"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Maintenance Mode</FormLabel>
                                <FormDescription>
                                  Put your store in maintenance mode to prevent customer access.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                      Save Changes
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
          
          <TabsContent value="payments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>
                  Configure your store payment settings.
                </CardDescription>
              </CardHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <>
                        <div className="h-20 w-full skeleton rounded mb-4" />
                        <div className="h-20 w-full skeleton rounded mb-4" />
                        <div className="h-20 w-full skeleton rounded mb-4" />
                      </>
                    ) : (
                      <>
                        <FormField
                          control={form.control}
                          name="taxRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tax Rate (%)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  min="0" 
                                  max="100"
                                  value={field.value}
                                  onChange={e => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Default tax rate applied to products.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="shippingFee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Shipping Fee</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0"
                                  value={field.value}
                                  onChange={e => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Standard shipping fee applied to orders.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="freeShippingThreshold"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Free Shipping Threshold</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0"
                                  value={field.value}
                                  onChange={e => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Minimum order value for free shipping.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                      Save Changes
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure email and SMS notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <h4 className="text-base font-medium">Order Confirmations</h4>
                      <p className="text-sm text-muted-foreground">
                        Send email notifications when an order is placed.
                      </p>
                    </div>
                    <Switch 
                      checked={notificationSettings.orderConfirmations}
                      onCheckedChange={(value) => updateNotificationSetting('orderConfirmations', value)}
                    />
                  </div>
                  
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <h4 className="text-base font-medium">Shipping Updates</h4>
                      <p className="text-sm text-muted-foreground">
                        Send email notifications for shipping status changes.
                      </p>
                    </div>
                    <Switch 
                      checked={notificationSettings.shippingUpdates}
                      onCheckedChange={(value) => updateNotificationSetting('shippingUpdates', value)}
                    />
                  </div>
                  
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <h4 className="text-base font-medium">Marketing Emails</h4>
                      <p className="text-sm text-muted-foreground">
                        Send promotional emails and offers to customers.
                      </p>
                    </div>
                    <Switch 
                      checked={notificationSettings.marketingEmails}
                      onCheckedChange={(value) => updateNotificationSetting('marketingEmails', value)}
                    />
                  </div>
                  
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <h4 className="text-base font-medium">SMS Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Send SMS alerts for order updates.
                      </p>
                    </div>
                    <Switch 
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(value) => updateNotificationSetting('smsNotifications', value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
