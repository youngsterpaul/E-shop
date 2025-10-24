import React from 'react';
import { cn } from '@/lib/utils';

interface VariantValue {
  id: string;
  name: string;
  value: string; // color hex or label
  available: boolean;
  priceModifier?: number;
  image?: string | null;
}

interface VariantGroup {
  id: string;
  name: string;
  type: 'color' | 'size' | 'material' | 'other';
  values: VariantValue[];
}

interface VariantSelectorProps {
  variants: VariantGroup[];
  selectedVariants: Record<string, string>;
  onVariantChange: (variantTypeId: string, variantValueId: string) => void;
  stockInfo?: Record<string, number>;
}

const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  selectedVariants,
  onVariantChange,
  stockInfo = {}
}) => {
  if (!variants?.length) return null;

  return (
    <div className="space-y-6">
      {variants.map((variant) => (
        <div key={variant.id} className="space-y-3">
          {/* Variant Label */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              {variant.name}
            </h3>
            {selectedVariants[variant.id] && (
              <span className="text-xs text-gray-500">
                {variant.values.find(v => v.id === selectedVariants[variant.id])?.name || selectedVariants[variant.id]}
              </span>
            )}
          </div>

          {/* Variant Options */}
          <div className="flex flex-wrap gap-2">
            {variant.values.map((value) => {
              const isSelected = selectedVariants[variant.id] === value.id;
              const inStock =
                stockInfo[`${variant.id}-${value.id}`] ?? value.available;

              const commonClasses = cn(
                'relative flex items-center justify-center transition-all duration-150',
                inStock
                  ? 'cursor-pointer hover:scale-105'
                  : 'opacity-40 cursor-not-allowed'
              );

              if (variant.type === 'color') {
                // --- COLOR or IMAGE SWATCH ---
                return (
                  <button
                    key={value.id}
                    onClick={() =>
                      inStock && onVariantChange(variant.id, value.id)
                    }
                    title={`${value.name}${!inStock ? ' (Out of Stock)' : ''}`}
                    className={cn(
                      commonClasses,
                      'w-10 h-10 rounded-full border-2',
                      isSelected ? 'border-orange-500' : 'border-gray-300'
                    )}
                  >
                    {value.image ? (
                      <img
                        src={value.image}
                        alt={value.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className="absolute inset-0 rounded-full"
                        style={{ backgroundColor: value.value }}
                      />
                    )}

                    {!inStock && (
                      <span className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-full">
                        <span className="text-[10px] text-gray-500 font-medium">
                          Out
                        </span>
                      </span>
                    )}
                  </button>
                );
              }

              // --- SIZE / MATERIAL / OTHER ---
              return (
                <button
                  key={value.id}
                  onClick={() =>
                    inStock && onVariantChange(variant.id, value.id)
                  }
                  title={`${value.name}${!inStock ? ' (Out of Stock)' : ''}`}
                  className={cn(
                    commonClasses,
                    'px-3 py-1 rounded-md border text-sm font-medium',
                    isSelected
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {value.name}
                  {!inStock && (
                    <span className="ml-1 text-[10px] text-gray-400">
                      (Out)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VariantSelector;