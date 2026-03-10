import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { orderId, customerName, customerEmail, customerPhone, amount, items, shippingAddress } = await req.json();

    console.log("Notifying admin about new order:", orderId);

    // Get admin emails from user_roles + profiles
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "superadmin"]);

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found");
      return new Response(
        JSON.stringify({ success: true, message: "No admins to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const adminUserIds = adminRoles.map((r: any) => r.user_id);

    const { data: adminProfiles } = await supabase
      .from("profiles")
      .select("email")
      .in("user_id", adminUserIds);

    const adminEmails = (adminProfiles || [])
      .map((p: any) => p.email)
      .filter((e: string) => e && e.length > 0);

    if (adminEmails.length === 0) {
      console.log("No admin emails found");
      return new Response(
        JSON.stringify({ success: true, message: "No admin emails found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const orderNumberShort = orderId.slice(-8).toUpperCase();
    const orderDate = new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" });

    // Build items table
    let itemsHtml = "";
    if (items && Array.isArray(items) && items.length > 0) {
      const rows = items.map((item: any) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">
            ${item.product?.name || item.name || "Product"}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151; text-align: center;">
            ${item.quantity || 1}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151; text-align: right;">
            KSH ${((item.product?.price || item.price || 0) * (item.quantity || 1)).toLocaleString()}
          </td>
        </tr>
      `).join("");

      itemsHtml = `
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-top: 16px;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 10px 12px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600;">Item</th>
              <th style="padding: 10px 12px; text-align: center; font-size: 13px; color: #6b7280; font-weight: 600;">Qty</th>
              <th style="padding: 10px 12px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Order Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 28px 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">🛒 New Order Received!</h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Order #${orderNumberShort}</p>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px 40px;">
                      <p style="color: #1f2937; font-size: 16px; margin: 0 0 24px 0;">
                        A new order has been placed and requires your attention.
                      </p>
                      
                      <!-- Order Info -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; overflow: hidden;">
                        <tr>
                          <td style="padding: 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Order ID</td>
                                <td style="padding: 6px 0; font-size: 14px; color: #1f2937; font-weight: 600; text-align: right;">#${orderNumberShort}</td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Customer</td>
                                <td style="padding: 6px 0; font-size: 14px; color: #1f2937; font-weight: 600; text-align: right;">${customerName || "N/A"}</td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Email</td>
                                <td style="padding: 6px 0; font-size: 14px; color: #1f2937; text-align: right;">${customerEmail || "N/A"}</td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Phone</td>
                                <td style="padding: 6px 0; font-size: 14px; color: #1f2937; text-align: right;">${customerPhone || "N/A"}</td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Shipping Address</td>
                                <td style="padding: 6px 0; font-size: 14px; color: #1f2937; text-align: right;">${shippingAddress || "N/A"}</td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Date</td>
                                <td style="padding: 6px 0; font-size: 14px; color: #1f2937; text-align: right;">${orderDate}</td>
                              </tr>
                              <tr>
                                <td colspan="2" style="padding-top: 12px; border-top: 1px solid #e5e7eb;">
                                  <table width="100%"><tr>
                                    <td style="font-size: 16px; font-weight: 700; color: #1f2937;">Total Amount</td>
                                    <td style="font-size: 18px; font-weight: 700; color: #10b981; text-align: right;">KSH ${(amount || 0).toLocaleString()}</td>
                                  </tr></table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      ${itemsHtml}
                      
                      <!-- CTA -->
                      <div style="text-align: center; margin-top: 32px;">
                        <a href="https://smartkenya.co.ke/supersmartkenyaadmin123/orders" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                          View Order in Dashboard
                        </a>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; text-align: center; border-top: 1px solid #f3f4f6;">
                      <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                        © ${new Date().getFullYear()} SmartKenya Admin Notification
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

    const emailResponse = await resend.emails.send({
      from: "SmartKenya <info@smartkenya.co.ke>",
      to: adminEmails,
      subject: `🛒 New Order #${orderNumberShort} - KSH ${(amount || 0).toLocaleString()} from ${customerName || "Customer"}`,
      html,
    });

    console.log("Admin notification email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Admin notified", emailsSent: adminEmails.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error notifying admin:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
