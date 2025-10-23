import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  CheckCircle, 
  Upload, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff,
  Plus,
  X,
  GripVertical
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface HeroSlide {
  id: string;
  title: string;
  image_url: string;
  link: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminHeroSlidesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    display_order: 0,
    is_active: true,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSlides(data || []);
    } catch (error: any) {
      console.error('Error fetching slides:', error);
      toast({
        title: "Failed to load slides",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `hero-slides/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('hero-slides')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('hero-slides')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast({
        title: "Missing information",
        description: "Please enter a title.",
        variant: "destructive"
      });
      return;
    }

    if (!editingSlide && !selectedImage) {
      toast({
        title: "Missing image",
        description: "Please select an image.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      let imageUrl = editingSlide?.image_url || '';

      // Upload new image if selected
      if (selectedImage) {
        imageUrl = await uploadImageToStorage(selectedImage);
        
        // Delete old image if editing
        if (editingSlide?.image_url) {
          const oldPath = editingSlide.image_url.split('/').slice(-2).join('/');
          await supabase.storage
            .from('hero-slides')
            .remove([oldPath]);
        }
      }

      const slideData = {
        title: formData.title,
        image_url: imageUrl,
        link: formData.link || null,
        display_order: formData.display_order,
        is_active: formData.is_active,
      };

      if (editingSlide) {
        // Update existing slide
        const { error } = await supabase
          .from('hero_slides')
          .update(slideData)
          .eq('id', editingSlide.id);

        if (error) throw error;

        toast({
          title: "Slide updated",
          description: "Hero slide has been updated successfully.",
        });
      } else {
        // Create new slide
        const { error } = await supabase
          .from('hero_slides')
          .insert(slideData);

        if (error) throw error;

        toast({
          title: "Slide created",
          description: "New hero slide has been added successfully.",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchSlides();
    } catch (error: any) {
      console.error('Error saving slide:', error);
      toast({
        title: "Failed to save slide",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      link: slide.link || '',
      display_order: slide.display_order,
      is_active: slide.is_active,
    });
    setImagePreview(slide.image_url);
    setIsDialogOpen(true);
  };

  const handleDelete = async (slide: HeroSlide) => {
    if (!confirm(`Are you sure you want to delete "${slide.title}"?`)) return;

    try {
      // Delete image from storage
      const imagePath = slide.image_url.split('/').slice(-2).join('/');
      await supabase.storage
        .from('hero-slides')
        .remove([imagePath]);

      // Delete from database
      const { error } = await supabase
        .from('hero_slides')
        .delete()
        .eq('id', slide.id);

      if (error) throw error;

      toast({
        title: "Slide deleted",
        description: "Hero slide has been removed successfully.",
      });

      fetchSlides();
    } catch (error: any) {
      console.error('Error deleting slide:', error);
      toast({
        title: "Failed to delete slide",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (slide: HeroSlide) => {
    try {
      const { error } = await supabase
        .from('hero_slides')
        .update({ is_active: !slide.is_active })
        .eq('id', slide.id);

      if (error) throw error;

      toast({
        title: slide.is_active ? "Slide deactivated" : "Slide activated",
        description: `Hero slide is now ${!slide.is_active ? 'visible' : 'hidden'}.`,
      });

      fetchSlides();
    } catch (error: any) {
      console.error('Error toggling slide:', error);
      toast({
        title: "Failed to update slide",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      link: '',
      display_order: 0,
      is_active: true,
    });
    setSelectedImage(null);
    setImagePreview('');
    setEditingSlide(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="ml-0 md:ml-64 p-4 md:p-6 flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="ml-0 md:ml-64 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Hero Slides Management</h1>
            <p className="text-muted-foreground">Manage homepage hero carousel slides</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add New Slide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSlide ? 'Edit' : 'Create'} Hero Slide</DialogTitle>
                <DialogDescription>
                  {editingSlide ? 'Update the hero slide information' : 'Add a new slide to the hero carousel'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Image Upload */}
                <div>
                  <Label>Slide Image *</Label>
                  <div className="mt-2">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setImagePreview('');
                            setSelectedImage(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">Click to upload image</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB</p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Summer Tech Sale"
                  />
                </div>

                {/* Link */}
                <div>
                  <Label htmlFor="link">Link (optional)</Label>
                  <Input
                    id="link"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="/products?category=tech"
                  />
                  <p className="text-xs text-gray-500 mt-1">Where users go when clicking the slide</p>
                </div>

                {/* Display Order */}
                <div>
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                </div>

                {/* Active Status */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                  />
                  <Label htmlFor="active" className="cursor-pointer">
                    Active (visible on homepage)
                  </Label>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || isUploading}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {editingSlide ? 'Update' : 'Create'} Slide
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Slides List */}
        <Card>
          <CardHeader>
            <CardTitle>Current Slides ({slides.length})</CardTitle>
            <CardDescription>
              Manage your homepage hero carousel slides
            </CardDescription>
          </CardHeader>
          <CardContent>
            {slides.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No slides yet. Create your first slide!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {slides.map((slide) => (
                  <div
                    key={slide.id}
                    className={`border rounded-lg p-4 flex items-center gap-4 ${
                      slide.is_active ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <GripVertical className="text-gray-400 cursor-move" size={20} />
                    
                    <img
                      src={slide.image_url}
                      alt={slide.title}
                      className="w-32 h-20 object-cover rounded"
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{slide.title}</h3>
                      <p className="text-sm text-gray-600">Order: {slide.display_order}</p>
                      {slide.link && (
                        <p className="text-sm text-blue-600 truncate">Link: {slide.link}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={slide.is_active ? "default" : "outline"}
                        size="icon"
                        onClick={() => toggleActive(slide)}
                        title={slide.is_active ? 'Active' : 'Inactive'}
                      >
                        {slide.is_active ? <Eye size={20} /> : <EyeOff size={20} />}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(slide)}
                      >
                        <Edit size={20} />
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(slide)}
                      >
                        <Trash2 size={20} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminHeroSlidesPage;