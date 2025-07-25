
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CartItemSelection, ShippingOption, Coupon, CartCalculations } from '@/types/cart';
import { useCartContext } from './CartContext';

interface SelectiveCartContextType {
  selections: CartItemSelection[];
  selectedItems: string[];
  shippingOption: ShippingOption | null;
  appliedCoupons: Coupon[];
  calculations: CartCalculations;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  // Actions
  toggleItemSelection: (itemId: string) => void;
  selectAllItems: () => void;
  clearAllSelections: () => void;
  toggleSelectAll: () => void;
  setShippingOption: (option: ShippingOption | null) => void;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: (couponId: string) => void;
  // Getters
  getSelectedItems: () => any[];
  hasSelectedItems: () => boolean;
  isItemSelected: (itemId: string) => boolean;
  // Utils
  forceRecalculate: () => void;
  resetSelections: () => void;
}

const SelectiveCartContext = createContext<SelectiveCartContextType | undefined>(undefined);

export const SelectiveCartProvider = ({ children }: { children: React.ReactNode }) => {
  const { cartItems, loading } = useCartContext();
  const [selections, setSelections] = useState<CartItemSelection[]>([]);
  const [shippingOption, setShippingOptionState] = useState<ShippingOption | null>(null);
  const [appliedCoupons, setAppliedCoupons] = useState<Coupon[]>([]);
  const [calculationKey, setCalculationKey] = useState(0);
  
  // Use ref to track if we've done initial selection
  const hasInitializedRef = useRef(false);

  // Force recalculation
  const forceRecalculate = useCallback(() => {
    setCalculationKey(prev => prev + 1);
  }, []);

  // Reset all selections
  const resetSelections = useCallback(() => {
    setSelections([]);
    setShippingOption(null);
    setAppliedCoupons([]);
    hasInitializedRef.current = false;
    forceRecalculate();
  }, [forceRecalculate]);

  // Initialize selections when cart items change
  useEffect(() => {
    if (loading) return;

    if (cartItems.length === 0) {
      resetSelections();
      return;
    }

    // Create selection map for efficiency
    const existingSelections = new Map(
      selections.map(s => [s.itemId, s.selected])
    );

    // Create new selections array
    const newSelections = cartItems.map(item => ({
      itemId: item.id,
      selected: existingSelections.get(item.id) ?? false
    }));

    // Auto-select all items on first load only
    if (!hasInitializedRef.current && cartItems.length > 0) {
      newSelections.forEach(selection => {
        selection.selected = true;
      });
      hasInitializedRef.current = true;
    }

    setSelections(newSelections);
    forceRecalculate();
  }, [cartItems, loading, forceRecalculate]);

  // Selection actions - all memoized to prevent unnecessary re-renders
  const toggleItemSelection = useCallback((itemId: string) => {
    setSelections(prev => 
      prev.map(selection => 
        selection.itemId === itemId 
          ? { ...selection, selected: !selection.selected }
          : selection
      )
    );
  }, []);

  const selectAllItems = useCallback(() => {
    setSelections(prev => prev.map(selection => ({ ...selection, selected: true })));
  }, []);

  const clearAllSelections = useCallback(() => {
    setSelections(prev => prev.map(selection => ({ ...selection, selected: false })));
  }, []);

  const toggleSelectAll = useCallback(() => {
    const selectedCount = selections.filter(s => s.selected).length;
    if (selectedCount === cartItems.length && cartItems.length > 0) {
      clearAllSelections();
    } else {
      selectAllItems();
    }
  }, [selections, cartItems.length, clearAllSelections, selectAllItems]);

  // Shipping and coupon actions
  const setShippingOption = useCallback((option: ShippingOption | null) => {
    setShippingOptionState(option);
  }, []);

  const applyCoupon = useCallback((coupon: Coupon) => {
    setAppliedCoupons(prev => {
      // Prevent duplicate coupons
      if (prev.find(c => c.id === coupon.id)) {
        return prev;
      }
      return [...prev, coupon];
    });
  }, []);

  const removeCoupon = useCallback((couponId: string) => {
    setAppliedCoupons(prev => prev.filter(coupon => coupon.id !== couponId));
  }, []);

  // Memoized derived state
  const selectedItemIds = useMemo(() => 
    selections.filter(s => s.selected).map(s => s.itemId), 
    [selections]
  );

  const selectedCount = selectedItemIds.length;
  const isAllSelected = selectedCount === cartItems.length && cartItems.length > 0;
  const isIndeterminate = selectedCount > 0 && selectedCount < cartItems.length;

  // Getter functions
  const getSelectedItems = useCallback(() => {
    return cartItems.filter(item => selectedItemIds.includes(item.id));
  }, [cartItems, selectedItemIds]);

  const hasSelectedItems = useCallback(() => {
    return selectedItemIds.length > 0;
  }, [selectedItemIds]);

  const isItemSelected = useCallback((itemId: string) => {
    return selectedItemIds.includes(itemId);
  }, [selectedItemIds]);

  // Optimized calculations with proper memoization
  const calculations = useMemo((): CartCalculations => {
    const selectedItems = cartItems.filter(item => selectedItemIds.includes(item.id));
    
    // Calculate subtotal
    const subtotal = selectedItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);

    // Calculate discount
    const discount = appliedCoupons.reduce((total, coupon) => {
      const couponDiscount = coupon.type === 'percentage' 
        ? subtotal * (coupon.discount / 100)
        : Math.min(coupon.discount, subtotal); // Cap fixed discount at subtotal
      return total + couponDiscount;
    }, 0);

    const discountedSubtotal = Math.max(0, subtotal - discount);
    
    // Add shipping
    const shipping = shippingOption?.price || 0;
    const preTaxTotal = discountedSubtotal + shipping;
    
    // Calculate tax (adjust rate as needed)
    const taxRate = 0.16; // 16% tax rate - adjust as needed
    const tax = preTaxTotal * taxRate;
    
    const total = preTaxTotal + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(Math.max(0, total) * 100) / 100,
      selectedItemsCount: selectedItems.length
    };
  }, [cartItems, selectedItemIds, shippingOption, appliedCoupons, calculationKey]);

  // Memoize the entire context value
  const contextValue = useMemo(() => ({
    selections,
    selectedItems: selectedItemIds,
    shippingOption,
    appliedCoupons,
    calculations,
    isAllSelected,
    isIndeterminate,
    toggleItemSelection,
    selectAllItems,
    clearAllSelections,
    toggleSelectAll,
    setShippingOption,
    applyCoupon,
    removeCoupon,
    getSelectedItems,
    hasSelectedItems,
    isItemSelected,
    forceRecalculate,
    resetSelections
  }), [
    selections,
    selectedItemIds,
    shippingOption,
    appliedCoupons,
    calculations,
    isAllSelected,
    isIndeterminate,
    toggleItemSelection,
    selectAllItems,
    clearAllSelections,
    toggleSelectAll,
    setShippingOption,
    applyCoupon,
    removeCoupon,
    getSelectedItems,
    hasSelectedItems,
    isItemSelected,
    forceRecalculate,
    resetSelections
  ]);

  return (
    <SelectiveCartContext.Provider value={contextValue}>
      {children}
    </SelectiveCartContext.Provider>
  );
};

export const useSelectiveCart = () => {
  const context = useContext(SelectiveCartContext);
  if (context === undefined) {
    throw new Error('useSelectiveCart must be used within a SelectiveCartProvider');
  }
  return context;
};