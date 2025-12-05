import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
  variables: string[];
  is_active: boolean;
}

// Map order status to template type
const statusToTemplateType: Record<string, string> = {
  processing: 'order_processing',
  packed: 'order_packed',
  shipped: 'order_shipped',
  delivered: 'order_delivered',
  cancelled: 'order_cancelled',
};

// Status colors and icons
const statusConfig: Record<string, { color: string; bgColor: string; icon: string; emoji: string }> = {
  processing: { color: '#3b82f6', bgColor: '#eff6ff', icon: '⚙️', emoji: '🔄' },
  packed: { color: '#8b5cf6', bgColor: '#f5f3ff', icon: '📦', emoji: '📦' },
  shipped: { color: '#f59e0b', bgColor: '#fffbeb', icon: '🚚', emoji: '🚚' },
  delivered: { color: '#22c55e', bgColor: '#f0fdf4', icon: '✅', emoji: '✅' },
  cancelled: { color: '#ef4444', bgColor: '#fef2f2', icon: '❌', emoji: '❌' },
};

// Replace template variables with actual values
function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    result = result.replace(regex, value || '');
  }
  return result;
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

    // Try to get template from database
    const templateType = statusToTemplateType[status];
    let emailContent;

    if (templateType) {
      const { data: template } = await supabase
        .from('email_templates')
        .select('*')
        .eq('type', templateType)
        .eq('is_active', true)
        .single();

      if (template) {
        console.log("Using database template:", template.name);
        
        // Prepare variables for replacement
        const templateVariables: Record<string, string> = {
          customer_name: order.username || 'Valued Customer',
          order_number: order.order_id.toUpperCase(),
          order_number_short: order.order_id.slice(0, 8).toUpperCase(),
          order_amount: `KSH ${order.amount?.toLocaleString() || '0'}`,
          status: status,
          tracking_number: trackingNumber || '',
          notes: notes || '',
          email: order.email || '',
          shipping_address: order.shipping_address || '',
          year: new Date().getFullYear().toString(),
        };

        const subject = replaceVariables(template.subject, templateVariables);
        const body = replaceVariables(template.body, templateVariables);

        // Check if body is HTML or plain text
        const isHtml = body.includes('<') && body.includes('>');
        
        emailContent = {
          subject,
          html: isHtml ? body : wrapInEmailTemplate(body, subject, templateVariables, status),
        };
      }
    }

    // Fallback to default template if no database template found
    if (!emailContent) {
      console.log("Using default professional template");
      emailContent = generateProfessionalEmailContent(order, status, trackingNumber, notes);
    }
    
    if (order.email) {
      const emailResponse = await resend.emails.send({
        from: "SmartKenya <info@smartkenya.co.ke>",
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

// Wrap plain text body in a styled email template
function wrapInEmailTemplate(body: string, title: string, variables: Record<string, string>, status: string): string {
  const config = statusConfig[status] || statusConfig.processing;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>${title}</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f3f4f6;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">SmartKenya</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Online Shopping Kenya</p>
                  </td>
                </tr>
                
                <!-- Status Badge -->
                <tr>
                  <td style="padding: 24px 40px 0 40px; text-align: center;">
                    <span style="display: inline-block; background-color: ${config.bgColor}; color: ${config.color}; padding: 8px 20px; border-radius: 50px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${config.emoji} ${status}
                    </span>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 32px 40px;">
                    <div style="color: #4b5563; line-height: 1.7; font-size: 15px; white-space: pre-wrap;">
${body}
                    </div>
                  </td>
                </tr>
                
                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="height: 1px; background: linear-gradient(90deg, transparent, #e5e7eb, transparent);"></div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; text-align: center;">
                    <p style="color: #9ca3af; margin: 0 0 16px 0; font-size: 13px;">
                      Need help? Contact our support team
                    </p>
                    <a href="mailto:support@smartkenya.co.ke" style="color: #10b981; text-decoration: none; font-size: 14px; font-weight: 500;">support@smartkenya.co.ke</a>
                    
                    <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #f3f4f6;">
                      <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                        © ${variables.year} SmartKenya. All rights reserved.
                      </p>
                      <p style="color: #d1d5db; margin: 8px 0 0 0; font-size: 11px;">
                        This email was sent to ${variables.email}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// Professional email content generator
function generateProfessionalEmailContent(
  order: any,
  status: string,
  trackingNumber?: string,
  notes?: string
) {
  const customerName = order.username || "Valued Customer";
  const orderNumberShort = order.order_id.slice(0, 8).toUpperCase();
  const orderNumber = order.order_id.toUpperCase();
  const config = statusConfig[status] || statusConfig.processing;
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const statusMessages: Record<string, { subject: string; title: string; message: string; cta?: string }> = {
    processing: {
      subject: `${config.emoji} Your Order #${orderNumberShort} is Being Processed`,
      title: "We're Working on Your Order!",
      message: "Great news! We've received your order and our team is now preparing it with care. You'll receive another email once it's packed and ready for shipping.",
      cta: "View Order Status"
    },
    packed: {
      subject: `${config.emoji} Your Order #${orderNumberShort} Has Been Packed`,
      title: "Your Order is Packed & Ready!",
      message: "Your order has been carefully packed and is ready to be shipped. Our delivery partner will pick it up soon, and you'll be on your way to receiving your items!",
      cta: "Track Your Order"
    },
    shipped: {
      subject: `${config.emoji} Your Order #${orderNumberShort} is On Its Way!`,
      title: "Your Order Has Shipped!",
      message: "Exciting news! Your order is now on its way to you. Track your package using the tracking number below to see its journey to your doorstep.",
      cta: "Track Your Package"
    },
    delivered: {
      subject: `${config.emoji} Your Order #${orderNumberShort} Has Been Delivered`,
      title: "Your Order Has Arrived!",
      message: "Your order has been successfully delivered! We hope everything meets your expectations. If you love your purchase, we'd appreciate a review to help other shoppers.",
      cta: "Leave a Review"
    },
    cancelled: {
      subject: `${config.emoji} Your Order #${orderNumberShort} Has Been Cancelled`,
      title: "Order Cancellation Confirmed",
      message: "Your order has been cancelled as requested. If you paid for this order, your refund will be processed within 3-5 business days. If you didn't request this cancellation, please contact us immediately.",
      cta: "Contact Support"
    }
  };

  const statusInfo = statusMessages[status] || statusMessages.processing;

  // Parse order items if available
  let orderItemsHtml = '';
  if (order.items && Array.isArray(order.items) && order.items.length > 0) {
    const itemsRows = order.items.map((item: any) => `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td width="60" style="vertical-align: top;">
                <div style="width: 56px; height: 56px; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                  ${item.image ? `<img src="${item.image}" alt="${item.name}" width="56" height="56" style="object-fit: cover; display: block;">` : ''}
                </div>
              </td>
              <td style="vertical-align: top; padding-left: 16px;">
                <p style="margin: 0 0 4px 0; font-weight: 600; color: #1f2937; font-size: 14px;">${item.name || 'Product'}</p>
                <p style="margin: 0; color: #6b7280; font-size: 13px;">Qty: ${item.quantity || 1}</p>
              </td>
              <td style="vertical-align: top; text-align: right;">
                <p style="margin: 0; font-weight: 600; color: #1f2937; font-size: 14px;">KSH ${(item.price * (item.quantity || 1)).toLocaleString()}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `).join('');
    
    orderItemsHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 24px;">
        <tr>
          <td>
            <p style="margin: 0 0 16px 0; font-weight: 600; color: #374151; font-size: 15px;">Order Items</p>
          </td>
        </tr>
        ${itemsRows}
      </table>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>${statusInfo.subject}</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f3f4f6;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              
              <!-- Main Container -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px;">
                
                <!-- Logo Section -->
                <tr>
                  <td style="text-align: center; padding-bottom: 24px;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #10b981;">SmartKenya</h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px;">Online Shopping</p>
                  </td>
                </tr>
                
                <!-- Email Card -->
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                      
                      <!-- Status Banner -->
                      <tr>
                        <td style="background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%); padding: 32px 40px; text-align: center;">
                          <div style="font-size: 48px; margin-bottom: 16px;">${config.emoji}</div>
                          <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">${statusInfo.title}</h2>
                          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Order #${orderNumberShort}</p>
                        </td>
                      </tr>
                      
                      <!-- Greeting & Message -->
                      <tr>
                        <td style="padding: 40px 40px 24px 40px;">
                          <p style="color: #1f2937; font-size: 16px; margin: 0 0 16px 0;">
                            Hi <strong>${customerName}</strong>,
                          </p>
                          <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0;">
                            ${statusInfo.message}
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Order Details Card -->
                      <tr>
                        <td style="padding: 0 40px 32px 40px;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f9fafb; border-radius: 12px; overflow: hidden;">
                            <tr>
                              <td style="padding: 24px;">
                                <p style="margin: 0 0 20px 0; font-weight: 700; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Order Summary</p>
                                
                                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                  <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order Number</td>
                                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; font-weight: 600; font-family: 'SF Mono', Monaco, monospace;">#${orderNumber}</td>
                                  </tr>
                                  <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order Date</td>
                                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${orderDate}</td>
                                  </tr>
                                  <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Status</td>
                                    <td style="padding: 8px 0; text-align: right;">
                                      <span style="display: inline-block; background-color: ${config.bgColor}; color: ${config.color}; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 600; text-transform: capitalize;">${status}</span>
                                    </td>
                                  </tr>
                                  ${trackingNumber ? `
                                  <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Tracking Number</td>
                                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; font-family: 'SF Mono', Monaco, monospace; font-weight: 600;">${trackingNumber}</td>
                                  </tr>
                                  ` : ''}
                                  ${order.shipping_address ? `
                                  <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Shipping To</td>
                                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${order.shipping_address}</td>
                                  </tr>
                                  ` : ''}
                                  <tr>
                                    <td colspan="2" style="padding-top: 16px;">
                                      <div style="height: 1px; background-color: #e5e7eb;"></div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="padding: 16px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 700;">Total</td>
                                    <td style="padding: 16px 0 0 0; color: #10b981; font-size: 20px; text-align: right; font-weight: 700;">KSH ${order.amount?.toLocaleString() || '0'}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      ${orderItemsHtml ? `
                      <!-- Order Items -->
                      <tr>
                        <td style="padding: 0 40px 32px 40px;">
                          ${orderItemsHtml}
                        </td>
                      </tr>
                      ` : ''}

                      ${notes ? `
                      <!-- Notes -->
                      <tr>
                        <td style="padding: 0 40px 32px 40px;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #fffbeb; border-radius: 12px; border-left: 4px solid #f59e0b;">
                            <tr>
                              <td style="padding: 16px 20px;">
                                <p style="margin: 0 0 4px 0; font-weight: 600; color: #92400e; font-size: 13px;">📝 Note from SmartKenya</p>
                                <p style="margin: 0; color: #a16207; font-size: 14px; line-height: 1.5;">${notes}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ` : ''}

                      <!-- CTA Button -->
                      <tr>
                        <td style="padding: 0 40px 40px 40px; text-align: center;">
                          <a href="https://smartkenya.co.ke/orders" 
                             style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39);">
                            ${statusInfo.cta || 'View Order'}
                          </a>
                        </td>
                      </tr>
                      
                      <!-- Help Section -->
                      <tr>
                        <td style="background-color: #f9fafb; padding: 32px 40px; text-align: center;">
                          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Need help with your order?</p>
                          <p style="margin: 0;">
                            <a href="mailto:support@smartkenya.co.ke" style="color: #10b981; text-decoration: none; font-weight: 600;">support@smartkenya.co.ke</a>
                            <span style="color: #d1d5db; margin: 0 8px;">|</span>
                            <a href="tel:+254700000000" style="color: #10b981; text-decoration: none; font-weight: 600;">+254 700 000 000</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 20px; text-align: center;">
                    <p style="margin: 0 0 16px 0; color: #9ca3af; font-size: 13px;">
                      Follow us for deals & updates
                    </p>
                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="https://facebook.com/smartkenya" style="display: inline-block; width: 36px; height: 36px; background-color: #f3f4f6; border-radius: 50%; text-align: center; line-height: 36px; text-decoration: none;">
                            <span style="font-size: 16px;">📘</span>
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="https://instagram.com/smartkenya" style="display: inline-block; width: 36px; height: 36px; background-color: #f3f4f6; border-radius: 50%; text-align: center; line-height: 36px; text-decoration: none;">
                            <span style="font-size: 16px;">📷</span>
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="https://twitter.com/smartkenya" style="display: inline-block; width: 36px; height: 36px; background-color: #f3f4f6; border-radius: 50%; text-align: center; line-height: 36px; text-decoration: none;">
                            <span style="font-size: 16px;">🐦</span>
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                        © ${new Date().getFullYear()} SmartKenya. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #d1d5db; font-size: 11px;">
                        This email was sent to ${order.email}
                      </p>
                      <p style="margin: 8px 0 0 0;">
                        <a href="https://smartkenya.co.ke/privacy" style="color: #9ca3af; font-size: 11px; text-decoration: none;">Privacy Policy</a>
                        <span style="color: #d1d5db; margin: 0 8px;">•</span>
                        <a href="https://smartkenya.co.ke/terms" style="color: #9ca3af; font-size: 11px; text-decoration: none;">Terms of Service</a>
                      </p>
                    </div>
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