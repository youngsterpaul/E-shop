import jsPDF from 'jspdf';
import smartkenyaLogo from '@/assets/images/smartkenya-logo.png';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

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

async function getBase64ImageFromURL(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert image to base64 string'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Brand colors
const BRAND_GREEN: [number, number, number] = [0, 128, 0];
const DARK_TEXT: [number, number, number] = [33, 33, 33];
const MID_TEXT: [number, number, number] = [100, 100, 100];
const LIGHT_BG: [number, number, number] = [245, 245, 245];
const WHITE: [number, number, number] = [255, 255, 255];
const BORDER_COLOR: [number, number, number] = [220, 220, 220];

const formatReceiptDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Africa/Nairobi',
  };
  return new Intl.DateTimeFormat('en-US', options).format(new Date(dateString));
};

const drawDottedLine = (doc: jsPDF, x1: number, x2: number, y: number) => {
  const dashLen = 1;
  const gapLen = 0.8;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.15);
  for (let x = x1; x < x2; x += dashLen + gapLen) {
    doc.line(x, y, Math.min(x + dashLen, x2), y);
  }
};

export const generatePDFReceipt = async (order: Order): Promise<void> => {
  try {
    const W = 80; // receipt width in mm
    const M = 5; // margin
    const contentW = W - M * 2;

    const doc = new jsPDF({ format: [W, 400], unit: 'mm' });
    let y = 6;

    // ── Logo ──
    const base64Logo = await getBase64ImageFromURL(smartkenyaLogo);
    const logoW = 42;
    const logoH = 11;
    doc.addImage(base64Logo, 'PNG', (W - logoW) / 2, y, logoW, logoH);
    y += logoH + 3;

    // ── Company tagline ──
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MID_TEXT);
    doc.text('Your Smart Shopping Destination', W / 2, y, { align: 'center' });
    y += 5;

    // ── Receipt title bar ──
    doc.setFillColor(...BRAND_GREEN);
    doc.roundedRect(M, y, contentW, 7, 1, 1, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text('PURCHASE RECEIPT', W / 2, y + 4.8, { align: 'center' });
    y += 11;

    // ── Order details box ──
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(M, y, contentW, 22, 1, 1, 'F');

    const infoX = M + 2;
    const valX = W - M - 2;
    y += 4;

    doc.setFontSize(6.5);

    // Receipt No
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...MID_TEXT);
    doc.text('RECEIPT NO', infoX, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_TEXT);
    doc.text(order.order_id, valX, y, { align: 'right' });
    y += 4.5;

    // Date
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...MID_TEXT);
    doc.text('DATE', infoX, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_TEXT);
    doc.text(formatReceiptDate(order.created_at), valX, y, { align: 'right' });
    y += 4.5;

    // Status
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...MID_TEXT);
    doc.text('STATUS', infoX, y);
    const statusText = order.status.toUpperCase();
    const statusColor: [number, number, number] =
      statusText === 'DELIVERED' || statusText === 'COMPLETED' ? [0, 150, 0] :
      statusText === 'PENDING' ? [200, 150, 0] :
      statusText === 'CANCELLED' ? [200, 0, 0] : BRAND_GREEN;
    doc.setTextColor(...statusColor);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, valX, y, { align: 'right' });
    y += 4.5;

    // M-Pesa
    if (order.mpesa_receipt_number) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...MID_TEXT);
      doc.text('M-PESA REF', infoX, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK_TEXT);
      doc.text(order.mpesa_receipt_number, valX, y, { align: 'right' });
      y += 4.5;
    }

    y += 3; // bottom padding of box

    drawDottedLine(doc, M, W - M, y);
    y += 4;

    // ── Customer section ──
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(M, y, contentW, order.shipping_address ? 20 : 16, 1, 1, 'F');
    
    const custX = M + 2;
    y += 4;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND_GREEN);
    doc.text('BILL TO', custX, y);
    y += 4;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_TEXT);
    doc.text(order.username || 'Walk-in Customer', custX, y);
    y += 3.5;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MID_TEXT);
    if (order.email) {
      doc.text(order.email, custX, y);
      y += 3.5;
    }
    if (order.phone_number) {
      doc.text(order.phone_number, custX, y);
      y += 3.5;
    }
    if (order.shipping_address) {
      const addressLines = doc.splitTextToSize(order.shipping_address, contentW - 4);
      doc.text(addressLines, custX, y);
      y += addressLines.length * 3.5;
    }
    y += 3;

    // ── Items table ──
    const items = order.items || [];
    const tableBody = items.map((item, idx) => {
      const qty = item.quantity || 0;
      const price = item.product.price || 0;
      const total = qty * price;
      return [
        (idx + 1).toString(),
        item.product.name || 'Unknown Item',
        qty.toString(),
        `${price.toLocaleString()}`,
        `${total.toLocaleString()}`
      ];
    });

    autoTable(doc, {
      startY: y,
      theme: 'plain',
      styles: { 
        fontSize: 7, 
        cellPadding: { top: 1.5, bottom: 1.5, left: 1, right: 1 },
        textColor: DARK_TEXT,
      },
      headStyles: { 
        fillColor: BRAND_GREEN,
        textColor: WHITE,
        fontStyle: 'bold',
        fontSize: 6.5,
        cellPadding: { top: 2, bottom: 2, left: 1, right: 1 },
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 6 },
        1: { cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 8 },
        3: { halign: 'right', cellWidth: 14 },
        4: { halign: 'right', cellWidth: 16, fontStyle: 'bold' },
      },
      margin: { left: M, right: M },
      head: [['#', 'ITEM DESCRIPTION', 'QTY', 'PRICE', 'AMOUNT']],
      body: tableBody.length > 0 ? tableBody : [['', 'No items in order.', '', '', '']],
      didDrawPage: (data) => {
        if (data.cursor) {
          y = data.cursor.y + 2;
        }
      }
    });

    y += 4;

    // ── Summary section ──
    const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.product.price || 0), 0);
    const discountAmount = order.discount_amount ?? 0;
    const deliveryFee = order.delivery_fee ?? 0;
    const grandTotal = subtotal - discountAmount + deliveryFee;

    const summaryX = W / 2 + 2;
    const summaryValX = W - M;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MID_TEXT);

    // Subtotal
    doc.text('Subtotal:', summaryX, y);
    doc.text(`KES ${subtotal.toLocaleString()}`, summaryValX, y, { align: 'right' });
    y += 4;

    // Discount
    if (discountAmount > 0) {
      doc.setTextColor(0, 150, 0);
      doc.text('Discount:', summaryX, y);
      doc.text(`-KES ${discountAmount.toLocaleString()}`, summaryValX, y, { align: 'right' });
      doc.setTextColor(...MID_TEXT);
      y += 4;
    }

    // Delivery
    doc.text('Delivery Fee:', summaryX, y);
    doc.text(deliveryFee > 0 ? `KES ${deliveryFee.toLocaleString()}` : 'FREE', summaryValX, y, { align: 'right' });
    y += 4;

    // Total divider
    doc.setDrawColor(...BRAND_GREEN);
    doc.setLineWidth(0.4);
    doc.line(summaryX, y, W - M, y);
    y += 5;

    // Grand total with background highlight
    doc.setFillColor(...BRAND_GREEN);
    doc.roundedRect(summaryX - 2, y - 3.5, (W - M) - summaryX + 4, 8, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.text('TOTAL', summaryX + 1, y + 1);
    doc.text(`KES ${grandTotal.toLocaleString()}`, summaryValX - 1, y + 1, { align: 'right' });
    y += 10;

    // ── Payment method indicator ──
    if (order.mpesa_receipt_number) {
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...MID_TEXT);
      doc.text('Paid via M-Pesa', W / 2, y, { align: 'center' });
      y += 5;
    }

    // ── QR Code section ──
    drawDottedLine(doc, M, W - M, y);
    y += 4;

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MID_TEXT);
    doc.text('Scan to track your order', W / 2, y, { align: 'center' });
    y += 3;

    const qrValue = `https://www.smartkenya.co.ke/order/${order.order_id}`;
    const qrDataUrl = await QRCode.toDataURL(qrValue, { width: 100, margin: 1 });
    const qrSize = 22;
    doc.addImage(qrDataUrl, 'PNG', (W - qrSize) / 2, y, qrSize, qrSize);
    y += qrSize + 5;

    // ── Footer ──
    drawDottedLine(doc, M, W - M, y);
    y += 4;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_TEXT);
    doc.text('Thank you for shopping with us!', W / 2, y, { align: 'center' });
    y += 4;

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MID_TEXT);
    doc.text('www.smartkenya.co.ke', W / 2, y, { align: 'center' });
    y += 3;
    doc.text('support@smartkenya.co.ke', W / 2, y, { align: 'center' });
    y += 4;

    doc.setFontSize(5);
    doc.text('This receipt is computer-generated and does not require a signature.', W / 2, y, { align: 'center' });
    y += 3;
    doc.text(`Generated on ${formatReceiptDate(new Date().toISOString())}`, W / 2, y, { align: 'center' });

    // Save
    doc.save(`SmartKenya-Receipt-${order.order_id}.pdf`);
  } catch (error) {
    console.error('Error generating PDF receipt:', error);
    throw error;
  }
};

export const downloadReceipt = (order: Order) => {
  generatePDFReceipt(order).catch((error) => {
    console.error('Failed to generate PDF receipt:', error);
  });
};
