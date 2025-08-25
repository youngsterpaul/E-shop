import { Checkbox } from '@/components/ui/checkbox';

interface CartHeaderProps {
  totalItems: number;
  selectedCount: number;
  onSelectAll: (selectAll: boolean) => void;
  allSelected: boolean;
}

const CartHeader = ({ totalItems, selectedCount, onSelectAll, allSelected }: CartHeaderProps) => {
  const isIndeterminate = selectedCount > 0 && selectedCount < totalItems;
  
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={allSelected}
          ref={(ref) => {
            if (ref && 'indeterminate' in ref) {
              (ref as HTMLInputElement).indeterminate = isIndeterminate;
            }
          }}
          onCheckedChange={onSelectAll}
          aria-label={
            allSelected 
              ? "Deselect all items" 
              : selectedCount > 0 
                ? "Select remaining items" 
                : "Select all items"
          }
        />
        <span className="text-sm font-medium">
          Select All ({selectedCount}/{totalItems})
        </span>
      </div>
      
      {/* Mobile-friendly responsive text */}
      <span className="text-sm text-gray-600 hidden sm:inline">
        {selectedCount} of {totalItems} items selected
      </span>
      <span className="text-xs text-gray-600 sm:hidden">
        {selectedCount}/{totalItems}
      </span>
    </div>
  );
};

export default CartHeader;