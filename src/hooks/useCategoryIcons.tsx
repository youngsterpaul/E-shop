import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Smartphone, 
  Laptop, 
  Headphones, 
  Camera, 
  Watch, 
  Gamepad2, 
  Tv, 
  Speaker,
  Monitor,
  Tablet,
  Router,
  Battery,
  Keyboard,
  Mouse,
  HardDrive,
  Usb,
  Printer,
  Wifi,
  Car,
  Home
} from 'lucide-react';

export interface CategoryIcon {
  id: number;
  name: string;
  iconName: string;
  icon: any; // Lucide icon component
  categoryId: number;
  subcategoryId?: number | null;
  categoryName: string;
  subcategoryName?: string | null;
  categorySlug?: string | null;
  subcategorySlug?: string | null;
  color: string;
  iconColor: string;
  productImage?: string | null;
  displayOrder: number;
  isActive: boolean;
}

// Map icon names to Lucide components
const iconMap: Record<string, any> = {
  Smartphone,
  Laptop,
  Headphones,
  Camera,
  Watch,
  Gamepad2,
  Tv,
  Speaker,
  Monitor,
  Tablet,
  Router,
  Battery,
  Keyboard,
  Mouse,
  HardDrive,
  Usb,
  Printer,
  Wifi,
  Car,
  Home
};

export const useCategoryIcons = () => {
  return useQuery({
    queryKey: ['categoryIcons'],
    queryFn: async () => {
      // Fetch category icons with related category data
      const { data, error } = await supabase
        .from('category_icons')
        .select(`
          *,
          category:categories!category_icons_category_id_fkey(id, category, slug),
          subcategory:categories!category_icons_subcategory_id_fkey(id, category, slug)
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching category icons:', error);
        throw error;
      }
      
      // Transform database records to CategoryIcon format
      return (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        iconName: item.icon_name,
        icon: iconMap[item.icon_name] || Smartphone, // Fallback icon
        categoryId: item.category_id,
        subcategoryId: item.subcategory_id,
        categoryName: item.category?.category || 'Unknown',
        subcategoryName: item.subcategory?.category || null,
        categorySlug: item.category?.slug || null,
        subcategorySlug: item.subcategory?.slug || null,
        color: item.color,
        iconColor: item.icon_color,
        productImage: item.product_image,
        displayOrder: item.display_order,
        isActive: item.is_active
      })) as CategoryIcon[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};