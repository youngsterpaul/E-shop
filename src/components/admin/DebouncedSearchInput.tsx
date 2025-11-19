import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { debounce } from '@/utils/debounce';

interface DebouncedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}

export function DebouncedSearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  delay = 300,
  className = '',
}: DebouncedSearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // Create debounced onChange handler
  useEffect(() => {
    const debouncedOnChange = debounce((val: string) => {
      onChange(val);
    }, delay);

    // Call debounced function
    if (localValue !== value) {
      debouncedOnChange(localValue);
    }

    // Cleanup is handled by the debounce function
  }, [localValue, delay]);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
