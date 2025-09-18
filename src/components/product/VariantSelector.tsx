import { useState, useEffect } from 'react';
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

  // Auto-select first available variant for each type on component mount
  useEffect(() => {
    variants.forEach(variant => {
      // Only auto-select if no variant is already selected for this type
      if (!selectedVariants[variant.id]) {
        const firstAvailable = variant.values.find(value => 
          value.available && isVariantAvailable(variant.id, value.id)
        );
        if (firstAvailable) {
          onVariantChange(variant.id, firstAvailable.id);
        }
      }
    });
  }, []); // Empty dependency array to run only once on mount

  const isVariantAvailable = (variantTypeId: string, variantValueId: string) => {
    const stockKey = `${variantTypeId}-${variantValueId}`;
    return (stockInfo[stockKey] ?? 10) > 0;
  };

  const getVariantStock = (variantTypeId: string, variantValueId: string) => {
    const stockKey = `${variantTypeId}-${variantValueId}`;
    return stockInfo[stockKey] ?? 10;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  const renderColorVariant = (variant: VariantType) => {
    const selectedValue = variant.values.find(v => v.id === selectedVariants[variant.id]);
    
    return (
      <div key={variant.id} className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">{variant.name}:</span>
            {selectedValue && (
              <span className="text-sm font-semibold text-gray-900">
                {selectedValue.name}
              </span>
            )}
          </div>
          {selectedVariants[variant.id] && (
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-600 border-emerald-200">
              {getVariantStock(variant.id, selectedVariants[variant.id])} left
            </Badge>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {variant.values.map((value) => {
            const isAvailable = value.available && isVariantAvailable(variant.id, value.id);
            const isSelected = selectedVariants[variant.id] === value.id;
            
            return (
              <div key={value.id} className="relative">
                <button
                  onClick={() => isAvailable && onVariantChange(variant.id, value.id)}
                  disabled={!isAvailable}
                  className={`
                    relative w-10 h-10 rounded-full border-2 transition-all duration-200 shadow-sm
                    ${isSelected 
                      ? 'border-orange-500 shadow-md ring-2 ring-orange-200 scale-110' 
                      : isAvailable 
                        ? 'border-gray-300 hover:border-orange-300 hover:shadow-md' 
                        : 'border-gray-200 opacity-40 cursor-not-allowed'
                    }
                  `}
                  style={{ backgroundColor: value.value }}
                  onMouseEnter={() => setHoveredVariant(value.id)}
                  onMouseLeave={() => setHoveredVariant(null)}
                  title={`${value.name} ${!isAvailable ? '(Out of stock)' : ''}`}
                >
                  {!isAvailable && (
                    <>
                      <div className="absolute inset-0 bg-white bg-opacity-70 rounded-full"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-0.5 bg-red-500 rotate-45"></div>
                      </div>
                    </>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full shadow-sm border border-gray-300"></div>
                    </div>
                  )}
                </button>
                
                {hoveredVariant === value.id && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20 shadow-lg">
                    {value.name}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSizeVariant = (variant: VariantType) => {
    const selectedValue = variant.values.find(v => v.id === selectedVariants[variant.id]);
    
    return (
      <div key={variant.id} className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">{variant.name}:</span>
            {selectedValue && (
              <span className="text-sm font-semibold text-gray-900">
                {selectedValue.name}
              </span>
            )}
          </div>
          {selectedVariants[variant.id] && (
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-600 border-emerald-200">
              {getVariantStock(variant.id, selectedVariants[variant.id])} left
            </Badge>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {variant.values.map((value) => {
            const isAvailable = value.available && isVariantAvailable(variant.id, value.id);
            const isSelected = selectedVariants[variant.id] === value.id;
            
            return (
              <button
                key={value.id}
                onClick={() => isAvailable && onVariantChange(variant.id, value.id)}
                disabled={!isAvailable}
                className={`
                  px-3 py-2 min-w-[3rem] text-sm font-medium rounded-md border transition-all duration-200
                  ${isSelected
                    ? 'border-orange-500 bg-orange-500 text-white shadow-md'
                    : isAvailable
                      ? 'border-gray-300 bg-white text-gray-700 hover:border-orange-300 hover:text-orange-600'
                      : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {value.name}
                {value.priceModifier && value.priceModifier !== 0 && (
                  <div className={`text-xs mt-0.5 ${isSelected ? 'text-orange-100' : 'text-gray-500'}`}>
                    {value.priceModifier > 0 ? '+' : ''}{formatPrice(Math.abs(value.priceModifier))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMaterialVariant = (variant: VariantType) => {
    const selectedValue = variant.values.find(v => v.id === selectedVariants[variant.id]);
    
    return (
      <div key={variant.id} className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">{variant.name}:</span>
            {selectedValue && (
              <span className="text-sm font-semibold text-gray-900">
                {selectedValue.name}
              </span>
            )}
          </div>
          {selectedVariants[variant.id] && (
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-600 border-emerald-200">
              {getVariantStock(variant.id, selectedVariants[variant.id])} left
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {variant.values.map((value) => {
            const isAvailable = value.available && isVariantAvailable(variant.id, value.id);
            const isSelected = selectedVariants[variant.id] === value.id;
            
            return (
              <button
                key={value.id}
                onClick={() => isAvailable && onVariantChange(variant.id, value.id)}
                disabled={!isAvailable}
                className={`
                  px-3 py-2 text-sm font-medium rounded-md border transition-all duration-200 text-center
                  ${isSelected
                    ? 'border-orange-500 bg-orange-500 text-white shadow-md'
                    : isAvailable
                      ? 'border-gray-300 bg-white text-gray-700 hover:border-orange-300 hover:text-orange-600'
                      : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {value.name}
                {value.priceModifier && value.priceModifier !== 0 && (
                  <span className={`block text-xs mt-0.5 ${isSelected ? 'text-orange-100' : 'text-gray-500'}`}>
                    {value.priceModifier > 0 ? '+' : ''}{formatPrice(Math.abs(value.priceModifier))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOtherVariant = (variant: VariantType) => {
    const selectedValue = variant.values.find(v => v.id === selectedVariants[variant.id]);
    
    return (
      <div key={variant.id} className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">{variant.name}:</span>
            {selectedValue && (
              <span className="text-sm font-semibold text-gray-900">
                {selectedValue.name}
              </span>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          {variant.values.map((value) => {
            const isAvailable = value.available && isVariantAvailable(variant.id, value.id);
            const isSelected = selectedVariants[variant.id] === value.id;
            
            return (
              <button
                key={value.id}
                onClick={() => isAvailable && onVariantChange(variant.id, value.id)}
                disabled={!isAvailable}
                className={`
                  w-full px-3 py-2 text-sm font-medium rounded-md border transition-all duration-200 text-left flex items-center justify-between
                  ${isSelected
                    ? 'border-orange-500 bg-orange-50 text-orange-600'
                    : isAvailable
                      ? 'border-gray-300 bg-white text-gray-700 hover:border-orange-300'
                      : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                <span>
                  {value.name}
                  {!isAvailable && ' (Out of stock)'}
                </span>
                {value.priceModifier && value.priceModifier !== 0 && (
                  <span className="text-xs text-gray-500">
                    {value.priceModifier > 0 ? '+' : ''}{formatPrice(Math.abs(value.priceModifier))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (variants.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
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