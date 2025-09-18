
import React from 'react';
import Header2 from '@/components/Header2';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { MobileHeader } from '@/components/ui/mobile-header';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TermsPage = () => {
  const isMobile = isMobileUserAgent();

  return (
    <div className={`min-h-screen ${!isMobile ? 'min-w-max' : ''}`}>
      {!isMobile && <Header2 />}
      {isMobile && (
        <MobileHeader 
          title={'Terms & Conditions'}
          backTo="/"
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
      )}
      <main className={`flex-grow mx-auto px-4 container py-8 ${!isMobile ? 'container px-4 xl:px-24':''}`}>
          <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>
          <div className="bg-white rounded-lg shadow-md p-6 prose prose-orange max-w-none">
            <p className="text-sm text-gray-500 mb-6">Last Updated: May 20, 2025</p>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p>
                Welcome to SmartKenya. These Terms & Conditions govern your use of the SmartKenya website, mobile applications, and services (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, please do not use our Service.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">2. User Accounts</h2>
              <p className="mb-4">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of these Terms, which may result in immediate termination of your account.
              </p>
              <p className="mb-4">
                You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. We encourage you to use "strong" passwords (passwords that use a combination of upper and lower case letters, numbers, and symbols) with your account.
              </p>
              <p>
                You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">3. Orders and Payments</h2>
              <p className="mb-4">
                By placing an order through our Service, you are making an offer to purchase the products you have selected based on these Terms. We reserve the right to refuse or cancel your order at any time for certain reasons including but not limited to product or service availability, errors in the description or price of the product or service, error in your order, or other reasons.
              </p>
              <p className="mb-4">
                We reserve the right to refuse or cancel your order if fraud or an unauthorized or illegal transaction is suspected. If your payment has already been processed, we will issue a refund.
              </p>
              <p>
                All payments are processed securely through our payment service providers. We do not store your payment information on our servers.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">4. Shipping and Delivery</h2>
              <p className="mb-4">
                We strive to deliver products in the fastest possible time and in excellent condition. Delivery times are estimates and not guaranteed. Delays can occasionally occur due to unforeseen circumstances.
              </p>
              <p>
                Risk of loss and title for items purchased from our website pass to you upon delivery of the items to the carrier. You are responsible for filing any claims with carriers for damaged and/or lost shipments.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">5. Returns and Refunds</h2>
              <p className="mb-4">
                We want you to be completely satisfied with your purchase. If you are not satisfied, you may return most items within 7 days of delivery for a full refund or exchange. Returns must be in their original condition, with all tags and packaging intact.
              </p>
              <p className="mb-4">
                Certain items cannot be returned due to hygiene concerns, including but not limited to personal care items, underwear, and food products.
              </p>
              <p>
                Refunds will be processed within 3-5 business days after we receive and inspect the returned item. The time it takes for the refund to appear in your account depends on your payment method.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">6. Product Information</h2>
              <p className="mb-4">
                We strive to provide accurate product information, including descriptions, images, and prices. However, we do not warrant that product descriptions or other content on the Service is accurate, complete, reliable, current, or error-free.
              </p>
              <p>
                If a product offered by SmartKenya is not as described, your sole remedy is to return it in unused condition.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
              <p className="mb-4">
                The Service and its original content, features, and functionality are and will remain the exclusive property of SmartKenya and its licensors. The Service is protected by copyright, trademark, and other laws of both Kenya and foreign countries.
              </p>
              <p>
                Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of SmartKenya.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
              <p className="mb-4">
                In no event shall SmartKenya, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
              </p>
              <ol className="list-decimal pl-6 mb-4 space-y-2">
                <li>Your access to or use of or inability to access or use the Service;</li>
                <li>Any conduct or content of any third party on the Service;</li>
                <li>Any content obtained from the Service; and</li>
                <li>Unauthorized access, use or alteration of your transmissions or content.</li>
              </ol>
              <p>
                This limitation applies whether the alleged liability is based on contract, tort, negligence, strict liability, or any other basis, even if we have been advised of the possibility of such damage.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">9. Governing Law</h2>
              <p>
                These Terms shall be governed and construed in accordance with the laws of Kenya, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">10. Changes to Terms</h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at legal@smartkenya.co.ke.
              </p>
            </section>
          </div>
      </main>  
    </div>
  );
};

export default TermsPage;
