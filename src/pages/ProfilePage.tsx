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
import { supabase } from '@/integrations/supabase/client';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import Header from '@/components/Header';
import { MobileHeader } from '@/components/ui/mobile-header';
import { Settings, Upload, X } from 'lucide-react';

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

      // Calculate new dimensions
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
  const isMobile = isMobileUserAgent();

  // County and city mapping
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

  // Initialize form data when profile loads
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

  // Generate avatar URL with caching
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
        // Add cache busting parameter for updated images
        const urlWithCacheBuster = `${data.publicUrl}?t=${Date.now()}`;
        avatarCache.set(cacheKey, urlWithCacheBuster);
        return urlWithCacheBuster;
      }
    } catch (error) {
      console.error('Error generating avatar URL:', error);
    }
    
    return null;
  }, []);

  // Update avatar URL when filename changes
  useEffect(() => {
    const updateAvatarUrl = async () => {
      const url = await generateAvatarUrl(filename);
      setAvatarUrl(url);
    };
    
    updateAvatarUrl();
  }, [filename, generateAvatarUrl]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Get available cities based on selected county
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

    // Clear previous messages
    setError(null);
    setSuccess(null);

    // Validate file
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
      // Step 1: Resize image (25% progress)
      setUploadProgress(25);
      const resizedBlob = await resizeImage(file, 400, 400, 0.8);
      
      // Step 2: Remove old avatar if exists (50% progress)
      setUploadProgress(50);
      if (filename) {
        try {
          await supabase.storage
            .from('avatars')
            .remove([filename]);
          
          // Invalidate cache for old image
          avatarCache.invalidate(`avatar_${filename}`);
        } catch (error) {
          console.warn('Could not remove old avatar:', error);
        }
      }

      // Step 3: Generate unique filename (60% progress)
      setUploadProgress(60);
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const newFilename = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Step 4: Upload new avatar (80% progress)
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

      // Step 5: Update profile (90% progress)
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

      // Step 6: Update local state (100% progress)
      setUploadProgress(100);
      setFilename(newFilename);
      setSuccess('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(`Error uploading avatar: ${typeof error === 'object' && error !== null && 'message' in error ? (error as { message?: string }).message : String(error)}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      
      // Clear file input
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
      
      // Remove from storage
      await supabase.storage
        .from('avatars')
        .remove([filename]);
      
      // Update profile
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
      
      // Clear local state and cache
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${!isMobile ? 'min-w-max' : ''}`}>
      {!isMobile && <Header />}
      {isMobile && (
        <MobileHeader 
          title={'Update Profile'}
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
      )}
      
      <div className={`flex-grow mx-auto py-8 ${!isMobile ? 'container px-4':''}`}>
        <div className="/max-w-md mx-auto space-y-6">
          
          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Avatar Section */}
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <Avatar className="w-32 h-32 mx-auto border-4 border-gray-200">
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
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                    {firstName?.[0] || ''}{lastName?.[0] || ''}
                  </AvatarFallback>
                )}
              </Avatar>
              
              {avatarUrl && !uploading && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={handleRemoveAvatar}
                  title="Remove avatar"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="avatar" className="text-sm font-medium block">
                {avatarUrl ? 'Change Avatar' : 'Upload Avatar'}
              </Label>
              
              <div className="flex items-center gap-2">
                <Input 
                  type="file" 
                  id="avatar" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  disabled={uploading}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => document.getElementById('avatar')?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              
              {uploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-blue-600">
                    {uploadProgress < 25 ? 'Preparing image...' :
                     uploadProgress < 50 ? 'Optimizing...' :
                     uploadProgress < 80 ? 'Uploading...' :
                     uploadProgress < 100 ? 'Saving...' : 'Complete!'}
                  </p>
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                Supported: JPEG, PNG, WebP (max 10MB)
              </p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                disabled={loading}
              />
            </div>
            
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                disabled={loading}
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
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed from this page
              </p>
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <PhoneInput
                id="phone"
                value={phone}
                onChange={(value) => setPhone(value)}
                disabled={loading}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="county">County</Label>
                <Select value={county} onValueChange={(value) => {
                  setCounty(value);
                  setCity(''); // Reset city when county changes
                }}>
                  <SelectTrigger>
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
              
              <div>
                <Label htmlFor="city">City/Town</Label>
                <Select 
                  value={city} 
                  onValueChange={(value) => setCity(value)}
                  disabled={!county}
                >
                  <SelectTrigger>
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
            
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your street address"
                disabled={loading}
                rows={3}
              />
            </div>
            
            <Button 
              onClick={handleUpdateProfile} 
              disabled={loading || uploading}
              className="w-full"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;