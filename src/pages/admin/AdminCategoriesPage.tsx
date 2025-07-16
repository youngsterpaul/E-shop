

import AdminSidebar from '@/components/admin/AdminSidebar';
import { Loader2 } from 'lucide-react';
import CategoryForm from '@/components/admin/CategoryFor';
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

          <CategoriesList
            mainCategories={mainCategories}
            getSubcategories={getSubcategories}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminCategoriesPage;
