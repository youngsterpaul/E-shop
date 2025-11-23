import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Camera, CheckCircle2, Mail, MapPin, User, X, AlertCircle } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';

export default function ProfilePage() {
  const { user, profile, loading, updateProfile } = useAuth();
  const { getCountyOptions, getCityOptions, isLoading: locationLoading } = useLocations(); // ✅ use hook
  
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    county: '',
    city: '',
    address: ''
  });

  // 🧠 Update city options when county changes
  const cityOptions = useMemo(() => {
    if (!form.county) return [];
    return getCityOptions(form.county);
  }, [form.county, getCityOptions]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<{ type: 'error' | 'success'; msg: string } | null>(null);
  const isMobile = isMobileUserAgent();

  // 🧠 Prefill data once profile loads
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

  // 🧩 Generic handler to update form fields
  const updateField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));



  const handleUpdate = useCallback(async () => {
    try {
      setStatus(null);

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
    }
  }, [form, user?.id, updateProfile]);



  const smallText = "text-sm sm:text-xs text-gray-700";
  const inputClass = "h-10 border-gray-300 text-sm";

  if (loading) return <p className="text-center text-sm">Loading profile...</p>;

  return (
    <div className={`min-h-screen container p-4 text-gray-800 text-sm ${!isMobile ? 'xl:px-24 px-4' : 'px-2'}`}>
      <div className=".max-w-3xl mx-auto space-y-5">

        {/* ✅ Alerts */}
        {status && (
          <Alert variant={status.type === 'error' ? 'destructive' : undefined}>
            {status.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <AlertDescription>{status.msg}</AlertDescription>
          </Alert>
        )}

        {/* ✅ Profile Form */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4" /> Personal Info
            </CardTitle>
            <CardDescription className="text-xs">Update your personal details</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className={smallText}>First Name</Label>
                <Input id="firstName" value={form.firstName} onChange={e => updateField('firstName', e.target.value)} className={inputClass} />
              </div>
              <div>
                <Label htmlFor="lastName" className={smallText}>Last Name</Label>
                <Input id="lastName" value={form.lastName} onChange={e => updateField('lastName', e.target.value)} className={inputClass} />
              </div>
              <div>
                <Label className={smallText}>Email</Label>
                <Input value={form.email} disabled className="bg-gray-100 text-gray-500 text-sm" />
              </div>
              <div>
                <Label className={smallText}>Phone</Label>
                <PhoneInput value={form.phone} onChange={v => updateField('phone', v)} className="text-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ✅ Location */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Address
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* County Dropdown */}
              <div>
                <Label className={smallText}>County</Label>
                <Select
                  value={form.county || undefined}
                  onValueChange={(v) => updateField('county', v)}
                  disabled={locationLoading}
                >
                  <SelectTrigger className="h-10 border-gray-300 text-sm">
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

              {/* City Dropdown */}
              <div>
                <Label className={smallText}>City</Label>
                <Select
                  value={form.city || undefined}
                  onValueChange={(v) => updateField('city', v)}
                  disabled={!form.county || locationLoading}
                >
                  <SelectTrigger className="h-10 border-gray-300 text-sm">
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

            {/* ✅ Address Input (Free Text) */}
            <Input
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Street, building, floor..."
              className="text-sm"
            />
          </CardContent>
        </Card>


        <div className="flex justify-end">
          <Button onClick={handleUpdate} disabled={uploading || loading} size="sm" className="px-6 text-sm">
            {uploading ? 'Saving...' : 'Update Profile'}
          </Button>
        </div>
      </div>
    </div>
  );
}
