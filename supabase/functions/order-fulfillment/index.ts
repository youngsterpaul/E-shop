import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderStatusUpdate {
  orderId: string;
  status: 'pending' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { orderId, status, trackingNumber, notes }: OrderStatusUpdate = await req.json();

    console.log("Processing order fulfillment:", { orderId, status, trackingNumber });

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, user_id, email, username')
      .eq('order_id', orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update order status and tracking number
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (trackingNumber) {
      updateData.tracking_number = trackingNumber;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('order_id', orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
      throw updateError;
    }

    // Send email notification to customer
    const emailContent = generateEmailContent(order, status, trackingNumber, notes);
    
    if (order.email) {
      const emailResponse = await resend.emails.send({
        from: "SmartKenya <onboarding@resend.dev>",
        to: [order.email],
        subject: emailContent.subject,
        html: emailContent.html,
      });

      console.log("Email sent successfully:", emailResponse);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId,
        status,
        message: "Order status updated and notification sent"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in order-fulfillment function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateEmailContent(
  order: any,
  status: string,
  trackingNumber?: string,
  notes?: string
) {
  const customerName = order.username || "Valued Customer";
  const orderNumber = order.order_id.slice(0, 8).toUpperCase();
  
  const statusMessages: Record<string, { subject: string; title: string; message: string }> = {
    processing: {
      subject: `Order ${orderNumber} is Being Processed`,
      title: "Order Processing Started",
      message: "We've received your order and are preparing it for shipment."
    },
    packed: {
      subject: `Order ${orderNumber} Has Been Packed`,
      title: "Order Packed",
      message: "Your order has been carefully packed and will be shipped soon."
    },
    shipped: {
      subject: `Order ${orderNumber} Has Been Shipped`,
      title: "Order Shipped",
      message: "Your order is on its way! You can track your package using the tracking number below."
    },
    delivered: {
      subject: `Order ${orderNumber} Has Been Delivered`,
      title: "Order Delivered",
      message: "Your order has been successfully delivered. We hope you enjoy your purchase!"
    },
    cancelled: {
      subject: `Order ${orderNumber} Has Been Cancelled`,
      title: "Order Cancelled",
      message: "Your order has been cancelled. If you didn't request this, please contact us immediately."
    }
  };

  const statusInfo = statusMessages[status] || statusMessages.processing;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${statusInfo.subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">SmartKenya</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">${statusInfo.title}</h2>
                    <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                      Hi ${customerName},
                    </p>
                    <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                      ${statusInfo.message}
                    </p>
                    
                    <!-- Order Details -->
                    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
                      <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">Order Details</h3>
                      <table width="100%" cellpadding="5" cellspacing="0">
                        <tr>
                          <td style="color: #666666; font-size: 14px;"><strong>Order Number:</strong></td>
                          <td style="color: #333333; font-size: 14px; text-align: right;">#${orderNumber}</td>
                        </tr>
                        <tr>
                          <td style="color: #666666; font-size: 14px;"><strong>Order Amount:</strong></td>
                          <td style="color: #333333; font-size: 14px; text-align: right;">KSH ${order.amount?.toLocaleString() || '0'}</td>
                        </tr>
                        <tr>
                          <td style="color: #666666; font-size: 14px;"><strong>Status:</strong></td>
                          <td style="color: #22c55e; font-size: 14px; text-align: right; font-weight: bold; text-transform: capitalize;">${status}</td>
                        </tr>
                        ${trackingNumber ? `
                        <tr>
                          <td style="color: #666666; font-size: 14px;"><strong>Tracking Number:</strong></td>
                          <td style="color: #333333; font-size: 14px; text-align: right; font-family: monospace;">${trackingNumber}</td>
                        </tr>
                        ` : ''}
                      </table>
                    </div>

                    ${notes ? `
                    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                      <p style="color: #92400e; margin: 0; font-size: 14px;"><strong>Note:</strong> ${notes}</p>
                    </div>
                    ` : ''}

                    ${trackingNumber ? `
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://www.google.com/search?q=${trackingNumber}" 
                         style="background-color: #22c55e; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                        Track Your Order
                      </a>
                    </div>
                    ` : ''}

                    <p style="color: #666666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
                      If you have any questions about your order, please don't hesitate to contact our customer support team.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="color: #999999; margin: 0; font-size: 12px;">
                      © ${new Date().getFullYear()} SmartKenya. All rights reserved.
                    </p>
                    <p style="color: #999999; margin: 10px 0 0 0; font-size: 12px;">
                      This email was sent to ${order.email}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return {
    subject: statusInfo.subject,
    html
  };
}

serve(handler);
