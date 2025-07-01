
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
      
      const { data, error } = await supabase.functions.invoke('mpesa-payment', {
        body: request
      });

      console.log('M-Pesa function response:', { data, error });

      if (error) {
        console.error('Payment initiation error:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to initiate payment' 
        };
      }

      if (data && data.success) {
        return {
          success: true,
          checkoutRequestId: data.checkoutRequestId
        };
      } else {
        return { 
          success: false, 
          error: data?.error || 'Payment initiation failed' 
        };
      }
    } catch (error: any) {
      console.error('Payment initiation failed:', error);
      
      let errorMessage = 'Payment initiation failed';
      if (error.message) {
        errorMessage = error.message;
      }
      
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
        result_desc: data.result_desc
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
