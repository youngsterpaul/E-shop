
import React from 'react';

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

export const generatePDFReceiptContent = (order: Order): string => {
  const orderDate = new Date(order.created_at).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const currentDate = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const subtotal = order.amount || 0;
  const tax = Math.round(subtotal * 0.16); // 16% VAT
  const shipping = subtotal > 5000 ? 0 : 200; // Free shipping over 5000
  const total = subtotal + tax + shipping;

  let itemsHtml = '';
  if (order.items && order.items.length > 0) {
    order.items.forEach((item, index) => {
      const itemTotal = (item.quantity || 0) * (item.price || 0);
      itemsHtml += `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; vertical-align: top;">
            <div style="display: flex; align-items: center;">
              <div style="width: 32px; height: 32px; background: #f3f4f6; border-radius: 4px; margin-right: 8px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 10px; color: #6b7280;">${index + 1}</span>
              </div>
              <div>
                <div style="font-weight: 500; color: #1f2937; font-size: 12px; margin-bottom: 2px;">${item.name}</div>
                <div style="font-size: 10px; color: #6b7280;">ID: ${item.product_id}</div>
              </div>
            </div>
          </td>
          <td style="padding: 8px 0; text-align: center; color: #374151; font-size: 12px;">${item.quantity}</td>
          <td style="padding: 8px 0; text-align: right; color: #374151; font-size: 12px;">Ksh ${(item.price || 0).toLocaleString()}</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1f2937; font-size: 12px;">Ksh ${itemTotal.toLocaleString()}</td>
        </tr>
      `;
    });
  } else {
    itemsHtml = `
      <tr>
        <td colspan="4" style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">No items found in this order</td>
      </tr>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt - ${order.order_id}</title>
      <style>
        @page {
          size: 210mm 297mm; /* A4 size */
          margin: 15mm;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.4;
          color: #1f2937;
          background: #ffffff;
          font-size: 12px;
        }
        .receipt-container {
          width: 100%;
          max-width: 180mm;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          padding: 20px;
          text-align: center;
        }
        .header h1 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
          letter-spacing: 1px;
        }
        .header p {
          font-size: 12px;
          opacity: 0.9;
        }
        .content {
          padding: 20px;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 10px;
          padding-bottom: 4px;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 15px;
        }
        .info-item {
          display: flex;
          align-items: center;
          padding: 8px;
          background: #f9fafb;
          border-radius: 4px;
          font-size: 11px;
        }
        .info-icon {
          width: 14px;
          height: 14px;
          margin-right: 8px;
          color: #3b82f6;
        }
        .info-label {
          font-weight: 500;
          color: #6b7280;
          margin-right: 6px;
        }
        .info-value {
          color: #1f2937;
          word-break: break-all;
        }
        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          background: #dcfce7;
          color: #166534;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table th {
          background: #f9fafb;
          padding: 8px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
          font-size: 11px;
        }
        .items-table th:last-child,
        .items-table td:last-child {
          text-align: right;
        }
        .items-table th:nth-child(2),
        .items-table td:nth-child(2) {
          text-align: center;
        }
        .summary-table {
          width: 100%;
          max-width: 200px;
          margin-left: auto;
          border-collapse: collapse;
          font-size: 11px;
        }
        .summary-table tr {
          border-bottom: 1px solid #e5e7eb;
        }
        .summary-table td {
          padding: 6px 0;
        }
        .summary-table .total-row {
          font-weight: 700;
          font-size: 14px;
          color: #1f2937;
          border-top: 2px solid #374151;
          border-bottom: 2px solid #374151;
        }
        .footer {
          background: #f9fafb;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 15px;
        }
        .footer-item {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          font-size: 10px;
        }
        .footer-icon {
          width: 12px;
          height: 12px;
          margin-right: 6px;
        }
        .qr-placeholder {
          width: 60px;
          height: 60px;
          background: #e5e7eb;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 10px auto;
          color: #6b7280;
          font-size: 10px;
        }
        .footer-text {
          color: #6b7280;
          font-size: 10px;
          line-height: 1.3;
        }
        .address-item {
          grid-column: 1 / -1;
          margin-top: 8px;
        }
        @media print {
          .receipt-container {
            box-shadow: none;
            border-radius: 0;
          }
          .no-print {
            display: none;
          }
          body {
            background: white;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <h1>SMART KENYA</h1>
          <p>Your Premium Online Shopping Destination</p>
        </div>
        
        <div class="content">
          <div class="section">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-icon">#</span>
                <span class="info-label">Receipt:</span>
                <span class="info-value">${order.order_id}</span>
              </div>
              <div class="info-item">
                <span class="info-icon">📅</span>
                <span class="info-label">Date:</span>
                <span class="info-value">${orderDate}</span>
              </div>
              <div class="info-item">
                <span class="info-icon">📊</span>
                <span class="info-label">Status:</span>
                <span class="status-badge">${order.status}</span>
              </div>
              <div class="info-item">
                <span class="info-icon">🕒</span>
                <span class="info-label">Generated:</span>
                <span class="info-value">${currentDate}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Customer Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-icon">✉️</span>
                <span class="info-label">Email:</span>
                <span class="info-value">${order.email || 'Not provided'}</span>
              </div>
              <div class="info-item">
                <span class="info-icon">📞</span>
                <span class="info-label">Phone:</span>
                <span class="info-value">${order.phone_number || 'Not provided'}</span>
              </div>
              <div class="info-item address-item">
                <span class="info-icon">📍</span>
                <span class="info-label">Address:</span>
                <span class="info-value">${order.shipping_address || 'No address provided'}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Order Items</h2>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2 class="section-title">Order Summary</h2>
            <table class="summary-table">
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right;">Ksh ${subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td>VAT (16%):</td>
                <td style="text-align: right;">Ksh ${tax.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Shipping:</td>
                <td style="text-align: right;">Ksh ${shipping.toLocaleString()}</td>
              </tr>
              <tr class="total-row">
                <td>TOTAL:</td>
                <td style="text-align: right;">Ksh ${total.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h2 class="section-title">Payment Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-icon">💳</span>
                <span class="info-label">Method:</span>
                <span class="info-value">M-Pesa</span>
              </div>
              <div class="info-item">
                <span class="info-icon">🔢</span>
                <span class="info-label">Transaction ID:</span>
                <span class="info-value">${order.mpesa_checkout_request_id || 'Pending'}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="footer-info">
            <div class="footer-item">
              <span class="footer-icon">✉️</span>
              <span>support@smartkenya.co.ke</span>
            </div>
            <div class="footer-item">
              <span class="footer-icon">📞</span>
              <span>+254 798 229783</span>
            </div>
            <div class="footer-item">
              <span class="footer-icon">🌐</span>
              <span>www.smartkenya.co.ke</span>
            </div>
            <div class="footer-item">
              <span class="footer-icon">🕒</span>
              <span>Mon-Fri 8AM-6PM EAT</span>
            </div>
          </div>
          <div class="qr-placeholder">QR Code</div>
          <div class="footer-text">
            Thank you for choosing Smart Kenya!<br>
            Keep this receipt for your records • Returns accepted within 30 days<br>
            Generated by Smart Kenya Receipt System v2.0
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const downloadPDFReceipt = (order: Order) => {
  const htmlContent = generatePDFReceiptContent(order);
  const fileName = `receipt-${order.order_id}.html`;
  
  // Create a blob from the HTML content
  const blob = new Blob([htmlContent], { type: 'text/html' });
  
  // Create a download link
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};