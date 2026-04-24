import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  store: string;
  categories: string;
  featured: boolean;
  features: string;
  specification: string;
  search_keywords: string;
}

interface ProductBasicInfoFormProps {
  form: UseFormReturn<ProductFormData>;
}

interface Store {
  id: number;
  name: string;
  phone: number | null;
}

const ProductBasicInfoForm: React.FC<ProductBasicInfoFormProps> = ({ form }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);

  useEffect(() => {
    fetchStores();
  }, []);

  // Sync keywords state from form value (for edit mode)
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'search_keywords' || !name) {
        const raw = value.search_keywords || '';
        const parsed = raw
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean);
        // Only update if different to avoid loops
        setKeywords((prev) =>
          prev.length === parsed.length && prev.every((v, i) => v === parsed[i])
            ? prev
            : parsed
        );
      }
    });
    // initial sync
    const initial = (form.getValues('search_keywords') || '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    setKeywords(initial);
    return () => subscription.unsubscribe();
  }, [form]);

  const updateForm = (next: string[]) => {
    setKeywords(next);
    form.setValue('search_keywords', next.join(', '), { shouldDirty: true });
  };

  const addKeyword = () => {
    const value = keywordInput.trim().toLowerCase();
    if (!value) return;
    if (keywords.includes(value)) {
      setKeywordInput('');
      return;
    }
    updateForm([...keywords, value]);
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) => {
    updateForm(keywords.filter((k) => k !== kw));
  };

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('store')
        .select('id, name, phone')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching stores:', error);
      } else {
        setStores(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name*</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Wireless Bluetooth Earbuds" required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (KSh)*</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01"
                    value={field.value}
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                    placeholder="e.g., 2999" 
                    required 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock*</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    value={field.value}
                    onChange={e => field.onChange(parseInt(e.target.value))}
                    placeholder="e.g., 100" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="store"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Store*</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={loading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={loading ? "Loading stores..." : "Select a store"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.name}>
                        {store.name} - {store.phone}
                      </SelectItem>
                    ))}
                    {stores.length === 0 && !loading && (
                      <div className="px-2 py-1 text-sm text-muted-foreground">No stores available</div>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Search Keywords */}
        <FormField
          control={form.control}
          name="search_keywords"
          render={() => (
            <FormItem>
              <FormLabel>Search Keywords</FormLabel>
              <p className="text-xs text-muted-foreground -mt-1">
                Tag this product with search terms (e.g. <em>laptop, notebook, ultrabook</em>) so it appears at the top when shoppers search for them.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a keyword and press Enter"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                />
                <Button type="button" onClick={addKeyword} size="sm" variant="secondary">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {keywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                      {kw}
                      <button
                        type="button"
                        onClick={() => removeKeyword(kw)}
                        className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                        aria-label={`Remove ${kw}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default ProductBasicInfoForm;
