import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Loader2, ChevronDown } from 'lucide-react';
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
    handleDeleteCategory
  } = useAdminCategories();

  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [displayedItemsCount, setDisplayedItemsCount] = useState(10);

  // Get categories to display (with pagination)
  const displayedCategories = mainCategories.slice(0, displayedItemsCount);
  const hasMoreCategories = mainCategories.length > displayedItemsCount;

  // Reset displayed items when itemsPerPage changes
  useEffect(() => {
    setDisplayedItemsCount(itemsPerPage);
  }, [itemsPerPage]);

  // Handle "Show More" button
  const handleShowMore = () => {
    setDisplayedItemsCount(prev => prev + itemsPerPage);
  };

  // Handle "Show All" button
  const handleShowAll = () => {
    setDisplayedItemsCount(mainCategories.length);
  };

  // Handle "Show Less" button
  const handleShowLess = () => {
    setDisplayedItemsCount(itemsPerPage);
    // Scroll to top of categories list
    document.querySelector('[data-categories-container]')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="ml-0 md:ml-64 p-4 md:p-6">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
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
            <h1 className="text-2xl font-bold">Categories</h1>
            <p className="text-muted-foreground">Manage product categories and subcategories</p>
          </div>
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
                  
                  {mainCategories.length > 10 && (
                    <Select 
                      value={itemsPerPage.toString()} 
                      onValueChange={(value) => setItemsPerPage(Number(value))}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 per page</SelectItem>
                        <SelectItem value="25">25 per page</SelectItem>
                        <SelectItem value="50">50 per page</SelectItem>
                        <SelectItem value="100">100 per page</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <CategoriesList
                  mainCategories={displayedCategories}
                  getSubcategories={getSubcategories}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  isSubmitting={isSubmitting}
                />

                {/* Pagination Controls */}
                {mainCategories.length > itemsPerPage && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 mt-6 border-t">
                    <div className="flex items-center gap-2">
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
                              className="text-green-600 hover:text-green-700"
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
                          className="flex items-center gap-2"
                        >
                          Show Less
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCategoriesPage;