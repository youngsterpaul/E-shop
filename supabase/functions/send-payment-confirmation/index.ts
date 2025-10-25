import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Define interface for request body
interface PaymentConfirmationRequest {
  email: string;
  orderId: string;
  amount: number;
  customerName?: string;
  trackingId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Payment confirmation email function called');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }
  
  try {
    // Check if RESEND_API_KEY exists
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not configured');
      return new Response(JSON.stringify({
        error: 'Email service not configured'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    const requestBody = await req.json();
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const { email, orderId, amount, customerName, trackingId }: PaymentConfirmationRequest = requestBody;
    
    if (!email || !orderId || !amount) {
      console.error('Missing required fields:', {
        email: !!email,
        orderId: !!orderId,
        amount: !!amount
      });
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    console.log('Sending email to:', email, 'for order:', orderId);
    
    const emailResponse = await resend.emails.send({
      from: "SmartKenya <info@smartkenya.co.ke>",
      to: [email],
      subject: `Payment Confirmation - Order #${orderId}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #22c55e 0%, #22c55e 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Payment Confirmed!</h1>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">
              Hello ${customerName || 'Valued Customer'},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Thank you for your payment! We have successfully received your M-Pesa payment and your order is now being processed.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #f97316; margin-top: 0;">Payment Details</h3>
              <p style="margin: 8px 0;"><strong>Order ID:</strong> ${orderId}</p>
              <p style="margin: 8px 0;"><strong>Tracking Number:</strong> ${trackingId || 'N/A'}</p>
              <p style="margin: 8px 0;"><strong>Amount Paid:</strong> Ksh ${amount.toLocaleString()}</p>
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
              <a href="https://smartkenya.co.ke/order/${orderId}" 
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
    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
    
  } catch (error: unknown) {
    console.error("Error sending payment confirmation email:", error);
    
    // Type guard to safely access error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
};

serve(handler);