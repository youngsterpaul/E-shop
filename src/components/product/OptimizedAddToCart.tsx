
import { useState, useCallback } from 'react';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOptimizedCart } from '@/hooks/useOptimizedCart';
import { useToast } from '@/hooks/use-toast';

interface OptimizedAddToCartProps {
  productId: string;
  productName: string;
  variantSelections?: Record<string, string>;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

const OptimizedAddToCart = ({
  productId,
  productName,
  variantSelections = {},
  quantity = 1,
  disabled = false,
  className = '',
  size = 'md',
  variant = 'default'
}: OptimizedAddToCartProps) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const { addToCart, isAddingToCart } = useOptimizedCart();
  const { toast } = useToast();

  const handleAddToCart = useCallback(async () => {
    if (disabled || isAddingToCart) return;

    try {
      await addToCart({ productId, quantity });
      
      // Show success state
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
      
      toast({
        title: "Added to cart!",
        description: `${productName} has been added to your cart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive"
      });
    }
  }, [productId, quantity, variantSelections, disabled, isAddingToCart, addToCart, productName, toast]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-8 px-3 text-sm';
      case 'lg': return 'h-12 px-6 text-base';
      default: return 'h-10 px-4';
    }
  };

  const buttonVariant = isSuccess ? 'default' : variant;
  const buttonClass = `
    ${getSizeClasses()}
    ${isSuccess ? 'bg-green-500 hover:bg-green-600' : ''}
    ${className}
    transition-all duration-200
  `;

  return (
    <Button
      onClick={handleAddToCart}
      disabled={disabled || isAddingToCart}
      variant={buttonVariant}
      className={buttonClass}
    >
      {isSuccess ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Added!
        </>
      ) : isAddingToCart ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adding...
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </>
      )}
    </Button>
  );
};

export default OptimizedAddToCart;
