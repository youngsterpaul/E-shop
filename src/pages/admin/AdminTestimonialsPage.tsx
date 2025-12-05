import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MessageSquareQuote,
  Plus,
  Edit2,
  Trash2,
  Star,
  User,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Testimonial {
  id: string;
  customer_name: string;
  customer_title: string | null;
  customer_image: string | null;
  content: string;
  rating: number;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const AdminTestimonialsPage = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_title: '',
    customer_image: '',
    content: '',
    rating: 5,
    is_featured: false,
    is_active: true,
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_title: '',
      customer_image: '',
      content: '',
      rating: 5,
      is_featured: false,
      is_active: true,
    });
    setEditingTestimonial(null);
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      customer_name: testimonial.customer_name,
      customer_title: testimonial.customer_title || '',
      customer_image: testimonial.customer_image || '',
      content: testimonial.content,
      rating: testimonial.rating,
      is_featured: testimonial.is_featured,
      is_active: testimonial.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTestimonial) {
        const { error } = await supabase
          .from('testimonials')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTestimonial.id);

        if (error) throw error;
        toast({ title: "Testimonial updated successfully" });
      } else {
        const { error } = await supabase
          .from('testimonials')
          .insert({
            ...formData,
            display_order: testimonials.length + 1,
          });

        if (error) throw error;
        toast({ title: "Testimonial created successfully" });
      }

      setDialogOpen(false);
      resetForm();
      fetchTestimonials();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTestimonials(prev => prev.filter(t => t.id !== id));
      toast({ title: "Testimonial deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
      
      setTestimonials(prev => prev.map(t => 
        t.id === id ? { ...t, is_active } : t
      ));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Customer Testimonials</h1>
            <p className="text-muted-foreground">Manage testimonials displayed on your site</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Testimonial
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer Title</Label>
                  <Input
                    value={formData.customer_title}
                    onChange={(e) => setFormData({ ...formData, customer_title: e.target.value })}
                    placeholder="CEO, Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer Image URL</Label>
                  <Input
                    value={formData.customer_image}
                    onChange={(e) => setFormData({ ...formData, customer_image: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Testimonial Content *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="What did the customer say?"
                    rows={4}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rating (1-5)</Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="p-1"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= formData.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                    <Label>Featured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTestimonial ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading testimonials...
            </div>
          ) : testimonials.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquareQuote className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-foreground mb-1">No testimonials yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add customer testimonials to build trust with visitors.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Testimonial
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testimonials.map((testimonial) => (
                  <TableRow key={testimonial.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {testimonial.customer_image ? (
                          <img
                            src={testimonial.customer_image}
                            alt={testimonial.customer_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{testimonial.customer_name}</p>
                          {testimonial.customer_title && (
                            <p className="text-xs text-muted-foreground">{testimonial.customer_title}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                        {testimonial.content}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < testimonial.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={testimonial.is_active}
                          onCheckedChange={(checked) => handleToggleActive(testimonial.id, checked)}
                        />
                        {testimonial.is_featured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(testimonial)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(testimonial.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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

export default AdminTestimonialsPage;
