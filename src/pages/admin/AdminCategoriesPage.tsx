import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { ExportButton } from '@/components/admin/ExportButton';
import { Loader2, ChevronDown, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CategoryForm from '@/components/admin/CategoryForm';
import CategoriesList from '@/components/admin/CategoryList';
import { useAdminCategories } from '@/hooks/useAdminCategories';

const AdminCategoriesPage = () => {
  const {
    categories,
    loading,
    isSubmitting,
    mainCategories,
    getSubcategories,
    handleAddCategory,
    handleEditCategory,
    handleDeleteCategory,
    handleReorderCategories
  } = useAdminCategories();

  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [displayedItemsCount, setDisplayedItemsCount] = useState(1);

  const displayedCategories = mainCategories.slice(0, displayedItemsCount);
  const hasMoreCategories = mainCategories.length > displayedItemsCount;

  useEffect(() => {
    setDisplayedItemsCount(itemsPerPage);
  }, [itemsPerPage]);

  const handleShowMore = () => {
    setDisplayedItemsCount(prev => prev + itemsPerPage);
  };

  const handleShowAll = () => {
    setDisplayedItemsCount(mainCategories.length);
  };

  const handleShowLess = () => {
    setDisplayedItemsCount(itemsPerPage);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <QuickActionsBar
        title="Categories"
        onRefresh={() => window.location.reload()}
      />

      <div className="flex justify-end mb-4">
        <ExportButton
          data={mainCategories}
          filename="categories"
          headers={[
            { key: 'category', label: 'Category Name' },
            { key: 'slug', label: 'Slug' },
            { key: 'icon_name', label: 'Icon' },
          ]}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CategoryForm
          categories={categories}
          onAddCategory={handleAddCategory}
          isSubmitting={isSubmitting}
        />

        <div data-categories-container>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Categories List</CardTitle>
                  <CardDescription>
                    Showing {displayedCategories.length} of {mainCategories.length} categories
                  </CardDescription>
                </div>
                
                {mainCategories.length > 1 && (
                  <Select 
                    value={itemsPerPage.toString()} 
                    onValueChange={(value) => setItemsPerPage(Number(value))}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 per page</SelectItem>
                      <SelectItem value="2">2 per page</SelectItem>
                      <SelectItem value="5">5 per page</SelectItem>
                      <SelectItem value="10">10 per page</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayedCategories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Tags className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No categories yet</p>
                  <p className="text-sm">Add your first category to get started</p>
                </div>
              ) : (
                <>
                  <CategoriesList 
                    mainCategories={displayedCategories}
                    onEdit={handleEditCategory}
                    onDelete={handleDeleteCategory}
                    onReorder={handleReorderCategories}
                    getSubcategories={getSubcategories}
                    isSubmitting={isSubmitting}
                  />
                  
                  {mainCategories.length > itemsPerPage && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t">
                      {hasMoreCategories && (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={handleShowMore}
                            className="flex items-center gap-2"
                          >
                            <ChevronDown className="h-4 w-4" />
                            Show More ({Math.min(itemsPerPage, mainCategories.length - displayedItemsCount)} more)
                          </Button>
                          
                          {mainCategories.length - displayedItemsCount > itemsPerPage && (
                            <Button 
                              variant="ghost" 
                              onClick={handleShowAll}
                            >
                              Show All ({mainCategories.length})
                            </Button>
                          )}
                        </>
                      )}
                      
                      {!hasMoreCategories && displayedItemsCount > itemsPerPage && (
                        <Button 
                          variant="outline" 
                          onClick={handleShowLess}
                        >
                          Show Less
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCategoriesPage;
