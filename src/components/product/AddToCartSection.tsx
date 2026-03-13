import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Share2, Check, Zap, Minus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';

interface AddToCartSectionProps {
  product: {
    product_id: string;
    name: string;
    price: number;
    stock?: number;
  };
  selectedVariants: Record<string, string>;
  requiredVariants: string[];
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  className?: string;
}

const AddToCartSection = ({
  product,
  selectedVariants,
  requiredVariants,
  quantity,
  onQuantityChange,
  className = ''
}: AddToCartSectionProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const inStock = (product.stock || 0) > 0;
  const isInWishlistState = isInWishlist(product.product_id);

  const validateVariantSelection = () => {
    const missingVariants = requiredVariants.filter(
      variantType => !selectedVariants[variantType]
    );
    if (missingVariants.length > 0) {
      toast({
        title: "Please select all options",
        description: `Please choose: ${missingVariants.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!inStock) return toast({ title: "Out of Stock", description: "This item is currently out of stock", variant: "destructive" });
    if (!validateVariantSelection()) return;
    setIsAddingToCart(true);
    try {
      await addToCart(product.product_id, selectedVariants, quantity);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      toast({ title: "Added to cart!", description: `${product.name.split('(')[0].trim()} has been added to your cart` });
    } catch {
      toast({ title: "Error", description: "Failed to add item to cart", variant: "destructive" });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!inStock) return toast({ title: "Out of Stock", description: "This item is currently out of stock", variant: "destructive" });
    if (!validateVariantSelection()) return;
    setIsBuyingNow(true);
    try {
      await addToCart(product.product_id, selectedVariants, quantity);
      if (user) navigate('/checkout');
      else { sessionStorage.setItem('redirectAfterAuth', '/checkout'); navigate('/auth'); }
    } catch {
      toast({ title: "Error", description: "Failed to proceed to checkout", variant: "destructive" });
      setIsBuyingNow(false);
    }
  };

  const handleWishlist = async () => {
    try {
      if (isInWishlistState) {
        await removeFromWishlist(product.product_id);
        toast({ title: "Removed from wishlist", description: "Item has been removed from your wishlist" });
      } else {
        await addToWishlist(product.product_id);
        toast({ title: "Added to wishlist", description: "Item has been added to your wishlist" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update wishlist", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url: window.location.href }); } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!", description: "Product link has been copied to clipboard" });
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stock Status */}
      <div className="flex items-center gap-2">
        <Badge variant={inStock ? "default" : "destructive"}>
          {inStock ? "In Stock" : "Out of Stock"}
        </Badge>
        {product.stock && product.stock <= 10 && inStock && (
          <Badge variant="outline" className="text-orange-600 border-orange-300">
            Only {product.stock} left
          </Badge>
        )}
      </div>

      {/* Quantity Selector */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
        <div className="inline-flex items-center rounded-xl bg-gray-50 ring-1 ring-gray-200 overflow-hidden">
          <button
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Minus size={14} strokeWidth={2.5} />
          </button>
          <span className="w-12 h-10 text-center text-sm font-bold text-gray-900 tabular-nums flex items-center justify-center border-x border-gray-200">
            {quantity}
          </span>
          <button
            onClick={() => onQuantityChange(quantity + 1)}
            disabled={product.stock ? quantity >= product.stock : false}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Action Buttons — all in one row */}
      <div className="flex flex-wrap gap-3">

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock || isAddingToCart}
          className={`
            relative h-12 px-6 rounded-xl font-semibold text-sm
            flex items-center justify-center gap-2 overflow-hidden group
            transition-all duration-200 active:scale-[0.98] select-none
            disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
            ${showSuccess
              ? 'bg-emerald-500 text-white shadow-[0_4px_14px_rgba(16,185,129,0.4)]'
              : 'bg-orange-500 text-white shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:bg-orange-600 hover:shadow-[0_6px_20px_rgba(249,115,22,0.45)]'
            }
          `}
        >
          {/* shine sweep */}
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          {showSuccess ? (
            <><Check size={16} strokeWidth={2.5} /> Added!</>
          ) : isAddingToCart ? (
            <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Adding...</>
          ) : (
            <><ShoppingCart size={16} strokeWidth={2} /> Add to Cart</>
          )}
        </button>

        {/* Buy Now */}
        <button
          onClick={handleBuyNow}
          disabled={!inStock || isBuyingNow}
          className="
            relative h-12 px-6 rounded-xl font-semibold text-sm
            flex items-center justify-center gap-2 overflow-hidden group
            bg-gray-900 text-white
            shadow-[0_4px_14px_rgba(0,0,0,0.22)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.32)] hover:bg-gray-800
            transition-all duration-200 active:scale-[0.98] select-none
            disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
          "
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
          {isBuyingNow ? (
            <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Processing...</>
          ) : (
            <><Zap size={16} strokeWidth={2} className="fill-current" /> Buy Now</>
          )}
        </button>

        {/* Wishlist — icon only */}
        <button
          onClick={handleWishlist}
          className={`
            h-12 w-12 rounded-xl flex items-center justify-center
            ring-1 transition-all duration-200 active:scale-[0.98] select-none
            ${isInWishlistState
              ? 'bg-red-50 text-red-500 ring-red-200 hover:bg-red-100 hover:ring-red-300'
              : 'bg-white text-gray-500 ring-gray-200 hover:bg-gray-50 hover:text-red-500 hover:ring-red-200'
            }
          `}
        >
          <Heart size={18} strokeWidth={2} className={isInWishlistState ? 'fill-current' : ''} />
        </button>

        {/* Share — icon only */}
        <button
          onClick={handleShare}
          className="
            h-12 w-12 rounded-xl flex items-center justify-center
            bg-white text-gray-500 ring-1 ring-gray-200
            hover:bg-gray-50 hover:ring-gray-300 hover:text-gray-900
            transition-all duration-200 active:scale-[0.98] select-none
          "
        >
          <Share2 size={18} strokeWidth={2} />
        </button>

      </div>
    </div>
  );
};

export default AddToCartSection;