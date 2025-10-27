<<<<<<< HEAD

import React from 'react';
import Header from '@/components/Header';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, HelpCircle, Settings } from 'lucide-react';
import { MobileHeader } from '@/components/ui/mobile-header';

const ReturnsPage = () => {
  const isMobile = isMobileUserAgent();

  return (
    <div className={`min-h-screen ${!isMobile ? 'min-w-max' : ''}`}>
      {isMobile && (
        <MobileHeader 
          title={'Returns'}
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
      )}
      <main className={`flex-grow mx-auto px-4 container py-8 ${!isMobile ? 'xl:px-24' : ''}`}>
        <div className="/max-w-3xl mx-auto /px-4">
          <h1 className="text-3xl font-bold mb-6">Returns Policy</h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Our Return Policy</h2>
            <p className="mb-4">
              At SmartKenya, we want you to be completely satisfied with your purchase. If you're not happy with your order for any reason, you can return most items within 7 days of delivery for a full refund or exchange.
            </p>
            <p>
              Please read the detailed guidelines below to understand our returns process, conditions, and exceptions.
            </p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Return Conditions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-green-50 border-green-100">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    Eligible for Return
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Unopened items in original packaging</li>
                    <li>Defective or damaged products</li>
                    <li>Items that don't match the description</li>
                    <li>Incorrect items received</li>
                    <li>Most clothing and accessories (unworn)</li>
                    <li>Electronics within 7 days (if unopened or defective)</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-red-50 border-red-100">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    Not Eligible for Return
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
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
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-md font-medium mb-1">Special Conditions for Electronics</h3>
                  <p className="text-sm text-gray-700">
                    Electronics may be returned within 7 days if defective. A 15% restocking fee may apply for non-defective electronics that have been opened. All electronics must include all original packaging, accessories, and manuals.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Return Process</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="bg-orange-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-orange-500">1</span>
                </div>
                <h3 className="font-medium mb-2">Request a Return</h3>
                <p className="text-sm text-gray-600">
                  Log into your account, go to "My Orders," and select "Request Return" for the specific item.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="bg-orange-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-orange-500">2</span>
                </div>
                <h3 className="font-medium mb-2">Package the Item</h3>
                <p className="text-sm text-gray-600">
                  Securely pack the item in its original packaging with all tags, accessories, and manuals.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="bg-orange-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-orange-500">3</span>
                </div>
                <h3 className="font-medium mb-2">Ship or Drop Off</h3>
                <p className="text-sm text-gray-600">
                  Use our return shipping label or drop off at designated return locations.
                </p>
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
              <h3 className="font-medium mb-2">After We Receive Your Return</h3>
              <p className="text-sm text-gray-700 mb-3">
                Once we receive and inspect your return, we'll process it within 3-5 business days. You'll receive an email notification when your refund has been processed.
              </p>
              <h4 className="font-medium text-sm mb-1">Refund Timeframes:</h4>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                <li>M-Pesa: 1-2 business days</li>
                <li>Credit/Debit Cards: 5-10 business days</li>
                <li>Bank Transfers: 5-7 business days</li>
              </ul>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Exchanges</h2>
            <p className="mb-4">
              If you'd like to exchange an item rather than request a refund, you can select "Exchange" instead of "Return" when initiating your return request. Exchanges are subject to product availability.
            </p>
            <p>
              For size or color exchanges of clothing items, we recommend selecting the "Exchange" option to streamline the process and avoid having to place a new order.
            </p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Return Shipping Costs</h2>
            <p className="mb-4">
              Return shipping costs are typically the responsibility of the customer, except in the following cases:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>The item received was defective or damaged</li>
              <li>The item received was incorrect (not what you ordered)</li>
              <li>The item doesn't match its description on our website</li>
            </ul>
            <p>
              In these cases, we'll provide a free return shipping label or arrange for pickup at no additional cost to you.
            </p>
          </div>
          
          <div className="bg-orange-50 rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-xl font-semibold mb-3">Need Help with a Return?</h3>
            <p className="text-gray-700 mb-6">
              Our customer support team is ready to assist you with any questions about returns or exchanges.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => window.location.href = "/contact"}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Contact Support
              </Button>
              <Button 
                onClick={() => window.location.href = "/faq"}
                variant="outline"
              >
                View FAQs
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      
    </div>
  );
};

export default ReturnsPage;
=======

import React from 'react';
import Header from '@/components/Header';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, HelpCircle, Settings } from 'lucide-react';
import { MobileHeader } from '@/components/ui/mobile-header';

const ReturnsPage = () => {
  const isMobile = isMobileUserAgent();

  return (
    <div className={`min-h-screen ${!isMobile ? 'min-w-max' : ''}`}>
      {!isMobile && <Header />}
      {isMobile && (
        <MobileHeader 
          title={'Returns'}
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
      )}
      <main className={`flex-grow mx-auto px-4 container py-8 ${!isMobile ? 'xl:px-24' : ''}`}>
        <div className="/max-w-3xl mx-auto /px-4">
          <h1 className="text-3xl font-bold mb-6">Returns Policy</h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Our Return Policy</h2>
            <p className="mb-4">
              At SmartKenya, we want you to be completely satisfied with your purchase. If you're not happy with your order for any reason, you can return most items within 7 days of delivery for a full refund or exchange.
            </p>
            <p>
              Please read the detailed guidelines below to understand our returns process, conditions, and exceptions.
            </p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Return Conditions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-green-50 border-green-100">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    Eligible for Return
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Unopened items in original packaging</li>
                    <li>Defective or damaged products</li>
                    <li>Items that don't match the description</li>
                    <li>Incorrect items received</li>
                    <li>Most clothing and accessories (unworn)</li>
                    <li>Electronics within 7 days (if unopened or defective)</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-red-50 border-red-100">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    Not Eligible for Return
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
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
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-md font-medium mb-1">Special Conditions for Electronics</h3>
                  <p className="text-sm text-gray-700">
                    Electronics may be returned within 7 days if defective. A 15% restocking fee may apply for non-defective electronics that have been opened. All electronics must include all original packaging, accessories, and manuals.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Return Process</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="bg-orange-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-orange-500">1</span>
                </div>
                <h3 className="font-medium mb-2">Request a Return</h3>
                <p className="text-sm text-gray-600">
                  Log into your account, go to "My Orders," and select "Request Return" for the specific item.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="bg-orange-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-orange-500">2</span>
                </div>
                <h3 className="font-medium mb-2">Package the Item</h3>
                <p className="text-sm text-gray-600">
                  Securely pack the item in its original packaging with all tags, accessories, and manuals.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="bg-orange-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-orange-500">3</span>
                </div>
                <h3 className="font-medium mb-2">Ship or Drop Off</h3>
                <p className="text-sm text-gray-600">
                  Use our return shipping label or drop off at designated return locations.
                </p>
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
              <h3 className="font-medium mb-2">After We Receive Your Return</h3>
              <p className="text-sm text-gray-700 mb-3">
                Once we receive and inspect your return, we'll process it within 3-5 business days. You'll receive an email notification when your refund has been processed.
              </p>
              <h4 className="font-medium text-sm mb-1">Refund Timeframes:</h4>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                <li>M-Pesa: 1-2 business days</li>
                <li>Credit/Debit Cards: 5-10 business days</li>
                <li>Bank Transfers: 5-7 business days</li>
              </ul>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Exchanges</h2>
            <p className="mb-4">
              If you'd like to exchange an item rather than request a refund, you can select "Exchange" instead of "Return" when initiating your return request. Exchanges are subject to product availability.
            </p>
            <p>
              For size or color exchanges of clothing items, we recommend selecting the "Exchange" option to streamline the process and avoid having to place a new order.
            </p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Return Shipping Costs</h2>
            <p className="mb-4">
              Return shipping costs are typically the responsibility of the customer, except in the following cases:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>The item received was defective or damaged</li>
              <li>The item received was incorrect (not what you ordered)</li>
              <li>The item doesn't match its description on our website</li>
            </ul>
            <p>
              In these cases, we'll provide a free return shipping label or arrange for pickup at no additional cost to you.
            </p>
          </div>
          
          <div className="bg-orange-50 rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-xl font-semibold mb-3">Need Help with a Return?</h3>
            <p className="text-gray-700 mb-6">
              Our customer support team is ready to assist you with any questions about returns or exchanges.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => window.location.href = "/contact"}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Contact Support
              </Button>
              <Button 
                onClick={() => window.location.href = "/faq"}
                variant="outline"
              >
                View FAQs
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      
    </div>
  );
};

export default ReturnsPage;
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
