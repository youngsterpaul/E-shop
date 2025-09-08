
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

async function isIPWhitelisted(ip: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('callback_ip_whitelist')
      .select('ip_address')
      .eq('ip_address', ip);
    
    if (error) {
      console.error('Error checking IP whitelist:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('IP whitelist check failed:', error);
    return false;
  }
}

async function sendPaymentConfirmationEmail(orderId: string) {
  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return;
    }

    // Call email function
    const { error: emailError } = await supabase.functions.invoke('send-payment-confirmation', {
      body: { 
        email: order.email,
        orderId: orderId,
        amount: order.amount,
        trackingId: order.tracking_number,
        customerName: order.username
      }
    });

    if (emailError) {
      console.error('Email sending failed:', emailError);
    } else {
      console.log('Payment confirmation email sent successfully');
    }
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Callback received - Method:', req.method);
  console.log('Callback received - URL:', req.url);
  console.log('Callback received - Headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    console.error('Method not allowed:', req.method);
    return new Response('Method not allowed', { 
      status: 405,
      headers: {
        'Allow': 'POST',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }

  try {
    const clientIP = getClientIP(req);
    console.log('Callback received from IP:', clientIP);

    // For development/testing, you might want to skip IP whitelist check
    // Comment out these lines if you're testing locally
    const isWhitelisted = await isIPWhitelisted(clientIP);
    if (!isWhitelisted) {
      console.warn('Unauthorized callback attempt from IP:', clientIP);
      // In development, you might want to allow this for testing
      // return new Response('Unauthorized', { status: 401 });
    }

    const callbackData = await req.json();
    console.log('M-Pesa Callback Data:', JSON.stringify(callbackData, null, 2));

    const { Body } = callbackData;
    if (!Body || !Body.stkCallback) {
      console.error('Invalid callback format');
      return new Response('Invalid callback format', { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    const { stkCallback } = Body;
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = stkCallback;

    // Extract transaction details from metadata
    let mpesaReceiptNumber = '';
    let transactionDate = '';
    let phoneNumber = '';
    let amount = 0;

    if (CallbackMetadata && CallbackMetadata.Item) {
      CallbackMetadata.Item.forEach((item: any) => {
        switch (item.Name) {
          case 'MpesaReceiptNumber':
            mpesaReceiptNumber = item.Value;
            break;
          case 'TransactionDate':
            transactionDate = item.Value;
            break;
          case 'PhoneNumber':
            phoneNumber = item.Value;
            break;
          case 'Amount':
            amount = item.Value;
            break;
        }
      });
    }

    // Update payment record
    const updateData: any = {
      merchant_request_id: MerchantRequestID,
      result_code: ResultCode,
      result_desc: ResultDesc,
      callback_data: callbackData,
      updated_at: new Date().toISOString()
    };

    if (ResultCode === 0) {
      // Payment successful
      updateData.status = 'success';
      updateData.mpesa_receipt_number = mpesaReceiptNumber;
      updateData.transaction_date = new Date(
        transactionDate.toString().replace(
          /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
          '$1-$2-$3T$4:$5:$6'
        )
      ).toISOString();
    } else {
      // Payment failed
      updateData.status = 'failed';
    }

    const { data: payment, error: updateError } = await supabase
      .from('mpesa_payments')
      .update(updateData)
      .eq('checkout_request_id', CheckoutRequestID)
      .select('order_id')
      .single();

    if (updateError) {
      console.error('Failed to update payment:', updateError);
      return new Response('Database update failed', { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // If payment was successful, update order status and send confirmation email
    if (ResultCode === 0 && payment?.order_id) {
      console.log('Payment successful, updating order status and sending confirmation email');
      
      // Update order status to 'paid'
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('order_id', payment.order_id);

      if (orderUpdateError) {
        console.error('Failed to update order status:', orderUpdateError);
      }

      // Send confirmation email
      await sendPaymentConfirmationEmail(payment.order_id);
    }

    console.log('Callback processed successfully');
    return new Response('Callback processed', { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    console.error('Callback processing error:', error);
    return new Response('Internal server error', { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
};

serve(handler);
