import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

interface ExistingImage {
  url: string;
  isExisting: true;
  index: number;
}

const AdminProductEdit = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
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
  const [loading, setLoading] = useState(true);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId, categories]);

  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory);
    } else {
      setSubcategories([]);
      setSelectedSubcategory('');
      setSubcategoryName('');
    }
  }, [selectedCategory]);

  const fetchProduct = async () => {
    if (!productId || categories.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (error) throw error;

      if (data) {
        // Set basic form data
        form.setValue('name', data.name);
        form.setValue('description', ''); // Description not in Row type, will be set during updates
        form.setValue('price', data.price || 0);
        form.setValue('stock', data.stock || 0);
        form.setValue('store', data.store || '');
        form.setValue('categories', data.categories || '');
        form.setValue('featured', data.featured || false);
        
        // Handle features
        if (data.features) {
          if (Array.isArray(data.features)) {
            form.setValue('features', data.features.join('\n'));
          } else if (typeof data.features === 'string') {
            form.setValue('features', data.features);
          }
        }
        
        // Handle specification
        if (data.specification) {
          if (typeof data.specification === 'object') {
            form.setValue('specification', JSON.stringify(data.specification, null, 2));
          } else {
            form.setValue('specification', String(data.specification));
          }
        }

        // Handle categories - parse the category string and find matching IDs
        if (data.categories) {
          const categoryParts = data.categories.split(' > ');
          const mainCategoryName = categoryParts[0];
          const subCategoryName = categoryParts[1];

          // Find main category
          const foundCategory = categories.find(cat => 
            cat.category.toLowerCase() === mainCategoryName.toLowerCase() && cat.parent_id === null
          );
          
          if (foundCategory) {
            setSelectedCategory(foundCategory.id);
            setCategoryName(foundCategory.category);
            
            // If there's a subcategory, fetch subcategories and find it
            if (subCategoryName) {
              const { data: subcategoriesData } = await supabase
                .from('categories')
                .select('id, category, parent_id')
                .eq('parent_id', parseInt(foundCategory.id));
              
              if (subcategoriesData) {
                const formattedSubcategories = subcategoriesData.map(sub => ({
                  id: sub.id.toString(),
                  name: sub.category,
                  category: sub.category,
                  parent_id: sub.parent_id?.toString() || ''
                }));
                setSubcategories(formattedSubcategories);
                
                const foundSubcategory = formattedSubcategories.find(sub => 
                  sub.category.toLowerCase() === subCategoryName.toLowerCase()
                );
                
                if (foundSubcategory) {
                  setSelectedSubcategory(foundSubcategory.id);
                  setSubcategoryName(foundSubcategory.category);
                }
              }
            }
          }
        }

        // Handle images - convert existing images to the format expected by the component
        if (data.image_urls && Array.isArray(data.image_urls)) {
          const existingImagesData = data.image_urls.map((url: string, index: number) => ({
            url,
            isExisting: true as const,
            index
          }));
          setExistingImages(existingImagesData);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Failed to load product",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter(img => img.index !== index));
  };

  const handleUploadImages = async () => {
    if (images.length === 0) {
      toast({
        title: "No new images selected",
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

    // Check if we have new images but haven't uploaded them yet
    if (images.length > 0 && imageUrls.length === 0) {
      toast({
        title: "Images not uploaded",
        description: "Please upload your new images first before saving the product.",
        variant: "destructive"
      });
      return;
    }

    // Must have at least one image (existing or new)
    const totalImages = existingImages.length + imageUrls.length;
    if (totalImages === 0) {
      toast({
        title: "No images",
        description: "Please add at least one image to the product.",
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
      
      // Combine existing images that weren't removed with newly uploaded images
      const finalImageUrls = [
        ...existingImages.map(img => img.url),
        ...imageUrls
      ];
      
      const { error } = await supabase
        .from('products')
        .update({
          name: data.name,
          price: data.price,
          description: data.description,
          stock: data.stock,
          store: data.store,
          categories: categoryToStore,
          featured: data.featured,
          features: data.features ? JSON.parse(`[${data.features.split('\n').map(f => `"${f.trim()}"`).join(',')}]`) : null,
          specification: specificationToStore ? JSON.parse(specificationToStore) : null,
          image_urls: finalImageUrls,
          updated_at: new Date().toISOString()
        })
        .eq('product_id', productId || '');
        
      if (error) throw error;
      
      toast({
        title: "Product updated successfully",
        description: `"${data.name}" has been updated with ${finalImageUrls.length} image(s).`,
      });
      
      navigate('/supersmartkenyaadmin123/products');
      
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalImages = existingImages.length + imageUrls.length;
  const canSaveProduct = (images.length === 0 || imageUrls.length > 0) && totalImages > 0;
  const hasUnuploadedImages = images.length > 0 && imageUrls.length === 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="ml-0 md:ml-64 p-4 md:p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg flex items-center">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading product...
            </div>
          </div>
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
            <h1 className="text-2xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground">Update product information</p>
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
              existingImages={existingImages}
              onRemoveExistingImage={handleRemoveExistingImage}
              isEditMode={true}
            />

            {/* Upload New Images Button */}
            {hasUnuploadedImages && (
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
                      Uploading New Images...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload New Images ({images.length})
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Update Product Button */}
            {canSaveProduct && (
              <div className="flex justify-center">
                <Button 
                  type="submit" 
                  className="bg-green-500 hover:bg-green-600" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Product...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Update Product ({totalImages} image{totalImages !== 1 ? 's' : ''})
                    </>
                  )}
                </Button>
              </div>
            )}

            {totalImages === 0 && (
              <div className="text-center text-red-500 text-sm">
                Please add at least one image to the product
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AdminProductEdit;
