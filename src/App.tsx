import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from '@/pages';
import Product from '@/pages/Product';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Confirmation from '@/pages/Confirmation';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import { CartProvider } from '@/context/CartContext';
import { SelectiveCartProvider } from '@/context/SelectiveCartContext';
import { CheckoutProvider } from '@/context/CheckoutContext';
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
                  <Route path="/product/:productId" element={<Product />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/confirmation" element={<Confirmation />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<Admin />} />
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
