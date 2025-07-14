import { format } from 'date-fns';

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
║  Receipt #: ${order.order_id.padEnd(45)}║
║  Order Date: ${orderDate.padEnd(43)}║
║  Generated: ${currentDate.padEnd(44)}║
║  Status: ${order.status.toUpperCase().padEnd(49)}║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  CUSTOMER DETAILS                                            ║
║                                                              ║
║  ${(order.email || 'Email: Not provided').padEnd(58)}║
║  ${(order.phone_number || 'Phone: Not provided').padEnd(58)}║
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
║  ${(index + 1 + '. ' + itemName).padEnd(58)}║
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
║  • For returns, present this receipt within 30 days         ║
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

export const downloadReceipt = (order: Order) => {
  const receiptContent = generateReceiptContent(order);
  const fileName = `receipt-${order.order_id}.txt`;
  
  // Create a blob from the receipt content
  const blob = new Blob([receiptContent], { type: 'text/plain' });
  
  // Create a download link
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  
  // Append to the document, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};