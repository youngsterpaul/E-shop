import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.1";

const MPESA_ENVIRONMENT = Deno.env.get('MPESA_ENVIRONMENT') || 'sandbox';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

async function isIPWhitelisted(ip: string, environment: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('callback_ip_whitelist')
      .select('ip_address')
      .eq('ip_address', ip)
      .eq('environment', environment);
    
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
      console.error('Order not found for email:', orderError);
      return;
    }

    // Validate required fields
    if (!order.email || !order.amount) {
      console.error('Missing required fields for email:', {
        hasEmail: !!order.email,
        hasAmount: !!order.amount
      });
      return;
    }

    console.log('Sending payment confirmation email to:', order.email);

    // Send email directly using Resend
    const emailResponse = await resend.emails.send({
      from: "SMARTKENYA ONLINE SHOPPING <info@smartkenya.co.ke>",
      to: [order.email],
      subject: `Payment Successful`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #22c55e 0%, #22c55e 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Payment Successful!</h1>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">
              Hello ${order.username || 'Valued Customer'},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Thank you for your payment! We have successfully received your M-Pesa payment and your order is now being processed.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #f97316; margin-top: 0;">Payment Details</h3>
              <p style="margin: 8px 0;"><strong>Order ID:</strong> ${orderId}</p>
              <p style="margin: 8px 0;"><strong>Amount Paid:</strong> Ksh ${order.amount.toLocaleString()}</p>
              <p style="margin: 8px 0;"><strong>Payment Method:</strong> M-Pesa</p>
              <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #22c55e; font-weight: bold;">Confirmed</span></p>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
              <h4 style="color: #92400e; margin-top: 0;">What's Next?</h4>
              <ul style="color: #92400e; margin: 0; padding-left: 20px;">
                <li>Your order will be processed within 24 hours</li>
                <li>You'll receive a shipping confirmation email once your order is dispatched</li>
                <li>Track your order status in your account dashboard</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://smartkenya.co.ke/orders" 
                 style="background: linear-gradient(135deg, #22c55e 0%, #22c55e 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                View Order Status
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
              Need help? Contact our customer support:
            </p>
            <p style="font-size: 14px; color: #666; margin: 5px 0;">
              📧 Email: support@smartkenya.co.ke<br>
              📞 Phone: +254 798 229 783<br>
              💬 WhatsApp: +254 798 229 783
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
              <p style="font-size: 14px; color: #999; margin: 0;">
                Thank you for shopping with SmartKenya!<br>
                <a href="https://smartkenya.co.ke" style="color: #f97316;">www.smartkenya.co.ke</a>
              </p>
            </div>
          </div>
        </div>
      `
    });

    console.log("Payment confirmation email sent successfully:", emailResponse);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

const handler = async (req: Request): Promise<Response> => {
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

    // Environment-aware IP checking
    if (MPESA_ENVIRONMENT === 'production') {
      const isWhitelisted = await isIPWhitelisted(clientIP, MPESA_ENVIRONMENT);
      if (!isWhitelisted) {
        console.warn('Unauthorized callback attempt from IP:', clientIP);
        return new Response('Unauthorized', { status: 401 });
      }
    } else {
      // In sandbox, log but don't block (for easier testing)
      const isWhitelisted = await isIPWhitelisted(clientIP, MPESA_ENVIRONMENT);
      if (!isWhitelisted) {
        // Continue processing instead of blocking
      }
    }

    const callbackData = await req.json();

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