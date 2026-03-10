import { useState, useEffect } from 'react';
import { AlertCircle, Clock } from 'lucide-react';

interface PendingOrderCountdownProps {
  createdAt: string;
  expiryHours?: number;
}

const PendingOrderCountdown = ({ createdAt, expiryHours = 48 }: PendingOrderCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const expiryTime = new Date(createdAt).getTime() + expiryHours * 60 * 60 * 1000;

    const update = () => {
      const now = Date.now();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        return;
      }

      setIsUrgent(diff < 6 * 60 * 60 * 1000); // < 6 hours

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt, expiryHours]);

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-3 py-2 text-xs font-medium">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>This order has expired and will be removed shortly.</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
      isUrgent 
        ? 'bg-destructive/10 border border-destructive/20 text-destructive' 
        : 'bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400'
    }`}>
      <Clock className="h-3.5 w-3.5 shrink-0" />
      <span>
        {isUrgent ? '⚠️ ' : ''}Complete payment within <strong className="font-bold tabular-nums">{timeLeft}</strong> or this order will be auto-cancelled.
      </span>
    </div>
  );
};

export default PendingOrderCountdown;
