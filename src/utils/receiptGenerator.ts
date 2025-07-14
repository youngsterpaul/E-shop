import { format } from 'date-fns';
import { jsPDF } from 'jspdf';

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

export const generateReceiptPDF = (order: Order): jsPDF => {
  const doc = new jsPDF();
  const orderDate = format(new Date(order.created_at), 'PPP p');
  const currentDate = format(new Date(), 'PPP p');
  
  // PDF styling constants
  const primaryColor = [44, 62, 80] as const;
  const accentColor = [52, 152, 219] as const;
  const textColor = [51, 51, 51] as const;
  const lightGray = [248, 249, 250] as const;
  
  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return `Ksh ${amount.toLocaleString()}`;
  };
  
  // Header Section
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('SMART KENYA', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Online Shopping Platform', 105, 30, { align: 'center' });
  doc.text('Official Receipt', 105, 40, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(...textColor);
  
  let y = 70;
  
  // Order Information Section
  doc.setFillColor(...lightGray);
  doc.rect(10, y - 5, 190, 30, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ORDER INFORMATION', 15, y + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Receipt #: ${order.order_id}`, 15, y + 12);
  doc.text(`Order Date: ${orderDate}`, 15, y + 18);
  doc.text(`Generated: ${currentDate}`, 15, y + 24);
  
  // Status badge
  const statusColors = {
    delivered: { bg: [212, 237, 218], text: [21, 87, 36] },
    pending: { bg: [255, 243, 205], text: [133, 100, 4] },
    cancelled: { bg: [248, 215, 218], text: [114, 28, 36] }
  };
  
  const statusColor = statusColors[order.status as keyof typeof statusColors] || statusColors.pending;
  
  doc.setFillColor(...statusColor.bg);
  doc.rect(140, y + 8, 35, 8, 'F');
  doc.setTextColor(...statusColor.text);
  doc.setFont('helvetica', 'bold');
  doc.text(order.status.toUpperCase(), 157.5, y + 13, { align: 'center' });
  doc.setTextColor(...textColor);
  
  y += 45;
  
  // Customer Details Section
  doc.setFillColor(...lightGray);
  doc.rect(10, y - 5, 190, 35, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CUSTOMER DETAILS', 15, y + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Email: ${order.email || 'Not provided'}`, 15, y + 12);
  doc.text(`Phone: ${order.phone_number || 'Not provided'}`, 15, y + 18);
  
  if (order.shipping_address) {
    doc.text('Shipping Address:', 15, y + 24);
    // Handle long addresses by wrapping text
    const addressLines = doc.splitTextToSize(order.shipping_address, 180);
    doc.text(addressLines, 15, y + 30);
    y += (addressLines.length - 1) * 4;
  }
  
  y += 50;
  
  // Items Section Header
  doc.setFillColor(...accentColor);
  doc.rect(10, y - 5, 190, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('ORDER ITEMS', 15, y + 3);
  
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  y += 15;
  doc.text('ITEM', 15, y);
  doc.text('QTY', 120, y);
  doc.text('UNIT PRICE', 140, y);
  doc.text('TOTAL', 170, y);
  
  // Items List
  doc.setFont('helvetica', 'normal');
  y += 8;
  
  if (order.items && order.items.length > 0) {
    order.items.forEach((item, index) => {
      const itemName = item.name.length > 25 ? item.name.substring(0, 22) + '...' : item.name;
      const itemTotal = item.quantity * item.price;
      
      doc.text(`${index + 1}. ${itemName}`, 15, y);
      doc.text(item.quantity.toString(), 120, y);
      doc.text(formatCurrency(item.price), 140, y);
      doc.text(formatCurrency(itemTotal), 170, y);
      y += 6;
    });
  } else {
    doc.text('No items found in this order', 15, y);
    y += 6;
  }
  
  // Totals Section
  y += 10;
  doc.setLineWidth(0.5);
  doc.line(10, y, 200, y);
  y += 10;
  
  const subtotal = order.amount || 0;
  const tax = 0;
  const shipping = 0;
  const total = subtotal + tax + shipping;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Subtotal:', 140, y);
  doc.text(formatCurrency(subtotal), 170, y);
  y += 6;
  
  doc.text('Tax:', 140, y);
  doc.text(formatCurrency(tax), 170, y);
  y += 6;
  
  doc.text('Shipping:', 140, y);
  doc.text(formatCurrency(shipping), 170, y);
  y += 8;
  
  doc.setLineWidth(1);
  doc.line(135, y, 200, y);
  y += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', 140, y);
  doc.text(formatCurrency(total), 170, y);
  
  // Payment Information Section
  y += 20;
  doc.setFillColor(...lightGray);
  doc.rect(10, y - 5, 190, 25, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PAYMENT INFORMATION', 15, y + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Payment Method: M-Pesa', 15, y + 12);
  
  if (order.mpesa_checkout_request_id) {
    doc.text(`Transaction ID: ${order.mpesa_checkout_request_id}`, 15, y + 18);
  }
  
  if (order.payment_id) {
    doc.text(`Payment ID: ${order.payment_id}`, 100, y + 18);
  }
  
  const paymentStatus = order.status === 'delivered' ? 'COMPLETED' : 'PENDING';
  doc.text(`Status: ${paymentStatus}`, 15, y + 24);
  
  // Important Notes Section
  y += 35;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('IMPORTANT NOTES', 15, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 8;
  doc.text('• Keep this receipt for your records', 15, y);
  y += 4;
  doc.text('• For returns, present this receipt within 30 days', 15, y);
  y += 4;
  doc.text('• Digital products are non-refundable', 15, y);
  y += 4;
  doc.text('• Contact support for any issues', 15, y);
  
  // Footer Section
  y += 15;
  doc.setFillColor(...primaryColor);
  doc.rect(10, y, 190, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('CONTACT INFORMATION', 15, y + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('📧 Email: support@smartkenya.co.ke', 15, y + 15);
  doc.text('📞 Phone: +254 798 229783', 15, y + 18);
  doc.text('🌐 Website: www.smartkenya.co.ke', 15, y + 21);
  doc.text('🕒 Support Hours: Mon-Fri 8AM-6PM EAT', 15, y + 24);
  
  doc.text('Thank you for choosing Smart Kenya!', 105, y + 18, { align: 'center' });
  
  // Add generation timestamp
  doc.setFontSize(7);
  doc.text(`Generated by Smart Kenya Receipt System v2.0 - ${new Date().toISOString()}`, 15, y + 27);
  
  return doc;
};

export const downloadReceiptPDF = (order: Order): void => {
  const doc = generateReceiptPDF(order);
  const fileName = `receipt-${order.order_id}.pdf`;
  doc.save(fileName);
};

// Alternative function to get PDF as blob (useful for email attachments, etc.)
export const getReceiptPDFBlob = (order: Order): Blob => {
  const doc = generateReceiptPDF(order);
  return doc.output('blob');
};

// Function to get PDF as base64 string
export const getReceiptPDFBase64 = (order: Order): string => {
  const doc = generateReceiptPDF(order);
  return doc.output('datauristring');
};