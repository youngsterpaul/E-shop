-- Seed default email templates
INSERT INTO email_templates (name, subject, body, type, variables, is_active) VALUES
('Order Processing', 'Your Order #{{order_number_short}} is Being Processed', 'Hi {{customer_name}},

Great news! We''ve received your order and our team is now preparing it for shipment.

Order Details:
- Order Number: #{{order_number}}
- Amount: {{order_amount}}
- Status: {{status}}

We''ll notify you once your order has been packed and is ready for shipping.

Thank you for shopping with SmartKenya!', 'order_processing', ARRAY['customer_name', 'order_number', 'order_number_short', 'order_amount', 'status'], true),

('Order Packed', 'Your Order #{{order_number_short}} Has Been Packed', 'Hi {{customer_name}},

Your order has been carefully packed and is ready for shipping!

Order Details:
- Order Number: #{{order_number}}
- Amount: {{order_amount}}
- Status: {{status}}

Your package will be handed over to our delivery partner soon. We''ll send you the tracking details once it''s on its way.

Thank you for your patience!', 'order_packed', ARRAY['customer_name', 'order_number', 'order_number_short', 'order_amount', 'status'], true),

('Order Shipped', 'Your Order #{{order_number_short}} Has Been Shipped!', 'Hi {{customer_name}},

Exciting news! Your order is on its way to you.

Order Details:
- Order Number: #{{order_number}}
- Amount: {{order_amount}}
- Tracking Number: {{tracking_number}}
- Delivery Address: {{shipping_address}}

You can track your package using the tracking number above.

Thank you for shopping with SmartKenya!', 'order_shipped', ARRAY['customer_name', 'order_number', 'order_number_short', 'order_amount', 'tracking_number', 'shipping_address', 'status'], true),

('Order Delivered', 'Your Order #{{order_number_short}} Has Been Delivered!', 'Hi {{customer_name}},

Your order has been successfully delivered! We hope you love your purchase.

Order Details:
- Order Number: #{{order_number}}
- Amount: {{order_amount}}

If you''re happy with your order, we''d love to hear from you! Please consider leaving a review.

If you have any questions or concerns, our customer support team is here to help.

Thank you for choosing SmartKenya!', 'order_delivered', ARRAY['customer_name', 'order_number', 'order_number_short', 'order_amount', 'status'], true),

('Order Cancelled', 'Your Order #{{order_number_short}} Has Been Cancelled', 'Hi {{customer_name}},

Your order has been cancelled as requested.

Order Details:
- Order Number: #{{order_number}}
- Amount: {{order_amount}}

If you didn''t request this cancellation, please contact our customer support immediately.

We hope to serve you again soon!', 'order_cancelled', ARRAY['customer_name', 'order_number', 'order_number_short', 'order_amount', 'status', 'notes'], true)

ON CONFLICT DO NOTHING;