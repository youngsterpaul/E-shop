import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface County {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  delivery_fee?: number;
}

export interface City {
  id: string;
  county_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  delivery_fee?: number;
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
      label: county.name,
      delivery_fee: Number(county.delivery_fee || 0),
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
        label: city.name,
        delivery_fee: Number(city.delivery_fee || 0),
      }));
  };

  /**
   * Resolve the delivery fee for a given county+city slug pair.
   * City fee takes precedence; falls back to county fee; defaults to 0.
   */
  const getDeliveryFee = (countySlug: string, citySlug: string): number => {
    if (!counties || !cities) return 0;
    const county = counties.find(c => c.slug === countySlug);
    if (!county) return 0;
    const city = cities.find(c => c.slug === citySlug && c.county_id === county.id);
    const cityFee = Number(city?.delivery_fee || 0);
    if (cityFee > 0) return cityFee;
    return Number(county.delivery_fee || 0);
  };

  const slugify = (s: string) =>
    s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  /**
   * Used when a customer's area isn't in the list yet. Creates the county
   * (if needed) and city as new rows so the location becomes a real, reusable
   * option going forward, then returns the slugs to select immediately.
   */
  const addCustomLocation = async (
    countyName: string,
    cityName: string
  ): Promise<{ countySlug: string; citySlug: string } | null> => {
    const countySlug = slugify(countyName);
    const citySlug = slugify(cityName);
    if (!countySlug || !citySlug) return null;

    try {
      // Find or create the county
      let county = counties?.find((c) => c.slug === countySlug);
      if (!county) {
        const { data: newCounty, error: countyError } = await supabase
          .from('counties')
          .insert({ name: countyName.trim(), slug: countySlug, delivery_fee: 350, is_active: true })
          .select()
          .single();
        if (countyError) {
          // Someone else may have just created the same slug — try fetching it instead
          const { data: existing } = await supabase
            .from('counties').select('*').eq('slug', countySlug).maybeSingle();
          if (!existing) throw countyError;
          county = existing as County;
        } else {
          county = newCounty as County;
        }
      }

      // Find or create the city under that county
      let city = cities?.find((c) => c.slug === citySlug && c.county_id === county!.id);
      if (!city) {
        const { data: newCity, error: cityError } = await supabase
          .from('cities')
          .insert({
            name: cityName.trim(),
            slug: citySlug,
            county_id: county!.id,
            delivery_fee: 0,
            is_active: true,
          })
          .select()
          .single();
        if (cityError) {
          const { data: existing } = await supabase
            .from('cities').select('*').eq('slug', citySlug).eq('county_id', county!.id).maybeSingle();
          if (!existing) throw cityError;
        }
      }

      await Promise.all([refetchCounties(), refetchCities()]);
      return { countySlug, citySlug };
    } catch (error) {
      console.error('Failed to add custom location:', error);
      return null;
    }
  };

  return {
    counties,
    cities,
    isLoading: countiesLoading || citiesLoading,
    getCountyOptions,
    getCityOptions,
    getDeliveryFee,
    addCustomLocation,
    refetchCounties,
    refetchCities
  };
};