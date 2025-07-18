import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
// Import from supabase client instead
import { supabase } from '@/integrations/supabase/client';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import Header from '@/components/Header';
import { MobileHeader } from '@/components/ui/mobile-header';
import { Settings } from 'lucide-react';

const ProfilePage = () => {
  const { user, profile, loading, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const isMobile = isMobileUserAgent();

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setFilename(profile.avatar_url);
    }
  }, [profile]);

  useEffect(() => {
    // Replace SUPABASE_URL with the actual URL from client
    const avatarUrl = profile?.avatar_url 
      ? `https://vsrkmtebffntocpjapxz.supabase.co/storage/v1/object/public/avatars/${filename}`
      : null;
    setAvatarUrl(avatarUrl);
  }, [filename, profile]);

  const handleUpdateProfile = async () => {
    const updates = {
      user_id: user?.id,
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      updated_at: new Date(),
    };

    await updateProfile(updates);
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploading(true);

      try {
        const fileExt = file.name.split('.').pop();
        const newFilename = `${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(newFilename, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        setFilename(newFilename);

        if (!user?.id) {
          throw new Error("User ID is undefined");
        }
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: newFilename })
          .eq('user_id', user.id);

        if (updateError) {
          throw updateError;
        }
      } catch (error: any) {
        console.error('Error uploading avatar: ', error.message);
        alert(error.message);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-2">
      {!isMobile && <Header />}
      {isMobile && (
        <MobileHeader 
          title={'Update Profile'}
          backTo="/"
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
      )}
      <div className="grid gap-10 md:grid-cols-2">
        <div className="md:order-2">
          <div className="mb-4">
            <Avatar className="w-32 h-32">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt="Avatar" />
              ) : (
                <AvatarFallback>{firstName?.[0]}{lastName?.[0]}</AvatarFallback>
              )}
            </Avatar>
          </div>
          <Label htmlFor="avatar" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">Change avatar</Label>
          <Input type="file" id="avatar" accept="image/*" onChange={handleAvatarChange} disabled={uploading} />
          {uploading && <p>Uploading...</p>}
        </div>
        <div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <PhoneInput
                id="phone"
                value={phone}
                onChange={(value) => setPhone(value)}
              />
            </div>
            <Button onClick={handleUpdateProfile} disabled={loading}>
              Update Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
