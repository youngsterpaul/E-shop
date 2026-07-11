import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface ToastNotificationProps {
  message: string;
  type?: NotificationType;
  duration?: number;
  onClose?: () => void;
  show: boolean;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle
};

const colors = {
  success: 'bg-primary',
  error: 'bg-destructive',
  info: 'bg-primary',
  warning: 'bg-amber-500'
};

export const ToastNotification = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
  show
}: ToastNotificationProps) => {
  const [isVisible, setIsVisible] = useState(show);
  const Icon = icons[type];

  useEffect(() => {
    setIsVisible(show);
    
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-28 left-4 right-4 z-50 flex justify-center pointer-events-none"
        >
          <div 
            className={`${colors[type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm pointer-events-auto`}
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook for using toast notifications
export const useToastNotification = () => {
  const [toast, setToast] = useState<{ message: string; type: NotificationType } | null>(null);

  const showToast = (message: string, type: NotificationType = 'info') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  const ToastComponent = toast ? (
    <ToastNotification
      message={toast.message}
      type={toast.type}
      show={true}
      onClose={hideToast}
    />
  ) : null;

  return { showToast, hideToast, ToastComponent };
};
