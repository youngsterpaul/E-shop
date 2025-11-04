import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface County {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface City {
  id: string;
  county_id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export const useLocations = () => {
  const { data: counties, isLoading: countiesLoading, refetch: refetchCounties } = useQuery({
    queryKey: ['counties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('counties')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as County[];
    }
  });

  const { data: cities, isLoading: citiesLoading, refetch: refetchCities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as City[];
    }
  });

  const getCountyOptions = () => {
    return counties?.map(county => ({
      value: county.slug,
      label: county.name
    })) || [];
  };

  const getCityOptions = (countySlug: string) => {
    if (!counties || !cities) return [];
    
    const county = counties.find(c => c.slug === countySlug);
    if (!county) return [];

    return cities
      .filter(city => city.county_id === county.id)
      .map(city => ({
        value: city.slug,
        label: city.name
      }));
  };

  return {
    counties,
    cities,
    isLoading: countiesLoading || citiesLoading,
    getCountyOptions,
    getCityOptions,
    refetchCounties,
    refetchCities
  };
};