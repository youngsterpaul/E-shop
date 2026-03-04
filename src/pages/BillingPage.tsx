import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { CreditCard, Smartphone, Receipt, ChevronRight, Loader2 } from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const BillingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  const { data: recentPayments, isLoading } = useQuery({
    queryKey: ['recent-payments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('orders')
        .select('order_id, amount, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className={`min-h-screen bg-muted/50 pb-10 ${!isMobile ? 'max-w-[480px] mx-auto' : ''}`}>
      <div className="px-4 pt-4 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">
          Payment Methods
        </p>
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-3.5 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-[18px] h-[18px] text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-medium text-foreground">M-Pesa</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Default payment method</p>
            </div>
            <span className="text-[10px] font-semibold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <div className="flex items-center gap-4 px-4 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-[18px] h-[18px] text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-medium text-foreground">Cash on Delivery</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Pay when you receive</p>
            </div>
            <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Available</span>
          </div>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2 mt-4">
          Recent Transactions
        </p>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : recentPayments && recentPayments.length > 0 ? (
          <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
            {recentPayments.map((payment: any, i: number) => (
              <div
                key={payment.order_id}
                className={`flex items-center gap-4 px-4 py-3.5 ${i !== recentPayments.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-[18px] h-[18px] text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-foreground">#{payment.order_id.slice(0, 8)}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-[14px] font-bold text-foreground">
                  KES {payment.amount?.toLocaleString() || '0'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-2xl shadow-sm p-8 text-center">
            <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-[14px] font-medium text-foreground">No transactions yet</p>
            <p className="text-[12px] text-muted-foreground mt-1">Your payment history will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingPage;
