import { format } from 'date-fns';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface OrderItem {
  product_id: string;
  quantity: number;
  name: string;
  price: number;
  image?: string;
}

interface Order {
  order_id: string;
  user_id: string | null;
  email: string | null;
  phone_number: string | null;
  status: string;
  amount: number | null;
  items: OrderItem[] | null;
  shipping_address: string | null;
  created_at: string;
  updated_at: string;
  mpesa_checkout_request_id?: string;
  payment_id?: string;
}

export const generatePDFReceipt = async (order: Order): Promise<void> => {
  try {
    // Standard receipt width: 80mm, height: variable or fixed
    const receiptWidth = 80;
    let receiptHeight = 160; // increase if needed

    const doc = new jsPDF({
      format: [receiptWidth, receiptHeight],
      unit: 'mm',
    });

    let y = 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SMART KENYA', receiptWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Online Shopping Platform', receiptWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIPT', receiptWidth / 2, y, { align: 'center' });
    y += 4;

    doc.setLineWidth(0.2);
    doc.line(4, y, receiptWidth - 4, y);
    y += 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Receipt #: ${order.order_id}`, 4, y); y += 4;
    doc.text(`Order Date: ${format(new Date(order.created_at), 'PPP p')}`, 4, y); y += 4;
    doc.text(`Status: ${order.status.toUpperCase()}`, 4, y); y += 4;

    doc.setLineWidth(0.1);
    doc.line(4, y, receiptWidth - 4, y);
    y += 2;

    doc.setFont('helvetica', 'bold');
    doc.text('Customer:', 4, y); y += 4;

    doc.setFont('helvetica', 'normal');
    doc.text(`Email: ${order.email || 'N/A'}`, 4, y); y += 4;
    doc.text(`Phone: ${order.phone_number || 'N/A'}`, 4, y); y += 4;
    doc.text(`Address:`, 4, y); y += 4;
    if (order.shipping_address) {
      doc.text(order.shipping_address, 7, y, { maxWidth: receiptWidth - 10 });
      y += 6;
    } else {
      y += 4;
    }

    doc.setLineWidth(0.1);
    doc.line(4, y, receiptWidth - 4, y);
    y += 2;

    doc.setFont('helvetica', 'bold');
    doc.text('Items:', 4, y); y += 4;

    doc.setFont('helvetica', 'normal');
    if (order.items && order.items.length > 0) {
      order.items.forEach((item, idx) => {
        // Add null checks and default values
        const itemPrice = item.price || 0;
        const itemQuantity = item.quantity || 0;
        const itemName = item.name || 'Unknown Item';
        const lineTotal = itemPrice * itemQuantity;
        
        doc.text(
          `${itemQuantity} × ${itemName} @ KES ${itemPrice.toLocaleString()} = KES ${lineTotal.toLocaleString()}`,
          6,
          y,
          { maxWidth: receiptWidth - 8 }
        );
        y += 4;
      });
    } else {
      doc.text('No items in order.', 6, y); y += 4;
    }

    y += 2;
    doc.line(4, y, receiptWidth - 4, y);
    y += 2;

    const subtotal = order.amount || 0;
    const total = subtotal;
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: KES ${total.toLocaleString()}`, 4, y);
    y += 7;

    // Generate the QR code as a data URL (encode order ID or payment link, etc)
    const qrValue = order.order_id; // You may encode a url or payment statement instead.
    const qrDataUrl = await QRCode.toDataURL(qrValue, { width: 80, margin: 1 });

    // Insert QR code image (centered)
    doc.addImage(qrDataUrl, 'PNG', (receiptWidth - 24) / 2, y, 24, 24);
    y += 28;

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Thank you for shopping with us!', receiptWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text('🌐 www.smartkenya.co.ke', receiptWidth / 2, y, { align: 'center' });

    // Optionally, set a taller page if your content goes beyond initial 160mm
    // doc.internal.pageSize.setHeight(y + 10);
    // ^ jsPDF v2.5.0+ only

    const fileName = `receipt-${order.order_id}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating POS PDF:', error);
    throw error;
  }
};

export const downloadReceipt = (order: Order) => {
  generatePDFReceipt(order).catch((error) => {
    console.error('Failed to generate PDF receipt:', error);
  });
};