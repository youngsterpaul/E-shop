import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CartItemSelection, ShippingOption, Coupon, CartCalculations, CartState } from '@/types/cart';
import { useCartContext } from './CartContext';

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
  forceRecalculate: () => void;  // Added this function
}

const SelectiveCartContext = createContext<SelectiveCartContextType | undefined>(undefined);

export const SelectiveCartProvider = ({ children }: { children: React.ReactNode }) => {
  const cartContext = useCartContext();
  const { cartItems } = cartContext || { cartItems: [] };
  const [selections, setSelections] = useState<CartItemSelection[]>([]);
  const [shippingOption, setShippingOptionState] = useState<ShippingOption | null>(null);
  const [appliedCoupons, setAppliedCoupons] = useState<Coupon[]>([]);
  const [recalculationTrigger, setRecalculationTrigger] = useState(0); // Added this state

  // Force recalculation function
  const forceRecalculate = useCallback(() => {
    setRecalculationTrigger(prev => prev + 1);
  }, []);

  // Initialize selections when cart items change - optimized to prevent unnecessary updates
  useEffect(() => {
    if (!cartItems.length) {
      setSelections([]);
    } else {
      setSelections(prevSelections => {
        const existingSelectionMap = new Map(
          prevSelections.map(s => [s.itemId, s.selected])
        );
        return cartItems.map(item => ({
          itemId: item.id,
          selected: existingSelectionMap.get(item.id) || false
        }));
      });
    }
    forceRecalculate(); // Force recalculation every time cartItems change
  }, [cartItems, forceRecalculate]);


  // Memoize callbacks to prevent unnecessary re-renders
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

  // Memoize expensive computations
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

  // Calculate selection states
  const selectedCount = selectedItemIds.length;
  const isAllSelected = selectedCount === cartItems.length && cartItems.length > 0;
  const isIndeterminate = selectedCount > 0 && selectedCount < cartItems.length;

  // Memoize calculations to prevent unnecessary recalculations
  // Added recalculationTrigger to dependencies to force updates
const calculations = useMemo((): CartCalculations => {
  const selectedItems = cartItems.filter(item => selectedItemIds.includes(item.id));
  const subtotal = selectedItems.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);
  const discount = appliedCoupons.reduce((total, coupon) => {
  const baseAmount = subtotal; // Use subtotal as base for discount calculation
  const couponDiscount = coupon.type === 'percentage' 
      ? baseAmount * coupon.discount / 100 
      : coupon.discount;
    return total + couponDiscount;
  }, 0);
    const discountedSubtotal = Math.max(0, subtotal - discount);
  
  // Add shipping to get pre-tax total
  const shipping = shippingOption ? shippingOption.price : 0;
  const preTaxTotal = discountedSubtotal + shipping;
  
  // Calculate tax (assuming 16% tax rate based on your 0.84 multiplier)
  const taxRate = 0;
  const tax = preTaxTotal * taxRate;
  const total = preTaxTotal + tax;

  return {
    subtotal,
    shipping,
    discount,
    tax,
    total: Math.max(0, total),
    selectedItemsCount: selectedItems.length
  };
}, [cartItems, selectedItemIds, shippingOption, appliedCoupons, recalculationTrigger]);

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