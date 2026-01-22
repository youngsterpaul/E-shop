import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { ReactNode } from 'react';

interface MobileHeaderProps {
  title: string;
  onBack?: () => void;
  backTo?: string;
  rightAction?: ReactNode;
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

  if (!isMobile) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 flex items-center justify-between px-2 py-4 shadow-sm"
      style={{
        top: 0,
        paddingTop: 'calc(10px + env(safe-area-inset-top))',
        height: 'calc(56px + env(safe-area-inset-top))',
      }}
    >
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="p-2 h-8 w-8"
          onClick={handleBack}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-sm font-semibold truncate">{title}</h1>
      </div>
      {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
    </div>
  );
};
