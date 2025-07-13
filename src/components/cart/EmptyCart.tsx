
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Search } from 'lucide-react';

const EmptyCart = () => {
  return (
    <div className="text-center py-16">
      <div className="mb-8">
        <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
        </p>
      </div>

      <div className="flex flex-column gap-4 justify-center">
        <Link to="/">
          <Button size="lg" className="flex items-center gap-2">
            <Search size={20} />
            Continue Shopping
          </Button>
        </Link>
        
        <Link to="/wishlist">
          <Button variant="outline" size="lg" className="flex items-center gap-2">
            <Heart size={20} />
            View Wishlist
          </Button>
        </Link>
      </div>

      {/* Suggested Actions */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search size={24} className="text-blue-600" />
          </div>
          <h3 className="font-medium mb-1">Browse Products</h3>
          <p className="text-sm text-gray-600">Discover our latest collections</p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Heart size={24} className="text-pink-600" />
          </div>
          <h3 className="font-medium mb-1">Check Wishlist</h3>
          <p className="text-sm text-gray-600">Move items from your wishlist</p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShoppingCart size={24} className="text-green-600" />
          </div>
          <h3 className="font-medium mb-1">Start Shopping</h3>
          <p className="text-sm text-gray-600">Find what you're looking for</p>
        </div>
      </div>
    </div>
  );
};

export default EmptyCart;
