import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Smartphone, 
  Laptop, 
  Home,
  Tv,
  Shirt,
  Refrigerator,
  Gamepad2,
  Heart,
  Wrench,
  Baby,
  ShoppingBag,
  Headphones,
  Camera,
  Watch
} from 'lucide-react';

// Map icon names to Lucide components
const iconMap: Record<string, any> = {
  Smartphone,
  Laptop,
  Home,
  Tv,
  Shirt,
  Refrigerator,
  Gamepad2,
  Heart,
  Wrench,
  Baby,
  ShoppingBag,
  Headphones,
  Camera,
  Watch
};

export interface SubcategoryWithIcon {
  id: number;
  name: string;
  slug: string | null;
  productImage?: string | null;
  iconName?: string;
  color?: string;
}

export interface CategoryWithHierarchy {
  id: number;
  name: string;
  slug: string | null;
  iconName: string;
  icon: any;
  subcategories: SubcategoryWithIcon[];
}

export const useCategoryHierarchy = () => {
  return useQuery({
    queryKey: ['categoryHierarchy'],
    queryFn: async () => {
      console.log('Fetching category hierarchy...');
      
      // Fetch parent categories
      const { data: parentCategories, error: parentError } = await supabase
        .from('categories')
        .select('id, category, slug, icon_name')
        .is('parent_id', null)
        .order('id', { ascending: true });
      
      if (parentError) {
        console.error('Error fetching parent categories:', parentError);
        throw parentError;
      }

      console.log('Parent categories:', parentCategories);

      // Fetch all subcategories
      const { data: subcategories, error: subError } = await supabase
        .from('categories')
        .select('id, category, slug, parent_id, icon_name')
        .not('parent_id', 'is', null)
        .order('id', { ascending: true });
      
      if (subError) {
        console.error('Error fetching subcategories:', subError);
        // Don't throw, continue with empty subcategories
      }

      console.log('Subcategories:', subcategories);

      // Fetch category icons for subcategories
      const { data: categoryIcons, error: iconsError } = await supabase
        .from('category_icons')
        .select('subcategory_id, product_image, icon_name, color')
        .not('subcategory_id', 'is', null);
      
      if (iconsError) {
        console.error('Error fetching category icons:', iconsError);
        // Don't throw, continue without icons
      }

      console.log('Category icons:', categoryIcons);

      // Create a map of subcategory icons
      const iconDataMap = new Map();
      (categoryIcons || []).forEach((icon: any) => {
        iconDataMap.set(icon.subcategory_id, {
          productImage: icon.product_image,
          iconName: icon.icon_name,
          color: icon.color
        });
      });

      // Build hierarchy
      const hierarchy: CategoryWithHierarchy[] = (parentCategories || []).map((parent: any) => {
        const subs = (subcategories || [])
          .filter((sub: any) => sub.parent_id === parent.id)
          .map((sub: any) => {
            const iconData = iconDataMap.get(sub.id);
            return {
              id: sub.id,
              name: sub.category,
              slug: sub.slug,
              productImage: iconData?.productImage || null,
              iconName: iconData?.iconName || sub.icon_name,
              color: iconData?.color || 'bg-gray-500'
            };
          });

        return {
          id: parent.id,
          name: parent.category,
          slug: parent.slug,
          iconName: parent.icon_name || 'ShoppingBag',
          icon: iconMap[parent.icon_name] || ShoppingBag,
          subcategories: subs
        };
      });

      console.log('Final hierarchy:', hierarchy);
      return hierarchy;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};