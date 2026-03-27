import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

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

// ─── Only these statuses trigger an email notification ───────────────────────
const EMAIL_STATUSES = ['processing', 'delivered', 'cancelled'];

const statusToTemplateType: Record<string, string> = {
  processing: 'order_processing',
  delivered:  'order_delivered',
  cancelled:  'order_cancelled',
};

const statusConfig: Record<string, {
  gradient: string; accentHex: string; accentRgb: string;
  badgeBg: string; emoji: string; label: string;
}> = {
  processing: {
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    accentHex: '#6366f1', accentRgb: '99,102,241',
    badgeBg: '#eef2ff', emoji: '⚙️', label: 'Processing',
  },
  delivered: {
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    accentHex: '#10b981', accentRgb: '16,185,129',
    badgeBg: '#ecfdf5', emoji: '✅', label: 'Delivered',
  },
  cancelled: {
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    accentHex: '#ef4444', accentRgb: '239,68,68',
    badgeBg: '#fef2f2', emoji: '✕', label: 'Cancelled',
  },
};

function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'gi'), value || '');
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// RECEIPT-STYLE PDF INVOICE GENERATOR  (mirrors the frontend receipt exactly)
// ─────────────────────────────────────────────────────────────────────────────

function formatReceiptDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'Africa/Nairobi',
  }).format(new Date(dateString));
}

async function generateInvoicePDF(order: any, currentStatus: string): Promise<Uint8Array> {
  // ── Dimensions (matching frontend receipt: 80 mm wide) ───────────────────
  const MM  = 2.8346;          // 1 mm → pts
  const W   = 80  * MM;        // page width  226.77 pt
  const M   =  5  * MM;        // margin       14.17 pt
  const CW  = W - 2 * M;       // content width

  // Dynamic page height: we'll use a generous 420 mm
  const PH  = 420 * MM;

  const pdfDoc = await PDFDocument.create();
  const page   = pdfDoc.addPage([W, PH]);

  const fontB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontR = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontO = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // ── Colors matching receipt ───────────────────────────────────────────────
  const C_GREEN  = rgb(0,      0.502, 0);      // [0,128,0]   BRAND_GREEN
  const C_DARK   = rgb(0.129,  0.129, 0.129);  // [33,33,33]  DARK_TEXT
  const C_MID    = rgb(0.392,  0.392, 0.392);  // [100,100,100] MID_TEXT
  const C_LIGHT  = rgb(0.961,  0.961, 0.961);  // [245,245,245] LIGHT_BG
  const C_WHITE  = rgb(1,      1,     1);
  const C_BORDER = rgb(0.863,  0.863, 0.863);  // [220,220,220] BORDER_COLOR

  // Use the freshly-set status (order.status is the pre-update snapshot)
  const statusUp = (currentStatus || order.status || '').toUpperCase();
  const C_STATUS =
    ['DELIVERED', 'COMPLETED'].includes(statusUp) ? rgb(0, 0.588, 0) :
    statusUp === 'PENDING'    ? rgb(0.784, 0.588, 0) :
    statusUp === 'CANCELLED'  ? rgb(0.784, 0,     0) : C_GREEN;

  // ── Coordinate helpers ────────────────────────────────────────────────────
  // `cur` = distance from page top in pts  (jsPDF-like, top-down tracking)
  // pdf-lib origin is bottom-left, so:
  //   text baseline pdfY  = PH - cur
  //   rect bottom-left pdfY = PH - cur - rectHeight
  let cur = 0;

  /**
   * Sanitize a string so every character is encodable by WinAnsi (pdf-lib
   * standard fonts). Replaces Unicode-only chars with safe ASCII equivalents.
   * The most common offender is U+202F (narrow no-break space) inserted by
   * Intl.DateTimeFormat before AM/PM; others are smart quotes, em/en dashes, etc.
   */
  const sanitize = (text: string): string =>
    text
      .replace(/\u202f/g, ' ')   // narrow no-break space  -> regular space
      .replace(/\u00a0/g, ' ')   // no-break space         -> regular space
      .replace(/\u2019/g, "'")   // right single quote     -> apostrophe
      .replace(/\u2018/g, "'")   // left single quote      -> apostrophe
      .replace(/\u201c/g, '"')   // left double quote      -> straight quote
      .replace(/\u201d/g, '"')   // right double quote     -> straight quote
      .replace(/\u2013/g, '-')   // en dash                -> hyphen
      .replace(/\u2014/g, '--')  // em dash                -> double hyphen
      .replace(/\u2026/g, '...') // ellipsis               -> three dots
      .replace(/[^\x00-\xff]/g, '?'); // catch-all: replace anything else

  /** Draw text. `at` = distance from top (baseline). */
  const dt = (
    text: string, x: number, at: number,
    font: any, size: number, color: any,
    align: 'left' | 'center' | 'right' = 'left',
  ) => {
    const safe = sanitize(text);
    const tw = font.widthOfTextAtSize(safe, size);
    const dx = align === 'center' ? x - tw / 2
             : align === 'right'  ? x - tw
             : x;
    page.drawText(safe, { x: dx, y: PH - at, font, size, color });
  };

  /** Draw filled rect. `at` = top-edge distance from page top. */
  const dr = (
    x: number, at: number, w: number, h: number,
    color: any, borderRadius = 0,
  ) => {
    page.drawRectangle({
      x, y: PH - at - h,
      width: w, height: h, color,
      ...(borderRadius > 0 ? { borderRadius } : {}),
    });
  };

  /** Dotted horizontal line at `at` from page top (mirrors drawDottedLine). */
  const dottedLine = (at: number) => {
    const dash = MM, gap = 0.8 * MM;
    for (let x = M; x < W - M; x += dash + gap) {
      page.drawLine({
        start: { x,                            y: PH - at },
        end:   { x: Math.min(x + dash, W - M), y: PH - at },
        thickness: 0.4, color: C_BORDER,
      });
    }
  };

  /** Word-wrap text into lines fitting maxW pts. Sanitizes input first. */
  const wrapText = (text: string, font: any, size: number, maxW: number): string[] => {
    const words = sanitize(text).split(' ');
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxW && line) {
        lines.push(line); line = word;
      } else { line = test; }
    }
    if (line) lines.push(line);
    return lines;
  };

  // ─── Section 1 · Logo image (mirrors frontend receipt exactly) ─────────────
  cur += 6 * MM;

  const logoW = 42 * MM;
  const logoH = 11 * MM;

  // Set LOGO_URL in Supabase secrets to point to your hosted logo file.
  // It must be a publicly accessible PNG or JPEG URL.
  const LOGO_URL =
    Deno.env.get("LOGO_URL") ??
    "https://www.smartkenya.co.ke/assets/images/smartkenya-logo-BcDCofys.png";

  let logoEmbedded = false;
  try {
    const logoRes = await fetch(LOGO_URL);
    if (logoRes.ok) {
      const logoBytes = new Uint8Array(await logoRes.arrayBuffer());
      const isPng = logoBytes[0] === 0x89 && logoBytes[1] === 0x50;
      const logoImg = isPng
        ? await pdfDoc.embedPng(logoBytes)
        : await pdfDoc.embedJpg(logoBytes);
      page.drawImage(logoImg, {
        x: (W - logoW) / 2,
        y: PH - cur - logoH,
        width: logoW,
        height: logoH,
      });
      cur += logoH + 3 * MM;
      dt("Your Smart Shopping Destination", W / 2, cur, fontR, 5.5, C_MID, "center");
      cur += 5 * MM;
      logoEmbedded = true;
    }
  } catch (_) { /* logo fetch failed — fall through to text fallback */ }

  if (!logoEmbedded) {
    // Text fallback keeps the same visual hierarchy as the image
    dt("SMARTKENYA",                    W / 2, cur, fontB, 14,  C_GREEN, "center"); cur += 4   * MM;
    dt("ONLINE SHOPPING KENYA",         W / 2, cur, fontR,  6,  C_MID,  "center"); cur += 4   * MM;
    dt("Your Smart Shopping Destination", W / 2, cur, fontR, 5.5, C_MID, "center"); cur += 5 * MM;
  }

  // ─── Section 2 · Green "PURCHASE RECEIPT" title bar ───────────────────────
  const titleH = 7 * MM;
  dr(M, cur, CW, titleH, C_GREEN, MM);
  dt('PURCHASE RECEIPT', W / 2, cur + titleH * 0.68, fontB, 8.5, C_WHITE, 'center');
  cur += titleH + 4 * MM;

  // ─── Section 3 · Order details box ────────────────────────────────────────
  const mpesaRef  = order.mpesa_receipt_number || order.mpesa_code || '';
  const hasMpesa  = !!mpesaRef;
  const detailH   = ((hasMpesa ? 4 : 3) * 4.5 + 7) * MM;
  dr(M, cur, CW, detailH, C_LIGHT, MM);

  const infoX = M + 2 * MM;
  const valX  = W - M - 2 * MM;
  cur += 4 * MM;

  const infoRow = (label: string, value: string, valColor = C_DARK, valBold = false) => {
    dt(label, infoX, cur, fontB, 5.5, C_MID);
    dt(value, valX,  cur, valBold ? fontB : fontR, 5.5, valColor, 'right');
    cur += 4.5 * MM;
  };

  infoRow('RECEIPT NO', order.order_id.toUpperCase());
  infoRow('DATE',       formatReceiptDate(order.created_at));
  infoRow('STATUS',     statusUp, C_STATUS, true);
  if (hasMpesa) infoRow('M-PESA REF', mpesaRef);

  cur += 3 * MM; // box bottom padding

  // ─── Section 4 · Dotted separator ─────────────────────────────────────────
  dottedLine(cur);
  cur += 4 * MM;

  // ─── Section 5 · BILL TO customer box ────────────────────────────────────
  // Pre-compute lines so we can size the box correctly
  const custTextLines: Array<{ text: string; font: any; size: number; color: any }> = [];
  custTextLines.push({ text: order.username || 'Walk-in Customer', font: fontB, size: 7,   color: C_DARK });
  if (order.email)        custTextLines.push({ text: order.email,        font: fontR, size: 6, color: C_MID });
  if (order.phone_number) custTextLines.push({ text: order.phone_number, font: fontR, size: 6, color: C_MID });
  if (order.shipping_address) {
    for (const l of wrapText(order.shipping_address, fontR, 6, CW - 4 * MM)) {
      custTextLines.push({ text: l, font: fontR, size: 6, color: C_MID });
    }
  }

  const custH = (custTextLines.length * 3.5 + 12) * MM;
  dr(M, cur, CW, custH, C_LIGHT, MM);

  cur += 4 * MM;
  dt('BILL TO', infoX, cur, fontB, 6, C_GREEN);
  cur += 4 * MM;
  for (const cl of custTextLines) {
    dt(cl.text, infoX, cur, cl.font, cl.size, cl.color);
    cur += 3.5 * MM;
  }
  cur += 3 * MM; // box bottom padding

  // ─── Section 6 · Items table ──────────────────────────────────────────────
  // Column widths match autoTable columnStyles from frontend receipt:
  //   #=6mm  ITEM=auto(26mm)  QTY=8mm  PRICE=14mm  AMOUNT=16mm
  const cNum   =  6 * MM;
  const cItem  = 26 * MM;
  const cQty   =  8 * MM;
  const cPrice = 14 * MM;
  const cAmt   = 16 * MM;

  const xNum   = M;
  const xItem  = xNum   + cNum;
  const xQty   = xItem  + cItem;
  const xPrice = xQty   + cQty;
  const xAmt   = xPrice + cPrice;

  // Header row
  const headH = 6 * MM;
  dr(M, cur, CW, headH, C_GREEN);
  const hY  = cur + headH * 0.65;
  const hs  = 5.5;
  dt('#',       xNum   + cNum   / 2,    hY, fontB, hs, C_WHITE, 'center');
  dt('ITEM',    xItem  + 2 * MM,        hY, fontB, hs, C_WHITE);
  dt('QTY',     xQty   + cQty   / 2,   hY, fontB, hs, C_WHITE, 'center');
  dt('PRICE',   xPrice + cPrice - MM,  hY, fontB, hs, C_WHITE, 'right');
  dt('AMOUNT',  xAmt   + cAmt   - MM,  hY, fontB, hs, C_WHITE, 'right');
  cur += headH;

  const items: any[] = order.items || [];
  let subtotal = 0;

  if (items.length === 0) {
    const rowH = 5.5 * MM;
    dr(M, cur, CW, rowH, C_LIGHT);
    dt('No items in this order.', W / 2, cur + rowH * 0.65, fontO, 6, C_MID, 'center');
    cur += rowH;
  } else {
    items.forEach((item: any, i: number) => {
      const qty   = item.quantity                        || 1;
      const price = item.product?.price ?? item.price   ?? 0;
      const name  = item.product?.name  ?? item.name    ?? 'Product';
      const total = qty * price;
      subtotal   += total;

      const rowH = 5.5 * MM;
      dr(M, cur, CW, rowH, i % 2 === 0 ? C_LIGHT : C_WHITE);

      const rY = cur + rowH * 0.65;

      // Truncate name to fit ITEM column width
      let displayName = name as string;
      const maxNameW  = cItem - 4 * MM;
      while (fontR.widthOfTextAtSize(displayName, 6) > maxNameW && displayName.length > 4) {
        displayName = displayName.slice(0, -4) + '…';
      }

      dt((i + 1).toString(),         xNum   + cNum   / 2,   rY, fontR, 6, C_DARK, 'center');
      dt(displayName,                 xItem  + MM,           rY, fontR, 6, C_DARK);
      dt(qty.toString(),              xQty   + cQty   / 2,  rY, fontR, 6, C_MID,  'center');
      dt(price.toLocaleString(),      xPrice + cPrice - MM, rY, fontR, 6, C_MID,  'right');
      dt(total.toLocaleString(),      xAmt   + cAmt   - MM, rY, fontB, 6, C_DARK, 'right');

      cur += rowH;
    });
  }

  cur += 4 * MM;

  // ─── Section 7 · Summary (mirrors receipt summary section) ───────────────
  const discount   = order.discount_amount ?? 0;
  const delivery   = order.delivery_fee    ?? 0;
  const grandTotal = subtotal - discount + delivery;

  const sumX    = W / 2 + 2 * MM;
  const sumValX = W - M;

  const sumRow = (label: string, value: string, lColor = C_MID, vColor = C_DARK) => {
    dt(label, sumX,    cur, fontR, 6, lColor);
    dt(value, sumValX, cur, fontR, 6, vColor, 'right');
    cur += 4 * MM;
  };

  sumRow('Subtotal:', `KES ${subtotal.toLocaleString()}`);
  if (discount > 0) {
    sumRow('Discount:', `-KES ${discount.toLocaleString()}`, rgb(0, 0.588, 0), rgb(0, 0.588, 0));
  }
  sumRow('Delivery Fee:', delivery > 0 ? `KES ${delivery.toLocaleString()}` : 'FREE');

  // Green divider line above total band
  page.drawLine({
    start: { x: sumX,  y: PH - cur },
    end:   { x: W - M, y: PH - cur },
    thickness: 0.4, color: C_GREEN,
  });
  cur += 5 * MM;

  // Grand total green band
  const gtBandW = (W - M) - sumX + 4 * MM;
  const gtBandH = 8 * MM;
  dr(sumX - 2 * MM, cur, gtBandW, gtBandH, C_GREEN, MM);
  const gtY = cur + gtBandH * 0.65;
  dt('TOTAL',                              sumX - MM,     gtY, fontB, 8, C_WHITE);
  dt(`KES ${grandTotal.toLocaleString()}`, W - M - MM,   gtY, fontB, 8, C_WHITE, 'right');
  cur += gtBandH + 5 * MM;

  // ─── Section 8 · Payment method indicator ─────────────────────────────────
  if (mpesaRef) {
    dt('Paid via M-Pesa', W / 2, cur, fontR, 5.5, C_MID, 'center');
    cur += 5 * MM;
  }

  // ─── Section 9 · QR code ──────────────────────────────────────────────────
  dottedLine(cur);
  cur += 4 * MM;
  dt('Scan to track your order', W / 2, cur, fontR, 5, C_MID, 'center');
  cur += 3 * MM;

  try {
    const qrSize = 22 * MM;
    const qrData = encodeURIComponent(`https://www.smartkenya.co.ke/order/${order.order_id}`);
    const qrRes  = await fetch(
      `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${qrData}&format=png&margin=1`,
    );
    if (qrRes.ok) {
      const qrBuf = await qrRes.arrayBuffer();
      const qrImg = await pdfDoc.embedPng(new Uint8Array(qrBuf));
      page.drawImage(qrImg, {
        x: (W - qrSize) / 2,
        y: PH - cur - qrSize,
        width:  qrSize,
        height: qrSize,
      });
      cur += qrSize + 5 * MM;
    } else {
      cur += 5 * MM;
    }
  } catch {
    cur += 5 * MM; // QR fetch failed — skip gracefully
  }

  // ─── Section 10 · Footer ──────────────────────────────────────────────────
  dottedLine(cur);
  cur += 4 * MM;
  dt('Thank you for shopping with us!', W / 2, cur, fontB, 7,   C_DARK, 'center');
  cur += 4 * MM;
  dt('www.smartkenya.co.ke',            W / 2, cur, fontR, 5.5, C_MID,  'center');
  cur += 3.5 * MM;
  dt('support@smartkenya.co.ke',        W / 2, cur, fontR, 5.5, C_MID,  'center');
  cur += 4 * MM;
  dt(
    'This receipt is computer-generated and does not require a signature.',
    W / 2, cur, fontR, 4, C_MID, 'center',
  );
  cur += 3 * MM;
  dt(
    `Generated on ${formatReceiptDate(new Date().toISOString())}`,
    W / 2, cur, fontR, 4, C_MID, 'center',
  );

  return pdfDoc.save();
}

// ─────────────────────────────────────────────────────────────────────────────
// PREMIUM EMAIL HTML GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
function generatePremiumEmail(order: any, status: string, trackingNumber?: string, notes?: string): { subject: string; html: string } {
  const cfg         = statusConfig[status];
  const customerName = order.username || 'Valued Customer';
  const shortId     = order.order_id.slice(0, 8).toUpperCase();
  const fullId      = order.order_id.toUpperCase();
  const amount      = order.amount?.toLocaleString() ?? '0';
  const year        = new Date().getFullYear();
  const orderDate   = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Africa/Nairobi',
  }).format(new Date(order.created_at));

  const copy: Record<string, { subject: string; headline: string; subline: string; body: string; cta: string; ctaUrl: string }> = {
    processing: {
      subject:  `⚙️ Order #${shortId} Confirmed — We're on it!`,
      headline: "We've Got Your Order!",
      subline:  `Order #${shortId} is now being processed`,
      body:     `Hi <strong>${customerName}</strong>,<br><br>Fantastic — your order has been confirmed and our team is already getting to work on it. We'll send you another update once it's packed and on its way.`,
      cta:      'View My Order',
      ctaUrl:   `https://smartkenya.co.ke/orders`,
    },
    delivered: {
      subject:  `✅ Order #${shortId} Delivered — Enjoy!`,
      headline: 'Your Order Has Arrived!',
      subline:  `Order #${shortId} was successfully delivered`,
      body:     `Hi <strong>${customerName}</strong>,<br><br>Your order has been delivered — we hope everything is exactly as expected! Your invoice is attached to this email for your records. If anything isn't right, reach out to us and we'll make it right.`,
      cta:      'Leave a Review',
      ctaUrl:   `https://smartkenya.co.ke/orders`,
    },
    cancelled: {
      subject:  `✕ Order #${shortId} Cancelled`,
      headline: 'Order Cancellation Confirmed',
      subline:  `Order #${shortId} has been cancelled`,
      body:     `Hi <strong>${customerName}</strong>,<br><br>Your order has been cancelled. If you made a payment, your refund will be processed within 3–5 business days. If you did not request this cancellation, please contact us immediately.`,
      cta:      'Contact Support',
      ctaUrl:   `mailto:support@smartkenya.co.ke`,
    },
  };

  const c = copy[status] ?? copy.processing;

  // Build order items HTML
  const items: any[] = order.items || [];
  const itemsHtml = items.length > 0 ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 8px;">
      <tr>
        <td colspan="3" style="padding-bottom: 10px;">
          <p style="margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8;">Order Items</p>
        </td>
      </tr>
      ${items.map((item: any) => {
        const qty   = item.quantity || 1;
        const price = item.product?.price || 0;
        const name  = item.product?.name  || 'Product';
        return `
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid #f1f5f9; vertical-align: top;">
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #0f172a;">${name}</p>
            <p style="margin: 4px 0 0; font-size: 14px; color: #64748b;">Qty: ${qty}</p>
          </td>
          <td style="padding: 10px 0; border-top: 1px solid #f1f5f9; text-align: right; vertical-align: top; white-space: nowrap;">
            <p style="margin: 0; font-size: 15px; font-weight: 700; color: #0f172a;">KES ${(price * qty).toLocaleString()}</p>
          </td>
        </tr>`;
      }).join('')}
    </table>` : '';

  const trackingHtml = trackingNumber ? `
    <tr>
      <td style="padding: 8px 0; border-top: 1px solid #f1f5f9;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size: 15px; color: #64748b;">Tracking Number</td>
            <td style="text-align: right; font-size: 15px; font-weight: 700; color: #0f172a; font-family: 'Courier New', monospace; letter-spacing: 1px;">${trackingNumber}</td>
          </tr>
        </table>
      </td>
    </tr>` : '';

  const notesHtml = notes ? `
    <tr>
      <td style="padding: 24px 40px 0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #fffbeb; border-radius: 10px; border-left: 3px solid #f59e0b;">
          <tr>
            <td style="padding: 16px 18px;">
              <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #b45309; letter-spacing: 1px; text-transform: uppercase;">Note</p>
              <p style="margin: 0; font-size: 15px; color: #78350f; line-height: 1.6;">${notes}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : '';

  const invoiceNoteHtml = status === 'delivered' ? `
    <tr>
      <td style="padding: 20px 40px 0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0fdf4; border-radius: 10px; border: 1px solid #bbf7d0;">
          <tr>
            <td style="padding: 14px 18px;">
              <p style="margin: 0; font-size: 15px; color: #166534; line-height: 1.5;">
                📎 <strong>Your invoice is attached</strong> to this email as a PDF for your records.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : '';

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${c.subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Preheader (hidden) -->
  <span style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    ${c.subline} — SmartKenya &#8203;&zwj;&zwnj;&nbsp;&zwnj;&zwj;
  </span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;">
    <tr>
      <td align="center" style="padding: 36px 16px 48px;">

        <!-- Brand header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin-bottom: 20px;">
          <tr>
            <td align="center">
              <p style="margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a;">
                Smart<span style="color: ${cfg.accentHex};">Kenya</span>
              </p>
              <p style="margin: 3px 0 0; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; color: #94a3b8;">Online Shopping</p>
            </td>
          </tr>
        </table>

        <!-- Main card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04);">

          <!-- Status hero banner -->
          <tr>
            <td style="background: ${cfg.gradient}; padding: 44px 40px; text-align: center;">
              <!-- Icon circle -->
              <div style="display: inline-block; width: 72px; height: 72px; background: rgba(255,255,255,0.2); border-radius: 50%; line-height: 72px; font-size: 34px; margin-bottom: 20px;">${cfg.emoji}</div>
              <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; line-height: 1.2;">${c.headline}</h1>
              <p style="margin: 10px 0 0; font-size: 16px; color: rgba(255,255,255,0.82); letter-spacing: 0.3px;">${c.subline}</p>
              <!-- Decorative line -->
              <div style="margin: 22px auto 0; width: 40px; height: 2px; background: rgba(255,255,255,0.4); border-radius: 2px;"></div>
            </td>
          </tr>

          <!-- Body message -->
          <tr>
            <td style="padding: 36px 40px 0 40px;">
              <p style="margin: 0; font-size: 17px; color: #334155; line-height: 1.8;">${c.body}</p>
            </td>
          </tr>

          ${invoiceNoteHtml}
          ${notesHtml}

          <!-- Order details card -->
          <tr>
            <td style="padding: 28px 40px 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 22px 24px;">
                    <!-- Card title -->
                    <p style="margin: 0 0 18px; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8;">Order Details</p>

                    <!-- Rows -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; font-size: 15px; color: #64748b;">Order Number</td>
                        <td style="padding: 8px 0; font-size: 15px; font-weight: 700; color: #0f172a; text-align: right; font-family: 'Courier New', monospace; letter-spacing: 0.5px;">#${fullId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; font-size: 15px; color: #64748b;">Order Date</td>
                        <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; font-size: 15px; color: #0f172a; text-align: right;">${orderDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; font-size: 15px; color: #64748b;">Status</td>
                        <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; text-align: right;">
                          <span style="display: inline-block; background: ${cfg.badgeBg}; color: ${cfg.accentHex}; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">${cfg.label}</span>
                        </td>
                      </tr>
                      ${trackingHtml}
                      ${order.shipping_address ? `
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; font-size: 15px; color: #64748b; vertical-align: top;">Ship To</td>
                        <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; font-size: 15px; color: #0f172a; text-align: right;">${order.shipping_address}</td>
                      </tr>` : ''}
                    </table>

                    ${itemsHtml}

                    <!-- Total -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 14px; border-top: 2px solid #e2e8f0; padding-top: 14px;">
                      <tr>
                        <td style="padding-top: 14px; font-size: 18px; font-weight: 800; color: #0f172a;">Total</td>
                        <td style="padding-top: 14px; text-align: right; font-size: 24px; font-weight: 800; color: ${cfg.accentHex};">KES ${amount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA button -->
          <tr>
            <td style="padding: 32px 40px 0 40px; text-align: center;">
              <a href="${c.ctaUrl}"
                 style="display: inline-block; background: ${cfg.gradient}; color: #ffffff; padding: 15px 36px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 8px 24px rgba(${cfg.accentRgb}, 0.35);">
                ${c.cta} &rarr;
              </a>
            </td>
          </tr>

          <!-- Help strip -->
          <tr>
            <td style="margin-top: 36px; padding: 28px 40px; background: #f8fafc; text-align: center; border-top: 1px solid #f1f5f9; margin-top: 36px;">
              <p style="margin: 0 0 6px; font-size: 15px; color: #94a3b8;">Questions about your order?</p>
              <p style="margin: 0;">
                <a href="mailto:support@smartkenya.co.ke" style="color: ${cfg.accentHex}; text-decoration: none; font-weight: 600; font-size: 16px;">support@smartkenya.co.ke</a>
                <span style="color: #cbd5e1; margin: 0 10px;">|</span>
                <a href="tel:+254700000000" style="color: ${cfg.accentHex}; text-decoration: none; font-weight: 600; font-size: 16px;">+254 700 000 000</a>
              </p>
            </td>
          </tr>

        </table><!-- /main card -->

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin-top: 28px;">
          <tr>
            <td align="center" style="padding: 0 20px 20px;">
              <p style="margin: 0 0 14px; font-size: 12px; color: #94a3b8;">Follow us</p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto 20px;">
                <tr>
                  <td style="padding: 0 6px;"><a href="https://www.facebook.com/profile.php?id=61583170510108" style="display:inline-block; width:32px; height:32px; background:#e2e8f0; border-radius:50%; text-align:center; line-height:32px; text-decoration:none; font-size:15px;">📘</a></td>
                  <td style="padding: 0 6px;"><a href="https://www.instagram.com/smartkenyaonlineshopping" style="display:inline-block; width:32px; height:32px; background:#e2e8f0; border-radius:50%; text-align:center; line-height:32px; text-decoration:none; font-size:15px;">📷</a></td>
                  <td style="padding: 0 6px;"><a href="https://x.com/smartkenyake" style="display:inline-block; width:32px; height:32px; background:#e2e8f0; border-radius:50%; text-align:center; line-height:32px; text-decoration:none; font-size:15px;">🐦</a></td>
                </tr>
              </table>
              <p style="margin: 0 0 6px; font-size: 11px; color: #94a3b8;">© ${year} SmartKenya. All rights reserved.</p>
              <p style="margin: 0 0 10px; font-size: 11px; color: #cbd5e1;">This email was sent to ${order.email}</p>
              <p style="margin: 0;">
                <a href="https://smartkenya.co.ke/privacy" style="font-size: 11px; color: #94a3b8; text-decoration: none;">Privacy Policy</a>
                <span style="color: #cbd5e1; margin: 0 6px;">•</span>
                <a href="https://smartkenya.co.ke/terms" style="font-size: 11px; color: #94a3b8; text-decoration: none;">Terms of Service</a>
                <span style="color: #cbd5e1; margin: 0 6px;">•</span>
                <a href="https://smartkenya.co.ke/unsubscribe" style="font-size: 11px; color: #94a3b8; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: c.subject, html };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────
const handler = async (req: Request): Promise<Response> => {
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

    // ── Fetch order ────────────────────────────────────────────────────────
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

    // ── Update order in DB ─────────────────────────────────────────────────
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (trackingNumber) updateData.tracking_number = trackingNumber;

    const { error: updateError } = await supabase.from('orders').update(updateData).eq('order_id', orderId);
    if (updateError) throw updateError;

    // ── Only send email for the three chosen statuses ──────────────────────
    if (!EMAIL_STATUSES.includes(status)) {
      console.log(`Status "${status}" is not in EMAIL_STATUSES — skipping email.`);
      return new Response(
        JSON.stringify({ success: true, orderId, status, message: "Order status updated (no email for this status)" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!order.email) {
      console.log("No email address on order — skipping email.");
      return new Response(
        JSON.stringify({ success: true, orderId, status, message: "Order status updated (no email address)" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ── Try DB template first, fall back to premium default ───────────────
    let emailContent: { subject: string; html: string } | undefined;
    const templateType = statusToTemplateType[status];

    if (templateType) {
      const { data: template } = await supabase
        .from('email_templates')
        .select('*')
        .eq('type', templateType)
        .eq('is_active', true)
        .single();

      if (template) {
        console.log("Using DB template:", template.name);
        const vars: Record<string, string> = {
          customer_name:       order.username || 'Valued Customer',
          order_number:        order.order_id.toUpperCase(),
          order_number_short:  order.order_id.slice(0, 8).toUpperCase(),
          order_amount:        `KES ${order.amount?.toLocaleString() || '0'}`,
          status,
          tracking_number:     trackingNumber || '',
          notes:               notes || '',
          email:               order.email || '',
          shipping_address:    order.shipping_address || '',
          year:                new Date().getFullYear().toString(),
        };
        const subject = replaceVariables(template.subject, vars);
        const body    = replaceVariables(template.body, vars);
        const isHtml  = body.includes('<') && body.includes('>');
        emailContent  = { subject, html: isHtml ? body : `<pre>${body}</pre>` };
      }
    }

    if (!emailContent) {
      console.log("Using premium default template");
      emailContent = generatePremiumEmail(order, status, trackingNumber, notes);
    }

    // ── Build email payload ────────────────────────────────────────────────
    const emailPayload: any = {
      from: "SmartKenya Orders <orders@smartkenya.co.ke>",
      to:   [order.email],
      subject: emailContent.subject,
      html:    emailContent.html,
    };

    // ── Attach PDF invoice for delivered orders ────────────────────────────
    if (status === 'delivered') {
      console.log("Generating PDF invoice for delivered order...");
      try {
        const pdfBytes = await generateInvoicePDF(order, status);
        const base64Pdf = btoa(String.fromCharCode(...pdfBytes));
        emailPayload.attachments = [
          {
            filename: `SmartKenya-Invoice-${order.order_id.slice(0, 8).toUpperCase()}.pdf`,
            content:  base64Pdf,
          }
        ];
        console.log("PDF invoice generated and attached.");
      } catch (pdfError) {
        console.error("PDF generation failed (sending email without attachment):", pdfError);
      }
    }

    const emailResponse = await resend.emails.send(emailPayload);
    console.log("Email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, orderId, status, message: "Order status updated and notification sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in order-fulfillment function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);