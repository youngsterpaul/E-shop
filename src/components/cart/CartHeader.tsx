
import { Checkbox } from '@/components/ui/checkbox';

interface CartHeaderProps {
  totalItems: number;
  selectedCount: number;
  onSelectAll: (selectAll: boolean) => void;
  allSelected: boolean;
}

const CartHeader = ({ totalItems, selectedCount, onSelectAll, allSelected }: CartHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onSelectAll}
        />
        <span className="text-sm font-medium">
          Select All ({selectedCount}/{totalItems})
        </span>
      </div>
      <span className="text-sm text-gray-600">
        {selectedCount} of {totalItems} items selected
      </span>
    </div>
  );
};

export default CartHeader;
