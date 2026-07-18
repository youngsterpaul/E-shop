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
  productCount: number;
}

export interface CategoryWithHierarchy {
  id: number;
  name: string;
  slug: string | null;
  iconName: string;
  icon: any;
  subcategories: SubcategoryWithIcon[];
  productCount: number;
}

export const useCategoryHierarchy = () => {
  return useQuery({
    queryKey: ['categoryHierarchy'],
    queryFn: async () => {
      // Fetch parent categories
      const { data: parentCategories, error: parentError } = await supabase
        .from('categories')
        .select('id, category, slug, icon_name')
        .is('parent_id', null)
        .order('display_order', { ascending: true });
      
      if (parentError) {
        console.error('Error fetching parent categories:', parentError);
        throw parentError;
      }

      // Fetch all subcategories
      const { data: subcategories, error: subError } = await supabase
        .from('categories')
        .select('id, category, slug, parent_id, icon_name')
        .not('parent_id', 'is', null)
        .order('display_order', { ascending: true });
      
      if (subError) {
        console.error('Error fetching subcategories:', subError);
        // Don't throw, continue with empty subcategories
      }

      // Fetch category icons for subcategories
      const { data: categoryIcons, error: iconsError } = await supabase
        .from('category_icons')
        .select('subcategory_id, product_image, icon_name, color')
        .not('subcategory_id', 'is', null);
      
      if (iconsError) {
        console.error('Error fetching category icons:', iconsError);
        // Don't throw, continue without icons
      }

      // Fetch subcategory_id for every active product, to compute how many
      // products sit under each category / subcategory id.
      const { data: activeProducts, error: productsError } = await supabase
        .from('products')
        .select('subcategory_id')
        .eq('is_active', true)
        .not('subcategory_id', 'is', null);

      if (productsError) {
        console.error('Error fetching product counts:', productsError);
        // Don't throw — fall back to treating everything as having 0 products
        // is too aggressive, so instead skip filtering if this call fails.
      }

      const countByCategoryId: Record<number, number> = {};
      (activeProducts || []).forEach((p: any) => {
        const subId = p.subcategory_id;
        if (subId == null) return;
        countByCategoryId[subId] = (countByCategoryId[subId] || 0) + 1;
      });

      // If the product-count fetch failed, don't hide anything — better to
      // show a possibly-empty category than to hide real categories due to
      // a transient error.
      const countsAvailable = !productsError;

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
              color: iconData?.color || 'bg-gray-500',
              productCount: countByCategoryId[sub.id] || 0,
            };
          })
          // Drop subcategories with zero active products
          .filter((sub) => !countsAvailable || sub.productCount > 0);

        // Parent's total count = anything tagged directly on the parent id
        // (rare, but possible) + everything under its subcategories.
        // Use the pre-filter subcategory list for the sum so a parent with
        // products only in a now-hidden subcategory still shows correctly
        // as having 0 (it should be hidden too).
        const allSubsForParent = (subcategories || []).filter((sub: any) => sub.parent_id === parent.id);
        const subsTotal = allSubsForParent.reduce(
          (sum: number, sub: any) => sum + (countByCategoryId[sub.id] || 0),
          0
        );
        const parentDirectCount = countByCategoryId[parent.id] || 0;
        const productCount = parentDirectCount + subsTotal;

        return {
          id: parent.id,
          name: parent.category,
          slug: parent.slug,
          iconName: parent.icon_name || 'ShoppingBag',
          icon: iconMap[parent.icon_name] || ShoppingBag,
          subcategories: subs,
          productCount,
        };
      })
      // Drop parent categories with zero active products anywhere under them
      .filter((cat) => !countsAvailable || cat.productCount > 0);

      return hierarchy;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};