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

const norm = (s: string | null | undefined) => (s || '').trim().toLowerCase();

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

      // 2. Fetch categories/subcategories text for every active product, to
      //    compute how many products sit under each category / subcategory.
      //    NOTE: products are tagged via the denormalized text columns
      //    `categories` (top-level category name, e.g. "fashion-clothing")
      //    and `subcategories` (subcategory name) — NOT via subcategory_id,
      //    which is null on real product rows. is_active can also be NULL
      //    on older rows (treated as active), only explicit `false` excludes.
      const { data: activeProducts, error: productsError } = await supabase
        .from('products')
        .select('categories, subcategories')
        .or('is_active.eq.true,is_active.is.null')
        .not('categories', 'is', null);

      if (productsError) {
        console.error('Error fetching product counts:', productsError);
        throw productsError;
      }

      // Total products per top-level category name (regardless of whether
      // they also have a subcategory set).
      const countByCategoryText: Record<string, number> = {};
      // Products per specific subcategory, scoped by parent category to
      // avoid name collisions across different parents.
      const countBySubcategoryKey: Record<string, number> = {};

      (activeProducts || []).forEach((p: any) => {
        const catKey = norm(p.categories);
        if (!catKey) return;
        countByCategoryText[catKey] = (countByCategoryText[catKey] || 0) + 1;

        const subKey = norm(p.subcategories);
        if (subKey) {
          const comboKey = `${catKey}||${subKey}`;
          countBySubcategoryKey[comboKey] = (countBySubcategoryKey[comboKey] || 0) + 1;
        }
      });

      // 3. Transform database records to CategoryIcon format, attaching
      //    each icon's resolved product count.
      const mapped = (data || []).map((item: any) => {
        const categoryName = item.category?.category || '';
        const subcategoryName = item.subcategory?.category || null;
        const catKey = norm(categoryName);
        const productCount = subcategoryName
          ? countBySubcategoryKey[`${catKey}||${norm(subcategoryName)}`] || 0
          : countByCategoryText[catKey] || 0;

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

      // 4. Hide any category/subcategory icon that has zero active products.
      return mapped.filter((c) => c.productCount > 0);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};