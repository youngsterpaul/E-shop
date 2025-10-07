import { Routes, Route } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';
import React, { lazy, Suspense } from "react";
//import { Toaster } from "@/components/ui/toaster";
//import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminRoute from "@/components/AdminRoute";
import TopProgressBar from './components/TopProgressBar';
//import Header from './components/Header';

// Lazy load pages for better performance
const Auth = lazy(() => import("./pages/Auth"));
const Index = lazy(() => import("./pages/Index"));
const ProductDetailsPage = lazy(() => import("./pages/ProductDetailsPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const WriteReviewPage = lazy(() => import("./pages/WriteReviewPage"));

const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ReturnsPage = lazy(() => import("./pages/ReturnsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// New pages
const CareersPage = lazy(() => import("./pages/CareersPage"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminProductAddPage = lazy(() => import("./pages/admin/AdminProductAddPage"));
const AdminProductEditPage = lazy(() => import("./pages/admin/AdminProductEditPage"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/AdminCategoriesPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminUserAddPage = lazy(() => import("./pages/admin/AdminUserAddPage"));
const AdminUserEditPage = lazy(() => import("./pages/admin/AdminUserEditPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));

// Add the lazy import for CategoryPage
const CategoryPage = lazy(() => import("./pages/CategoryPage"));

function App() {
  return (
      <TooltipProvider>
      <TopProgressBar/>
      {/*<Sonner />*/}
      <div className="min-h-screen bg-background">
        <Suspense>
          <main id="main-content">
            <Routes>
            {/* Public Routes */}
            <Route path="auth" element={<Auth />} />
            <Route path="/" element={<Index />} />
            <Route path="/category" element={<CategoryPage />} />
            <Route path="/product/:productName/:id" element={<ProductDetailsPage />} />
            <Route path="/products/:productId/review" element={<WriteReviewPage />} />
            
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/order/:id" element={<OrderDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/returns" element={<ReturnsPage />} />
                    
            {/* New Pages */}
            <Route path="/careers" element={<CareersPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProductsPage /></AdminRoute>} />
            <Route path="/admin/products/add" element={<AdminRoute><AdminProductAddPage /></AdminRoute>} />
            <Route path="/admin/products/edit/:productId" element={<AdminRoute><AdminProductEditPage /></AdminRoute>} />
            <Route path="/admin/categories" element={<AdminRoute><AdminCategoriesPage /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrdersPage /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
            <Route path="/admin/users/add" element={<AdminRoute><AdminUserAddPage /></AdminRoute>} />
            <Route path="/admin/users/edit/:userId" element={<AdminRoute><AdminUserEditPage /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </Suspense>
        
      {/*<Toaster />*/}
      </div>
      </TooltipProvider>
  );
}

export default App;