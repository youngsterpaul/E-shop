
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckoutState, CustomerDetails, DeliveryInfo, PaymentStatus } from '@/types/checkout';

interface CheckoutContextType extends CheckoutState {
  setStep: (step: number) => void;
  updateCustomerDetails: (details: Partial<CustomerDetails>) => void;
  updateDeliveryInfo: (info: Partial<DeliveryInfo>) => void;
  updatePaymentStatus: (status: Partial<PaymentStatus>) => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  resetCheckout: () => void;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

const initialState: CheckoutState = {
  step: 1,
  customerDetails: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  },
  deliveryInfo: {
    address: '',
    city: '',
    county: '',
    deliveryMethod: 'standard',
    specialInstructions: '',
  },
  paymentStatus: {
    status: 'idle',
  },
  isOpen: false,
};

export const CheckoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<CheckoutState>(initialState);

  const setStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const updateCustomerDetails = useCallback((details: Partial<CustomerDetails>) => {
    setState(prev => ({
      ...prev,
      customerDetails: { ...prev.customerDetails, ...details }
    }));
  }, []);

  const updateDeliveryInfo = useCallback((info: Partial<DeliveryInfo>) => {
    setState(prev => ({
      ...prev,
      deliveryInfo: { ...prev.deliveryInfo, ...info }
    }));
  }, []);

  const updatePaymentStatus = useCallback((status: Partial<PaymentStatus>) => {
    setState(prev => ({
      ...prev,
      paymentStatus: { ...prev.paymentStatus, ...status }
    }));
  }, []);

  const openCheckout = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }));
  }, []);

  const closeCheckout = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const resetCheckout = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <CheckoutContext.Provider value={{
      ...state,
      setStep,
      updateCustomerDetails,
      updateDeliveryInfo,
      updatePaymentStatus,
      openCheckout,
      closeCheckout,
      resetCheckout,
    }}>
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
};
