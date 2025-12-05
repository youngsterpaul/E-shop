import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Mail,
  Users,
  Download,
  Search,
  Trash2,
  RefreshCw,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
}

const AdminNewsletterPage = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Stats
  const totalSubscribers = subscribers.length;
  const activeSubscribers = subscribers.filter(s => s.is_active).length;
  const thisMonthSubscribers = subscribers.filter(s => {
    const subDate = new Date(s.subscribed_at);
    const now = new Date();
    return subDate.getMonth() === now.getMonth() && subDate.getFullYear() === now.getFullYear();
  }).length;

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      // Table might not exist yet
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSubscribers(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Subscriber removed",
        description: "The subscriber has been removed from the list.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove subscriber.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    const csv = [
      ['Email', 'Subscribed At', 'Status'],
      ...subscribers.map(s => [
        s.email,
        format(new Date(s.subscribed_at), 'yyyy-MM-dd HH:mm'),
        s.is_active ? 'Active' : 'Inactive'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: `Exported ${subscribers.length} subscribers.`,
    });
  };

  const filteredSubscribers = subscribers.filter(s =>
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Newsletter Subscribers</h1>
            <p className="text-muted-foreground">Manage your email subscriber list</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchSubscribers} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleExport} disabled={subscribers.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Subscribers</p>
                <p className="text-2xl font-bold text-foreground">{totalSubscribers}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Subscribers</p>
                <p className="text-2xl font-bold text-foreground">{activeSubscribers}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">{thisMonthSubscribers}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search subscribers by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Table */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading subscribers...
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-foreground mb-1">No subscribers yet</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No subscribers match your search.' : 'Subscribers will appear here when users sign up.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Subscribed Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell className="font-medium">{subscriber.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(subscriber.subscribed_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={subscriber.is_active ? "default" : "secondary"}>
                        {subscriber.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(subscriber.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminNewsletterPage;
