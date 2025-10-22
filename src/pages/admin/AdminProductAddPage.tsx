import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdvancedProductForm from '@/components/admin/AdvancedProductForm';
import ProductBasicInfoForm from '@/components/admin/ProductBasicInfoForm';
import ProductCategorySelect from '@/components/admin/ProductCategorySelect';
import ProductImageUpload from '@/components/admin/ProductImageUpload';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { useCategories } from '@/hooks/useCategories';
import { useImageUpload } from '@/hooks/useImageUpload';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  store: string;
  categories: string;
  featured: boolean;
  features: string;
  specification: string;
}

const AdminProductAdd = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      store: '',
      categories: '',
      featured: false,
      features: '',
      specification: '',
    },
  });

  const { categories, subcategories, setSubcategories, fetchSubcategories } = useCategories();
  const { 
    images, 
    imageUrls, 
    uploadProgress,
    isUploading,
    handleImageUpload, 
    uploadImagesToStorage,
    removeImage, 
    clearImages 
  } = useImageUpload();
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory);
    } else {
      setSubcategories([]);
      setSelectedSubcategory('');
      setSubcategoryName('');
    }
  }, [selectedCategory]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    const category = categories.find(cat => cat.id === value);
    if (category) {
      setCategoryName(category.category);
      form.setValue('categories', category.category);
    }
    setSelectedSubcategory('');
    setSubcategoryName('');
  };

  const handleSubcategoryChange = (value: string) => {
    setSelectedSubcategory(value);
    const subcategory = subcategories.find(sub => sub.id === value);
    if (subcategory) {
      setSubcategoryName(subcategory.category);
    }
  };

  const handleUploadImages = async () => {
    if (images.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select some images to upload.",
        variant: "destructive"
      });
      return;
    }

    try {
      await uploadImagesToStorage();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
  
  const onSubmit = async (data: ProductFormData) => {
    if (!selectedCategory) {
      toast({
        title: "Missing information",
        description: "Please select a category.",
        variant: "destructive"
      });
      return;
    }

    // Check if we have images but haven't uploaded them yet
    if (images.length > 0 && imageUrls.length === 0) {
      toast({
        title: "Images not uploaded",
        description: "Please upload your images first before saving the product.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);

      let specificationToStore = data.specification || '';
      
      if (data.specification) {
        try {
          JSON.parse(data.specification);
          specificationToStore = data.specification;
        } catch {
          specificationToStore = JSON.stringify({ description: data.specification });
        }
      }

      const categoryToStore = subcategoryName ? `${categoryName} > ${subcategoryName}` : categoryName;
      
      const { error } = await supabase
        .from('products')
        .insert({
          name: data.name,
          price: data.price,
          description: data.description,
          stock: data.stock,
          store: data.store,
          categories: categoryToStore,
          featured: data.featured,
          features: data.features ? JSON.parse(`[${data.features.split('\n').map(f => `"${f.trim()}"`).join(',')}]`) : null,
          specification: specificationToStore ? JSON.parse(specificationToStore) : null,
          image_urls: imageUrls // CDN-optimized URLs
        });
        
      if (error) throw error;
      
      toast({
        title: "Product added successfully",
        description: `"${data.name}" has been added to your inventory with ${imageUrls.length} optimized image(s).`,
      });
      
      form.reset();
      clearImages();
      
      navigate('/supersmartkenyaadmin123/products');
      
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast({
        title: "Failed to add product",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSaveProduct = imageUrls.length > 0 || images.length === 0;
  const hasUnuploadedImages = images.length > 0 && imageUrls.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="ml-0 md:ml-64 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Add Product</h1>
            <p className="text-muted-foreground">Add a new product to your inventory</p>
          </div>
          
          <Button onClick={() => navigate('/supersmartkenyaadmin123/products')} variant="outline">
            Cancel
          </Button>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ProductBasicInfoForm form={form} />

            <ProductCategorySelect
              form={form}
              categories={categories}
              subcategories={subcategories}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              categoryName={categoryName}
              subcategoryName={subcategoryName}
              onCategoryChange={handleCategoryChange}
              onSubcategoryChange={handleSubcategoryChange}
            />

            <AdvancedProductForm form={form} />
            
            <ProductImageUpload
              images={images}
              uploadProgress={uploadProgress}
              isUploading={isUploading}
              onImageUpload={handleImageUpload}
              onRemoveImage={removeImage}
            />

            {/* Upload Images Button */}
            {images.length > 0 && imageUrls.length === 0 && (
              <div className="flex justify-center">
                <Button 
                  type="button"
                  onClick={handleUploadImages}
                  disabled={isUploading}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading Images...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Images
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Save Product Button */}
            {canSaveProduct && (
              <div className="flex justify-center">
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Product...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Save Product
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AdminProductAdd;
