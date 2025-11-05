import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DeliveryAddress {
  id: string;
  user_id: string;
  address_name: string | null;
  full_name: string;
  phone: string;
  street_address: string;
  city: string;
  county: string;
  is_default: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useDeliveryAddresses = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all addresses for the current user
  const fetchAddresses = async () => {
    if (!user?.id) {
      setAddresses([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Ensure is_default is always boolean
      const normalizedData = (data || []).map(addr => ({
        ...addr,
        is_default: addr.is_default ?? false
      }));
      setAddresses(normalizedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setError('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  // Get default address
  const getDefaultAddress = () => {
    return addresses.find(addr => addr.is_default) || addresses[0] || null;
  };

  // Add new address
  const addAddress = async (addressData: Omit<DeliveryAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('delivery_addresses')
        .insert({
          ...addressData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      await fetchAddresses();
      return data;
    } catch (err) {
      console.error('Error adding address:', err);
      throw err;
    }
  };

  // Update address
  const updateAddress = async (id: string, updates: Partial<Omit<DeliveryAddress, 'id' | 'user_id' | 'created_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('delivery_addresses')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchAddresses();
      return data;
    } catch (err) {
      console.error('Error updating address:', err);
      throw err;
    }
  };

  // Delete address
  const deleteAddress = async (id: string) => {
    try {
      const { error } = await supabase
        .from('delivery_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAddresses();
    } catch (err) {
      console.error('Error deleting address:', err);
      throw err;
    }
  };

  // Set default address
  const setDefaultAddress = async (id: string) => {
    try {
      await updateAddress(id, { is_default: true });
    } catch (err) {
      console.error('Error setting default address:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user?.id]);

  return {
    addresses,
    loading,
    error,
    getDefaultAddress,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refreshAddresses: fetchAddresses
  };
};