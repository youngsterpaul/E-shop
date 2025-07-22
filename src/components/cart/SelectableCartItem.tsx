
import React, { memo } from 'react';
import { useState, useCallback, useMemo } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '@/hooks/useCart';
import { debounce } from 'lodash';

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

const SelectableCartItem = memo(({ item, isSelected, onToggleSelect, onRemove, className = '' }: SelectableCartItemProps) => {
  const { updateQuantity, removeFromCart } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(item.quantity);

  // Debounce quantity updates to prevent spam clicking
  const debouncedUpdateQuantity = useMemo(
    () => debounce(async (itemId: string, quantity: number) => {
      setIsUpdating(true);
      try {
        await updateQuantity(itemId, quantity);
      } catch (error) {
        // Revert on error
        setLocalQuantity(item.quantity);
        console.error('Failed to update quantity:', error);
      } finally {
        setIsUpdating(false);
      }
    }, 300),
    [updateQuantity, item.quantity]
  );

  // Cleanup debounce on unmount
  React.useEffect(() => {
    return () => {
      debouncedUpdateQuantity.cancel();
    };
  }, [debouncedUpdateQuantity]);

  // Debounced quantity update
  const handleQuantityChange = useCallback(async (newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemove();
      return;
    }

    // Immediate UI update
    setLocalQuantity(newQuantity);
    
    // Debounced backend update
    debouncedUpdateQuantity(item.id, newQuantity);
  }, [item.id, debouncedUpdateQuantity]);

  const handleRemove = useCallback(async () => {
    setIsRemoving(true);
    try {
      await removeFromCart(item.id);
      onRemove?.(item.id);
    } catch (error) {
      console.error('Failed to remove item:', error);
      setIsRemoving(false);
    }
  }, [item.id, removeFromCart, onRemove]);

  // Memoize price formatting
  const formattedPrice = React.useMemo(() => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(item.product.price);
  }, [item.product.price]);

  // Don't render if item is being removed
  if (isRemoving) {
    return null;
  }

  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-lg border">
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggleSelect}
        className="mt-2"
        disabled={isRemoving}
      />
      
      <img
        src={item.product.image}
        alt={item.product.name}
        className="w-20 h-20 object-cover rounded-md"
        loading="lazy"
      />
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">
          {item.product.name}
        </h3>
        
        {/* Display selected variants */}
        {item.variant_selections && Object.keys(item.variant_selections).length > 0 && (
          <div className="mt-1 space-y-1">
            {Object.entries(item.variant_selections).map(([type, value]) => (
              <p key={type} className="text-sm text-gray-600">
                <span className="capitalize font-medium">{type}:</span> {value}
              </p>
            ))}
          </div>
        )}
        
        <p className="text-lg font-semibold text-primary mt-2">
          {formattedPrice}
        </p>
      </div>
      
      <div className="flex flex-col items-end gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={isRemoving}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center border rounded-md">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuantityChange(localQuantity - 1)}
            disabled={isUpdating || localQuantity <= 1 || isRemoving}
            className="h-8 w-8 p-0"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <span className="w-8 text-center font-medium">
            {localQuantity}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuantityChange(localQuantity + 1)}
            disabled={isUpdating || isRemoving}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

SelectableCartItem.displayName = 'SelectableCartItem';

export default SelectableCartItem;