
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
  const orderDate = format(new Date(order.created_at), 'PPP');
  
  // Header
  let receipt = `
    SMARTKENYA ONLINE SHOPPING        
    ORDER RECEIPT                 
    ============================================
    
    Order ID: ${order.order_id}
    Date: ${orderDate}
    Status: ${order.status.toUpperCase()}
    
    Customer Information:
    ${order.email || 'No email provided'}
    ${order.phone_number || 'No phone number provided'}
    
    Shipping Address:
    ${order.shipping_address || 'No shipping address provided'}
    
    ============================================
    ITEMS
    ============================================
  `;
  
  // Items
  if (order.items && order.items.length > 0) {
    order.items.forEach(item => {
      receipt += `
    ${item.name}
    ${item.quantity} x Ksh ${item.price.toLocaleString()} = Ksh ${(item.quantity * item.price).toLocaleString()}
      `;
    });
  } else {
    receipt += `
    No items found in order
    `;
  }
  
  // Totals
  receipt += `
    ============================================
    TOTAL: Ksh ${order.amount?.toLocaleString() || '0'}
    ============================================
    
    Thank you for shopping with Smart Kenya!
    For questions or support, contact us at:
    support@smartkenya.co.ke | +254 798 229783
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
