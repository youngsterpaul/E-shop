import React from 'react';
import { cn } from '@/lib/utils';

interface VariantValue {
  id: string;
  name: string;
  value: string; // color hex or label
  available: boolean;
  priceModifier?: number;
  image?: string | null;
  stockQuantity?: number;
}

interface VariantGroup {
  id: string;
  name: string;
  type: 'color' | 'size' | 'material' | 'other';
  values: VariantValue[];
}

interface GemFashionStyleProps {
  variants: VariantGroup[];
  selectedVariants: Record<string, string>;
  onVariantChange: (variantTypeId: string, variantValueId: string) => void;
  stockInfo?: Record<string, number>;
}

const GemFashionStyle: React.FC<GemFashionStyleProps> = ({
  variants,
  selectedVariants,
  onVariantChange,
  stockInfo = {}
}) => {
  if (!variants?.length) return null;

  return (
    <div className="space-y-8 tracking-tight">
      {variants.map((variant) => (
        <div key={variant.id} className="space-y-4">
          {/* Variant Label */}
          <div className="flex items-baseline justify-between border-b border-gray-100 pb-1.5">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-slate-900">
              {variant.name}
            </h3>
            {selectedVariants[variant.id] && (
              <span className="text-xs font-medium text-amber-700 bg-amber-50/60 px-2.5 py-0.5 rounded-full">
                {variant.values.find(v => v.id === selectedVariants[variant.id])?.name || selectedVariants[variant.id]}
              </span>
            )}
          </div>

          {/* Variant Options */}
          <div className="flex flex-wrap gap-3">
            {variant.values.map((value) => {
              const isSelected = selectedVariants[variant.id] === value.id;
              const inStock =
                stockInfo[`${variant.id}-${value.id}`] ?? value.available;

              const commonClasses = cn(
                'relative flex items-center justify-center transition-all duration-300 ease-out',
                inStock
                  ? 'cursor-pointer hover:scale-105 active:scale-95'
                  : 'opacity-35 cursor-not-allowed'
              );

              if (variant.type === 'color') {
                // --- COLOR or IMAGE SWATCH ---
                return (
                  <div key={value.id} className="flex flex-col items-center gap-2 group">
                    <button
                      onClick={() =>
                        inStock && onVariantChange(variant.id, value.id)
                      }
                      title={`${value.name}${!inStock ? ' (Out of Stock)' : ''}`}
                      className={cn(
                        commonClasses,
                        'w-9 h-9 rounded-full ring-offset-2 transition-all',
                        isSelected 
                          ? 'ring-2 ring-slate-900 scale-105 border border-transparent' 
                          : 'border border-gray-200 hover:border-slate-400'
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
                          className="absolute inset-0.5 rounded-full border border-black/5"
                          style={{ backgroundColor: value.value }}
                        />
                      )}

                      {!inStock && (
                        <span className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-full">
                          <span className="w-full h-[1px] bg-gray-400 rotate-45 absolute" />
                        </span>
                      )}
                    </button>
                    <span className="text-[10px] font-medium tracking-wide text-gray-500 uppercase transition-colors group-hover:text-slate-900">
                      {value.name}
                    </span>
                  </div>
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
                    'px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all min-w-[44px]',
                    isSelected
                      ? 'bg-slate-900 text-white border border-slate-950 shadow-sm'
                      : 'bg-white border border-gray-200 text-slate-800 hover:border-slate-900 hover:text-slate-900',
                    !inStock && 'line-through border-dashed'
                  )}
                >
                  {value.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GemFashionStyle;