import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { ExportButton } from '@/components/admin/ExportButton';
import { SuperadminOnly } from '@/components/admin/SuperadminOnly';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, AlertTriangle, Package, TrendingDown, ShoppingCart, FileText, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  product_id: string;
  name: string;
  stock: number;
  reorder_point: number;
  price: number;
  categories: string;
}

interface Supplier {
  id: string;
  name: string;
}

const AdminInventoryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [displayedItemsCount, setDisplayedItemsCount] = useState(20);

  const { data: products, isLoading: productsLoading, refetch } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('product_id, name, stock, reorder_point, price, categories')
        .order('stock', { ascending: true });

      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;
      return data as Supplier[];
    },
  });

  const lowStockProducts = products?.filter(p => p.stock <= p.reorder_point) || [];
  const outOfStockProducts = products?.filter(p => p.stock === 0) || [];
  const criticalStockProducts = products?.filter(p => p.stock > 0 && p.stock <= (p.reorder_point * 0.5)) || [];

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (filterType) {
      case 'low':
        return matchesSearch && product.stock <= product.reorder_point;
      case 'critical':
        return matchesSearch && product.stock > 0 && product.stock <= (product.reorder_point * 0.5);
      case 'out':
        return matchesSearch && product.stock === 0;
      default:
        return matchesSearch;
    }
  }) || [];

  const displayedProducts = filteredProducts.slice(0, displayedItemsCount);
  const hasMoreProducts = filteredProducts.length > displayedItemsCount;

  const handleShowMore = () => {
    setDisplayedItemsCount(prev => Math.min(prev + 20, filteredProducts.length));
  };

  const handleShowAll = () => {
    setDisplayedItemsCount(filteredProducts.length);
  };

  const handleShowLess = () => {
    setDisplayedItemsCount(20);
  };

  const getStockStatus = (stock: number, reorderPoint: number) => {
    if (stock === 0) return { label: 'Out of Stock', variant: 'destructive' as const, icon: AlertTriangle };
    if (stock <= reorderPoint * 0.5) return { label: 'Critical', variant: 'destructive' as const, icon: TrendingDown };
    if (stock <= reorderPoint) return { label: 'Low Stock', variant: 'secondary' as const, icon: AlertTriangle };
    return { label: 'In Stock', variant: 'default' as const, icon: Package };
  };

  const totalInventoryValue = products?.reduce((sum, p) => sum + (p.stock * p.price), 0) || 0;

  return (
    <AdminLayout>
      <QuickActionsBar
        title="Inventory Management"
        onRefresh={refetch}
        customActions={
          <>
            <Link to="/admin/suppliers">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Suppliers
              </Button>
            </Link>
            <Link to="/admin/purchase-orders">
              <Button size="sm">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Purchase Orders
              </Button>
            </Link>
          </>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockProducts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSH {totalInventoryValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <SuperadminOnly>
        <div className="flex justify-end mb-4">
          <ExportButton
            data={filteredProducts}
            filename="inventory"
            headers={[
              { key: 'name', label: 'Product Name' },
              { key: 'stock', label: 'Current Stock' },
              { key: 'reorder_point', label: 'Reorder Point' },
              { key: 'price', label: 'Unit Price' },
              { key: 'categories', label: 'Category' },
            ]}
          />
        </div>
      </SuperadminOnly>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="critical">Critical Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {productsLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {displayedProducts.length} of {filteredProducts.length} products
              </div>
              <div className="space-y-3">
                {displayedProducts.map((product) => {
                  const status = getStockStatus(product.stock, product.reorder_point);
                  const StatusIcon = status.icon;
                  const stockPercentage = (product.stock / product.reorder_point) * 100;

                  return (
                    <Card key={product.product_id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold truncate">{product.name}</h3>
                              <Badge variant={status.variant} className="gap-1 shrink-0">
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">Stock:</span> {product.stock} units
                              </div>
                              <div>
                                <span className="font-medium">Reorder Point:</span> {product.reorder_point}
                              </div>
                              <div>
                                <span className="font-medium">Category:</span> {product.categories}
                              </div>
                            </div>

                            {/* Stock Level Bar */}
                            <div className="mt-2">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    stockPercentage > 100 ? 'bg-green-500' :
                                    stockPercentage > 50 ? 'bg-yellow-500' :
                                    stockPercentage > 0 ? 'bg-orange-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 shrink-0">
                            {product.stock <= product.reorder_point && (
                              <Link to={`/admin/purchase-orders/create?product=${product.product_id}`}>
                                <Button size="sm">
                                  <ShoppingCart className="h-4 w-4 mr-1" />
                                  Reorder
                                </Button>
                              </Link>
                            )}
                            <Link to={`/admin/products/edit/${product.product_id}`}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {filteredProducts.length > 20 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {displayedItemsCount} of {filteredProducts.length} products
                  </p>
                  <div className="flex gap-2">
                    {hasMoreProducts && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleShowMore}
                        >
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show More (20)
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleShowAll}
                        >
                          Show All ({filteredProducts.length})
                        </Button>
                      </>
                    )}
                    {displayedItemsCount > 20 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShowLess}
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
    </AdminLayout>
  );
};

export default AdminInventoryPage;