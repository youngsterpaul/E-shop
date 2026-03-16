import jsPDF from 'jspdf';
import smartkenyaLogo from '@/assets/images/smartkenya-logo.png';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
  quantity: number;
  variant_selections?: Record<string, any>;
}

interface Order {
  order_id: string;
  user_id: string | null;
  email: string | null;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone_number: string | null;
  status: string;
  amount: number | null;
  delivery_fee: number | null;
  discount_amount: number | null;
  items: OrderItem[] | null;
  shipping_address: string | null;
  created_at: string;
  updated_at: string;
  mpesa_receipt_number?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Brand colors  (identical to the email invoice)
// ─────────────────────────────────────────────────────────────────────────────
const BRAND_GREEN : [number,number,number] = [0,   128,  0  ];   // rgb(0,0.502,0)
const DARK_TEXT   : [number,number,number] = [33,   33,  33 ];   // rgb(0.129…)
const MID_TEXT    : [number,number,number] = [100, 100, 100 ];   // rgb(0.392…)
const LIGHT_BG    : [number,number,number] = [245, 245, 245 ];   // rgb(0.961…)
const WHITE       : [number,number,number] = [255, 255, 255 ];
const BORDER_COLOR: [number,number,number] = [220, 220, 220 ];   // rgb(0.863…)

// ─────────────────────────────────────────────────────────────────────────────
// Date formatter  (same as invoice's formatReceiptDate)
// ─────────────────────────────────────────────────────────────────────────────
const formatReceiptDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year:     'numeric',
    month:    'short',
    day:      'numeric',
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   true,
    timeZone: 'Africa/Nairobi',
  }).format(new Date(dateString));
};

// ─────────────────────────────────────────────────────────────────────────────
// Dotted separator  (matches dottedLine in the invoice: 1mm dashes, 0.8mm gaps)
// ─────────────────────────────────────────────────────────────────────────────
const drawDottedLine = (doc: jsPDF, x1: number, x2: number, y: number) => {
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.15);
  const dash = 1, gap = 0.8;
  for (let x = x1; x < x2; x += dash + gap) {
    doc.line(x, y, Math.min(x + dash, x2), y);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STATUS color logic  (mirrors the invoice's C_STATUS)
// ─────────────────────────────────────────────────────────────────────────────
const statusColor = (s: string): [number,number,number] => {
  const u = s.toUpperCase();
  if (u === 'DELIVERED' || u === 'COMPLETED') return [0,  150,  0];
  if (u === 'PENDING')                         return [200, 150,  0];
  if (u === 'CANCELLED')                       return [200,   0,  0];
  return BRAND_GREEN;
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN RECEIPT GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export const generatePDFReceipt = async (order: Order): Promise<void> => {
  try {
    // ── Page dimensions (exact match with invoice) ──────────────────────────
    const W  = 80;   // mm — receipt width
    const M  =  5;   // mm — margin
    const CW = W - 2 * M;  // 70 mm content width

    const doc = new jsPDF({ format: [W, 420], unit: 'mm' });
    let y = 0;

    // ─── Section 1 · Logo ──────────────────────────────────────────────────
    y += 6;
    const logoW = 42, logoH = 11;
    const base64Logo = await loadImage(smartkenyaLogo);
    doc.addImage(base64Logo, 'PNG', (W - logoW) / 2, y, logoW, logoH);
    y += logoH + 3;

    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MID_TEXT);
    doc.text('Your Smart Shopping Destination', W / 2, y, { align: 'center' });
    y += 5;

    // ─── Section 2 · "PURCHASE RECEIPT" green title bar ───────────────────
    const titleH = 7;
    doc.setFillColor(...BRAND_GREEN);
    doc.roundedRect(M, y, CW, titleH, 1, 1, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text('PURCHASE RECEIPT', W / 2, y + titleH * 0.68, { align: 'center' });
    y += titleH + 4;

    // ─── Section 3 · Order details box ────────────────────────────────────
    // Compute box height dynamically (same as invoice)
    const mpesaRef = order.mpesa_receipt_number || '';
    const hasMpesa = !!mpesaRef;
    const detailRows = hasMpesa ? 4 : 3;
    const detailH = detailRows * 4.5 + 7;

    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(M, y, CW, detailH, 1, 1, 'F');

    const infoX = M + 2;
    const valX  = W - M - 2;
    y += 4;

    const infoRow = (
      label: string, value: string,
      valCol: [number,number,number] = DARK_TEXT, bold = false,
    ) => {
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...MID_TEXT);
      doc.text(label, infoX, y);

      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...valCol);
      doc.text(value, valX, y, { align: 'right' });
      y += 4.5;
    };

    infoRow('RECEIPT NO', order.order_id.toUpperCase());
    infoRow('DATE',       formatReceiptDate(order.created_at));
    infoRow('STATUS',     order.status.toUpperCase(), statusColor(order.status), true);
    if (hasMpesa) infoRow('M-PESA REF', mpesaRef);

    y += 3; // box bottom padding

    // ─── Section 4 · Dotted separator ──────────────────────────────────────
    drawDottedLine(doc, M, W - M, y);
    y += 4;

    // ─── Section 5 · BILL TO customer box ─────────────────────────────────
    // Pre-compute customer text lines so the box height is exact
    type CustLine = { text: string; bold: boolean; size: number; color: [number,number,number] };
    const custLines: CustLine[] = [];

    custLines.push({ text: order.username || 'Walk-in Customer', bold: true,  size: 7,   color: DARK_TEXT });
    if (order.email)        custLines.push({ text: order.email,        bold: false, size: 6, color: MID_TEXT });
    if (order.phone_number) custLines.push({ text: order.phone_number, bold: false, size: 6, color: MID_TEXT });
    if (order.shipping_address) {
      doc.setFontSize(6);
      const addrLines = doc.splitTextToSize(order.shipping_address, CW - 4);
      for (const l of addrLines) {
        custLines.push({ text: l, bold: false, size: 6, color: MID_TEXT });
      }
    }

    const custH = custLines.length * 3.5 + 12;
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(M, y, CW, custH, 1, 1, 'F');

    const custX = M + 2;
    y += 4;

    // "BILL TO" label in green
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND_GREEN);
    doc.text('BILL TO', custX, y);
    y += 4;

    for (const cl of custLines) {
      doc.setFontSize(cl.size);
      doc.setFont('helvetica', cl.bold ? 'bold' : 'normal');
      doc.setTextColor(...cl.color);
      doc.text(cl.text, custX, y);
      y += 3.5;
    }
    y += 3; // box bottom padding

    // ─── Section 6 · Items table ──────────────────────────────────────────
    // Column widths match the invoice exactly:
    //   # = 6mm | ITEM = 26mm(auto) | QTY = 8mm | PRICE = 14mm | AMOUNT = 16mm
    const items = order.items || [];
    // ITEM column is 26 mm wide; minus 2 mm of cell padding = 24 mm usable.
    // Split at fontSize 6, cap to 2 lines, append "..." if truncated.
    const ITEM_COL_W = 26;
    const ITEM_MAX_W = ITEM_COL_W - 2;
    const MAX_LINES  = 2;

    const truncateName = (name: string): string => {
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      const lines: string[] = doc.splitTextToSize(name, ITEM_MAX_W);
      if (lines.length <= MAX_LINES) return name;
      const kept = lines.slice(0, MAX_LINES);
      let last = kept[MAX_LINES - 1].trimEnd();
      while (last.length > 0 && doc.getTextWidth(last + '...') > ITEM_MAX_W) {
        last = last.slice(0, -1);
      }
      kept[MAX_LINES - 1] = last.trimEnd() + '...';
      return kept.join('\n');
    };

    const tableBody = items.map((item, idx) => {
      const qty   = item.quantity        || 0;
      const price = item.product.price   || 0;
      const total = qty * price;
      return [
        (idx + 1).toString(),
        truncateName(item.product.name || 'Unknown Item'),
        qty.toString(),
        price.toLocaleString(),
        total.toLocaleString(),
      ];
    });

    autoTable(doc, {
      startY: y,
      theme: 'plain',
      styles: {
        fontSize:    6,
        cellPadding: { top: 1.5, bottom: 1.5, left: 1, right: 1 },
        textColor:   DARK_TEXT,
        font:        'helvetica',
        overflow:    'linebreak',
      },
      headStyles: {
        fillColor:  BRAND_GREEN,
        textColor:  WHITE,
        fontStyle:  'bold',
        fontSize:   5.5,
        cellPadding: { top: 2, bottom: 2, left: 1, right: 1 },
      },
      alternateRowStyles: {
        fillColor: LIGHT_BG,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth:  6 },
        1: { halign: 'left',   cellWidth: ITEM_COL_W },
        2: { halign: 'center', cellWidth:  8 },
        3: { halign: 'right',  cellWidth: 14 },
        4: { halign: 'right',  cellWidth: 16, fontStyle: 'bold' },
      },
      margin: { left: M, right: M },
      head: [['#', 'ITEM', 'QTY', 'PRICE', 'AMOUNT']],
      body: tableBody.length > 0
        ? tableBody
        : [['', 'No items in order.', '', '', '']],
      didDrawPage: (data) => {
        if (data.cursor) y = data.cursor.y + 2;
      },
    });

    y += 4;

    // ─── Section 7 · Summary ──────────────────────────────────────────────
    const subtotal    = items.reduce((s, i) => s + (i.quantity || 0) * (i.product.price || 0), 0);
    const discount    = order.discount_amount ?? 0;
    const delivery    = order.delivery_fee    ?? 0;
    const grandTotal  = subtotal - discount + delivery;

    const sumX    = W / 2 + 2;
    const sumValX = W - M;

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MID_TEXT);

    // Subtotal row
    doc.text('Subtotal:',    sumX,    y);
    doc.text(`KES ${subtotal.toLocaleString()}`, sumValX, y, { align: 'right' });
    y += 4;

    // Discount row (only if discount > 0)
    if (discount > 0) {
      doc.setTextColor(0, 150, 0);
      doc.text('Discount:',            sumX,    y);
      doc.text(`-KES ${discount.toLocaleString()}`, sumValX, y, { align: 'right' });
      doc.setTextColor(...MID_TEXT);
      y += 4;
    }

    // Delivery fee row
    doc.text('Delivery Fee:', sumX, y);
    doc.text(delivery > 0 ? `KES ${delivery.toLocaleString()}` : 'FREE', sumValX, y, { align: 'right' });
    y += 4;

    // Green divider line above TOTAL band
    doc.setDrawColor(...BRAND_GREEN);
    doc.setLineWidth(0.4);
    doc.line(sumX, y, W - M, y);
    y += 5;

    // Grand TOTAL green rounded band
    const gtBandW = (W - M) - sumX + 4;
    const gtBandH = 8;
    doc.setFillColor(...BRAND_GREEN);
    doc.roundedRect(sumX - 2, y, gtBandW, gtBandH, 1, 1, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text('TOTAL', sumX - 1,     y + gtBandH * 0.65);
    doc.text(`KES ${grandTotal.toLocaleString()}`, sumValX - 1, y + gtBandH * 0.65, { align: 'right' });
    y += gtBandH + 5;

    // ─── Section 8 · "Paid via M-Pesa" ────────────────────────────────────
    if (hasMpesa) {
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...MID_TEXT);
      doc.text('Paid via M-Pesa', W / 2, y, { align: 'center' });
      y += 5;
    }

    // ─── Section 9 · QR code ──────────────────────────────────────────────
    drawDottedLine(doc, M, W - M, y);
    y += 4;

    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MID_TEXT);
    doc.text('Scan to track your order', W / 2, y, { align: 'center' });
    y += 3;

    try {
      const qrValue  = `https://www.smartkenya.co.ke/order/${order.order_id}`;
      const qrDataUrl = await QRCode.toDataURL(qrValue, { width: 80, margin: 1 });
      const qrSize = 22;
      doc.addImage(qrDataUrl, 'PNG', (W - qrSize) / 2, y, qrSize, qrSize);
      y += qrSize + 5;
    } catch {
      y += 5;
    }

    // ─── Section 10 · Footer ──────────────────────────────────────────────
    drawDottedLine(doc, M, W - M, y);
    y += 4;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_TEXT);
    doc.text('Thank you for shopping with us!', W / 2, y, { align: 'center' });
    y += 4;

    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MID_TEXT);
    doc.text('www.smartkenya.co.ke',     W / 2, y, { align: 'center' });
    y += 3.5;
    doc.text('support@smartkenya.co.ke', W / 2, y, { align: 'center' });
    y += 4;

    doc.setFontSize(4);
    doc.text('This receipt is computer-generated and does not require a signature.', W / 2, y, { align: 'center' });
    y += 3;
    doc.text(`Generated on ${formatReceiptDate(new Date().toISOString())}`, W / 2, y, { align: 'center' });

    doc.save(`SmartKenya-Receipt-${order.order_id}.pdf`);
  } catch (error) {
    console.error('Error generating PDF receipt:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: load a local asset URL as base64 data URL
// ─────────────────────────────────────────────────────────────────────────────
async function loadImage(src: string): Promise<string> {
  const res  = await fetch(src);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Image conversion failed'));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const downloadReceipt = (order: Order) => {
  generatePDFReceipt(order).catch((error) => {
    console.error('Failed to generate PDF receipt:', error);
  });
};