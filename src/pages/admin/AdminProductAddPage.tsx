
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdvancedProductForm from '@/components/admin/AdvancedProductForm';
import ProductBasicInfoForm from '@/components/admin/ProductBasicInfoForm';
import ProductCategorySelect from '@/components/admin/ProductCategorySelect';
import ProductImageUpload from '@/components/admin/ProductImageUpload';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';
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
      categories: '',
      featured: false,
      features: '',
      specification: '',
    },
  });

  const { categories, subcategories, setSubcategories, fetchSubcategories } = useCategories();
  const { images, imagePreview, handleImageUpload, removeImage, clearImages } = useImageUpload();
  
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
  
  const onSubmit = async (data: ProductFormData) => {
    if (!selectedCategory) {
      toast({
        title: "Missing information",
        description: "Please select a category.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const imageUrls = imagePreview;

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
          categories: categoryToStore,
          featured: data.featured,
          features: data.features ? JSON.parse(`[${data.features.split('\n').map(f => `"${f.trim()}"`).join(',')}]`) : null,
          specification: specificationToStore ? JSON.parse(specificationToStore) : null,
          image_urls: imageUrls
        });
        
      if (error) throw error;
      
      toast({
        title: "Product added successfully",
        description: `"${data.name}" has been added to your inventory.`,
      });
      
      form.reset();
      clearImages();
      
      navigate('/admin/products');
      
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="ml-0 md:ml-64 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Add Product</h1>
            <p className="text-muted-foreground">Add a new product to your inventory</p>
          </div>
          
          <Button onClick={() => navigate('/admin/products')} variant="outline">
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
              imagePreview={imagePreview}
              onImageUpload={handleImageUpload}
              onRemoveImage={removeImage}
            />
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="bg-orange-500 hover:bg-orange-600" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Save Product
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AdminProductAdd;
