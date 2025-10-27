<<<<<<< HEAD

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

function getMpesaBaseUrl(): string {
  return MPESA_ENVIRONMENT === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke';
}

async function getMpesaAccessToken() {
  const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
  const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
  
  console.log('M-Pesa credentials check:', {
    hasConsumerKey: !!consumerKey,
    hasConsumerSecret: !!consumerSecret,
    environment: MPESA_ENVIRONMENT // Add this for debugging
  });
  
  if (!consumerKey || !consumerSecret) {
    throw new Error('M-Pesa credentials not configured. Please add MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET to your Supabase secrets.');
  }

  const auth = btoa(`${consumerKey}:${consumerSecret}`);
  const baseUrl = getMpesaBaseUrl();
  
  console.log('Requesting M-Pesa access token from:', `${baseUrl}/oauth/v1/generate`);
  
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
  console.log('M-Pesa access token obtained successfully');
  return data.access_token;
}

async function initiateSTKPush(phone: string, amount: number, orderId: string) {
  const accessToken = await getMpesaAccessToken();
  const shortcode = Deno.env.get('MPESA_SHORTCODE') || '174379';
  const passkey = Deno.env.get('MPESA_PASSKEY') || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
  
  console.log('M-Pesa configuration:', {
    shortcode,
    hasPasskey: !!passkey,
    hasAccessToken: !!accessToken
  });

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

  // Use the project-specific function URL for callback
  const callbackUrl = `https://sgpjnbdrmwrupeqhjqpj.supabase.co/functions/v1/mpesa-callback`;

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

  console.log('Initiating STK Push:', {
    orderId,
    phone: formattedPhone,
    amount: Math.round(amount),
    callbackUrl
  });

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
  console.log('STK Push response:', result);
  return result;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('M-Pesa payment function called:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

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
    console.log('Request body:', requestBody);
    
    const { phone, amount, orderId }: PaymentRequest = JSON.parse(requestBody);

    console.log('Parsed request:', { phone, amount, orderId });

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
    if (amount < 1) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Amount must be at least 1 KES' 
        }),
        { 
          status: 400, 
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

      console.log('M-Pesa payment record created successfully:', {
        checkoutRequestId: stkResponse.CheckoutRequestID,
        orderId: orderId
      });

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
=======

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

function getMpesaBaseUrl(): string {
  return MPESA_ENVIRONMENT === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke';
}

async function getMpesaAccessToken() {
  const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
  const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
  
  console.log('M-Pesa credentials check:', {
    hasConsumerKey: !!consumerKey,
    hasConsumerSecret: !!consumerSecret,
    environment: MPESA_ENVIRONMENT // Add this for debugging
  });
  
  if (!consumerKey || !consumerSecret) {
    throw new Error('M-Pesa credentials not configured. Please add MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET to your Supabase secrets.');
  }

  const auth = btoa(`${consumerKey}:${consumerSecret}`);
  const baseUrl = getMpesaBaseUrl();
  
  console.log('Requesting M-Pesa access token from:', `${baseUrl}/oauth/v1/generate`);
  
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
  console.log('M-Pesa access token obtained successfully');
  return data.access_token;
}

async function initiateSTKPush(phone: string, amount: number, orderId: string) {
  const accessToken = await getMpesaAccessToken();
  const shortcode = Deno.env.get('MPESA_SHORTCODE') || '174379';
  const passkey = Deno.env.get('MPESA_PASSKEY') || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
  
  console.log('M-Pesa configuration:', {
    shortcode,
    hasPasskey: !!passkey,
    hasAccessToken: !!accessToken
  });

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

  // Use the project-specific function URL for callback
  const callbackUrl = `https://sgpjnbdrmwrupeqhjqpj.supabase.co/functions/v1/mpesa-callback`;

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

  console.log('Initiating STK Push:', {
    orderId,
    phone: formattedPhone,
    amount: Math.round(amount),
    callbackUrl
  });

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
  console.log('STK Push response:', result);
  return result;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('M-Pesa payment function called:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

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
    console.log('Request body:', requestBody);
    
    const { phone, amount, orderId }: PaymentRequest = JSON.parse(requestBody);

    console.log('Parsed request:', { phone, amount, orderId });

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
    if (amount < 1) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Amount must be at least 1 KES' 
        }),
        { 
          status: 400, 
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

      console.log('M-Pesa payment record created successfully:', {
        checkoutRequestId: stkResponse.CheckoutRequestID,
        orderId: orderId
      });

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
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
