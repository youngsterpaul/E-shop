import { Routes, Route } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';
import React, { lazy, Suspense } from "react";
//import { Toaster } from "@/components/ui/toaster";
//import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminRoute from "@/components/AdminRoute";
import TopProgressBar from './components/TopProgressBar';
import Header from './components/Header';
import Footer from './components/Footer';
import { isMobileUserAgent } from './hooks/use-mobile';
import MobileNav from '@/components/MobileNav';
import { MobileHeader } from './components/ui/mobile-header';
import { useLocation } from "react-router-dom";
import { ShoppingBag, Settings, LogOut } from "lucide-react";
import { useCartContext } from "@/contexts/CartContext";
import { Button } from '@/components/ui/button';

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
const AdminDailySalesPage = lazy(() => import("./pages/admin/AdminDailySalesPage"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminProductAddPage = lazy(() => import("./pages/admin/AdminProductAddPage"));
const AdminProductEditPage = lazy(() => import("./pages/admin/AdminProductEditPage"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/AdminCategoriesPage"));
const AdminStoresPage = lazy(() => import("./pages/admin/AdminStoresPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminUserAddPage = lazy(() => import("./pages/admin/AdminUserAddPage"));
const AdminUserEditPage = lazy(() => import("./pages/admin/AdminUserEditPage"));
const AdminHeroSlidesPage = lazy(() => import("./pages/admin/AdminHeroSlidesPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));

// Add the lazy import for CategoryPage
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const MobileCategoryPage = lazy(() => import("./pages/MobileCategoryPage"));

const isMobile = isMobileUserAgent();
const hideHeaderPaths = ["/auth"];
const { cartItems } = useCartContext();

const showMobileHeader = isMobile && !hideHeaderPaths.includes(location.pathname);

const getHeaderProps = () => {
  // Default title and no right action
  let title = "SmartKenya";
  let rightAction = (
    <Button variant="ghost" size="sm" className="p-2">
      <Settings className="h-4 w-4" />
    </Button>
    );

  if (location.pathname.startsWith("/cart")) {
    title = "Shopping Cart";
    rightAction = (
      <div className="flex items-center gap-1 text-sm text-gray-500">
        <ShoppingBag className="h-4 w-4" />
        <span>{cartItems.length}</span>
      </div>
    );
  } else if (location.pathname.startsWith("/about")) {
    title = "Our Story";
    rightAction = (
      <Button variant="ghost" size="sm" className="p-2">
        <Settings className="h-4 w-4" />
      </Button>
    );
  } else if (location.pathname.startsWith("/orders")) {
    title = "My Orders";
  } else if (location.pathname.startsWith("/returns")) {
    title = "Returns";
  } else if (location.pathname.startsWith("/terms")) {
    title = "Terms & Conditions";
  } else if (location.pathname.startsWith("/wishlist")) {
    title = "Wishlist";
  } else if (location.pathname.startsWith("/reviews")) {
    title = "Write Review";
      } else if (location.pathname.startsWith("/privacy")) {
    title = "Privacy";
      } else if (location.pathname.startsWith("/category")) {
    title = "Product Category";
      } else if (location.pathname.startsWith("/checkout")) {
    title = "Checkout";
      } else if (location.pathname.startsWith("/chat")) {
    title = "Customer Support";
      } else if (location.pathname.startsWith("/cart")) {
    title = "Shopping Cart";
     } else if (location.pathname.startsWith("/careers")) {
    title = "Careers"; 
      } else if (location.pathname.startsWith("/orders")) {
    title = "My Orders";
  } else if (location.pathname.startsWith("/profile")) {
    title = "My Profile";
  }

  return { title, rightAction };
};

const { title, rightAction } = getHeaderProps();


function App() {
  return (
      <TooltipProvider>
      <TopProgressBar/>
      {/*<Sonner />*/}
      {/* ✅ Use flex column to make footer stay at the bottom */}
      <div className="min-h-screen flex flex-col bg-background">
        {/* ✅ Header stays at top */}
        {!isMobile && <Header />}
        {showMobileHeader && <MobileHeader title={title} rightAction={rightAction} />}

        <Suspense fallback={<LoadingSpinner overlay text="Please wait..." />}>
          {/* main content fills available space */}
          <main id="main-content" className="flex-grow">
            <Routes>
            {/* Public Routes */}
            <Route path="auth" element={<Auth />} />
            <Route path="/" element={<Index />} />
            <Route path="/category/:categorySlug" element={<CategoryPage />} />
            <Route path="/category/:categorySlug/:subcategorySlug" element={<CategoryPage />} />
            <Route path="/category" element={<MobileCategoryPage />} /> 
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
            <Route path="/supersmartkenyaadmin123" element={<AdminRoute requiredRole="superadmin"><AdminDashboard /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/daily-sales" element={<AdminRoute requiredRole="superadmin"><AdminDailySalesPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/products" element={<AdminRoute requiredRole="admin"><AdminProductsPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/products/add" element={<AdminRoute requiredRole="admin"><AdminProductAddPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/products/edit/:productId" element={<AdminRoute requiredRole="admin"><AdminProductEditPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/categories" element={<AdminRoute requiredRole="superadmin"><AdminCategoriesPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/stores" element={<AdminRoute requiredRole="superadmin"><AdminStoresPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/orders" element={<AdminRoute requiredRole="superadmin"><AdminOrdersPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/users" element={<AdminRoute requiredRole="superadmin"><AdminUsersPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/users/add" element={<AdminRoute requiredRole="superadmin"><AdminUserAddPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/users/edit/:userId" element={<AdminRoute requiredRole="superadmin"><AdminUserEditPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/heroslides" element={<AdminRoute requiredRole="superadmin"><AdminHeroSlidesPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/settings" element={<AdminRoute requiredRole="superadmin"><AdminSettingsPage /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </Suspense>
        
      {/*<Toaster />*/}
      {/* ✅ Footer stays at bottom naturally (not fixed) */}
      {!isMobile && <Footer />}
      {isMobile && <MobileNav />}
      </div>
      </TooltipProvider>
  );
}

export default App;