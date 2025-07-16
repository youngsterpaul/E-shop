
export interface CheckoutStep {
  id: number;
  title: string;
  completed: boolean;
  active: boolean;
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface DeliveryInfo {
  address: string;
  city: string;
  county: string;
  deliveryMethod: 'standard' | 'express';
  specialInstructions?: string;
}

export interface PaymentStatus {
  status: 'idle' | 'processing' | 'waiting' | 'success' | 'failed' | 'timeout';
  transactionId?: string;
  checkoutRequestId?: string;
  message?: string;
  countdown?: number;
}

export interface CheckoutState {
  step: number;
  customerDetails: CustomerDetails;
  deliveryInfo: DeliveryInfo;
  paymentStatus: PaymentStatus;
  orderId?: string;
  isOpen: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
}

export interface OrderSummary {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
}
