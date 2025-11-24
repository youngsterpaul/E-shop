import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { ExportButton } from '@/components/admin/ExportButton';
import { BulkActionsBar } from '@/components/admin/BulkActionsBar';
import { EmptyState } from '@/components/admin/EmptyState';
import { DebouncedSearchInput } from '@/components/admin/DebouncedSearchInput';
import { CSVProductImportExport } from '@/components/admin/CSVProductImportExport';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Edit, Trash2, X, Check, Settings, ChevronDown, Package, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useCategories } from '@/hooks/useCategories';
import ProductVariantManagement from '@/components/admin/ProductVariantManagement';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface Product {
  product_id: string;
  name: string;
  price: number;
  stock: number;
  store: string;
  categories: string;
  featured: boolean;
  created_at: string;
  display_order: number;
  image_urls: string[] | null;
}

interface SortableRowProps {
  product: Product;
  isSelected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onManageVariants: () => void;
  formatDate: (date: string) => string;
}

const SortableRow = ({ product, isSelected, onToggle, onEdit, onDelete, onManageVariants, formatDate }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.product_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-8">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
        />
      </TableCell>
      <TableCell className="text-center text-muted-foreground">
        {product.display_order || 0}
      </TableCell>
      <TableCell>
        {product.image_urls && product.image_urls.length > 0 ? (
          <img 
            src={product.image_urls[0]} 
            alt={product.name}
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell>{product.categories}</TableCell>
      <TableCell>KSH {product.price?.toLocaleString()}</TableCell>
      <TableCell>
        <Badge variant={product.stock < 10 ? "destructive" : "secondary"}>
          {product.stock}
        </Badge>
      </TableCell>
      <TableCell>{product.store}</TableCell>
      <TableCell>
        {product.featured ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <X className="h-4 w-4 text-gray-400" />
        )}
      </TableCell>
      <TableCell>{formatDate(product.created_at)}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onManageVariants}
            title="Manage Variants"
          >
            <Settings size={14} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const AdminProductsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const { categories } = useCategories();
  const [showVariantsDialog, setShowVariantsDialog] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);
  
  const [displayedItemsCount, setDisplayedItemsCount] = useState(50);
  const itemsPerPage = 50;
  
  const categoryOptions = [{ id: 0, category: 'All Categories' }, ...categories];

  const handleEdit = (productId: string) => {
    navigate(`/supersmartkenyaadmin123/products/edit/${productId}`);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as Product[];
  };
  
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: fetchProducts
  });
  
  const filteredProducts = products.filter(product => {
    const searchMatch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Handle category filtering for "Category > Subcategory" format
    const categoryMatch = selectedCategory === 'All Categories' || 
      product.categories?.startsWith(selectedCategory) ||
      product.categories === selectedCategory;

    return searchMatch && categoryMatch;
  });

  const displayedProducts = filteredProducts.slice(0, displayedItemsCount);
  const hasMoreProducts = filteredProducts.length > displayedItemsCount;

  useEffect(() => {
    setDisplayedItemsCount(itemsPerPage);
    setSelectedProducts([]);
    setIsAllSelected(false);
  }, [searchQuery, selectedCategory, itemsPerPage]);

  const handleShowMore = () => {
    setDisplayedItemsCount(prev => prev + itemsPerPage);
  };

  const handleShowAll = () => {
    setDisplayedItemsCount(filteredProducts.length);
  };

  const handleShowLess = () => {
    setDisplayedItemsCount(itemsPerPage);
  };

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDeleteClick = () => {
    setProductToDelete(null);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (productToDelete) {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('product_id', productToDelete);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
      } else {
        const { error } = await supabase
          .from('products')
          .delete()
          .in('product_id', selectedProducts);

        if (error) throw error;

        toast({
          title: "Success",
          description: `${selectedProducts.length} products deleted successfully`,
        });

        setSelectedProducts([]);
        setIsAllSelected(false);
      }

      refetch();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting products:', error);
      toast({
        title: "Error",
        description: "Failed to delete products",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('product_id', selectedProducts);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedProducts.length} products deleted successfully`,
      });

      setSelectedProducts([]);
      setIsAllSelected(false);
      refetch();
    } catch (error) {
      console.error('Error deleting products:', error);
      toast({
        title: "Error",
        description: "Failed to delete products",
        variant: "destructive",
      });
    }
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProducts([]);
      setIsAllSelected(false);
    } else {
      setSelectedProducts(displayedProducts.map(p => p.product_id));
      setIsAllSelected(true);
    }
  };

  const handleSelectAll = () => {
    setSelectedProducts(displayedProducts.map(p => p.product_id));
    setIsAllSelected(true);
  };

  const handleDeselectAll = () => {
    setSelectedProducts([]);
    setIsAllSelected(false);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleManageVariants = (product: Product) => {
    setSelectedProductForVariants(product);
    setShowVariantsDialog(true);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = displayedProducts.findIndex((p) => p.product_id === active.id);
    const newIndex = displayedProducts.findIndex((p) => p.product_id === over.id);

    const reorderedProducts = arrayMove(displayedProducts, oldIndex, newIndex);

    // Update display_order for all affected products
    try {
      const updates = reorderedProducts.map((product, index) => ({
        product_id: product.product_id,
        display_order: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('products')
          .update({ display_order: update.display_order })
          .eq('product_id', update.product_id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Product order updated successfully",
      });

      refetch();
    } catch (error) {
      console.error('Error updating product order:', error);
      toast({
        title: "Error",
        description: "Failed to update product order",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <QuickActionsBar
        title="Products"
        onRefresh={() => refetch()}
        addNewPath="/supersmartkenyaadmin123/products/add"
        addNewLabel="Add Product"
      />

      <div className="mb-4">
        <CSVProductImportExport />
      </div>

      <div className="flex justify-end mb-4">
        <ExportButton
          data={filteredProducts}
          filename="products"
          headers={[
            { key: 'name', label: 'Product Name' },
            { key: 'price', label: 'Price' },
            { key: 'stock', label: 'Stock' },
            { key: 'categories', label: 'Category' },
            { key: 'store', label: 'Store' },
            { key: 'featured', label: 'Featured' },
          ]}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <DebouncedSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search products..."
                className="flex-1"
              />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat.id} value={cat.category}>
                      {cat.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products found"
              description={searchQuery || selectedCategory !== 'All Categories' 
                ? "Try adjusting your filters"
                : "Get started by adding your first product"
              }
              actionLabel="Add Product"
              onAction={() => navigate('/supersmartkenyaadmin123/products/add')}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead className="w-12">
                          <Checkbox 
                            checked={isAllSelected && displayedProducts.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="w-16 text-center">Order</TableHead>
                        <TableHead className="w-16">Image</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Store</TableHead>
                        <TableHead>Featured</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <SortableContext
                      items={displayedProducts.map((p) => p.product_id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <TableBody>
                        {displayedProducts.map((product) => (
                          <SortableRow
                            key={product.product_id}
                            product={product}
                            isSelected={selectedProducts.includes(product.product_id)}
                            onToggle={() => toggleProductSelection(product.product_id)}
                            onEdit={() => handleEdit(product.product_id)}
                            onDelete={() => handleDeleteClick(product.product_id)}
                            onManageVariants={() => handleManageVariants(product)}
                            formatDate={formatDate}
                          />
                        ))}
                      </TableBody>
                    </SortableContext>
                  </Table>
                </DndContext>
              </div>

              {filteredProducts.length > itemsPerPage && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 p-6 border-t bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    {hasMoreProducts && (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={handleShowMore}
                          className="flex items-center gap-2"
                        >
                          <ChevronDown className="h-4 w-4" />
                          Show More ({Math.min(itemsPerPage, filteredProducts.length - displayedItemsCount)} more)
                        </Button>
                        
                        {filteredProducts.length - displayedItemsCount > itemsPerPage && (
                          <Button 
                            variant="ghost" 
                            onClick={handleShowAll}
                            className="text-green-600 hover:text-green-700"
                          >
                            Show All ({filteredProducts.length})
                          </Button>
                        )}
                      </>
                    )}
                    
                    {!hasMoreProducts && displayedItemsCount > itemsPerPage && (
                      <Button 
                        variant="outline" 
                        onClick={handleShowLess}
                        className="flex items-center gap-2"
                      >
                        Show Less
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <BulkActionsBar
        selectedCount={selectedProducts.length}
        totalCount={displayedProducts.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDelete={handleBulkDelete}
        onExport={() => {
          const selected = displayedProducts.filter(p => selectedProducts.includes(p.product_id));
          const csv = [
            ['Name', 'Price', 'Stock', 'Category', 'Store'].join(','),
            ...selected.map(p => [p.name, p.price, p.stock, p.categories, p.store].join(','))
          ].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'selected-products.csv';
          a.click();
        }}
      />

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

      {selectedProductForVariants && (
        <Dialog open={showVariantsDialog} onOpenChange={setShowVariantsDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Manage Product Variants - {selectedProductForVariants.name}</DialogTitle>
            </DialogHeader>
            <ProductVariantManagement 
              productId={selectedProductForVariants.product_id}
              productName={selectedProductForVariants.name}
            />
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
};

export default AdminProductsPage;
