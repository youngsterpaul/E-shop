import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import ProductDetailsPage from '@/pages/ProductDetailsPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import { CartProvider } from '@/contexts/CartContext';
import { SelectiveCartProvider } from '@/contexts/SelectiveCartContext';
import { CheckoutProvider } from '@/contexts/CheckoutContext';
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import OptimizedProductsPage from '@/pages/OptimizedProductsPage';
import SearchPage from '@/pages/SearchPage';
import ProductsPage from './pages/ProductsPage';

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <CartProvider>
          <SelectiveCartProvider>
            <CheckoutProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/category" element={<OptimizedProductsPage />} />
                  <Route path="/product/:productId" element={<ProductDetailsPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/search" element={<SearchPage />} />
                </Routes>
              </BrowserRouter>
            </CheckoutProvider>
          </SelectiveCartProvider>
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
