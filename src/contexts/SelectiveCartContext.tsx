
import React, { createContext, useContext, useState, useEffect } from 'react';
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
}

const SelectiveCartContext = createContext<SelectiveCartContextType | undefined>(undefined);

export const SelectiveCartProvider = ({ children }: { children: React.ReactNode }) => {
  const { cartItems } = useCartContext();
  const [selections, setSelections] = useState<CartItemSelection[]>([]);
  const [shippingOption, setShippingOptionState] = useState<ShippingOption | null>(null);
  const [appliedCoupons, setAppliedCoupons] = useState<Coupon[]>([]);

  // Initialize selections when cart items change
  useEffect(() => {
    const newSelections = cartItems.map(item => ({
      itemId: item.id,
      selected: selections.find(s => s.itemId === item.id)?.selected || false
    }));
    setSelections(newSelections);
  }, [cartItems]);

  const toggleItemSelection = (itemId: string) => {
    setSelections(prev => 
      prev.map(selection => 
        selection.itemId === itemId 
          ? { ...selection, selected: !selection.selected }
          : selection
      )
    );
  };

  const selectAllItems = () => {
    setSelections(prev => prev.map(selection => ({ ...selection, selected: true })));
  };

  const clearAllSelections = () => {
    setSelections(prev => prev.map(selection => ({ ...selection, selected: false })));
  };

  const toggleSelectAll = () => {
    const selectedCount = selections.filter(s => s.selected).length;
    if (selectedCount === cartItems.length) {
      clearAllSelections();
    } else {
      selectAllItems();
    }
  };

  const setShippingOption = (option: ShippingOption | null) => {
    setShippingOptionState(option);
  };

  const applyCoupon = (coupon: Coupon) => {
    setAppliedCoupons(prev => [...prev, coupon]);
  };

  const removeCoupon = (couponId: string) => {
    setAppliedCoupons(prev => prev.filter(coupon => coupon.id !== couponId));
  };

  const getSelectedItems = () => {
    return cartItems.filter(item => 
      selections.find(s => s.itemId === item.id && s.selected)
    );
  };

  const hasSelectedItems = () => {
    return selections.some(s => s.selected);
  };

  // Calculate selection states
  const selectedCount = selections.filter(s => s.selected).length;
  const selectedItems = selections.filter(s => s.selected).map(s => s.itemId);
  const isAllSelected = selectedCount === cartItems.length && cartItems.length > 0;
  const isIndeterminate = selectedCount > 0 && selectedCount < cartItems.length;

  // Calculate totals
  const calculations = React.useMemo((): CartCalculations => {
    const selectedItems = getSelectedItems();
    const subtotal = selectedItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const shipping = shippingOption ? shippingOption.price : 0;
    const discount = appliedCoupons.reduce((total, coupon) => {
      return total + (coupon.type === 'percentage' ? subtotal * coupon.discount / 100 : coupon.discount);
    }, 0);
    const tax = subtotal * 0.16; // 16% tax
    const total = subtotal + shipping + tax - discount;

    return {
      subtotal,
      shipping,
      discount,
      tax,
      total: Math.max(0, total),
      selectedItemsCount: selectedItems.length
    };
  }, [selections, cartItems, shippingOption, appliedCoupons]);

  const value = {
    selections,
    selectedItems,
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
    hasSelectedItems
  };

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
