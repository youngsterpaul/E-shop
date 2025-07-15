
import { useCheckout } from '@/contexts/CheckoutContext';
import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, CheckCircle } from 'lucide-react';
import { CustomerDetailsStep } from './CustomerDetailsStep';
import { DeliveryStep } from './DeliveryStep';
import { PaymentStep } from './PaymentStep';
import { SuccessStep } from './SuccessStep';

const CheckoutModal = () => {
  const { 
    isOpen, 
    closeCheckout, 
    step, 
    paymentStatus 
  } = useCheckout();
  
  const { calculations } = useSelectiveCart();

  const steps = [
    { id: 1, title: 'Customer Details', completed: step > 1, active: step === 1 },
    { id: 2, title: 'Delivery', completed: step > 2, active: step === 2 },
    { id: 3, title: 'Payment', completed: step > 3, active: step === 3 },
    { id: 4, title: 'Complete', completed: step === 4, active: step === 4 }
  ];

  const handleClose = () => {
    if (paymentStatus.status === 'processing' || paymentStatus.status === 'waiting') {
      if (window.confirm('Payment is in progress. Are you sure you want to close?')) {
        closeCheckout();
      }
    } else {
      closeCheckout();
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <CustomerDetailsStep />;
      case 2:
        return <DeliveryStep />;
      case 3:
        return <PaymentStep />;
      case 4:
        return <SuccessStep />;
      default:
        return <CustomerDetailsStep />;
    }
  };

  const progressValue = (step / 4) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-1 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-semibold">
              {step === 4 ? 'Order Complete' : 'Checkout'}
            </DialogTitle>
          </div>
          
          {step < 4 && (
            <div className="space-y-2">
              <Progress value={progressValue} className="w-full" />
              
              <div className="flex justify-between text-sm">
                {steps.map((stepItem) => (
                  <div
                    key={stepItem.id}
                    className={`flex items-center gap-2 ${
                      stepItem.completed
                        ? 'text-green-600'
                        : stepItem.active
                        ? 'text-orange-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {stepItem.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <div
                        className={`h-4 w-4 rounded-full border-2 ${
                          stepItem.active
                            ? 'border-orange-600 bg-orange-100'
                            : 'border-gray-300'
                        }`}
                      />
                    )}
                    <span className="hidden sm:inline">{stepItem.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {renderStepContent()}
        </div>

        {step < 4 && calculations.selectedItemsCount > 0 && (
          <div className="border-t px-6">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>{calculations.selectedItemsCount} items selected</span>
              <span className="font-semibold text-lg">
                Total: KES {((calculations.total)-(calculations.tax)).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;
