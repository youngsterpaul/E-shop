import { useState, useEffect } from 'react';
import { AlertCircle, Clock } from 'lucide-react';

interface GemFashionStyleProps {
  createdAt: string;
  expiryHours?: number;
}

const GemFashionStyle = ({ createdAt, expiryHours = 48 }: GemFashionStyleProps) => {
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

  // Styling for Expired State (Chic, muted minimalist style)
  if (isExpired) {
    return (
      <div className="flex items-center gap-2.5 bg-stone-100 border border-stone-200 text-stone-500 rounded-md px-4 py-2.5 text-xs tracking-wide uppercase font-semibold dark:bg-stone-900 dark:border-stone-800 dark:text-stone-400">
        <AlertCircle className="h-4 w-4 shrink-0 stroke-[1.5]" />
        <span>This exclusive order window has closed.</span>
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center gap-2.5 rounded-md px-4 py-2.5 text-xs tracking-wide font-medium transition-all duration-300 ${
        isUrgent 
          ? 'bg-rose-50/60 border border-rose-200/80 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-300 animate-pulse' 
          : 'bg-zinc-50 border border-zinc-200/60 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200'
      }`}
    >
      <Clock className={`h-4 w-4 shrink-0 stroke-[1.5] ${isUrgent ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600/80'}`} />
      <span className="uppercase">
        {isUrgent ? 'Final Call: ' : 'Secure Your Pieces: '}
        <span className="normal-case font-normal text-zinc-600 dark:text-zinc-400">Complete payment within </span>
        <strong className={`font-bold tabular-nums tracking-wider ${isUrgent ? 'text-rose-700 dark:text-rose-300' : 'text-zinc-900 dark:text-white'}`}>
          {timeLeft}
        </strong>
        <span className="normal-case font-normal text-zinc-600 dark:text-zinc-400"> before reservation expires.</span>
      </span>
    </div>
  );
};

export default GemFashionStyle;