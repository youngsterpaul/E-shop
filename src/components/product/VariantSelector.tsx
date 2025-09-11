import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface VariantValue {
  id: string;
  name: string;
  value: string;
  available: boolean;
  priceModifier?: number;
  image?: string;
}

interface VariantType {
  id: string;
  name: string;
  type: 'color' | 'size' | 'material' | 'other';
  values: VariantValue[];
}

interface VariantSelectorProps {
  variants: VariantType[];
  selectedVariants: Record<string, string>;
  onVariantChange: (variantTypeId: string, variantValueId: string) => void;
  stockInfo?: Record<string, number>;
}

const VariantSelector = ({ 
  variants, 
  selectedVariants, 
  onVariantChange,
  stockInfo = {}
}: VariantSelectorProps) => {
  const [hoveredVariant, setHoveredVariant] = useState<string | null>(null);
  const [variantsInitialized, setVariantsInitialized] = useState(false);

  // Auto-select first available variant for each type
  useEffect(() => {
    if (variants.length > 0 && !variantsInitialized) {
      variants.forEach(variant => {
        // Only auto-select if no variant is already selected for this type
        if (!selectedVariants[variant.id]) {
          const firstAvailable = variant.values.find(value => value.available);
          if (firstAvailable) {
            onVariantChange(variant.id, firstAvailable.id);
          }
        }
      });
      setVariantsInitialized(true);
    }
  }, [variants, selectedVariants, onVariantChange, variantsInitialized]);

  const isVariantAvailable = (variantTypeId: string, variantValueId: string) => {
    const stockKey = `${variantTypeId}-${variantValueId}`;
    return (stockInfo[stockKey] || 10) > 0;
  };

  const getVariantStock = (variantTypeId: string, variantValueId: string) => {
    const stockKey = `${variantTypeId}-${variantValueId}`;
    return stockInfo[stockKey] || 10;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  const renderColorVariant = (variant: VariantType) => (
    <div key={variant.id} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-base font-semibold text-gray-900">
            {variant.name}
          </Label>
          {selectedVariants[variant.id] && (
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
              {variant.values.find(v => v.id === selectedVariants[variant.id])?.name}
            </span>
          )}
        </div>
        {selectedVariants[variant.id] && (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            {getVariantStock(variant.id, selectedVariants[variant.id])} in stock
          </Badge>
        )}
      </div>
      
      <RadioGroup 
        value={selectedVariants[variant.id] || ''} 
        onValueChange={(value) => onVariantChange(variant.id, value)}
        className="flex gap-3 flex-wrap"
      >
        {variant.values.map((value) => {
          const isAvailable = isVariantAvailable(variant.id, value.id);
          const isSelected = selectedVariants[variant.id] === value.id;
          
          return (
            <div key={value.id} className="relative">
              <RadioGroupItem
                value={value.id}
                id={`${variant.id}-${value.id}`}
                className="sr-only"
                disabled={!isAvailable}
              />
              <Label
                htmlFor={`${variant.id}-${value.id}`}
                className={`
                  w-14 h-14 rounded-full border-3 cursor-pointer transition-all duration-200
                  flex items-center justify-center relative shadow-sm hover:shadow-md
                  ${isSelected 
                    ? 'border-orange-500 ring-3 ring-orange-200 scale-110 shadow-lg' 
                    : isAvailable 
                      ? 'border-gray-300 hover:border-gray-400 hover:scale-105' 
                      : 'border-gray-200 opacity-40 cursor-not-allowed'
                  }
                `}
                style={{ backgroundColor: value.value }}
                onMouseEnter={() => setHoveredVariant(value.id)}
                onMouseLeave={() => setHoveredVariant(null)}
                title={`${value.name} ${!isAvailable ? '(Out of stock)' : ''}`}
              >
                {!isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-0.5 bg-red-500 rotate-45 absolute"></div>
                  </div>
                )}
                {isSelected && (
                  <div className="w-5 h-5 bg-white rounded-full border-2 border-gray-300 shadow-sm"></div>
                )}
              </Label>
              
              {hoveredVariant === value.id && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded-lg whitespace-nowrap z-10 shadow-lg">
                  {value.name}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1"></div>
                </div>
              )}
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );

  const renderSizeVariant = (variant: VariantType) => (
    <div key={variant.id} className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold text-gray-900">{variant.name}</Label>
        {selectedVariants[variant.id] && (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            {getVariantStock(variant.id, selectedVariants[variant.id])} in stock
          </Badge>
        )}
      </div>
      
      <RadioGroup 
        value={selectedVariants[variant.id] || ''} 
        onValueChange={(value) => onVariantChange(variant.id, value)}
        className="flex gap-3 flex-wrap"
      >
        {variant.values.map((value) => {
          const isAvailable = isVariantAvailable(variant.id, value.id);
          const isSelected = selectedVariants[variant.id] === value.id;
          
          return (
            <div key={value.id}>
              <RadioGroupItem
                value={value.id}
                id={`${variant.id}-${value.id}`}
                className="sr-only"
                disabled={!isAvailable}
              />
              <Label
                htmlFor={`${variant.id}-${value.id}`}
                className={`
                  px-5 py-3 border-2 rounded-xl cursor-pointer transition-all duration-200 
                  min-w-[4rem] text-center font-medium shadow-sm hover:shadow-md
                  ${isSelected
                    ? 'border-orange-500 bg-orange-500 text-white shadow-lg'
                    : isAvailable
                      ? 'border-gray-300 hover:border-orange-300 hover:bg-orange-50 text-gray-700'
                      : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                <div className="text-sm font-medium">{value.name}</div>
                {value.priceModifier && value.priceModifier !== 0 && (
                  <div className={`text-xs mt-1 ${isSelected ? 'text-orange-100' : 'text-gray-500'}`}>
                    {value.priceModifier > 0 ? '+' : ''}{formatPrice(Math.abs(value.priceModifier))}
                  </div>
                )}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );

  const renderMaterialVariant = (variant: VariantType) => (
    <div key={variant.id} className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold text-gray-900">{variant.name}</Label>
        {selectedVariants[variant.id] && (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            {getVariantStock(variant.id, selectedVariants[variant.id])} in stock
          </Badge>
        )}
      </div>
      
      <RadioGroup 
        value={selectedVariants[variant.id] || ''} 
        onValueChange={(value) => onVariantChange(variant.id, value)}
        className="grid grid-cols-2 gap-3"
      >
        {variant.values.map((value) => {
          const isAvailable = isVariantAvailable(variant.id, value.id);
          const isSelected = selectedVariants[variant.id] === value.id;
          
          return (
            <div key={value.id}>
              <RadioGroupItem
                value={value.id}
                id={`${variant.id}-${value.id}`}
                className="sr-only"
                disabled={!isAvailable}
              />
              <Label
                htmlFor={`${variant.id}-${value.id}`}
                className={`
                  flex items-center justify-center px-4 py-3 border-2 rounded-xl cursor-pointer 
                  transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md
                  ${isSelected
                    ? 'border-orange-500 bg-orange-500 text-white shadow-lg'
                    : isAvailable
                      ? 'border-gray-300 hover:border-orange-300 hover:bg-orange-50 text-gray-700'
                      : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {value.name}
                {value.priceModifier && value.priceModifier !== 0 && (
                  <span className={`ml-2 text-xs ${isSelected ? 'text-orange-100' : 'text-gray-500'}`}>
                    ({value.priceModifier > 0 ? '+' : ''}{formatPrice(Math.abs(value.priceModifier))})
                  </span>
                )}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );

  const renderOtherVariant = (variant: VariantType) => (
    <div key={variant.id} className="space-y-4">
      <Label className="text-base font-semibold text-gray-900">{variant.name}</Label>
      <RadioGroup 
        value={selectedVariants[variant.id] || ''} 
        onValueChange={(value) => onVariantChange(variant.id, value)}
        className="space-y-3"
      >
        {variant.values.map((value) => {
          const isAvailable = isVariantAvailable(variant.id, value.id);
          const isSelected = selectedVariants[variant.id] === value.id;
          
          return (
            <div key={value.id} className="flex items-center space-x-3">
              <RadioGroupItem
                value={value.id}
                id={`${variant.id}-${value.id}`}
                disabled={!isAvailable}
                className={`${isSelected ? 'border-orange-500 text-orange-500' : ''}`}
              />
              <Label
                htmlFor={`${variant.id}-${value.id}`}
                className={`text-sm font-medium cursor-pointer ${
                  !isAvailable ? 'text-gray-400' : 'text-gray-700'
                }`}
              >
                {value.name}
                {!isAvailable && ' (Out of stock)'}
                {value.priceModifier && value.priceModifier !== 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({value.priceModifier > 0 ? '+' : ''}{formatPrice(Math.abs(value.priceModifier))})
                  </span>
                )}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );

  if (variants.length === 0) return null;

  return (
    <div className="space-y-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
        Select Options
      </h3>
      {variants.map((variant) => {
        switch (variant.type) {
          case 'color':
            return renderColorVariant(variant);
          case 'size':
            return renderSizeVariant(variant);
          case 'material':
            return renderMaterialVariant(variant);
          default:
            return renderOtherVariant(variant);
        }
      })}
    </div>
  );
};

export default VariantSelector;
