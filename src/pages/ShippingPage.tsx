
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
//import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PhoneInput } from '@/components/ui/phone-input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Home, Plus, Edit, Trash2, Check, Settings } from 'lucide-react';
import { MobileHeader } from '@/components/ui/mobile-header';
import useIsMobile from '@/hooks/use-mobile';

interface ShippingAddress {
  id: string;
  recipient_name: string;
  street_address: string;
  city: string;
  postal_code: string | null;
  country: string;
  phone_number: string;
  is_default: boolean | null;
}

const ShippingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile;
  
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<ShippingAddress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [recipientName, setRecipientName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchAddresses();
  }, [user, navigate]);
  
  const fetchAddresses = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_shipping_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
        
      if (error) throw error;
      
      setAddresses(data || []);
    } catch (error: any) {
      console.error('Error fetching addresses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your shipping addresses.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddAddress = async () => {
    if (!user) return;
    
    if (!recipientName || !streetAddress || !city || !phoneNumber) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // If this is the first address, make it default
      const shouldBeDefault = addresses.length === 0 ? true : isDefault;
      
      const { data, error } = await supabase
        .from('user_shipping_addresses')
        .insert({
          user_id: user.id,
          recipient_name: recipientName,
          street_address: streetAddress,
          city: city,
          postal_code: postalCode || null,
          phone_number: phoneNumber,
          is_default: shouldBeDefault
        })
        .select();
        
      if (error) throw error;
      
      // Reset form
      resetForm();
      setIsAddDialogOpen(false);
      
      // Refresh addresses
      fetchAddresses();
      
      toast({
        title: "Address added",
        description: "Your shipping address has been added successfully.",
      });
      
    } catch (error: any) {
      console.error('Error adding address:', error);
      toast({
        title: "Error",
        description: "Failed to add shipping address.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditAddress = async () => {
    if (!user || !selectedAddress) return;
    
    if (!recipientName || !streetAddress || !city || !phoneNumber) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('user_shipping_addresses')
        .update({
          recipient_name: recipientName,
          street_address: streetAddress,
          city: city,
          postal_code: postalCode || null,
          phone_number: phoneNumber,
          is_default: isDefault
        })
        .eq('id', selectedAddress.id);
        
      if (error) throw error;
      
      // Reset form
      resetForm();
      setIsEditDialogOpen(false);
      setSelectedAddress(null);
      
      // Refresh addresses
      fetchAddresses();
      
      toast({
        title: "Address updated",
        description: "Your shipping address has been updated successfully.",
      });
      
    } catch (error: any) {
      console.error('Error updating address:', error);
      toast({
        title: "Error",
        description: "Failed to update shipping address.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteAddress = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_shipping_addresses')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh addresses
      fetchAddresses();
      
      toast({
        title: "Address deleted",
        description: "Your shipping address has been deleted successfully.",
      });
      
    } catch (error: any) {
      console.error('Error deleting address:', error);
      toast({
        title: "Error",
        description: "Failed to delete shipping address.",
        variant: "destructive"
      });
    }
  };
  
  const handleSetAsDefault = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_shipping_addresses')
        .update({ is_default: true })
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh addresses
      fetchAddresses();
      
      toast({
        title: "Default address set",
        description: "Your default shipping address has been updated.",
      });
      
    } catch (error: any) {
      console.error('Error setting default address:', error);
      toast({
        title: "Error",
        description: "Failed to set default shipping address.",
        variant: "destructive"
      });
    }
  };
  
  const openEditDialog = (address: ShippingAddress) => {
    setSelectedAddress(address);
    setRecipientName(address.recipient_name);
    setStreetAddress(address.street_address);
    setCity(address.city);
    setPostalCode(address.postal_code || '');
    setPhoneNumber(address.phone_number);
    setIsDefault(Boolean(address.is_default));
    setIsEditDialogOpen(true);
  };
  
  const resetForm = () => {
    setRecipientName('');
    setStreetAddress('');
    setCity('');
    setPostalCode('');
    setPhoneNumber('');
    setIsDefault(false);
  };
  
  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {!isMobile && <Header />}
      {isMobile && isMobile() && (
        <MobileHeader 
          title={'Shipping Address'}
          backTo="/"
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
      )}
      <main className="flex-grow container py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Shipping Addresses</h1>
            <p className="text-muted-foreground">Manage your shipping addresses</p>
          </div>
          
          <Button 
            onClick={openAddDialog} 
            className="bg-orange-500 hover:bg-orange-600 mt-4 md:mt-0"
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Address
          </Button>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="relative shadow-sm animate-pulse">
                <CardContent className="p-6">
                  <div className="h-5 w-32 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Home className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No addresses yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't added any shipping addresses yet.
              </p>
              <Button 
                onClick={openAddDialog} 
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Plus className="mr-2 h-4 w-4" /> Add New Address
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <Card key={address.id} className="relative shadow-sm">
                {address.is_default && (
                  <Badge className="absolute top-2 right-2 bg-orange-500">
                    Default
                  </Badge>
                )}
                <CardContent className="p-6">
                  <h3 className="font-medium text-lg mb-2">{address.recipient_name}</h3>
                  <p className="text-muted-foreground mb-1">{address.street_address}</p>
                  <p className="text-muted-foreground mb-1">
                    {address.city}{address.postal_code ? `, ${address.postal_code}` : ''}
                  </p>
                  <p className="text-muted-foreground mb-4">{address.phone_number}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {!address.is_default && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSetAsDefault(address.id)}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Set as Default
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(address)}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      
      {/* Add Address Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Shipping Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Full Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="streetAddress">Street Address</Label>
              <Input
                id="streetAddress"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Street address, apartment, etc."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code (Optional)</Label>
                <Input
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Postal code"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <PhoneInput
                id="phoneNumber"
                value={phoneNumber}
                onChange={(value) => setPhoneNumber(value)}
                placeholder="+254712345678"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                title="Set as default address"
              />
              <Label htmlFor="isDefault">Set as default address</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddAddress}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Address Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Shipping Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editRecipientName">Recipient Name</Label>
              <Input
                id="editRecipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Full Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editStreetAddress">Street Address</Label>
              <Input
                id="editStreetAddress"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Street address, apartment, etc."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCity">City</Label>
                <Input
                  id="editCity"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editPostalCode">Postal Code (Optional)</Label>
                <Input
                  id="editPostalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Postal code"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editPhoneNumber">Phone Number</Label>
              <PhoneInput
                id="editPhoneNumber"
                value={phoneNumber}
                onChange={(value) => setPhoneNumber(value)}
                placeholder="+254712345678"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                title="Set as default address"
              />
              <Label htmlFor="editIsDefault">Set as default address</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedAddress(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleEditAddress}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShippingPage;
