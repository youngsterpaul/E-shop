
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { useIsMobile } from '@/hooks/use-mobile';

const ProductDetailsPage = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Product Details</h1>
        <p className="text-muted-foreground">Product details will be implemented here.</p>
      </main>
      <Footer />
      {isMobile && <MobileNav />}
    </div>
  );
};

export default ProductDetailsPage;
