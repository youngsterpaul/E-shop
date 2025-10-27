import { format } from 'date-fns';
import jsPDF from 'jspdf';
import smartkenyaLogo from '@/assets/images/smartkenya-logo.png';
import autoTable from 'jspdf-autotable';
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
  delivery_fee: number | null;
  items: OrderItem[] | null;
  shipping_address: string | null;
  created_at: string;
  updated_at: string;
  mpesa_checkout_request_id?: string;
  payment_id?: string;
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


export const generatePDFReceipt = async (order: Order): Promise<void> => {
  try {
    const receiptWidth = 80;

    const doc = new jsPDF({
      format: [receiptWidth, 400], // Height will expand if needed
      unit: 'mm',
    });

    let y = 8;

    // Header
    const base64Logo = await getBase64ImageFromURL(smartkenyaLogo);

    // Calculate position to center the logo
    const logoWidth = 48;  // Adjust width
    const logoHeight = 12; // Adjust height
    const xPos = (receiptWidth / 2) - (logoWidth / 2);

    // Add logo to PDF
    doc.addImage(base64Logo, 'PNG', xPos, y, logoWidth, logoHeight);

    y += logoHeight + 6;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIPT', receiptWidth / 2, y, { align: 'center' });
    y += 4;

    doc.setLineWidth(0.2);
    doc.line(4, y, receiptWidth - 4, y);
    y += 4;

    // Order Info
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Receipt #: ${order.order_id}`, 4, y); y += 4;
    doc.text(`Order Date: ${format(new Date(order.created_at), 'PPP p')}`, 4, y); y += 4;
    doc.text(`Status: ${order.status.toUpperCase()}`, 4, y); y += 4;

    doc.line(4, y, receiptWidth - 4, y);
    y += 4;

    // Customer Info
    doc.setFont('helvetica', 'bold');
    doc.text('Customer:', 4, y); y += 4;

    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${order.username || 'N/A'}`, 4, y); y += 4;
    doc.text(`Email: ${order.email || 'N/A'}`, 4, y); y += 4;
    doc.text(`Phone: ${order.phone_number || 'N/A'}`, 4, y); y += 4;
    doc.text(`Address: ${order.shipping_address || 'N/A'}`, 4, y); y += 4;

    doc.line(4, y, receiptWidth - 4, y);
    y += 4;

    // Items Table
    const items = order.items || [];

    const tableBody = items.map((item) => {
      const qty = item.quantity || 0;
      const price = item.price || 0;
      const total = qty * price;

      return [
        qty.toString(),
        item.name || 'Unknown Item',
        `KES ${price.toLocaleString()}`,
        `KES ${total.toLocaleString()}`
      ];
    });

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fillColor: [240, 240, 240] },
      margin: { left: 4, right: 4 },
      head: [['QTY', 'ITEM', 'PRICE', 'TOTAL']],
      body: tableBody.length > 0 ? tableBody : [['', 'No items in order.', '', '']],
      didDrawPage: (data) => {
        if (data.cursor) {
          y = data.cursor.y + 4;
        }
      }
    });

    // Summary Section
    const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
    const deliveryFee = order.delivery_fee ?? 0; // Use 0 if null or undefined
    const grandTotal = subtotal + deliveryFee;

    // Spacing from items table
    y += 6;

    // Subtotal line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Subtotal:', 10, y);  // Left aligned a bit more inside
    doc.text(`KES ${subtotal.toLocaleString()}`, receiptWidth - 10, y, { align: 'right' });
    y += 6;

    // Delivery line
    doc.text('Delivery:', 10, y);
    doc.text(`KES ${deliveryFee.toLocaleString()}`, receiptWidth - 10, y, { align: 'right' });
    y += 6;

    // Draw line above total
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(10, y, receiptWidth - 10, y);
    y += 6;

    // TOTAL line (bigger and bold)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL:', 10, y);
    doc.text(`KES ${grandTotal.toLocaleString()}`, receiptWidth - 10, y, { align: 'right' });
    y += 10; // some extra space after total



    // QR Code
    const qrValue = `https://www.smartkenya.co.ke/order/${order.order_id}`;
    const qrDataUrl = await QRCode.toDataURL(qrValue, { width: 80, margin: 1 });
    doc.addImage(qrDataUrl, 'PNG', (receiptWidth - 24) / 2, y, 24, 24);
    y += 28;

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Thank you for shopping with us!', receiptWidth / 2, y, { align: 'center' }); y += 4;
    doc.text('www.smartkenya.co.ke', receiptWidth / 2, y, { align: 'center' });

    // Save
    const fileName = `receipt-${order.order_id}.pdf`;
    doc.save(fileName);
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
