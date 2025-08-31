import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCartContext } from '@/contexts/CartContext';
import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface SelectableCartItemProps {
  item: {
    id: string;
    product: {
      id: string;
      name: string;
      price: number;
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
  
  // Refs for cleanup and debouncing
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const isMobile = isMobileUserAgent();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Sync local quantity with prop changes
  useEffect(() => {
    if (item.quantity !== localQuantity) {
      setLocalQuantity(item.quantity);
    }
  }, [item.quantity]);

  // Memoize selection state
  const isSelected = useMemo(() => isItemSelected(item.id), [isItemSelected, item.id]);

  // Debounced quantity update
  const debouncedUpdate = useCallback((itemId: string, quantity: number) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

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
          setLocalQuantity(item.quantity); // Revert on error
        }
        console.error('Failed to update quantity:', error);
      } finally {
        if (mountedRef.current) {
          setIsUpdating(false);
        }
      }
    }, 500); // Increased debounce time for better UX
  }, [updateQuantity, item.quantity, forceRecalculate]);

  // Handle quantity changes
  const handleQuantityChange = useCallback((newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemove();
      return;
    }

    setLocalQuantity(newQuantity);
    debouncedUpdate(item.id, newQuantity);
  }, [item.id, debouncedUpdate]);

  // Handle item removal
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

  // Quantity control handlers
  const handleIncrement = useCallback(() => {
    handleQuantityChange(localQuantity + 1);
  }, [localQuantity, handleQuantityChange]);

  const handleDecrement = useCallback(() => {
    handleQuantityChange(Math.max(1, localQuantity - 1));
  }, [localQuantity, handleQuantityChange]);

  // Toggle selection handler
  const handleToggleSelect = useCallback(() => {
    toggleItemSelection(item.id);
  }, [toggleItemSelection, item.id]);

  // Memoized price formatting
  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(item.product.price);
  }, [item.product.price]);

  const totalPrice = useMemo(() => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(item.product.price * localQuantity);
  }, [item.product.price, localQuantity]);

  // Memoized variant display
  const variantDisplay = useMemo(() => {
    if (!item.variant_selections || Object.keys(item.variant_selections).length === 0) {
      return null;
    }

    return (
      <div className="mt-1 space-y-1">
        {Object.entries(item.variant_selections).map(([type, value]) => (
          <p key={`${type}-${value}`} className="text-xs sm:text-sm text-gray-600">
            <span className="capitalize font-medium">{type}:</span> {value}
          </p>
        ))}
      </div>
    );
  }, [item.variant_selections]);

  // Don't render if removing
  if (isRemoving) {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200 ${
      isSelected ? 'ring-2 ring-primary/20 bg-primary/5 border-primary/30' : ''
    } ${isRemoving ? 'opacity-50' : ''} ${className}`}>
      
      {/* Mobile Layout */}
      {isMobile && (
      <div className="block sm:hidden">
        <div className="p-3">
          {/* Header with checkbox and remove button */}
          <div className="flex items-center justify-between mb-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleToggleSelect}
              className="flex-shrink-0"
              disabled={isRemoving || isUpdating}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isRemoving || isUpdating}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
              title="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Product image and basic info */}
          <div className="flex gap-3 mb-3">
            <div className="w-16 h-16 flex-shrink-0">
              <img
                src={item.product.image}
                alt={item.product.name}
                className="w-full h-full object-cover rounded-md bg-gray-100"
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-sm leading-tight mb-1 line-clamp-2 min-h-[32px]">
                {item.product.name}
              </h3>
              <p className="text-xs text-gray-600">
                {formattedPrice} each
              </p>
            </div>
          </div>

          {/* Variants */}
          {variantDisplay}

          {/* Quantity and total price */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
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
              
              <div className="w-10 text-center">
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

            <div className="text-right">
              <p className="text-base font-semibold text-primary">
                {totalPrice}
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Desktop/Tablet Layout */}
      {!isMobile && (
      <div className="hidden sm:flex items-start gap-4 p-4">
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
          <h3 className="font-medium text-gray-900 text-sm md:text-base mb-1 truncate">
            {item.product.name}
          </h3>
          
          {variantDisplay}
          
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">
              Unit Price: {formattedPrice}
            </p>
            <p className="text-lg font-semibold text-primary">
              Total: {totalPrice}
            </p>
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
