
import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import SelectableCartItem from '@/components/cart/SelectableCartItem';

interface VirtualizedCartItemsProps {
  cartItems: any[];
  selectedItems: string[];
  toggleItemSelection: (itemId: string) => void;
  height?: number;
  itemHeight?: number;
}

const VirtualizedCartItems = ({ 
  cartItems, 
  selectedItems, 
  toggleItemSelection,
  height = 400,
  itemHeight = 120 
}: VirtualizedCartItemsProps) => {
  
  // Render individual cart item
  const CartItemRenderer = useMemo(() => {
    return ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const item = cartItems[index];
      
      return (
        <div style={style} className="px-4 py-2">
          <SelectableCartItem
            key={item.id}
            item={item}
            isSelected={selectedItems.includes(item.id)}
            onToggleSelect={() => toggleItemSelection(item.id)}
          />
        </div>
      );
    };
  }, [cartItems, selectedItems, toggleItemSelection]);

  // Don't use virtualization for small lists (under 20 items)
  if (cartItems.length < 20) {
    return (
      <div className="divide-y divide-gray-200">
        {cartItems.map((item) => (
          <SelectableCartItem
            key={item.id}
            item={item}
            isSelected={selectedItems.includes(item.id)}
            onToggleSelect={() => toggleItemSelection(item.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <List
      height={height}
      itemCount={cartItems.length}
      itemSize={itemHeight}
      itemData={cartItems}
      className="divide-y divide-gray-200"
    >
      {CartItemRenderer}
    </List>
  );
};

export default VirtualizedCartItems;