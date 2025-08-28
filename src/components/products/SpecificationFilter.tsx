
import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SpecificationFilterProps {
  selectedCategories: string[];
  selectedSubcategories: string[];
}

interface SpecificationOption {
  key: string;
  values: string[];
}

const SpecificationFilter = ({
  selectedCategories,
  selectedSubcategories,
}: SpecificationFilterProps) => {
  const [specifications, setSpecifications] = useState<SpecificationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [openSpecs, setOpenSpecs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchSpecifications = async () => {
      if (selectedCategories.length === 0) return;

      setLoading(true);
      try {
        // Fetch unique specification keys and values for selected categories
        const { data, error } = await supabase
          .from('products')
          .select('specification')
          .in('categories', selectedCategories)
          .not('specification', 'is', null);

        if (error) throw error;

        // Process specifications to extract unique keys and values
        const specMap = new Map<string, Set<string>>();
        
        data?.forEach(product => {
          if (product.specification && typeof product.specification === 'object') {
            Object.entries(product.specification as Record<string, any>).forEach(([key, value]) => {
              if (typeof value === 'string' || typeof value === 'number') {
                if (!specMap.has(key)) {
                  specMap.set(key, new Set());
                }
                specMap.get(key)?.add(String(value));
              }
            });
          }
        });

        const specsArray = Array.from(specMap.entries()).map(([key, values]) => ({
          key,
          values: Array.from(values).sort()
        }));

        setSpecifications(specsArray);
      } catch (error) {
        console.error('Error fetching specifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecifications();
  }, [selectedCategories, selectedSubcategories]);

  const toggleSpec = (specKey: string) => {
    const newOpenSpecs = new Set(openSpecs);
    if (newOpenSpecs.has(specKey)) {
      newOpenSpecs.delete(specKey);
    } else {
      newOpenSpecs.add(specKey);
    }
    setOpenSpecs(newOpenSpecs);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading specifications...</div>;
  }

  if (specifications.length === 0) {
    return <div className="text-sm text-gray-500">No specifications available</div>;
  }

  return (
    <div className="space-y-2">
      {specifications.slice(0, 5).map((spec) => (
        <Collapsible key={spec.key} open={openSpecs.has(spec.key)}>
          <CollapsibleTrigger
            onClick={() => toggleSpec(spec.key)}
            className="flex items-center justify-between w-full text-sm font-medium hover:text-gray-700"
          >
            <span className="capitalize">{spec.key.replace(/_/g, ' ')}</span>
            {openSpecs.has(spec.key) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="space-y-2 max-h-32 overflow-y-auto pl-2">
              {spec.values.slice(0, 10).map((value) => (
                <div key={value} className="flex items-center">
                  <Checkbox
                    id={`${spec.key}-${value}`}
                    // You can add state management for selected spec values here
                  />
                  <label
                    htmlFor={`${spec.key}-${value}`}
                    className="ml-2 text-sm cursor-pointer"
                  >
                    {value}
                  </label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
};

export default SpecificationFilter;
