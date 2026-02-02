import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMobileEnhancements } from '@/hooks/useMobileEnhancements';

interface ScrollToTopButtonProps {
  threshold?: number;
}

export const ScrollToTopButton = ({ threshold = 400 }: ScrollToTopButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollToTop } = useMobileEnhancements();

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        scale: isVisible ? 1 : 0.8,
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-24 right-4 z-40"
    >
      <Button
        onClick={scrollToTop}
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </motion.div>
  );
};
