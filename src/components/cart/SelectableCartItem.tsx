
import React from 'react';
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
  };
  isSelected: boolean;
  onToggleSelect: () => void;
}

const SelectableCartItem = ({ item, isSelected, onToggleSelect }: SelectableCartItemProps) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(item.id);
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };

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
          onClick={() => removeFromCart(item.id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 size={16} />
        </Button>
        
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            className="h-8 w-8 p-0"
          >
            <Minus size={14} />
          </Button>
          
          <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
            {item.quantity}
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            className="h-8 w-8 p-0"
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectableCartItem;
