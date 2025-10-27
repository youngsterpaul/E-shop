<<<<<<< HEAD

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

  return (
    <div className="space-y-6">
      <Card>
        <Collapsible open={isfeaturesOpen} onOpenChange={setIsfeaturesOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <CardTitle className="flex items-center justify-between">
                Features
                <Badge variant="outline">{featureItems.length}</Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter feature"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                />
                <Button type="button" onClick={addFeature} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {featureItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{item}</span>
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
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card>
        <Collapsible open={isSpecsOpen} onOpenChange={setIsSpecsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <CardTitle className="flex items-center justify-between">
                Specifications
                <Badge variant="outline">{specItems.length}</Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
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
                    onKeyPress={(e) => e.key === 'Enter' && addSpecification()}
                  />
                  <Button type="button" onClick={addSpecification} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {specItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex gap-2 text-sm">
                      <span className="font-medium">{item.key}:</span>
                      <span>{item.value}</span>
                    </div>
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
=======

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

  return (
    <div className="space-y-6">
      <Card>
        <Collapsible open={isfeaturesOpen} onOpenChange={setIsfeaturesOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <CardTitle className="flex items-center justify-between">
                Features
                <Badge variant="outline">{featureItems.length}</Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter feature"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                />
                <Button type="button" onClick={addFeature} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {featureItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{item}</span>
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
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card>
        <Collapsible open={isSpecsOpen} onOpenChange={setIsSpecsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <CardTitle className="flex items-center justify-between">
                Specifications
                <Badge variant="outline">{specItems.length}</Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
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
                    onKeyPress={(e) => e.key === 'Enter' && addSpecification()}
                  />
                  <Button type="button" onClick={addSpecification} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {specItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex gap-2 text-sm">
                      <span className="font-medium">{item.key}:</span>
                      <span>{item.value}</span>
                    </div>
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
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
