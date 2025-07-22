import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CartItemSelection, ShippingOption, Coupon, CartCalculations, CartState } from '@/types/cart';
import { useCart } from '@/hooks/useCart'; // Import useCart directly

interface SelectiveCartContextType {
  selections: CartItemSelection[];
  selectedItems: string[];
  shippingOption: ShippingOption | null;
  appliedCoupons: Coupon[];
  calculations: CartCalculations;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  toggleItemSelection: (itemId: string) => void;
  selectAllItems: () => void;
  clearAllSelections: () => void;
  toggleSelectAll: () => void;
  setShippingOption: (option: ShippingOption | null) => void;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: (couponId: string) => void;
  getSelectedItems: () => any[];
  hasSelectedItems: () => boolean;
  forceRecalculate: () => void;
}

const SelectiveCartContext = createContext<SelectiveCartContextType | undefined>(undefined);

export const SelectiveCartProvider = ({ children }: { children: React.ReactNode }) => {
  // Use useCart hook directly instead of useCartContext
  const { cartItems } = useCart();
  const [selections, setSelections] = useState<CartItemSelection[]>([]);
  const [shippingOption, setShippingOptionState] = useState<ShippingOption | null>(null);
  const [appliedCoupons, setAppliedCoupons] = useState<Coupon[]>([]);
  const [recalculationTrigger, setRecalculationTrigger] = useState(0);

  // Force recalculation function
  const forceRecalculate = useCallback(() => {
    setRecalculationTrigger(prev => prev + 1);
  }, []);

  // Initialize selections when cart items change
  useEffect(() => {
    if (!cartItems.length) {
      setSelections([]);
      return;
    }
    
    setSelections(prevSelections => {
      const existingSelectionMap = new Map(
        prevSelections.map(s => [s.itemId, s.selected])
      );
      
      return cartItems.map(item => ({
        itemId: item.id,
        selected: existingSelectionMap.get(item.id) || false
      }));
    });
  }, [cartItems]);

  // Clear selections when cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      setSelections([]);
    }
  }, [cartItems.length]);

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
    if (selectedCount === cartItems.length) {
      clearAllSelections();
    } else {
      selectAllItems();
    }
  }, [selections, cartItems.length, clearAllSelections, selectAllItems]);

  const setShippingOption = useCallback((option: ShippingOption | null) => {
    setShippingOptionState(option);
  }, []);

  const applyCoupon = useCallback((coupon: Coupon) => {
    setAppliedCoupons(prev => [...prev, coupon]);
  }, []);

  const removeCoupon = useCallback((couponId: string) => {
    setAppliedCoupons(prev => prev.filter(coupon => coupon.id !== couponId));
  }, []);

  const selectedItemIds = useMemo(() => 
    selections.filter(s => s.selected).map(s => s.itemId), 
    [selections]
  );

  const getSelectedItems = useCallback(() => {
    return cartItems.filter(item => selectedItemIds.includes(item.id));
  }, [cartItems, selectedItemIds]);

  const hasSelectedItems = useCallback(() => {
    return selectedItemIds.length > 0;
  }, [selectedItemIds]);

  const selectedCount = selectedItemIds.length;
  const isAllSelected = selectedCount === cartItems.length && cartItems.length > 0;
  const isIndeterminate = selectedCount > 0 && selectedCount < cartItems.length;

  // Improved calculations with better change detection
  const calculations = useMemo((): CartCalculations => {
    const selectedItems = cartItems.filter(item => selectedItemIds.includes(item.id));
    const subtotal = selectedItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const shipping = shippingOption ? shippingOption.price : 0;
    const discount = appliedCoupons.reduce((total, coupon) => {
      return total + (coupon.type === 'percentage' ? subtotal * coupon.discount / 100 : coupon.discount);
    }, 0);
    const tax = subtotal * 0.16;
    const total = subtotal + shipping + tax - discount;

    return {
      subtotal,
      shipping,
      discount,
      tax,
      total: Math.max(0, total),
      selectedItemsCount: selectedItems.length
    };
  }, [
    // Create a more reliable dependency that changes when cart items change
    cartItems.map(item => `${item.id}-${item.quantity}`).join(','),
    selectedItemIds.join(','),
    shippingOption?.id,
    shippingOption?.price,
    appliedCoupons.map(c => `${c.id}-${c.discount}`).join(','),
    recalculationTrigger
  ]);

  const value = useMemo(() => ({
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
    forceRecalculate
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
    forceRecalculate
  ]);

  return (
    <SelectiveCartContext.Provider value={value}>
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