import React from 'react';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import SiteBreadcrumb from '@/components/Breadcrumb';

const ReturnsPage = () => {
  const isMobile = isMobileUserAgent();

  return (
    <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
      <main className={`${!isMobile ? 'max-w-[1400px] mx-auto px-4 lg:px-6 py-8' : 'px-4 py-8 pb-24'}`}>
        <SiteBreadcrumb 
          items={[
            { label: 'Home', href: '/' },
            { label: 'Returns Policy' }
          ]}
          className="mb-6"
        />

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-6">Returns Policy</h1>
          
          <Card className="border-border/50 shadow-sm mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Our Return Policy</h2>
              <p className="mb-4 text-muted-foreground">
                At SmartKenya, we want you to be completely satisfied with your purchase. If you're not happy with your order for any reason, you can return most items within 7 days of delivery for a full refund or exchange.
              </p>
              <p className="text-muted-foreground">
                Please read the detailed guidelines below to understand our returns process, conditions, and exceptions.
              </p>
            </CardContent>
          </Card>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Return Conditions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-green-500/5 border-green-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg text-foreground">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    Eligible for Return
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                    <li>Unopened items in original packaging</li>
                    <li>Defective or damaged products</li>
                    <li>Items that don't match the description</li>
                    <li>Incorrect items received</li>
                    <li>Most clothing and accessories (unworn)</li>
                    <li>Electronics within 7 days (if unopened or defective)</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-red-500/5 border-red-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg text-foreground">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    Not Eligible for Return
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                    <li>Personal care items and cosmetics (opened)</li>
                    <li>Underwear, swimwear, and socks</li>
                    <li>Perishable goods (food and beverages)</li>
                    <li>Gift cards and digital products</li>
                    <li>Made-to-order or customized items</li>
                    <li>Items marked as "Final Sale" or "Non-Returnable"</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-muted/50 border-border/50 mb-6">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-medium mb-1 text-foreground">Special Conditions for Electronics</h3>
                    <p className="text-sm text-muted-foreground">
                      Electronics may be returned within 7 days if defective. A 15% restocking fee may apply for non-defective electronics that have been opened. All electronics must include all original packaging, accessories, and manuals.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Return Process</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-border/50 text-center">
                <CardContent className="p-6">
                  <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <span className="font-bold text-primary text-lg">1</span>
                  </div>
                  <h3 className="font-medium mb-2 text-foreground">Request a Return</h3>
                  <p className="text-sm text-muted-foreground">
                    Log into your account, go to "My Orders," and select "Request Return" for the specific item.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 text-center">
                <CardContent className="p-6">
                  <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <span className="font-bold text-primary text-lg">2</span>
                  </div>
                  <h3 className="font-medium mb-2 text-foreground">Package the Item</h3>
                  <p className="text-sm text-muted-foreground">
                    Securely pack the item in its original packaging with all tags, accessories, and manuals.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 text-center">
                <CardContent className="p-6">
                  <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <span className="font-bold text-primary text-lg">3</span>
                  </div>
                  <h3 className="font-medium mb-2 text-foreground">Ship or Drop Off</h3>
                  <p className="text-sm text-muted-foreground">
                    Use our return shipping label or drop off at designated return locations.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-medium mb-2 text-foreground">After We Receive Your Return</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Once we receive and inspect your return, we'll process it within 3-5 business days. You'll receive an email notification when your refund has been processed.
                </p>
                <h4 className="font-medium text-sm mb-2 text-foreground">Refund Timeframes:</h4>
                <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                  <li>M-Pesa: 1-2 business days</li>
                  <li>Credit/Debit Cards: 5-10 business days</li>
                  <li>Bank Transfers: 5-7 business days</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 text-center">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-3 text-foreground">Need Help with a Return?</h3>
              <p className="text-muted-foreground mb-6">
                Our customer support team is ready to assist you with any questions about returns or exchanges.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button onClick={() => window.location.href = "/contact"}>
                  Contact Support
                </Button>
                <Button variant="outline" onClick={() => window.location.href = "/faq"}>
                  View FAQs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ReturnsPage;
