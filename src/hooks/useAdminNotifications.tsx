import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '@/contexts/NotificationContext';

export const useAdminNotifications = (isAdmin: boolean) => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!isAdmin) return;

    // Channel for new orders
    const ordersChannel = supabase
      .channel('admin-orders-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const order = payload.new as any;
          const message = `Order #${order.order_id?.slice(0, 8)} - KSH ${order.amount?.toLocaleString() || '0'}`;
          
          toast({
            title: '🛒 New Order Received',
            description: message,
            duration: 5000,
          });

          addNotification({
            title: 'New Order Received',
            description: message,
            type: 'order',
          });
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['adminRecentOrders'] });
          queryClient.invalidateQueries({ queryKey: ['adminSummaryMetrics'] });
          queryClient.invalidateQueries({ queryKey: ['adminDailySalesMetrics'] });
        }
      )
      .subscribe();

    // Channel for low stock products
    const productsChannel = supabase
      .channel('admin-products-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          const product = payload.new as any;
          const oldProduct = payload.old as any;
          
          // Check if stock went below reorder point
          const reorderPoint = product.reorder_point || 10;
          if (
            product.stock <= reorderPoint && 
            oldProduct.stock > reorderPoint
          ) {
            const message = `${product.name} needs reordering (${product.stock} units left, reorder point: ${reorderPoint})`;
            
            toast({
              title: '⚠️ Low Stock Alert',
              description: message,
              variant: 'destructive',
              duration: 7000,
            });

            addNotification({
              title: 'Low Stock Alert',
              description: message,
              type: 'stock',
            });
            
            // Invalidate low stock products query
            queryClient.invalidateQueries({ queryKey: ['adminLowStockProducts'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
          }
        }
      )
      .subscribe();

    // Channel for security alerts - listen to INSERT, UPDATE, and DELETE
    const securityChannel = supabase
      .channel('admin-security-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_alerts'
        },
        (payload) => {
          const alert = payload.new as any;
          const severityEmoji = {
            'critical': '🚨',
            'high': '⚠️',
            'medium': '⚡',
            'low': 'ℹ️'
          }[alert.severity] || '🔔';
          
          const message = `${alert.alert_type}: ${alert.identifier}`;

          toast({
            title: `${severityEmoji} Security Alert`,
            description: message,
            variant: alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'default',
            duration: 10000,
          });

          addNotification({
            title: 'Security Alert',
            description: message,
            type: 'security',
          });
          
          // Invalidate security alerts queries with correct key
          queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
          queryClient.invalidateQueries({ queryKey: ['security-alerts-count'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'security_alerts'
        },
        () => {
          // Invalidate queries when alerts are updated (acknowledged)
          queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
          queryClient.invalidateQueries({ queryKey: ['security-alerts-count'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'security_alerts'
        },
        () => {
          // Invalidate queries when alerts are deleted
          queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
          queryClient.invalidateQueries({ queryKey: ['security-alerts-count'] });
        }
      )
      .subscribe();

    // Channel for new chat messages from users
    const chatChannel = supabase
      .channel('admin-chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const message = payload.new as any;
          
          // Only notify for user messages (not admin or AI)
          if (message.sender_type === 'user') {
            // Try to get user info
            let userName = 'Customer';
            if (message.sender_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('email, first_name')
                .eq('user_id', message.sender_id)
                .maybeSingle();
              
              if (profile) {
                userName = profile.first_name || profile.email?.split('@')[0] || 'Customer';
              }
            }

            const truncatedContent = message.content.length > 50 
              ? message.content.substring(0, 50) + '...' 
              : message.content;

            toast({
              title: `💬 New message from ${userName}`,
              description: truncatedContent,
              duration: 5000,
            });

            addNotification({
              title: `New Chat Message`,
              description: `${userName}: ${truncatedContent}`,
              type: 'message',
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(securityChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [isAdmin, queryClient, addNotification]);
};
