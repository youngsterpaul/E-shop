import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '@/hooks/useCart';
import { useSelectiveCart } from '@/contexts/SelectiveCartContext';

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
  };
  isSelected: boolean;
  onToggleSelect: () => void;
  onRemove?: (itemId: string) => void;
  className?: string;
}

const SelectableCartItem = memo(({ 
  item, 
  isSelected, 
  onToggleSelect, 
  onRemove, 
  className = '' 
}: SelectableCartItemProps) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { forceRecalculate } = useSelectiveCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  
  // Use refs to manage debouncing without causing re-renders
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  // Sync local quantity with prop changes
  useEffect(() => {
    setLocalQuantity(item.quantity);
  }, [item.quantity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Debounced quantity update with better error handling
  const debouncedUpdate = useCallback((itemId: string, quantity: number) => {
    // Clear previous timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Set new timeout
    updateTimeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      
      setIsUpdating(true);
      try {
        await updateQuantity(itemId, quantity);
        // Force recalculate after successful update
        if (mountedRef.current) {
          forceRecalculate();
        }
      } catch (error) {
        // Revert on error
        if (mountedRef.current) {
          setLocalQuantity(item.quantity);
        }
        console.error('Failed to update quantity:', error);
      } finally {
        if (mountedRef.current) {
          setIsUpdating(false);
        }
      }
    }, 300);
  }, [updateQuantity, item.quantity, forceRecalculate]);

  // Handle quantity changes with immediate UI feedback
  const handleQuantityChange = useCallback((newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemove();
      return;
    }

    // Immediate UI update
    setLocalQuantity(newQuantity);
    
    // Debounced backend update
    debouncedUpdate(item.id, newQuantity);
  }, [item.id, debouncedUpdate]);

  // Handle item removal
  const handleRemove = useCallback(async () => {
    if (isRemoving) return;
    
    setIsRemoving(true);
    try {
      await removeFromCart(item.id);
      onRemove?.(item.id);
      // Force recalculate after successful removal
      forceRecalculate();
    } catch (error) {
      console.error('Failed to remove item:', error);
      if (mountedRef.current) {
        setIsRemoving(false);
      }
    }
  }, [item.id, removeFromCart, onRemove, isRemoving, forceRecalculate]);

  // Increment quantity
  const handleIncrement = useCallback(() => {
    handleQuantityChange(localQuantity + 1);
  }, [localQuantity, handleQuantityChange]);

  // Decrement quantity
  const handleDecrement = useCallback(() => {
    handleQuantityChange(localQuantity - 1);
  }, [localQuantity, handleQuantityChange]);

  // Memoize price formatting to prevent recalculation
  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(item.product.price);
  }, [item.product.price]);

  // Memoize total price calculation
  const totalPrice = useMemo(() => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(item.product.price * localQuantity);
  }, [item.product.price, localQuantity]);

  // Memoize variant display
  const variantDisplay = useMemo(() => {
    if (!item.variant_selections || Object.keys(item.variant_selections).length === 0) {
      return null;
    }

    return (
      <div className="mt-1 space-y-1">
        {Object.entries(item.variant_selections).map(([type, value]) => (
          <p key={`${type}-${value}`} className="text-sm text-gray-600">
            <span className="capitalize font-medium">{type}:</span> {value}
          </p>
        ))}
      </div>
    );
  }, [item.variant_selections]);

  // Don't render if item is being removed
  if (isRemoving) {
    return null;
  }

  return (
    <div className={`flex items-start gap-4 p-4 bg-white transition-opacity ${isRemoving ? 'opacity-50' : ''} ${className}`}>
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggleSelect}
        className="mt-2 flex-shrink-0"
        disabled={isRemoving || isUpdating}
      />
      
      <div className="w-20 h-20 flex-shrink-0">
        <img
          src={item.product.image}
          alt={item.product.name}
          className="w-full h-full object-cover rounded-md bg-gray-100"
          loading="lazy"
          //onError={(e) => {
            //const target = e.target as HTMLImageElement;
            //target.src = '/placeholder.svg';
          //}}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate text-sm md:text-base">
          {item.product.name}
        </h3>
        
        {variantDisplay}
        
        <div className="mt-2 space-y-1">
          <p className="text-sm text-gray-600">
            Unit Price: {formattedPrice}
          </p>
          <p className="text-base font-semibold text-primary">
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
  );
});

SelectableCartItem.displayName = 'SelectableCartItem';

export default SelectableCartItem;