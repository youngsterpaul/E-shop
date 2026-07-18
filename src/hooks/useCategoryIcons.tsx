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
  productCount: number;
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
      // 1. Fetch category icons with related category data
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

      // 2. Fetch parent/child relationships for every category, so we can
      //    roll subcategory product counts up into their parent category.
      const { data: allCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, parent_id');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        throw categoriesError;
      }

      const parentToChildren: Record<number, number[]> = {};
      (allCategories || []).forEach((cat: any) => {
        if (cat.parent_id != null) {
          if (!parentToChildren[cat.parent_id]) parentToChildren[cat.parent_id] = [];
          parentToChildren[cat.parent_id].push(cat.id);
        }
      });

      // 3. Fetch subcategory_id for every active product (with stock) and
      //    tally how many products fall under each category id.
      const { data: activeProducts, error: productsError } = await supabase
        .from('products')
        .select('subcategory_id')
        .eq('is_active', true)
        .not('subcategory_id', 'is', null);

      if (productsError) {
        console.error('Error fetching product counts:', productsError);
        throw productsError;
      }

      const countByCategoryId: Record<number, number> = {};
      (activeProducts || []).forEach((p: any) => {
        const subId = p.subcategory_id;
        if (subId == null) return;
        countByCategoryId[subId] = (countByCategoryId[subId] || 0) + 1;
      });

      // Returns total product count for a category id, including any
      // products assigned directly to it plus everything under its children.
      const getProductCount = (categoryId: number): number => {
        let total = countByCategoryId[categoryId] || 0;
        const children = parentToChildren[categoryId] || [];
        children.forEach((childId) => {
          total += countByCategoryId[childId] || 0;
        });
        return total;
      };
      
      // 4. Transform database records to CategoryIcon format, attaching
      //    each icon's resolved product count.
      const mapped = (data || []).map((item: any) => {
        const relevantId = item.subcategory_id ?? item.category_id;
        const productCount = item.subcategory_id
          ? countByCategoryId[item.subcategory_id] || 0
          : getProductCount(item.category_id);

        return {
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
          isActive: item.is_active,
          productCount,
        } as CategoryIcon;
      });

      // 5. Hide any category/subcategory icon that has zero active products.
      return mapped.filter((c) => c.productCount > 0);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};