
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface ChatSession {
  session_id: string;
  user_email?: string;
  last_message: string;
  last_timestamp: string;
  unread_count: number;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  
  const {
    useSummaryMetrics,
    useRecentOrders,
    useDailySalesMetrics,
    useProductsByCategory,
    useLowStockProducts
  } = useAdminDashboard();

  const { data: summaryMetrics, isLoading: metricsLoading } = useSummaryMetrics();
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders();
  const { data: dailySales, isLoading: salesLoading } = useDailySalesMetrics();
  const { data: productsByCategory, isLoading: categoryLoading } = useProductsByCategory();
  const { data: lowStockProducts, isLoading: stockLoading } = useLowStockProducts();

  // Fetch recent chat sessions
  useEffect(() => {
    fetchRecentChats();
    setupRealtimeSubscription();
  }, []);

  const fetchRecentChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          session_id,
          user_id,
          text,
          timestamp,
          is_read,
          sender,
          profiles(email)
        `)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Group by session and get session info
      const sessionMap = new Map<string, ChatSession>();
      
      data?.forEach((msg: any) => {
        const sessionId = msg.session_id;
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, {
            session_id: sessionId,
            user_email: msg.profiles?.email || 'Guest User',
            last_message: msg.text,
            last_timestamp: msg.timestamp,
            unread_count: 0,
          });
        }
        
        // Count unread messages from users
        if (!msg.is_read && msg.sender === 'user') {
          const session = sessionMap.get(sessionId)!;
          session.unread_count++;
        }
      });

      setRecentChats(Array.from(sessionMap.values()).slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent chats:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('dashboard_chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          fetchRecentChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="ml-0 md:ml-64 p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your admin dashboard</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KSH {metricsLoading ? '...' : summaryMetrics?.totalRevenue?.toLocaleString() || '0'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricsLoading ? '...' : summaryMetrics?.totalOrders || '0'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricsLoading ? '...' : summaryMetrics?.totalProducts || '0'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricsLoading ? '...' : summaryMetrics?.totalUsers || '0'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Sales Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="h-64 flex items-center justify-center">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total_revenue" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent Chats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Chats
              </CardTitle>
              <Link to="/admin/chat">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentChats.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent chats</p>
              ) : (
                recentChats.map((chat) => (
                  <Link
                    key={chat.session_id}
                    to={`/admin/chat?session=${chat.session_id}`}
                    className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{chat.user_email}</span>
                      {chat.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {chat.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {chat.last_message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(chat.last_timestamp).toLocaleString()}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Products by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryLoading ? (
                <div className="h-64 flex items-center justify-center">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={productsByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {productsByCategory?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stockLoading ? (
                <div className="space-y-2">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : lowStockProducts && lowStockProducts.length > 0 ? (
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div key={product.product_id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">Stock: {product.stock}</p>
                      </div>
                      <Badge variant="destructive">Low Stock</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No low stock products</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
