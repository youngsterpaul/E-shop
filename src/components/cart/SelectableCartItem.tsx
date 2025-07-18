
import React from 'react';
import { useState, useCallback } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '@/hooks/useCart';

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
    onQuantityChange: (quantity: number) => void;
  };
  isSelected: boolean;
  onToggleSelect: () => void;
  onRemove?: (itemId: string) => void;
  className?: string;
}

const SelectableCartItem = ({ item, isSelected, onToggleSelect, onRemove, className = '' }: SelectableCartItemProps) => {
  const { removeFromCart } = useCart();


  const handleRemove = useCallback(async () => {
    try {
      await removeFromCart(item.id);
      onRemove?.(item.id);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  }, [item.id, removeFromCart, onRemove]);


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-lg border">
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggleSelect}
        className="mt-2"
      />
      
      <img
        src={item.product.image}
        alt={item.product.name}
        className="w-20 h-20 object-cover rounded-md"
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
          {formatPrice(item.product.price)}
        </p>
      </div>
      
      <div className="flex flex-col items-end gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => item.onQuantityChange(Math.max(1, item.quantity - 1))}
            className="h-10 w-10 p-0 hover:bg-gray-100"
            disabled={item.quantity <= 1}
          >
            -
          </Button>
          <span className="h-10 px-4 flex items-center justify-center border-x min-w-[3rem]">
            {item.quantity}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => item.onQuantityChange(item.quantity + 1)}
            className="h-10 w-10 p-0 hover:bg-gray-100"
          >
            +
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectableCartItem;
