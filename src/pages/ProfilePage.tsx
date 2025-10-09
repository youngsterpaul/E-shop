import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import Header from '@/components/Header';
import { MobileHeader } from '@/components/ui/mobile-header';
import { Settings, Upload, X, User, Mail, Phone, MapPin, Camera, CheckCircle2, AlertCircle } from 'lucide-react';

// Simple avatar cache implementation
const avatarCache = {
  _cache: new Map<string, string>(),
  get(key: string) {
    return this._cache.get(key);
  },
  set(key: string, value: string) {
    this._cache.set(key, value);
  },
  invalidate(key: string) {
    this._cache.delete(key);
  }
};

// Validate image file type and size
function validateImageFile(file: File): { isValid: boolean; errors: string[] } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const errors: string[] = [];
  if (!allowedTypes.includes(file.type)) {
    errors.push('Invalid file type');
  }
  if (file.size > maxSize) {
    errors.push('File is too large');
  }
  return { isValid: errors.length === 0, errors };
}

// Utility to resize image using canvas
async function resizeImage(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const aspect = width / height;
        if (width > height) {
          width = maxWidth;
          height = Math.round(maxWidth / aspect);
        } else {
          height = maxHeight;
          width = Math.round(maxHeight * aspect);
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context not available'));
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to resize image'));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = (err) => reject(err);
    img.src = URL.createObjectURL(file);
  });
}

const ProfilePage = () => {
  const { user, profile, loading, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [county, setCounty] = useState(profile?.county || '');
  const [city, setCity] = useState(profile?.city || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filename, setFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const isMobile = isMobileUserAgent();

  const countyOptions = [
    { value: 'embu', label: 'Embu' },
    { value: 'murangaa', label: "Murang'a" }
  ];

  const cityOptions = {
    embu: [
      { value: 'runyenjes', label: 'Runyenjes' },
      { value: 'manyatta', label: 'Manyatta' },
      { value: 'embu-town', label: 'Embu Town' }
    ],
    murangaa: [
      { value: 'kiharu', label: 'Kiharu' },
      { value: 'mukuyu', label: 'Mukuyu' }
    ]
  };

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setCounty(profile.county || '');
      setCity(profile.city || '');
      setAddress(profile.address || '');
      setFilename(profile.avatar_url);
    }
  }, [profile]);

  const generateAvatarUrl = useCallback(async (filename) => {
    if (!filename) return null;
    
    const cacheKey = `avatar_${filename}`;
    const cachedUrl = avatarCache.get(cacheKey);
    
    if (cachedUrl) {
      return cachedUrl;
    }
    
    try {
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filename);
      
      if (data?.publicUrl) {
        const urlWithCacheBuster = `${data.publicUrl}?t=${Date.now()}`;
        avatarCache.set(cacheKey, urlWithCacheBuster);
        return urlWithCacheBuster;
      }
    } catch (error) {
      console.error('Error generating avatar URL:', error);
    }
    
    return null;
  }, []);

  useEffect(() => {
    const updateAvatarUrl = async () => {
      const url = await generateAvatarUrl(filename);
      setAvatarUrl(url);
    };
    
    updateAvatarUrl();
  }, [filename, generateAvatarUrl]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const getAvailableCities = () => {
    if (!county) return [];
    return cityOptions[county] || [];
  };

  const handleUpdateProfile = async () => {
    try {
      setError(null);
      const updates = {
        user_id: user?.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        county: county,
        city: city,
        address: address,
        updated_at: new Date(),
      };

      await updateProfile(updates);
      setSuccess('Profile updated successfully!');
    } catch (error) {
      const errorMsg = typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message?: string }).message
        : String(error);
      setError(`Failed to update profile: ${errorMsg}`);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      setUploadProgress(25);
      const resizedBlob = await resizeImage(file, 400, 400, 0.8);
      
      setUploadProgress(50);
      if (filename) {
        try {
          await supabase.storage
            .from('avatars')
            .remove([filename]);
          
          avatarCache.invalidate(`avatar_${filename}`);
        } catch (error) {
          console.warn('Could not remove old avatar:', error);
        }
      }

      setUploadProgress(60);
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const newFilename = `${user.id}/${Date.now()}.${fileExt}`;
      
      setUploadProgress(80);
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(newFilename, resizedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: resizedBlob.type
        });

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(90);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: newFilename,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      setUploadProgress(100);
      setFilename(newFilename);
      setSuccess('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(`Error uploading avatar: ${typeof error === 'object' && error !== null && 'message' in error ? (error as { message?: string }).message : String(error)}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!filename || !user?.id) return;
    
    try {
      setError(null);
      setUploading(true);
      
      await supabase.storage
        .from('avatars')
        .remove([filename]);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (updateError) {
        throw updateError;
      }
      
      setFilename(null);
      setAvatarUrl(null);
      avatarCache.invalidate(`avatar_${filename}`);
      setSuccess('Avatar removed successfully!');
      
    } catch (error) {
      const errorMsg = typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message?: string }).message
        : String(error);
      setError(`Error removing avatar: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${!isMobile ? 'min-w-max' : ''}`}>
        {!isMobile && <Header />}
        {isMobile && (
          <MobileHeader 
            title={'My Profile'}
            rightAction={
              <Button variant="ghost" size="sm" className="p-2">
                <Settings className="h-4 w-4" />
              </Button>
            }
          />
        )}
        
        <div className={`flex-grow mx-auto py-8 ${!isMobile ? 'container px-4 xl:px-24' : 'px-4'}`}>
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Profile Header Card Skeleton */}
            <Card className="shadow-xl border-0 overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-gray-300 to-gray-400 animate-pulse"></div>
              <CardContent className="relative pt-0 pb-8">
                <div className="flex flex-col items-center -mt-16">
                  {/* Avatar Skeleton */}
                  <div className="w-32 h-32 rounded-full bg-gray-300 animate-pulse border-4 border-white shadow-2xl ring-4 ring-gray-100"></div>
                  
                  <div className="text-center mt-4 space-y-2 w-full max-w-xs">
                    <div className="h-8 bg-gray-300 rounded animate-pulse w-48 mx-auto"></div>
                    <div className="h-5 bg-gray-300 rounded animate-pulse w-64 mx-auto"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Information Card Skeleton */}
            <Card className="shadow-xl border-0">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="h-6 bg-gray-300 rounded animate-pulse w-48"></div>
                <div className="h-4 bg-gray-300 rounded animate-pulse w-64 mt-2"></div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded animate-pulse w-24"></div>
                      <div className="h-11 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Location Card Skeleton */}
            <Card className="shadow-xl border-0">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="h-6 bg-gray-300 rounded animate-pulse w-40"></div>
                <div className="h-4 bg-gray-300 rounded animate-pulse w-56 mt-2"></div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(2)].map((_, index) => (
                      <div key={index} className="space-y-2">
                        <div className="h-4 bg-gray-300 rounded animate-pulse w-20"></div>
                        <div className="h-11 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded animate-pulse w-28"></div>
                    <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Update Button Skeleton */}
            <div className="flex justify-end">
              <div className="h-11 w-40 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${!isMobile ? 'min-w-max' : ''}`}>
      {!isMobile && <Header />}
      {isMobile && (
        <MobileHeader 
          title={'My Profile'}
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
      )}
      
      <div className={`flex-grow mx-auto py-8 ${!isMobile ? 'container px-4 xl:px-24' : 'px-4'}`}>
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive" className="shadow-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-500 bg-green-50 shadow-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Profile Header Card */}
          <Card className="shadow-xl border-0 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            <CardContent className="relative pt-0 pb-8">
              <div className="flex flex-col items-center -mt-16">
                {/* Avatar Section */}
                <div 
                  className="relative group"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  <Avatar className="w-32 h-32 border-4 border-white shadow-2xl ring-4 ring-gray-100">
                    {avatarUrl ? (
                      <AvatarImage 
                        src={avatarUrl} 
                        alt="Profile Avatar"
                        className="object-cover"
                        onError={(e) => {
                          console.error('Avatar failed to load:', avatarUrl);
                          setAvatarUrl(null);
                        }}
                      />
                    ) : (
                      <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                        {firstName?.[0] || ''}{lastName?.[0] || ''}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  {/* Upload Button Overlay */}
                  <label 
                    htmlFor="avatar-upload"
                    className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer transition-opacity duration-200 ${isHovering || isMobile ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <Camera className="h-8 w-8 text-white" />
                    <input 
                      type="file" 
                      id="avatar-upload" 
                      accept="image/*" 
                      onChange={handleAvatarChange}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  
                  {avatarUrl && !uploading && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0 shadow-lg"
                      onClick={handleRemoveAvatar}
                      title="Remove avatar"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Upload Progress */}
                {uploading && (
                  <div className="w-full max-w-xs mt-4 space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-center font-medium text-blue-600">
                      {uploadProgress < 25 ? 'Preparing image...' :
                       uploadProgress < 50 ? 'Optimizing...' :
                       uploadProgress < 80 ? 'Uploading...' :
                       uploadProgress < 100 ? 'Saving...' : 'Complete!'}
                    </p>
                  </div>
                )}
                
                <div className="text-center mt-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {firstName} {lastName}
                  </h2>
                  <p className="text-gray-600 mt-1 flex items-center justify-center gap-1">
                    <Mail className="h-4 w-4" />
                    {email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information Card */}
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
                    First Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                      disabled={loading}
                      className="pl-10 h-11 border-gray-300 focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>
                
                {/* Last Name */}
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
                    Last Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                      disabled={loading}
                      className="pl-10 h-11 border-gray-300 focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>
                
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled
                      className="pl-10 h-11 bg-gray-50 border-gray-200"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Email cannot be changed from this page
                  </p>
                </div>
                
                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                    <PhoneInput
                      id="phone"
                      value={phone}
                      onChange={(value) => setPhone(value)}
                      disabled={loading}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Card */}
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-5 w-5 text-primary" />
                Location Details
              </CardTitle>
              <CardDescription>Manage your delivery and contact address</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* County and City */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="county" className="text-sm font-semibold text-gray-700">
                      County
                    </Label>
                    <Select value={county} onValueChange={(value) => {
                      setCounty(value);
                      setCity('');
                    }}>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-primary focus:ring-primary">
                        <SelectValue placeholder="Select county" />
                      </SelectTrigger>
                      <SelectContent>
                        {countyOptions.map((countyOption) => (
                          <SelectItem key={countyOption.value} value={countyOption.value}>
                            {countyOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-semibold text-gray-700">
                      City/Town
                    </Label>
                    <Select 
                      value={city} 
                      onValueChange={(value) => setCity(value)}
                      disabled={!county}
                    >
                      <SelectTrigger className="h-11 border-gray-300 focus:border-primary focus:ring-primary">
                        <SelectValue placeholder={county ? "Select city" : "Select county first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableCities().map((cityOption) => (
                          <SelectItem key={cityOption.value} value={cityOption.value}>
                            {cityOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
                    Street Address
                  </Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your complete street address"
                    disabled={loading}
                    rows={3}
                    className="border-gray-300 focus:border-primary focus:ring-primary resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Update Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleUpdateProfile} 
              disabled={loading || uploading}
              size="lg"
              className="px-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Update Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;