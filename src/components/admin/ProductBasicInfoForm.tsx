import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  categories: string;
  featured: boolean;
  features: string;
  specification: string;
}

interface ProductBasicInfoFormProps {
  form: UseFormReturn<ProductFormData>;
}

const ProductBasicInfoForm: React.FC<ProductBasicInfoFormProps> = ({ form }) => {
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

        <FormField
          control={form.control}
          name="stock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Seller's Phone*</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0"
                  value={field.value}
                  onChange={e => field.onChange(parseInt(e.target.value))}
                  placeholder="e.g., 0712345678" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/*<FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description*</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Describe your product" required rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />*/}
      </CardContent>
    </Card>
  );
};

export default ProductBasicInfoForm;
