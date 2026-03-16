import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const ADMIN_EMAIL = "orders@smartkenya.co.ke";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      amount,
      items,
      shippingAddress,
    } = await req.json();

    console.log("Notifying admin about new order:", orderId);

    const orderNumberShort = orderId.slice(-8).toUpperCase();
    const orderDate = new Date().toLocaleString("en-KE", {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // ── Build items list (text-based rows with product images) ──────────────
    const itemsList: any[] = Array.isArray(items) ? items : [];

    const itemRowsHtml = itemsList.map((item: any, i: number) => {
      const name    = item.product?.name  || item.name  || "Product";
      const price   = item.product?.price || item.price || 0;
      const qty     = item.quantity || 1;
      const total   = price * qty;
      const image   = item.product?.image || item.image || item.product?.images?.[0] || "";

      return `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <!-- Item image -->
                <td width="52" style="vertical-align: top; padding-right: 14px;">
                  ${image
                    ? `<img src="${image}" alt="${name}"
                        width="52" height="52"
                        style="display:block; width:52px; height:52px; object-fit:cover;
                               border-radius:8px; border:1px solid #e2e8f0;">`
                    : `<div style="width:52px; height:52px; background:#f1f5f9; border-radius:8px;
                                  display:flex; align-items:center; justify-content:center;
                                  font-size:22px; text-align:center; line-height:52px;">📦</div>`
                  }
                </td>
                <!-- Item details -->
                <td style="vertical-align: top;">
                  <p style="margin: 0 0 3px; font-size: 14px; font-weight: 600; color: #0f172a;
                             line-height: 1.4;">${name}</p>
                  <p style="margin: 0; font-size: 13px; color: #64748b;">
                    Qty: ${qty}
                    &nbsp;·&nbsp;
                    KES ${price.toLocaleString()} each
                  </p>
                </td>
                <!-- Line total -->
                <td style="vertical-align: top; text-align: right; white-space: nowrap; padding-left: 12px;">
                  <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">
                    KES ${total.toLocaleString()}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    }).join("");

    // ── Helper: one info row (label · value) ─────────────────────────────────
    const infoRow = (label: string, value: string, valueStyle = "") => `
      <tr>
        <td style="padding: 7px 0; font-size: 14px; color: #64748b; white-space: nowrap;
                   border-bottom: 1px solid #f8fafc; width: 120px;">${label}</td>
        <td style="padding: 7px 0; font-size: 14px; color: #0f172a;
                   border-bottom: 1px solid #f8fafc; ${valueStyle}">${value}</td>
      </tr>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order #${orderNumberShort}</title>
</head>
<body style="margin:0; padding:0; background-color:#f0f4f8;
             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;">
    <tr>
      <td align="center" style="padding: 36px 16px 48px;">

        <!-- ── Brand ── -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px; margin-bottom:20px;">
          <tr>
            <td align="center">
              <p style="margin:0; font-size:26px; font-weight:800; color:#0f172a; letter-spacing:-0.5px;">
                Smart<span style="color:#f59e0b;">Kenya</span>
              </p>
              <p style="margin:3px 0 0; font-size:11px; letter-spacing:3px;
                         text-transform:uppercase; color:#94a3b8;">Admin Notification</p>
            </td>
          </tr>
        </table>

        <!-- ── Main card ── -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="max-width:580px; background:#ffffff; border-radius:20px;
                      overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.07),
                      0 4px 16px rgba(0,0,0,0.04);">

          <!-- Amber top bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);
                       padding:36px 40px; text-align:center;">
              <p style="margin:0 0 10px; font-size:36px; line-height:1;">🛒</p>
              <h1 style="margin:0; font-size:24px; font-weight:800; color:#ffffff;
                          letter-spacing:-0.3px;">New Order Received</h1>
              <p style="margin:8px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                Order <span style="font-weight:700;">#${orderNumberShort}</span>
                &nbsp;·&nbsp; ${orderDate}
              </p>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="padding: 36px 40px 0 40px;">

              <!-- Customer details block -->
              <p style="margin:0 0 12px; font-size:11px; font-weight:700;
                         letter-spacing:1.5px; text-transform:uppercase; color:#94a3b8;">
                Customer
              </p>
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#f8fafc; border-radius:12px;
                            border:1px solid #e2e8f0; padding:4px 0;">
                <tr><td style="padding:0 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow("Name",     customerName     || "N/A", "font-weight:600;")}
                    ${infoRow("Email",    customerEmail    || "N/A")}
                    ${infoRow("Phone",    customerPhone    || "N/A")}
                    ${infoRow("Ships to", shippingAddress || "N/A")}
                  </table>
                </td></tr>
              </table>

            </td>
          </tr>

          <!-- ── Items ── -->
          <tr>
            <td style="padding: 28px 40px 0 40px;">
              <p style="margin:0 0 4px; font-size:11px; font-weight:700;
                         letter-spacing:1.5px; text-transform:uppercase; color:#94a3b8;">
                Items Ordered
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemRowsHtml || `
                  <tr>
                    <td style="padding:16px 0; font-size:14px; color:#94a3b8; font-style:italic;">
                      No item details available.
                    </td>
                  </tr>`}
              </table>
            </td>
          </tr>

          <!-- ── Order total ── -->
          <tr>
            <td style="padding: 20px 40px 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="border-top: 2px solid #f1f5f9;">
                <tr>
                  <td style="padding-top:16px; font-size:15px; font-weight:700; color:#0f172a;">
                    Order Total
                  </td>
                  <td style="padding-top:16px; text-align:right; font-size:22px;
                              font-weight:800; color:#f59e0b;">
                    KES ${(amount || 0).toLocaleString()}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── CTA ── -->
          <tr>
            <td style="padding: 28px 40px 36px 40px; text-align:center;">
              <a href="https://smartkenya.co.ke/supersmartkenyaadmin123/orders"
                 style="display:inline-block; background:linear-gradient(135deg,#f59e0b,#d97706);
                        color:#ffffff; padding:14px 32px; text-decoration:none;
                        border-radius:50px; font-weight:700; font-size:15px;
                        box-shadow:0 8px 24px rgba(245,158,11,0.35);">
                Open Order Dashboard &rarr;
              </a>
            </td>
          </tr>

          <!-- ── Footer strip ── -->
          <tr>
            <td style="padding:22px 40px; background:#f8fafc;
                       border-top:1px solid #f1f5f9; text-align:center;">
              <p style="margin:0; font-size:12px; color:#94a3b8;">
                © ${new Date().getFullYear()} SmartKenya &nbsp;·&nbsp;
                <a href="https://smartkenya.co.ke"
                   style="color:#94a3b8; text-decoration:none;">smartkenya.co.ke</a>
              </p>
            </td>
          </tr>

        </table><!-- /card -->

      </td>
    </tr>
  </table>
</body>
</html>`;

    const emailResponse = await resend.emails.send({
      from: "SmartKenya Orders <orders@smartkenya.co.ke>",
      to: ADMIN_EMAIL,
      subject: `🛒 New Order #${orderNumberShort} — KES ${(amount || 0).toLocaleString()}`,
      html,
    });

    console.log("Admin email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});