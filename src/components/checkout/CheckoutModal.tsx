import { useCheckout } from '@/contexts/CheckoutContext';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { CheckoutHeader } from './CheckoutHeader';
import { CustomerDetailsStep } from './CustomerDetailsStep';
import { DeliveryInfoStep } from './DeliveryInfoStep';
import { PaymentStep } from './PaymentStep';
import { SuccessStep } from './SuccessStep';
import { OrderSummary } from './OrderSummary';
import { useEffect } from 'react';

export const CheckoutModal = () => {
  const { isOpen, closeCheckout, step, paymentStatus } = useCheckout();

  // Prevent body scroll when modal is open and ensure mobile viewport
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      // Ensure proper viewport for mobile
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
      }
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      
      // Reset viewport
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
      }
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    if (paymentStatus.status === 'processing' || paymentStatus.status === 'waiting') {
      if (window.confirm('Payment is in progress. Are you sure you want to close?')) {
        closeCheckout();
      }
    } else {
      closeCheckout();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <CustomerDetailsStep />;
      case 2:
        return <DeliveryInfoStep />;
      case 3:
        return <PaymentStep />;
      case 4:
        return <SuccessStep />;
      default:
        return <CustomerDetailsStep />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogOverlay className="bg-black/50 backdrop-blur-sm fixed inset-0 z-50" />
      <DialogContent className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 w-full h-full md:w-[90vw] md:max-w-4xl md:h-auto md:max-h-[90vh] p-0 border-0 md:border md:rounded-lg z-50 flex flex-col overflow-hidden">
        <div className="flex flex-col md:flex-row h-full flex-1 overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <CheckoutHeader />
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="p-4 md:p-6">
                <div className="pb-20 md:pb-0">
                  {renderStep()}
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Summary - Mobile: Fixed bottom, Desktop: Sidebar */}
          <div className={`
            ${(step === 3 || step === 4) ? 'hidden md:flex' : 'flex'}
            ${step === 4 ? 'hidden' : ''}
            w-full md:w-80 bg-gray-50 border-t md:border-t-0 md:border-l
            fixed bottom-0 left-0 right-0 md:relative md:bottom-auto
            max-h-[40vh] md:max-h-full md:flex-col
            z-10 safe-area-inset-bottom overflow-hidden
          `}>
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <OrderSummary />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};