
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

  const isVariantAvailable = (variantTypeId: string, variantValueId: string) => {
    const stockKey = `${variantTypeId}-${variantValueId}`;
    return (stockInfo[stockKey] || 10) > 0;
  };

  const getVariantStock = (variantTypeId: string, variantValueId: string) => {
    const stockKey = `${variantTypeId}-${variantValueId}`;
    return stockInfo[stockKey] ||10;
  };

  const renderColorVariant = (variant: VariantType) => (
    <div key={variant.id} className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {variant.name}
          {selectedVariants[variant.id] && (
            <span className="ml-2 text-gray-600">
              ({variant.values.find(v => v.id === selectedVariants[variant.id])?.name})
            </span>
          )}
        </Label>
        {selectedVariants[variant.id] && (
          <Badge variant="outline" className="text-xs">
            Stock: {getVariantStock(variant.id, selectedVariants[variant.id])}
          </Badge>
        )}
      </div>
      
      <RadioGroup 
        value={selectedVariants[variant.id] || ''} 
        onValueChange={(value) => onVariantChange(variant.id, value)}
        className="flex gap-2 flex-wrap"
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
                  w-12 h-12 rounded-full border-2 cursor-pointer transition-all
                  flex items-center justify-center relative
                  ${isSelected 
                    ? 'border-primary ring-2 ring-primary/20 scale-110' 
                    : isAvailable 
                      ? 'border-gray-300 hover:border-gray-400 hover:scale-105' 
                      : 'border-gray-200 opacity-50 cursor-not-allowed'
                  }
                `}
                style={{ backgroundColor: value.value }}
                onMouseEnter={() => setHoveredVariant(value.id)}
                onMouseLeave={() => setHoveredVariant(null)}
                title={`${value.name} ${!isAvailable ? '(Out of stock)' : ''}`}
              >
                {!isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-0.5 bg-red-500 rotate-45 absolute"></div>
                  </div>
                )}
                {isSelected && (
                  <div className="w-4 h-4 bg-white rounded-full border border-gray-300"></div>
                )}
              </Label>
              
              {hoveredVariant === value.id && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  {value.name}
                </div>
              )}
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );

  const renderSizeVariant = (variant: VariantType) => (
    <div key={variant.id} className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{variant.name}</Label>
        {selectedVariants[variant.id] && (
          <Badge variant="outline" className="text-xs">
            Stock: {getVariantStock(variant.id, selectedVariants[variant.id])}
          </Badge>
        )}
      </div>
      
      <RadioGroup 
        value={selectedVariants[variant.id] || ''} 
        onValueChange={(value) => onVariantChange(variant.id, value)}
        className="flex gap-2 flex-wrap"
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
                  px-4 py-2 border rounded-md cursor-pointer transition-all min-w-[3rem] text-center
                  ${isSelected
                    ? 'border-primary bg-primary text-white'
                    : isAvailable
                      ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {value.name}
                {value.priceModifier && value.priceModifier !== 0 && (
                  <span className="block text-xs mt-1">
                    {value.priceModifier > 0 ? '+' : ''}KES {Math.abs(value.priceModifier)}
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
    <div key={variant.id} className="space-y-3">
      <Label className="text-sm font-medium">{variant.name}</Label>
      <RadioGroup 
        value={selectedVariants[variant.id] || ''} 
        onValueChange={(value) => onVariantChange(variant.id, value)}
        className="flex gap-2 flex-wrap"
      >
        {variant.values.map((value) => {
          const isAvailable = isVariantAvailable(variant.id, value.id);
          const isSelected = selectedVariants[variant.id] === value.id;
          
          return (
            <div key={value.id} className="flex items-center space-x-2">
              <RadioGroupItem
                value={value.id}
                id={`${variant.id}-${value.id}`}
                disabled={!isAvailable}
              />
              <Label
                htmlFor={`${variant.id}-${value.id}`}
                className={`text-sm ${!isAvailable ? 'text-gray-400' : ''}`}
              >
                {value.name}
                {!isAvailable && ' (Out of stock)'}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );

  return (
    <div className="space-y-6">
      {variants.map((variant) => {
        switch (variant.type) {
          case 'color':
            return renderColorVariant(variant);
          case 'size':
            return renderSizeVariant(variant);
          default:
            return renderOtherVariant(variant);
        }
      })}
    </div>
  );
};

export default VariantSelector;
