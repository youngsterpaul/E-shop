<<<<<<< HEAD

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentRequest {
  phone: string;
  amount: number;
  orderId: string;
}

interface PaymentResult {
  success: boolean;
  checkoutRequestId?: string;
  error?: string;
}

interface PaymentStatus {
  status: 'pending' | 'success' | 'failed';
  result_desc?: string;
}

export const useMpesaPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const initiatePayment = async (request: PaymentRequest): Promise<PaymentResult> => {
    setIsProcessing(true);
    
    try {
      console.log('Initiating M-Pesa payment:', request);
      
      // Validate phone number format before sending
      const phoneRegex = /^(\+?254|0)?[17]\d{8}$/;
      if (!phoneRegex.test(request.phone)) {
        throw new Error('Invalid phone number format. Please use format: 0712345678 or +254712345678');
      }

      // Validate amount
      if (request.amount < 1) {
        throw new Error('Amount must be at least 1 KES');
      }

      const { data, error } = await supabase.functions.invoke('mpesa-payment', {
        body: request
      });

      console.log('M-Pesa function response:', { data, error });

      if (error) {
        console.error('Payment initiation error:', error);
        
        // Handle different types of errors
        if (error.message?.includes('not properly configured')) {
          throw new Error('M-Pesa service is currently unavailable. Please try again later or contact support.');
        } else if (error.message?.includes('Invalid phone number')) {
          throw new Error('Please enter a valid Safaricom phone number (07XXXXXXXX or 01XXXXXXXX)');
        } else if (error.message?.includes('Unable to connect')) {
          throw new Error('Connection error. Please check your internet connection and try again.');
        }
        
        throw new Error(error.message || 'Failed to initiate payment');
      }

      if (data && data.success) {
        toast({
          title: "Payment Request Sent",
          description: "Please check your phone and enter your M-Pesa PIN",
        });
        
        return {
          success: true,
          checkoutRequestId: data.checkoutRequestId
        };
      } else {
        const errorMessage = data?.error || 'Payment initiation failed';
        console.error('Payment failed:', errorMessage);
        
        toast({
          title: "Payment Failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        return { 
          success: false, 
          error: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Payment initiation failed:', error);
      
      let errorMessage = 'Payment initiation failed';
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  };

  const checkPaymentStatus = async (checkoutRequestId: string): Promise<PaymentStatus | null> => {
    try {
      const { data, error } = await supabase
        .from('mpesa_payments')
        .select('status, result_desc')
        .eq('checkout_request_id', checkoutRequestId)
        .single();

      if (error) {
        console.error('Error checking payment status:', error);
        return null;
      }

      return {
        status: data.status as 'pending' | 'success' | 'failed',
        result_desc: data.result_desc ?? undefined
      };
    } catch (error) {
      console.error('Error checking payment status:', error);
      return null;
    }
  };

  return {
    initiatePayment,
    checkPaymentStatus,
    isProcessing
  };
};
=======

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentRequest {
  phone: string;
  amount: number;
  orderId: string;
}

interface PaymentResult {
  success: boolean;
  checkoutRequestId?: string;
  error?: string;
}

interface PaymentStatus {
  status: 'pending' | 'success' | 'failed';
  result_desc?: string;
}

export const useMpesaPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const initiatePayment = async (request: PaymentRequest): Promise<PaymentResult> => {
    setIsProcessing(true);
    
    try {
      console.log('Initiating M-Pesa payment:', request);
      
      // Validate phone number format before sending
      const phoneRegex = /^(\+?254|0)?[17]\d{8}$/;
      if (!phoneRegex.test(request.phone)) {
        throw new Error('Invalid phone number format. Please use format: 0712345678 or +254712345678');
      }

      // Validate amount
      if (request.amount < 1) {
        throw new Error('Amount must be at least 1 KES');
      }

      const { data, error } = await supabase.functions.invoke('mpesa-payment', {
        body: request
      });

      console.log('M-Pesa function response:', { data, error });

      if (error) {
        console.error('Payment initiation error:', error);
        
        // Handle different types of errors
        if (error.message?.includes('not properly configured')) {
          throw new Error('M-Pesa service is currently unavailable. Please try again later or contact support.');
        } else if (error.message?.includes('Invalid phone number')) {
          throw new Error('Please enter a valid Safaricom phone number (07XXXXXXXX or 01XXXXXXXX)');
        } else if (error.message?.includes('Unable to connect')) {
          throw new Error('Connection error. Please check your internet connection and try again.');
        }
        
        throw new Error(error.message || 'Failed to initiate payment');
      }

      if (data && data.success) {
        toast({
          title: "Payment Request Sent",
          description: "Please check your phone and enter your M-Pesa PIN",
        });
        
        return {
          success: true,
          checkoutRequestId: data.checkoutRequestId
        };
      } else {
        const errorMessage = data?.error || 'Payment initiation failed';
        console.error('Payment failed:', errorMessage);
        
        toast({
          title: "Payment Failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        return { 
          success: false, 
          error: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Payment initiation failed:', error);
      
      let errorMessage = 'Payment initiation failed';
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  };

  const checkPaymentStatus = async (checkoutRequestId: string): Promise<PaymentStatus | null> => {
    try {
      const { data, error } = await supabase
        .from('mpesa_payments')
        .select('status, result_desc')
        .eq('checkout_request_id', checkoutRequestId)
        .single();

      if (error) {
        console.error('Error checking payment status:', error);
        return null;
      }

      return {
        status: data.status as 'pending' | 'success' | 'failed',
        result_desc: data.result_desc ?? undefined
      };
    } catch (error) {
      console.error('Error checking payment status:', error);
      return null;
    }
  };

  return {
    initiatePayment,
    checkPaymentStatus,
    isProcessing
  };
};
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
