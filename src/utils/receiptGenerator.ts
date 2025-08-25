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
  first_name?: string;
  last_name?: string;
  username?: string;
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
    // Standard receipt width: 80mm
    const receiptWidth = 80;
    
    // Calculate dynamic height based on content
    const baseHeight = 100; // Base height for header, customer info, footer, etc.
    const itemHeight = 4; // Height per item line
    const itemCount = order.items?.length || 0;
    
    // Calculate additional height needed for long item names (if text wraps)
    let additionalWrappingHeight = 0;
    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        const itemName = item.name || 'Unknown Item';
        const itemPrice = item.price || 0;
        const itemQuantity = item.quantity || 0;
        const lineTotal = itemPrice * itemQuantity;
        const fullText = `${itemQuantity} × ${itemName} @ KES ${itemPrice.toLocaleString()} = KES ${lineTotal.toLocaleString()}`;
        
        // Rough estimation: if text is longer than ~60 characters, it might wrap
        // This is a simple estimation - you might need to adjust based on testing
        const estimatedCharsPerLine = 60;
        if (fullText.length > estimatedCharsPerLine) {
          const extraLines = Math.ceil(fullText.length / estimatedCharsPerLine) - 1;
          additionalWrappingHeight += extraLines * 4; // 4mm per extra line
        }
      });
    }
    
    // Calculate total height needed
    const calculatedHeight = baseHeight + (itemCount * itemHeight) + additionalWrappingHeight;
    const receiptHeight = Math.max(160, calculatedHeight); // Minimum 160mm, or calculated height

    const doc = new jsPDF({
      format: [receiptWidth, receiptHeight],
      unit: 'mm',
    });

    let y = 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SMARTKENYA', receiptWidth / 2, y, { align: 'center' });
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
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Receipt #: ${order.order_id}`, 4, y); y += 4;
    doc.text(`Order Date: ${format(new Date(order.created_at), 'PPP p')}`, 4, y); y += 4;
    doc.text(`Status: ${order.status.toUpperCase()}`, 4, y); y += 4;

    doc.setLineWidth(0.1);
    doc.line(4, y, receiptWidth - 4, y);
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.text('Customer:', 4, y); y += 4;

    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${order.username || 'N/A'}`, 4, y); y += 4;
    doc.text(`Email: ${order.email || 'N/A'}`, 4, y); y += 4;
    doc.text(`Phone: ${order.phone_number || 'N/A'}`, 4, y); y += 4;
    doc.text(`Address: ${order.shipping_address || 'N/A'}`, 4, y); y += 4;

    doc.setLineWidth(0.1);
    doc.line(4, y, receiptWidth - 4, y);
    y += 4;

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
        
        // Get the text dimensions to calculate how many lines it will take
        const fullText = `${itemQuantity} × ${itemName} @ KES ${itemPrice.toLocaleString()} = KES ${lineTotal.toLocaleString()}`;
        const splitText = doc.splitTextToSize(fullText, receiptWidth - 8);
        
        // Add text (this handles wrapping automatically)
        doc.text(splitText, 6, y);
        
        // Adjust y position based on how many lines the text actually took
        y += splitText.length * 4; // 4mm per line
      });
    } else {
      doc.text('No items in order.', 6, y); y += 4;
    }

    y += 4;
    doc.line(4, y, receiptWidth - 4, y);
    y += 4;

    const subtotal = order.amount || 0;
    const total = subtotal;
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: KES ${total.toLocaleString()}`, 4, y);
    y += 7;

    // Generate the QR code as a data URL (encode order ID or payment link, etc)
    const qrValue = `https://www.smartkenya.co.ke/order/${order.order_id}`; // You may encode a url or payment statement instead.
    const qrDataUrl = await QRCode.toDataURL(qrValue, { width: 80, margin: 1 });

    // Insert QR code image (centered)
    doc.addImage(qrDataUrl, 'PNG', (receiptWidth - 24) / 2, y, 24, 24);
    y += 28;

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Thank you for shopping with us!', receiptWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text('www.smartkenya.co.ke', receiptWidth / 2, y, { align: 'center' });

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