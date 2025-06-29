
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useOptimisticCart } from '@/hooks/useOptimisticCart';
import OptimizedImage from '../OptimizedImage';

interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  quantity: number;
}

interface OptimizedCartItemProps {
  item: CartItem;
  onRemove?: (itemId: string) => void;
  className?: string;
}

const OptimizedCartItem = ({ 
  item, 
  onRemove,
  className = '' 
}: OptimizedCartItemProps) => {
  const { updateQuantity, removeFromCart } = useOptimisticCart();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityChange = useCallback(async (newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemove();
      return;
    }

    setIsUpdating(true);
    try {
      await updateQuantity(item.id, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [item.id, updateQuantity]);

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
      currency: 'KES',
    }).format(price);
  };

  return (
    <div className={`flex items-center gap-4 py-4 border-b ${className}`}>
      {/* Product Image */}
      <div className="flex-shrink-0">
        <OptimizedImage
          src={item.product.image}
          alt={item.product.name}
          width={80}
          height={80}
          className="rounded-lg object-cover"
          sizes="80px"
        />
      </div>

      {/* Product Details */}
      <div className="flex-grow min-w-0">
        <h3 className="font-medium text-gray-900 truncate">
          {item.product.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {formatPrice(item.product.price)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={isUpdating || item.quantity <= 1}
          className="h-8 w-8 p-0"
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <span className="w-8 text-center font-medium">
          {item.quantity}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={isUpdating}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRemove}
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Total Price */}
      <div className="text-right min-w-[80px]">
        <p className="font-semibold text-gray-900">
          {formatPrice(item.product.price * item.quantity)}
        </p>
      </div>
    </div>
  );
};

export default OptimizedCartItem;
