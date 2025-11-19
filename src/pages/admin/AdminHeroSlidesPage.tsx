import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { EmptyState } from '@/components/admin/EmptyState';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface HeroSlide {
  id: string;
  title: string;
  image_url: string;
  link: string | null;
  display_order: number;
  is_active: boolean;
}

const AdminHeroSlidesPage = () => {
  const { toast } = useToast();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSlides(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('hero_slides')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Slide visibility updated" });
      fetchSlides();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <QuickActionsBar
        title="Hero Slides"
        onRefresh={fetchSlides}
        addNewPath="/supersmartkenyaadmin123/heroslides/add"
        addNewLabel="Add Slide"
      />

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-8">Loading slides...</div>
          ) : slides.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="No hero slides yet"
              description="Create engaging hero slides for your homepage"
              actionLabel="Add Slide"
              onAction={() => window.location.href = '/supersmartkenyaadmin123/heroslides/add'}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slides.map((slide) => (
                  <TableRow key={slide.id}>
                    <TableCell className="font-medium">{slide.display_order}</TableCell>
                    <TableCell>{slide.title}</TableCell>
                    <TableCell>
                      <img src={slide.image_url} alt={slide.title} className="h-10 w-20 object-cover rounded" />
                    </TableCell>
                    <TableCell>
                      <Badge variant={slide.is_active ? "default" : "secondary"}>
                        {slide.is_active ? 'Active' : 'Hidden'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(slide.id, slide.is_active)}
                      >
                        {slide.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminHeroSlidesPage;
