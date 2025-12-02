import { Routes, Route, Link } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';
import React, { lazy, Suspense, ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminRoute from "@/components/AdminRoute";
import TopProgressBar from './components/TopProgressBar';
import Header from './components/Header';
import Footer from './components/Footer';
import { isMobileUserAgent } from './hooks/use-mobile';
import MobileNav from '@/components/MobileNav';
import { MobileHeader } from './components/ui/mobile-header';
import { useLocation } from "react-router-dom";
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Heart, LogOut, Search, Settings, ShoppingCart } from 'lucide-react';
import { useCartContext } from '@/contexts/CartContext';
import SecurityHeaders from './components/SecurityHeaders';
import { useSessionTimeout } from './hooks/useSessionTimeout';

// Lazy load pages for better performance
const Auth = lazy(() => import("./pages/Auth"));
const VerifyOTP = lazy(() => import("./pages/VerifyOTP"));
const VerifyPasswordResetOTP = lazy(() => import("./pages/VerifyPasswordResetOTP"));
const MFASetup = lazy(() => import("./pages/MFASetup"));
const Index = lazy(() => import("./pages/Index"));
const ProductDetailsPage = lazy(() => import("./pages/ProductDetailsPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const WriteReviewPage = lazy(() => import("./pages/WriteReviewPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ReturnsPage = lazy(() => import("./pages/ReturnsPage"));
const CustomerReturnsPage = lazy(() => import("./pages/CustomerReturnsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// New pages
const CareersPage = lazy(() => import("./pages/CareersPage"));
const LoyaltyPage = lazy(() => import("./pages/LoyaltyPage"));
const RewardsPage = lazy(() => import("./pages/RewardsPage"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminDailySalesPage = lazy(() => import("./pages/admin/AdminDailySalesPage"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminProductAddPage = lazy(() => import("./pages/admin/AdminProductAddPage"));
const AdminProductEditPage = lazy(() => import("./pages/admin/AdminProductEditPage"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/AdminCategoriesPage"));
const AdminStoresPage = lazy(() => import("./pages/admin/AdminStoresPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminUserAddPage = lazy(() => import("./pages/admin/AdminUserAddPage"));
const AdminUserEditPage = lazy(() => import("./pages/admin/AdminUserEditPage"));
const AdminHeroSlidesPage = lazy(() => import("./pages/admin/AdminHeroSlidesPage"));
const AdminLocationsPage = lazy(() => import("./pages/admin/AdminLocationsPage"));
const AdminSecurityAlertsPage = lazy(() => import("./pages/admin/AdminSecurityAlertsPage"));
const AdminLoginAuditPage = lazy(() => import("./pages/admin/AdminLoginAuditPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));
const AdminActivityLogPage = lazy(() => import("./pages/admin/AdminActivityLogPage"));
const AdminReviewsPage = lazy(() => import("./pages/admin/AdminReviewsPage"));
const AdminDiscountsPage = lazy(() => import("./pages/admin/AdminDiscountsPage"));
const AdminFlashSalesPage = lazy(() => import("./pages/admin/AdminFlashSalesPage"));
const AdminReportsPage = lazy(() => import("./pages/admin/AdminReportsPage"));
const AdminReturnsPage = lazy(() => import("./pages/admin/AdminReturnsPage"));
const AdminEmailTemplatesPage = lazy(() => import("./pages/admin/AdminEmailTemplatesPage"));
const AdminRevenueDashboardPage = lazy(() => import("./pages/admin/AdminRevenueDashboardPage"));
const AdminSuppliersPage = lazy(() => import("./pages/admin/AdminSuppliersPage"));
const AdminInventoryPage = lazy(() => import("./pages/admin/AdminInventoryPage"));
const AdminPurchaseOrdersPage = lazy(() => import("./pages/admin/AdminPurchaseOrdersPage"));
const AdminPurchaseOrderCreatePage = lazy(() => import("./pages/admin/AdminPurchaseOrderCreatePage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminCustomersPage = lazy(() => import("./pages/admin/AdminCustomersPage"));
const AdminCustomerViewPage = lazy(() => import("./pages/admin/AdminCustomerViewPage"));
const AdminAnalyticsPage = lazy(() => import("./pages/admin/AdminAnalyticsPage"));
const AdminCategoryIconsPage = lazy(() => import("./pages/admin/AdminCategoryIconsPage"));
const AdminContactPage = lazy(() => import("./pages/admin/AdminContactPage"));
const AdminCareersPage = lazy(() => import("./pages/admin/AdminCareersPage"));

// Add the lazy import for CategoryPage
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const MobileCategoryPage = lazy(() => import("./pages/MobileCategoryPage"));
const FlashSalePage = lazy(() => import("./pages/FlashSalePage"));
function App() {
  const {
    user,
    profile,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Enable session timeout for authenticated users
  useSessionTimeout();
  const isMobile = isMobileUserAgent();
  const isAdminRoute = location.pathname.startsWith("/supersmartkenyaadmin123");
  const isAuthRoute = location.pathname.startsWith("/auth");

  // ✅ define handleLogout inside App so it’s in scope
  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };
  let totalItems = 0;
  try {
    const {
      cartItems
    } = useCartContext();
    totalItems = cartItems?.reduce((total, item) => total + item.quantity, 0) ?? 0;
  } catch {
    totalItems = 0;
  }

  // ✅ move getHeaderProps inside App and remove type Location
  const getHeaderProps = () => {
    let title = "";
    let backTo = "/";
    let rightAction: ReactNode = null;
    if (location.pathname.startsWith("/account")) {
      title = "Account";
      rightAction = <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>;
    } else if (location.pathname.startsWith("/product")) {
      title = "Product Details";
      rightAction = <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/search')} variant="ghost" size="sm" className="p-2">
              <Search className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate('/wishlist')} variant="ghost" size="sm" className="p-2">
              <Heart className="h-4 w-4" />
            </Button>
            <Link to="/cart" aria-label="View Cart" className="relative text-gray-700 hover:text-primary transition-colors p-2">
              <ShoppingCart size={16} />
              {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>}
            </Link>
          </div>;
    } else if (location.pathname.startsWith("/category")) {
      title = "Product Category";
    } else if (location.pathname.startsWith("/orders")) {
      title = "My Orders";
    } else if (location.pathname.startsWith("/order")) {
      title = "Order Detail";
    } else if (location.pathname.startsWith("/about")) {
      title = "About Smartkenya";
    } else if (location.pathname.startsWith("/faq")) {
      title = "Faqs";
    } else if (location.pathname.startsWith("/contact")) {
      title = "Contact Us";
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
      title = "Place Order";
    } else if (location.pathname.startsWith("/chat")) {
      title = "Customer Support";
    } else if (location.pathname.startsWith("/cart")) {
      title = "Shopping Cart";
    } else if (location.pathname.startsWith("/careers")) {
      title = "Careers";
    } else if (location.pathname.startsWith("/profile")) {
      title = "My Profile";
    }
    return {
      title,
      backTo,
      rightAction
    };
  };
  const {
    title,
    backTo,
    rightAction
  } = getHeaderProps();

  // Enable session timeout for authenticated users
  useSessionTimeout();
  return <TooltipProvider>
      <SecurityHeaders />
      <TopProgressBar />
      {/*<Sonner />*/}
      {/* ✅ Use flex column to make footer stay at the bottom */}
      <div className="flex flex-col min-h-screen bg-white">
        {/* ✅ Header stays at top */}
        {!isMobile && !isAdminRoute && !isAuthRoute && <Header />}
        {isMobile && !isAdminRoute && !isAuthRoute && <MobileHeader title={title} backTo={backTo} rightAction={rightAction} />}

        <Suspense fallback={<LoadingSpinner overlay text="Please wait..." />}>
          {/* main content fills available space */}
          <main id="main-content" className="flex-grow">
            <Routes>
            {/* Public Routes */}
            <Route path="auth" element={<Auth />} />
            <Route path="verify-otp" element={<VerifyOTP />} />
            <Route path="verify-password-reset-otp" element={<VerifyPasswordResetOTP />} />
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
            <Route path="/mfa-setup" element={<MFASetup />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/my-returns" element={<CustomerReturnsPage />} />
                    
            {/* New Pages */}
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/loyalty" element={<LoyaltyPage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/flash-sale" element={<FlashSalePage />} />

            {/* Admin Routes */}
            <Route path="/supersmartkenyaadmin123" element={<AdminRoute requiredRole="moderator"><AdminDashboard /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/daily-sales" element={<AdminRoute requiredRole="superadmin"><AdminDailySalesPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/products" element={<AdminRoute requiredRole="moderator"><AdminProductsPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/products/add" element={<AdminRoute requiredRole="moderator"><AdminProductAddPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/products/edit/:productId" element={<AdminRoute requiredRole="moderator"><AdminProductEditPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/categories" element={<AdminRoute requiredRole="superadmin"><AdminCategoriesPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/category-icons" element={<AdminRoute requiredRole="superadmin"><AdminCategoryIconsPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/stores" element={<AdminRoute requiredRole="admin"><AdminStoresPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/orders" element={<AdminRoute requiredRole="moderator"><AdminOrdersPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/users" element={<AdminRoute requiredRole="superadmin"><AdminUsersPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/users/add" element={<AdminRoute requiredRole="superadmin"><AdminUserAddPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/users/edit/:userId" element={<AdminRoute requiredRole="superadmin"><AdminUserEditPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/heroslides" element={<AdminRoute requiredRole="admin"><AdminHeroSlidesPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/locations" element={<AdminRoute requiredRole="superadmin"><AdminLocationsPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/security-alerts" element={<AdminRoute requiredRole="superadmin"><AdminSecurityAlertsPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/login-audit" element={<AdminRoute requiredRole="superadmin"><AdminLoginAuditPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/settings" element={<AdminRoute requiredRole="superadmin"><AdminSettingsPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/activity-log" element={<AdminRoute requiredRole="superadmin"><AdminActivityLogPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/suppliers" element={<AdminRoute requiredRole="admin"><AdminSuppliersPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/inventory" element={<AdminRoute requiredRole="admin"><AdminInventoryPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/purchase-orders" element={<AdminRoute requiredRole="admin"><AdminPurchaseOrdersPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/purchase-orders/create" element={<AdminRoute requiredRole="admin"><AdminPurchaseOrderCreatePage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/reviews" element={<AdminRoute requiredRole="moderator"><AdminReviewsPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/discounts" element={<AdminRoute requiredRole="admin"><AdminDiscountsPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/flash-sales" element={<AdminRoute requiredRole="admin"><AdminFlashSalesPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/reports" element={<AdminRoute requiredRole="admin"><AdminReportsPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/returns" element={<AdminRoute requiredRole="admin"><AdminReturnsPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/email-templates" element={<AdminRoute requiredRole="admin"><AdminEmailTemplatesPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/revenue-dashboard" element={<AdminRoute requiredRole="admin"><AdminRevenueDashboardPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/customers" element={<AdminRoute requiredRole="superadmin"><AdminCustomersPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/customers/:customerId" element={<AdminRoute requiredRole="superadmin"><AdminCustomerViewPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/analytics" element={<AdminRoute requiredRole="superadmin"><AdminAnalyticsPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/contact" element={<AdminRoute requiredRole="superadmin"><AdminContactPage /></AdminRoute>} />
            <Route path="/supersmartkenyaadmin123/careers" element={<AdminRoute requiredRole="admin"><AdminCareersPage /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </Suspense>
        
      {/*<Toaster />*/}
      {/* ✅ Footer stays at bottom naturally (not fixed) */}
      {isMobile && isAuthRoute && <div className="text-center text-xs text-gray-400 py-3 border-t border-gray-100 bg-white left-0 right-0 mt-8">
        © 2025 SmartKenya. All rights reserved.
      </div>}
      {!isMobile && <Footer />}
      {isMobile && <MobileNav />}
      </div>
      </TooltipProvider>;
}
export default App;