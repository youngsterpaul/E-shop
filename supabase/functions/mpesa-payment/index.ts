
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const MPESA_ENVIRONMENT = Deno.env.get('MPESA_ENVIRONMENT') || 'sandbox';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  phone: string;
  amount: number;
  orderId: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  blockDurationMinutes: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  payment_init: {
    maxAttempts: 3,
    windowMinutes: 15,
    blockDurationMinutes: 60
  }
};

async function checkRateLimit(
  identifier: string,
  requestType: string
): Promise<{ allowed: boolean; remainingTime?: number }> {
  const config = RATE_LIMITS[requestType];
  const now = new Date();
  
  const { data: existing, error } = await supabase
    .from('mpesa_rate_limit')
    .select('*')
    .eq('identifier', identifier)
    .eq('request_type', requestType)
    .maybeSingle();
  
  if (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true };
  }
  
  if (existing?.blocked_until) {
    const blockExpiry = new Date(existing.blocked_until);
    if (now < blockExpiry) {
      const remainingMinutes = Math.ceil(
        (blockExpiry.getTime() - now.getTime()) / 60000
      );
      return { allowed: false, remainingTime: remainingMinutes };
    }
  }
  
  if (existing) {
    const windowStart = new Date(existing.window_start);
    const windowExpiry = new Date(
      windowStart.getTime() + config.windowMinutes * 60000
    );
    
    if (now < windowExpiry) {
      if (existing.attempts >= config.maxAttempts) {
        const blockUntil = new Date(
          now.getTime() + config.blockDurationMinutes * 60000
        );
        
        await supabase
          .from('mpesa_rate_limit')
          .update({
            blocked_until: blockUntil.toISOString(),
            last_attempt: now.toISOString()
          })
          .eq('id', existing.id);
        
        await supabase
          .from('security_alerts')
          .insert({
            alert_type: 'mpesa_rate_limit_exceeded',
            severity: 'warning',
            identifier,
            details: {
              attempts: existing.attempts,
              blocked_until: blockUntil.toISOString()
            }
          });
        
        return { allowed: false, remainingTime: config.blockDurationMinutes };
      }
      
      await supabase
        .from('mpesa_rate_limit')
        .update({
          attempts: existing.attempts + 1,
          last_attempt: now.toISOString()
        })
        .eq('id', existing.id);
      
      return { allowed: true };
    } else {
      await supabase
        .from('mpesa_rate_limit')
        .update({
          attempts: 1,
          window_start: now.toISOString(),
          last_attempt: now.toISOString(),
          blocked_until: null
        })
        .eq('id', existing.id);
      
      return { allowed: true };
    }
  }
  
  await supabase
    .from('mpesa_rate_limit')
    .insert({
      identifier,
      request_type: requestType,
      attempts: 1,
      window_start: now.toISOString(),
      last_attempt: now.toISOString()
    });
  
  return { allowed: true };
}

function getMpesaBaseUrl(): string {
  return MPESA_ENVIRONMENT === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke';
}

async function getMpesaAccessToken() {
  const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
  const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
  
  if (!consumerKey || !consumerSecret) {
    throw new Error('M-Pesa credentials not configured. Please add MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET to your Supabase secrets.');
  }

  const auth = btoa(`${consumerKey}:${consumerSecret}`);
  const baseUrl = getMpesaBaseUrl();
  
  const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to get M-Pesa access token:', errorText);
    throw new Error('Failed to get M-Pesa access token');
  }

  const data = await response.json();
  return data.access_token;
}

async function initiateSTKPush(phone: string, amount: number, orderId: string) {
  const accessToken = await getMpesaAccessToken();
  const shortcode = Deno.env.get('MPESA_SHORTCODE') || '174379';
  const passkey = Deno.env.get('MPESA_PASSKEY') || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = btoa(`${shortcode}${passkey}${timestamp}`);
  
  // Format phone number (remove + and ensure it starts with 254)
  let formattedPhone = phone.replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.slice(1);
  } else if (formattedPhone.startsWith('+254')) {
    formattedPhone = formattedPhone.slice(1);
  } else if (!formattedPhone.startsWith('254')) {
    formattedPhone = '254' + formattedPhone;
  }

  // Generate unique webhook secret for this order
  const webhookSecret = crypto.randomUUID();
  
  // Store webhook secret in order
  await supabase
    .from('orders')
    .update({ webhook_secret: webhookSecret })
    .eq('order_id', orderId);

  // Use the project-specific function URL for callback with secret
  const callbackUrl = `https://sgpjnbdrmwrupeqhjqpj.supabase.co/functions/v1/mpesa-callback?secret=${webhookSecret}`;

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(amount),
    PartyA: formattedPhone,
    PartyB: shortcode,
    PhoneNumber: formattedPhone,
    CallBackURL: callbackUrl,
    AccountReference: orderId,
    TransactionDesc: `Payment for order ${orderId}`
  };

  const baseUrl = getMpesaBaseUrl();
  const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('STK Push failed:', errorText);
    throw new Error(`STK Push failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.error('Method not allowed:', req.method);
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const requestBody = await req.text();
    const { phone, amount, orderId }: PaymentRequest = JSON.parse(requestBody);

    // Get identifier for rate limiting (IP address)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() 
              || req.headers.get('x-real-ip') 
              || 'unknown';
    const identifier = `ip_${ip}`;

    // Check rate limit
    const rateLimitResult = await checkRateLimit(identifier, 'payment_init');
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many payment attempts',
          message: `Please try again in ${rateLimitResult.remainingTime} minutes`,
          retryAfter: rateLimitResult.remainingTime
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.remainingTime! * 60)
          }
        }
      );
    }

    if (!phone || !amount || !orderId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required fields: phone, amount, and orderId are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate phone number format
    const phoneRegex = /^(\+?254|0)?[17]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid phone number format. Please use format: 0712345678 or +254712345678' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate amount
    if (amount < 1 || amount > 300000) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid amount',
          message: 'Amount must be between Ksh 1 and Ksh 300,000' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check for duplicate pending payments
    const { data: existingPayment } = await supabase
      .from('mpesa_payments')
      .select('id, status')
      .eq('order_id', orderId)
      .eq('status', 'pending')
      .maybeSingle();
    
    if (existingPayment) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Duplicate payment',
          message: 'A payment is already in progress for this order'
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initiate STK Push
    const stkResponse = await initiateSTKPush(phone, amount, orderId);
    
    if (stkResponse.ResponseCode === "0") {
      // Store payment record in database
      const { error: dbError } = await supabase
        .from('mpesa_payments')
        .insert({
          checkout_request_id: stkResponse.CheckoutRequestID,
          merchant_request_id: stkResponse.MerchantRequestID,
          order_id: orderId,
          phone_number: phone,
          amount: amount,
          status: 'pending'
        });

      if (dbError) {
        console.error('Database error when creating M-Pesa payment record:', dbError);
        throw new Error('Failed to record payment request in database');
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'STK Push sent successfully',
          checkoutRequestId: stkResponse.CheckoutRequestID
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      throw new Error(stkResponse.ResponseDescription || 'STK Push failed');
    }

  } catch (error: any) {
    console.error('Payment initiation error:', error);
    
    let errorMessage = 'Payment initiation failed';
    if (error.message.includes('credentials not configured')) {
      errorMessage = 'M-Pesa integration not properly configured. Please contact support.';
    } else if (error.message.includes('Failed to get M-Pesa access token')) {
      errorMessage = 'Unable to connect to M-Pesa service. Please try again later.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);
