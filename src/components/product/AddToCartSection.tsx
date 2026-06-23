import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Share2, Check, Zap, Minus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';

interface GemFashionStyleProps {
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

const GemFashionStyle = ({
  product,
  selectedVariants,
  requiredVariants,
  quantity,
  onQuantityChange,
  className = ''
}: GemFashionStyleProps) => {
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
    const missingVariants = requiredVariants.filter(v => !selectedVariants[v]);
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
      toast({ title: "Added to cart!", description: `${product.name.split('(')[0].trim()} added to your cart` });
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
        toast({ title: "Removed from wishlist" });
      } else {
        await addToWishlist(product.product_id);
        toast({ title: "Added to wishlist" });
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
      toast({ title: "Link copied!", description: "Product link copied to clipboard" });
    }
  };

  return (
    <div className={`space-y-6 p-1 ${className}`}>

      {/* Stock Status */}
      <div className="flex items-center gap-2.5">
        <Badge 
          variant={inStock ? "default" : "destructive"} 
          className={`px-3 py-1 text-xs uppercase tracking-wider font-semibold rounded-full shadow-sm border ${
            inStock 
              ? 'bg-emerald-900 text-emerald-50 border-emerald-800' 
              : 'bg-rose-950 text-rose-200 border-rose-900'
          }`}
        >
          {inStock ? "In Stock" : "Out of Stock"}
        </Badge>
        {product.stock && product.stock <= 10 && inStock && (
          <Badge variant="outline" className="text-amber-700 bg-amber-50/60 border-amber-200/80 px-3 py-1 text-xs font-medium rounded-full animate-pulse">
            Only {product.stock} items left
          </Badge>
        )}
      </div>

      {/* Quantity Selector */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">Select Quantity</p>
        <div className="inline-flex items-center rounded-xl border border-stone-200 bg-stone-50 shadow-sm overflow-hidden p-0.5">
          <button
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="w-9 h-9 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-white rounded-lg disabled:opacity-20 disabled:hover:bg-transparent transition-all duration-200"
          >
            <Minus size={13} strokeWidth={2.5} />
          </button>
          <span className="w-11 h-9 flex items-center justify-center text-sm font-bold text-stone-900 font-serif tabular-nums">
            {quantity}
          </span>
          <button
            onClick={() => onQuantityChange(quantity + 1)}
            disabled={product.stock ? quantity >= product.stock : false}
            className="w-9 h-9 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-white rounded-lg disabled:opacity-20 disabled:hover:bg-transparent transition-all duration-200"
          >
            <Plus size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock || isAddingToCart}
          className={`
            flex-1 h-12 px-6 rounded-xl text-sm font-semibold tracking-wide
            flex items-center justify-center gap-2.5 uppercase
            border transition-all duration-300 transform active:scale-[0.98] select-none
            disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
            ${showSuccess
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-inner'
              : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-50 hover:border-stone-900 shadow-sm hover:shadow'
            }
          `}
        >
          {showSuccess ? (
            <><Check size={16} strokeWidth={3} className="text-emerald-600" /> Added to Collection</>
          ) : isAddingToCart ? (
            <><span className="w-4 h-4 rounded-full border-2 border-stone-300 border-t-stone-800 animate-spin" /> Updating...</>
          ) : (
            <><ShoppingCart size={16} strokeWidth={2} /> Add to Cart</>
          )}
        </button>

        {/* Buy Now */}
        <button
          onClick={handleBuyNow}
          disabled={!inStock || isBuyingNow}
          className="
            flex-1 h-12 px-6 rounded-xl text-sm font-semibold tracking-wide uppercase
            flex items-center justify-center gap-2.5
            bg-stone-900 text-stone-50 shadow-md shadow-stone-900/10
            hover:bg-stone-800 hover:shadow-lg transition-all duration-300
            transform active:scale-[0.98] select-none
            disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
          "
        >
          {isBuyingNow ? (
            <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Designing Order...</>
          ) : (
            <><Zap size={16} strokeWidth={2} className="text-amber-400 fill-amber-400" /> Buy Now</>
          )}
        </button>

        {/* Wishlist & Share Group */}
        <div className="flex gap-2.5 justify-end">
          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className={`
              h-12 w-12 rounded-xl flex items-center justify-center shrink-0
              border transition-all duration-300 transform active:scale-[0.98] select-none shadow-sm
              ${isInWishlistState
                ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100 shadow-rose-100'
                : 'bg-white border-stone-200 text-stone-400 hover:border-rose-200 hover:text-rose-400 hover:bg-rose-50/30'
              }
            `}
          >
            <Heart size={18} strokeWidth={2} className={isInWishlistState ? 'fill-current scale-110 transition-transform duration-300' : 'transition-transform duration-300'} />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="
              h-12 w-12 rounded-xl flex items-center justify-center shrink-0
              bg-white border border-stone-200 text-stone-400 shadow-sm
              hover:border-stone-300 hover:text-stone-700 hover:bg-stone-50/50
              transition-all duration-300 transform active:scale-[0.98] select-none
            "
          >
            <Share2 size={18} strokeWidth={2} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default GemFashionStyle;