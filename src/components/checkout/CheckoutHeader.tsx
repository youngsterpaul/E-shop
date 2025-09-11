
import { useCheckout } from '@/contexts/CheckoutContext';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft } from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';

export const CheckoutHeader = () => {
  const { step, setStep, closeCheckout, paymentStatus } = useCheckout();
  const isMobile = isMobileUserAgent();

  const steps = [
    { id: 1, title: 'Details', description: 'Customer info' },
    { id: 2, title: 'Delivery', description: 'Address & method' },
    { id: 3, title: 'Payment', description: 'M-Pesa payment' },
    { id: 4, title: 'Success', description: 'Order confirmed' }
  ];

  const canGoBack = step > 1 && step < 4 && paymentStatus.status !== 'processing';

  const handleBack = () => {
    if (canGoBack) {
      setStep(step - 1);
    }
  };

  const handleClose = () => {
    if (paymentStatus.status === 'processing' || paymentStatus.status === 'waiting') {
      if (window.confirm('Payment is in progress. Are you sure you want to close?')) {
        closeCheckout();
      }
    } else {
      closeCheckout();
    }
  };

  return (
    <div className="border-b bg-white">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          {isMobile && canGoBack && (
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="font-semibold text-lg">Checkout</h1>
            {!isMobile && (
              <p className="text-sm text-gray-500">
                Step {step} of {steps.length}
              </p>
            )}
          </div>
        </div>
        
        <Button variant="ghost" size="sm" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Steps */}
      {!isMobile && (
        <div className="px-4 pb-4">
          <div className="flex items-center">
            {steps.map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${step >= stepItem.id 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {stepItem.id}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      step >= stepItem.id ? 'text-orange-600' : 'text-gray-500'
                    }`}>
                      {stepItem.title}
                    </p>
                    <p className="text-xs text-gray-400">{stepItem.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${
                    step > stepItem.id ? 'bg-orange-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Progress Bar */}
      {isMobile && (
        <div className="px-4 pb-2">
          <div className="flex space-x-1">
            {steps.map((stepItem) => (
              <div
                key={stepItem.id}
                className={`flex-1 h-2 rounded-full ${
                  step >= stepItem.id ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500">
              {steps.find(s => s.id === step)?.title}
            </span>
            <span className="text-xs text-gray-500">
              {step} of {steps.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
