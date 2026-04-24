import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { AIProductHelper } from './AIProductHelper';

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

interface AdvancedProductFormProps {
  form: UseFormReturn<ProductFormData>;
}

const AdvancedProductForm: React.FC<AdvancedProductFormProps> = ({ form }) => {
  const [featureItems, setFeatureItems] = React.useState<string[]>([]);
  const [newFeature, setNewFeature] = React.useState('');
  const [specItems, setSpecItems] = React.useState<Array<{ key: string; value: string }>>([]);
  const [newSpecKey, setNewSpecKey] = React.useState('');
  const [newSpecValue, setNewSpecValue] = React.useState('');
  const [isfeaturesOpen, setIsfeaturesOpen] = React.useState(false);
  const [isSpecsOpen, setIsSpecsOpen] = React.useState(false);

  React.useEffect(() => {
    const featuresValue = form.getValues('features');
    if (featuresValue) {
      const items = featuresValue.split('\n').map(item => item.trim()).filter(Boolean);
      setFeatureItems(items);
    }

    const specValue = form.getValues('specification');
    if (specValue) {
      try {
        const parsed = JSON.parse(specValue);
        if (typeof parsed === 'object' && parsed !== null) {
          const items = Object.entries(parsed).map(([key, value]) => ({
            key,
            value: String(value)
          }));
          setSpecItems(items);
        }
      } catch (e) {
        if (specValue.trim()) {
          setSpecItems([{ key: 'description', value: specValue }]);
        }
      }
    }
  }, [form]);

  const addFeature = () => {
    if (newFeature.trim()) {
      const updated = [...featureItems, newFeature.trim()];
      setFeatureItems(updated);
      form.setValue('features', updated.join('\n'));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    const updated = featureItems.filter((_, i) => i !== index);
    setFeatureItems(updated);
    form.setValue('features', updated.join('\n'));
  };

  const addSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      const updated = [...specItems, { key: newSpecKey.trim(), value: newSpecValue.trim() }];
      setSpecItems(updated);
      const specObject = updated.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string>);
      form.setValue('specification', JSON.stringify(specObject, null, 2));
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const removeSpecification = (index: number) => {
    const updated = specItems.filter((_, i) => i !== index);
    setSpecItems(updated);
    const specObject = updated.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);
    form.setValue('specification', JSON.stringify(specObject, null, 2));
  };

  const handleAIFeatures = (aiFeatures: string[] | Record<string, string>) => {
    if (Array.isArray(aiFeatures)) {
      const updated = [...featureItems, ...aiFeatures];
      setFeatureItems(updated);
      form.setValue('features', updated.join('\n'));
    }
  };

  const handleAISpecifications = (aiSpecs: string[] | Record<string, string>) => {
    if (!Array.isArray(aiSpecs)) {
      const newItems = Object.entries(aiSpecs).map(([key, value]) => ({ key, value }));
      const updated = [...specItems, ...newItems];
      setSpecItems(updated);
      const specObject = updated.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string>);
      form.setValue('specification', JSON.stringify(specObject, null, 2));
    }
  };

  const productName = form.watch('name') || '';
  const productCategory = form.watch('categories') || '';
  const productDescription = form.watch('description') || '';

  return (
    <div className="space-y-6">
      <Card>
        <Collapsible open={isfeaturesOpen} onOpenChange={setIsfeaturesOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                Features
                <Badge variant="outline">{featureItems.length}</Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <AIProductHelper
                productName={productName}
                category={productCategory}
                description={productDescription}
                type="features"
                onApply={handleAIFeatures}
                existingItems={featureItems}
              />
              
              <div className="flex gap-2">
                <Input
                  placeholder="Enter feature manually"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <Button type="button" onClick={addFeature} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {featureItems.length > 0 && (
                <div className="space-y-2">
                  {featureItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded bg-muted/30">
                      <Input
                        value={item}
                        onChange={(e) => {
                          const updated = [...featureItems];
                          updated[index] = e.target.value;
                          setFeatureItems(updated);
                          form.setValue('features', updated.join('\n'));
                        }}
                        className="flex-1 h-8 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card>
        <Collapsible open={isSpecsOpen} onOpenChange={setIsSpecsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                Specifications
                <Badge variant="outline">{specItems.length}</Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <AIProductHelper
                productName={productName}
                category={productCategory}
                description={productDescription}
                type="specifications"
                onApply={handleAISpecifications}
                existingItems={specItems}
              />
              
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Property name (e.g., Weight)"
                  value={newSpecKey}
                  onChange={(e) => setNewSpecKey(e.target.value)}
                />
                <div className="flex gap-1">
                  <Input
                    placeholder="Value (e.g., 500g)"
                    value={newSpecValue}
                    onChange={(e) => setNewSpecValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecification())}
                  />
                  <Button type="button" onClick={addSpecification} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {specItems.length > 0 && (
                <div className="space-y-2">
                  {specItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded bg-muted/30">
                      <Input
                        value={item.key}
                        onChange={(e) => {
                          const updated = [...specItems];
                          updated[index] = { ...updated[index], key: e.target.value };
                          setSpecItems(updated);
                          const specObject = updated.reduce((acc, spec) => {
                            acc[spec.key] = spec.value;
                            return acc;
                          }, {} as Record<string, string>);
                          form.setValue('specification', JSON.stringify(specObject, null, 2));
                        }}
                        placeholder="Property"
                        className="w-1/3 h-8 text-sm font-medium"
                      />
                      <Input
                        value={item.value}
                        onChange={(e) => {
                          const updated = [...specItems];
                          updated[index] = { ...updated[index], value: e.target.value };
                          setSpecItems(updated);
                          const specObject = updated.reduce((acc, spec) => {
                            acc[spec.key] = spec.value;
                            return acc;
                          }, {} as Record<string, string>);
                          form.setValue('specification', JSON.stringify(specObject, null, 2));
                        }}
                        placeholder="Value"
                        className="flex-1 h-8 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSpecification(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Featured Product
                  </FormLabel>
                  <div className="text-sm text-muted-foreground">
                    This product will be displayed in the featured products section
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedProductForm;
