
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  variant?: string;
}

export interface CartItemSelection {
  itemId: string;
  selected: boolean;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
}

export interface CartCalculations {
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
  selectedItemsCount: number;
}

export interface CartState {
  items: CartItem[];
  selections: CartItemSelection[];
  shippingOption: ShippingOption | null;
  appliedCoupons: Coupon[];
  calculations: CartCalculations;
}

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateCartItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  loading: boolean;
}
