
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Search, Plus, Edit, Trash2, FileUp, X, Check, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useCategories } from '@/hooks/useCategories';
import ProductVariantManagement from '@/components/admin/ProductVariantManagement';

interface Product {
  product_id: string;
  name: string;
  price: number;
  stock: number;
  categories: string;
  featured: boolean;
  created_at: string;
}

const AdminProductsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const { categories } = useCategories();
    const [showVariantsDialog, setShowVariantsDialog] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);
  const categoryOptions = [{ id: 0, category: 'All Categories' }, ...categories];

  const handleEdit = (productId: string) => {
    navigate(`/admin/products/edit/${productId}`);
  };

  // Fetch products from database
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as Product[];
  };
  
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: fetchProducts
  });
  
  // Apply filtering
  const filteredProducts = products.filter(product => {
    const searchMatch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase());

    // If "All Categories" is selected, include all products
    const categoryMatch = selectedCategory === 'All Categories' || 
      product.categories === selectedCategory;

    return searchMatch && categoryMatch;
  });
  
  // Handle bulk selection
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(product => product.product_id));
    }
    setIsAllSelected(!isAllSelected);
  };
  
  const toggleSelectProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };
  
  // Handle delete
  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setIsDeleteDialogOpen(true);
  };
  
  const handleBulkDeleteClick = () => {
    setProductToDelete(null); // null means bulk delete
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    try {
      if (productToDelete !== null) {
        // Single delete
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('product_id', productToDelete);
          
        if (error) throw error;
        
        toast({
          title: "Product deleted",
          description: "The product has been successfully deleted.",
        });
      } else {
        // Bulk delete
        const { error } = await supabase
          .from('products')
          .delete()
          .in('product_id', selectedProducts);
          
        if (error) throw error;
        
        toast({
          title: "Products deleted",
          description: `${selectedProducts.length} products have been successfully deleted.`,
        });
        setSelectedProducts([]);
      }
      
      refetch(); // Refresh the data
    } catch (error: any) {
      console.error('Error deleting products:', error);
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleManageVariants = (product: Product) => {
    setSelectedProductForVariants(product);
    setShowVariantsDialog(true);
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Categories');
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(price);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="ml-0 md:ml-64 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="text-muted-foreground">Manage your product inventory</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap md:flex-nowrap gap-3">
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => navigate('/admin/products/add')}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
            
            <Button 
              variant="outline" 
              disabled={selectedProducts.length === 0}
              onClick={handleBulkDeleteClick}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
            </Button>
            
            <Button variant="outline">
              <FileUp className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Search products..." 
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(cat => (
                    <SelectItem key={cat.id} value={cat.category}>
                      {cat.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>
              {filteredProducts.length} products found
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={isAllSelected && filteredProducts.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="h-4 w-4 skeleton" />
                        </TableCell>
                        <TableCell><div className="h-5 w-32 skeleton" /></TableCell>
                        <TableCell><div className="h-5 w-20 skeleton" /></TableCell>
                        <TableCell><div className="h-5 w-16 skeleton" /></TableCell>
                        <TableCell><div className="h-5 w-12 skeleton" /></TableCell>
                        <TableCell><div className="h-5 w-16 skeleton" /></TableCell>
                        <TableCell><div className="h-5 w-24 skeleton" /></TableCell>
                        <TableCell className="text-right"><div className="h-8 w-16 ml-auto skeleton" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <p className="text-muted-foreground">No products found</p>
                        <Button variant="link" className="mt-2" onClick={resetFilters}>
                          Reset filters
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.product_id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedProducts.includes(product.product_id)}
                            onCheckedChange={() => toggleSelectProduct(product.product_id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{product.name}</div>
                        </TableCell>
                        <TableCell>{product.categories || 'Uncategorized'}</TableCell>
                        <TableCell>{formatPrice(product.price)}</TableCell>
                        <TableCell>
                          <span className={product.stock <= 10 ? 'text-red-600 font-medium' : ''}>
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell>
                          {product.featured ? (
                            <Badge className="bg-orange-500">Featured</Badge>
                          ) : (
                            <Badge variant="secondary">Regular</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(product.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleManageVariants(product)}
                              title="Manage Variants"
                            >
                              <Settings size={14} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(product.product_id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteClick(product.product_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {productToDelete === null
                ? `Are you sure you want to delete ${selectedProducts.length} selected products? This action cannot be undone.`
                : "Are you sure you want to delete this product? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Variants Management Dialog */}
      <Dialog open={showVariantsDialog} onOpenChange={setShowVariantsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Product Variants</DialogTitle>
          </DialogHeader>
          {selectedProductForVariants && (
            <ProductVariantManagement 
              productId={selectedProductForVariants.product_id}
              productName={selectedProductForVariants.name}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProductsPage;
