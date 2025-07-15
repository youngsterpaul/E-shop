import { format } from 'date-fns';
import jsPDF from 'jspdf';

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

export const generateReceiptContent = (order: Order): string => {
  const orderDate = format(new Date(order.created_at), 'PPP p');
  const currentDate = format(new Date(), 'PPP p');
  
  // Modern receipt with better formatting
  let receipt = `
╔══════════════════════════════════════════════════════════════╗
║                    SMART KENYA RECEIPT                       ║
║                  Online Shopping Platform                    ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Receipt #: ${order.order_id.padEnd(45)}                     ║
║  Order Date: ${orderDate.padEnd(43)}                         ║
║  Generated: ${currentDate.padEnd(44)}                        ║
║  Status: ${order.status.toUpperCase().padEnd(49)}            ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  CUSTOMER DETAILS                                            ║
║                                                              ║
║  ${(order.email || 'Email: Not provided').padEnd(58)}        ║
║  ${(order.phone_number || 'Phone: Not provided').padEnd(58)} ║
║                                                              ║
║  SHIPPING ADDRESS:                                           ║
║  ${(order.shipping_address || 'No address provided').substring(0, 58).padEnd(58)}║${order.shipping_address && order.shipping_address.length > 58 ? '\n║  ' + order.shipping_address.substring(58, 116).padEnd(58) + '║' : ''}
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ORDER ITEMS                                                 ║
╠══════════════════════════════════════════════════════════════╣`;

  // Items section with better formatting
  if (order.items && order.items.length > 0) {
    order.items.forEach((item, index) => {
      const itemName = (item.name || 'Unknown Item').length > 35 ? (item.name || 'Unknown Item').substring(0, 32) + '...' : (item.name || 'Unknown Item');
      const unitPrice = `Ksh ${(item.price || 0).toLocaleString()}`;
      const qty = `x${item.quantity || 0}`;
      const totalPrice = `Ksh ${((item.quantity || 0) * (item.price || 0)).toLocaleString()}`;
      
      receipt += `
║                                                              ║
║  ${(index + 1 + '. ' + itemName).padEnd(58)}                 ║
║     Qty: ${qty.padEnd(8)} Unit: ${unitPrice.padEnd(15)} Total: ${totalPrice.padEnd(15)}║`;
    });
  } else {
    receipt += `
║                                                              ║
║  No items found in this order                                ║`;
  }

  // Calculate subtotal, taxes, etc.
  const subtotal = order.amount || 0;
  const tax = 0; // Assuming no tax for now
  const shipping = 0; // Assuming free shipping
  const total = subtotal + tax + shipping;

  receipt += `
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ORDER SUMMARY                                               ║
║                                                              ║
║  Subtotal:                                   Ksh ${subtotal.toLocaleString().padStart(12)}║
║  Tax:                                        Ksh ${tax.toLocaleString().padStart(12)}║
║  Shipping:                                   Ksh ${shipping.toLocaleString().padStart(12)}║
║  ─────────────────────────────────────────────────────────── ║
║  TOTAL:                                      Ksh ${total.toLocaleString().padStart(12)}║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  PAYMENT INFORMATION                                         ║
║                                                              ║
║  Payment Method: M-Pesa                                      ║${order.mpesa_checkout_request_id ? `
║  Transaction ID: ${order.mpesa_checkout_request_id.padEnd(38)}║` : ''}
║  Status: ${(order.status === 'delivered' ? 'COMPLETED' : 'PENDING').padEnd(51)}║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  IMPORTANT NOTES                                             ║
║                                                              ║
║  • Keep this receipt for your records                        ║
║  • For returns, present this receipt within 30 days          ║
║  • Digital products are non-refundable                       ║
║  • Contact support for any issues                            ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  CONTACT INFORMATION                                         ║
║                                                              ║
║  📧 Email: support@smartkenya.co.ke                          ║
║  📞 Phone: +254 798 229783                                   ║
║  🌐 Website: www.smartkenya.co.ke                            ║
║  🕒 Support Hours: Mon-Fri 8AM-6PM EAT                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

Thank you for choosing Smart Kenya!
Your business is greatly appreciated.

Generated by Smart Kenya Receipt System v2.0
${new Date().toISOString()}
`;

  return receipt;
};

export const generatePDFReceipt = (order: Order): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF({
        format: 'a4',
        unit: 'mm'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      // Header
      doc.setFillColor(24, 95, 53); // Primary color
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Company Logo/Name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('SMART KENYA', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Online Shopping Platform', pageWidth / 2, 30, { align: 'center' });
      
      let yPosition = 60;
      
      // Receipt Title
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('RECEIPT', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;
      
      // Receipt Details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const orderDate = format(new Date(order.created_at), 'PPP p');
      const currentDate = format(new Date(), 'PPP p');
      
      // Receipt Info Box
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPosition, contentWidth, 30);
      
      yPosition += 8;
      doc.text(`Receipt #: ${order.order_id}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Order Date: ${orderDate}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Generated: ${currentDate}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Status: ${order.status.toUpperCase()}`, margin + 5, yPosition);
      
      yPosition += 20;
      
      // Customer Details
      doc.setFont('helvetica', 'bold');
      doc.text('CUSTOMER DETAILS', margin, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Email: ${order.email || 'Not provided'}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Phone: ${order.phone_number || 'Not provided'}`, margin, yPosition);
      yPosition += 6;
      
      if (order.shipping_address) {
        doc.text('Shipping Address:', margin, yPosition);
        yPosition += 6;
        
        // Split long addresses
        const addressLines = order.shipping_address.match(/.{1,60}/g) || [order.shipping_address];
        addressLines.forEach(line => {
          doc.text(line, margin + 5, yPosition);
          yPosition += 6;
        });
      }
      
      yPosition += 10;
      
      // Order Items
      doc.setFont('helvetica', 'bold');
      doc.text('ORDER ITEMS', margin, yPosition);
      yPosition += 8;
      
      // Table header
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPosition, contentWidth, 8);
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      
      doc.setFontSize(9);
      doc.text('Item', margin + 2, yPosition + 5);
      doc.text('Qty', margin + 100, yPosition + 5);
      doc.text('Unit Price', margin + 120, yPosition + 5);
      doc.text('Total', margin + 150, yPosition + 5);
      
      yPosition += 8;
      
      // Items
      if (order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
          const itemName = (item.name || 'Unknown Item').length > 35 
            ? (item.name || 'Unknown Item').substring(0, 32) + '...' 
            : (item.name || 'Unknown Item');
          
          doc.setFont('helvetica', 'normal');
          doc.text(`${index + 1}. ${itemName}`, margin + 2, yPosition + 5);
          doc.text(`${item.quantity || 0}`, margin + 100, yPosition + 5);
          doc.text(`KES ${(item.price || 0).toLocaleString()}`, margin + 120, yPosition + 5);
          doc.text(`KES ${((item.quantity || 0) * (item.price || 0)).toLocaleString()}`, margin + 150, yPosition + 5);
          
          yPosition += 8;
          
          // Check if we need a new page
          if (yPosition > pageHeight - 60) {
            doc.addPage();
            yPosition = 40;
          }
        });
      }
      
      yPosition += 10;
      
      // Order Summary
      const subtotal = order.amount || 0;
      const tax = 0;
      const shipping = 0;
      const total = subtotal + tax + shipping;
      
      doc.setDrawColor(0, 0, 0);
      doc.line(margin + 100, yPosition, margin + contentWidth, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', margin + 100, yPosition);
      doc.text(`KES ${subtotal.toLocaleString()}`, margin + 150, yPosition);
      yPosition += 6;
      
      doc.text('Tax:', margin + 100, yPosition);
      doc.text(`KES ${tax.toLocaleString()}`, margin + 150, yPosition);
      yPosition += 6;
      
      doc.text('Shipping:', margin + 100, yPosition);
      doc.text(`KES ${shipping.toLocaleString()}`, margin + 150, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('TOTAL:', margin + 100, yPosition);
      doc.text(`KES ${total.toLocaleString()}`, margin + 150, yPosition);
      
      yPosition += 20;
      
      // Payment Information
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT INFORMATION', margin, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.text('Payment Method: M-Pesa', margin, yPosition);
      yPosition += 6;
      
      if (order.mpesa_checkout_request_id) {
        doc.text(`Transaction ID: ${order.mpesa_checkout_request_id}`, margin, yPosition);
        yPosition += 6;
      }
      
      doc.text(`Status: ${order.status === 'delivered' ? 'COMPLETED' : 'PENDING'}`, margin, yPosition);
      
      yPosition += 20;
      
      // Footer
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 40;
      }
      
      doc.setFillColor(24, 95, 53);
      doc.rect(0, pageHeight - 30, pageWidth, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text('Thank you for choosing Smart Kenya!', pageWidth / 2, pageHeight - 20, { align: 'center' });
      doc.text('📧 support@smartkenya.co.ke | 📞 +254 798 229783', pageWidth / 2, pageHeight - 12, { align: 'center' });
      doc.text('🌐 www.smartkenya.co.ke', pageWidth / 2, pageHeight - 5, { align: 'center' });
      
      // Save the PDF
      const fileName = `receipt-${order.order_id}.pdf`;
      doc.save(fileName);
      resolve();
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
};

export const downloadReceipt = (order: Order) => {
  generatePDFReceipt(order).catch(error => {
    console.error('Failed to generate PDF receipt:', error);
    // Fallback to text receipt
    const receiptContent = generateReceiptContent(order);
    const fileName = `receipt-${order.order_id}.txt`;
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
};