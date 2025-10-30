import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { ReactNode } from 'react';

interface MobileHeaderProps {
  title: string;
  onBack?: () => void;
  backTo?: string;
  rightAction?: ReactNode; // ✅ matches getHeaderProps return type
}

export const MobileHeader = ({
  title,
  onBack,
  backTo,
  rightAction,
}: MobileHeaderProps) => {
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  const handleBack = () => {
    if (onBack) onBack();
    else if (backTo) navigate(backTo);
    else navigate(-1);
  };

  // ✅ Safe early return (no hooks below this)
  if (!isMobile) return null;
  if (location.pathname === '/') return null;

  return (
   <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between overflow-hidden">
  <div className="flex items-center gap-3">
    <Button variant="ghost" size="sm" className="p-2 h-8 w-8" onClick={handleBack}>
      <ChevronLeft className="h-4 w-4" />
    </Button>
  </div>
  <div className="flex-grow flex justify-center items-center overflow-hidden">
    <h1 className="text-md font-semibold truncate text-center">
      {title}
    </h1>
  </div>
  {rightAction && (
    <div className="flex-shrink-0">
      {rightAction}
    </div>
  )}
</div>
  );
};
