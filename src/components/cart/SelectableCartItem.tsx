import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Minus, Plus, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useCartContext } from '@/contexts/CartContext';
import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import OptimizedImage from '../OptimizedImage';

interface SelectableCartItemProps {
  item: {
    id: string;
    product: {
      id: string;
      name: string;
      price: number;
      originalPrice?: number;
      flashSalePrice?: number;
      hasFlashSale?: boolean;
      image: string;
    };
    variant_selections?: Record<string, string>;
    quantity: number;
    added_at?: string;
    updated_at?: string;
  };
  className?: string;
}

const SelectableCartItem = memo(({ item, className = '' }: SelectableCartItemProps) => {
  const { updateQuantity, removeFromCart } = useCartContext();
  const { isItemSelected, toggleItemSelection, forceRecalculate } = useSelectiveCart();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);

  const isMobile = isMobileUserAgent();

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (item.quantity !== localQuantity) {
      setLocalQuantity(item.quantity);
    }
  }, [item.quantity]);

  const isSelected = useMemo(() => isItemSelected(item.id), [isItemSelected, item.id]);

  const debouncedUpdate = useCallback((itemId: string, quantity: number) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Short debounce so rapid clicks batch, but totals still feel instant
    updateTimeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;

      setIsUpdating(true);
      try {
        await updateQuantity(itemId, quantity);
        if (mountedRef.current) {
          forceRecalculate();
        }
      } catch (error) {
        if (mountedRef.current) {
          setLocalQuantity(item.quantity);
        }
        console.error('Failed to update quantity:', error);
      } finally {
        if (mountedRef.current) {
          setIsUpdating(false);
        }
      }
    }, 120);
  }, [updateQuantity, item.quantity, forceRecalculate]);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemove();
      return;
    }

    setLocalQuantity(newQuantity);
    debouncedUpdate(item.id, newQuantity);
  }, [item.id, debouncedUpdate]);

  const handleRemove = useCallback(async () => {
    if (isRemoving) return;
    
    setIsRemoving(true);
    try {
      await removeFromCart(item.id);
      forceRecalculate();
    } catch (error) {
      console.error('Failed to remove item:', error);
      if (mountedRef.current) {
        setIsRemoving(false);
      }
    }
  }, [item.id, removeFromCart, isRemoving, forceRecalculate]);

  const handleIncrement = useCallback(() => {
    handleQuantityChange(localQuantity + 1);
  }, [localQuantity, handleQuantityChange]);

  const handleDecrement = useCallback(() => {
    handleQuantityChange(Math.max(1, localQuantity - 1));
  }, [localQuantity, handleQuantityChange]);

  const handleToggleSelect = useCallback(() => {
    toggleItemSelection(item.id);
  }, [toggleItemSelection, item.id]);

  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(item.product.price);
  }, [item.product.price]);

  const formattedOriginalPrice = useMemo(() => {
    if (!item.product.hasFlashSale || !item.product.originalPrice) return null;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(item.product.originalPrice);
  }, [item.product.originalPrice, item.product.hasFlashSale]);

  const totalPrice = useMemo(() => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(item.product.price * localQuantity);
  }, [item.product.price, localQuantity]);

  const totalOriginalPrice = useMemo(() => {
    if (!item.product.hasFlashSale || !item.product.originalPrice) return null;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(item.product.originalPrice * localQuantity);
  }, [item.product.originalPrice, item.product.hasFlashSale, localQuantity]);

  const variantDisplay = useMemo(() => {
    if (!item.variant_selections || Object.keys(item.variant_selections).length === 0) {
      return null;
    }

    return (
      <div className="flex space-x-1">
        {Object.entries(item.variant_selections).map(([type, value]) => (
          <p key={`${type}-${value}`} className="text-xs sm:text-sm text-gray-600">
            <span className="capitalize font-medium">{type}:</span> {value}
          </p>
        ))}
      </div>
    );
  }, [item.variant_selections]);

  if (isRemoving) {
    return null;
  }

  return (
    <div className={`transition-all duration-200 ${
      !isMobile
        ? `bg-white border border-gray-200 shadow-sm ${isSelected ? 'bg-red/10 border-red/30 shadow-[0_0_0_2px_rgba(239,68,68,0.2)]' : ''}`
        : ''
    } ${isRemoving ? 'opacity-50' : ''} ${className}`}>

      {/* Mobile Layout — redesigned green theme */}
      {isMobile && (
        <div className={`bg-card rounded-2xl border ${isSelected ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border/60'} overflow-hidden shadow-sm`}>
          {/* Top: image + name + price + remove */}
          <div className="p-3 flex gap-3">
            <div className="flex flex-col items-center gap-2 pt-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleToggleSelect}
                className="flex-shrink-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                disabled={isRemoving || isUpdating}
              />
            </div>

            <div className="w-[88px] h-[88px] flex-shrink-0 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-center overflow-hidden">
              <OptimizedImage
                src={item.product.image}
                alt={item.product.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-foreground text-[15px] leading-tight line-clamp-2 pr-1">
                  {item.product.name}
                </h3>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[15px] font-extrabold text-primary leading-none">
                    {formattedPrice}
                  </span>
                  {formattedOriginalPrice && (
                    <span className="text-[11px] text-muted-foreground line-through leading-none">
                      {formattedOriginalPrice}
                    </span>
                  )}
                  {item.product.hasFlashSale && item.product.originalPrice && (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/15 text-[10px] px-1.5 py-0.5 font-semibold border-0">
                      <Zap className="h-2.5 w-2.5 mr-0.5" />
                      {Math.round((1 - item.product.price / item.product.originalPrice) * 100)}% OFF
                    </Badge>
                  )}
                </div>
              </div>
              {variantDisplay && (
                <div className="mt-1.5 text-[12px] text-muted-foreground">
                  {Object.entries(item.variant_selections || {}).map(([type, value], idx, arr) => (
                    <span key={`${type}-${value}`} className="inline-flex items-center">
                      {type.toLowerCase() === 'color' && (
                        <span className="inline-block w-3 h-3 rounded-full bg-primary mr-1 border border-border" />
                      )}
                      <span className="capitalize">{value}</span>
                      {idx < arr.length - 1 && <span className="mx-1">·</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Subtotal row */}
          <div className="px-3 pb-2 -mt-1 flex items-center justify-end">
            <span className="text-[12px] text-muted-foreground mr-2">Item subtotal:</span>
            <span className="text-[14px] font-bold text-foreground">{totalPrice}</span>
          </div>

          {/* Bottom: Remove + Quantity pill */}
          <div className="px-3 py-2.5 bg-primary/5 border-t border-primary/10 flex items-center justify-between">
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="text-[13px] font-semibold text-destructive hover:text-destructive/80 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>

            <div className="flex items-center bg-card rounded-full border border-primary/30 overflow-hidden h-9 shadow-sm">
              <button
                onClick={handleDecrement}
                disabled={isUpdating || localQuantity <= 1 || isRemoving}
                className="h-9 w-9 flex items-center justify-center text-foreground hover:bg-primary/5 disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <div className="w-9 text-center">
                <span className={`font-bold text-[15px] ${isUpdating ? 'opacity-50' : ''}`}>
                  {localQuantity}
                </span>
              </div>
              <button
                onClick={handleIncrement}
                disabled={isUpdating || isRemoving}
                className="h-9 w-9 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop/Tablet Layout */}
      {!isMobile && (
        <div className="flex items-start gap-4 p-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleToggleSelect}
            className="mt-2 flex-shrink-0"
            disabled={isRemoving || isUpdating}
          />
          
          <div className="w-20 h-20 flex-shrink-0">
            <img
              src={item.product.image}
              alt={item.product.name}
              className="w-full h-full object-cover rounded-md bg-gray-100"
              loading="lazy"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2 max-w-[400px]">
              {item.product.name}
            </h3>
            
            {item.product.hasFlashSale && (
              <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs mb-2">
                <Zap className="h-3 w-3 mr-1" />
                Flash Sale
              </Badge>
            )}
            
            {variantDisplay}
            
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Unit Price:</span>
                {item.product.hasFlashSale ? (
                  <>
                    <span className="text-sm font-semibold text-red-500">{formattedPrice}</span>
                    {formattedOriginalPrice && (
                      <span className="text-sm text-gray-400 line-through">{formattedOriginalPrice}</span>
                    )}
                  </>
                ) : (
                  <span className="text-sm">{formattedPrice}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-red-600">Total:</span>
                {item.product.hasFlashSale && totalOriginalPrice ? (
                  <>
                    <span className="text-lg font-semibold text-red-600">{totalPrice}</span>
                    <span className="text-sm text-gray-400 line-through">{totalOriginalPrice}</span>
                  </>
                ) : (
                  <span className="text-lg font-semibold text-red-600">{totalPrice}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isRemoving || isUpdating}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
              title="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center border rounded-md bg-white">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDecrement}
                disabled={isUpdating || localQuantity <= 1 || isRemoving}
                className="h-8 w-8 p-0 hover:bg-gray-100"
                title="Decrease quantity"
              >
                <Minus className="h-3 w-3" />
              </Button>
              
              <div className="w-12 text-center">
                <span className={`font-medium text-sm ${isUpdating ? 'opacity-50' : ''}`}>
                  {localQuantity}
                </span>
                {isUpdating && (
                  <div className="text-xs text-blue-500 leading-none">...</div>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleIncrement}
                disabled={isUpdating || isRemoving}
                className="h-8 w-8 p-0 hover:bg-gray-100"
                title="Increase quantity"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

SelectableCartItem.displayName = 'SelectableCartItem';

export default SelectableCartItem;
