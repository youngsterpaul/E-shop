import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { LoyaltyPointsWidget } from "@/components/loyalty/LoyaltyPointsWidget";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { CheckCircle2, MapPin, User, AlertCircle, Loader2, Save } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';

export default function ProfilePage() {
  const { user, profile, loading, updateProfile } = useAuth();
  const { getCountyOptions, getCityOptions, isLoading: locationLoading } = useLocations();
  
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    county: '',
    city: '',
    address: ''
  });

  const cityOptions = useMemo(() => {
    if (!form.county) return [];
    return getCityOptions(form.county);
  }, [form.county, getCityOptions]);
  
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success'; msg: string } | null>(null);
  const isMobile = isMobileUserAgent();

  useEffect(() => {
    if (!profile) return;
    setForm({
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      county: profile.county || '',
      city: profile.city || '',
      address: profile.address || ''
    });
  }, [profile]);

  const updateField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleUpdate = useCallback(async () => {
    try {
      setStatus(null);
      setUploading(true);

      const payload = {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone,
        county: form.county,
        city: form.city,
        address: form.address,
        user_id: user?.id,
        updated_at: new Date(),
      };

      await updateProfile(payload);
      setStatus({ type: 'success', msg: 'Profile updated successfully!' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Failed to update profile' });
    } finally {
      setUploading(false);
    }
  }, [form, user?.id, updateProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
      <main className={`container mx-auto px-4 py-8 ${!isMobile ? 'max-w-3xl' : 'pb-24'}`}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your personal information</p>
        </div>

        <div className="space-y-6">
          {/* Status Alerts */}
          {status && (
            <Alert variant={status.type === 'error' ? 'destructive' : 'default'} className="border-0 shadow-sm">
              {status.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-primary" />}
              <AlertDescription>{status.msg}</AlertDescription>
            </Alert>
          )}

          {/* Loyalty Points Widget */}
          <LoyaltyPointsWidget />

          {/* Personal Info Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={form.firstName} 
                    onChange={e => updateField('firstName', e.target.value)} 
                    className="h-11"
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={form.lastName} 
                    onChange={e => updateField('lastName', e.target.value)} 
                    className="h-11"
                    placeholder="Enter last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <Input 
                    value={form.email} 
                    disabled 
                    className="h-11 bg-muted text-muted-foreground" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Phone</Label>
                  <PhoneInput 
                    value={form.phone} 
                    onChange={v => updateField('phone', v)} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Delivery Address</CardTitle>
                  <CardDescription>Your default delivery location</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">County</Label>
                  <Select
                    value={form.county || undefined}
                    onValueChange={(v) => updateField('county', v)}
                    disabled={locationLoading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select County" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCountyOptions().map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">City</Label>
                  <Select
                    value={form.city || undefined}
                    onValueChange={(v) => updateField('city', v)}
                    disabled={!form.county || locationLoading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={form.county ? "Select City" : "Select County first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {cityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Street Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Street, building, floor..."
                  className="h-11"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleUpdate} 
              disabled={uploading || loading} 
              className="px-8 h-11"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
