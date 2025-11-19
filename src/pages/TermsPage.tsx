import React from 'react';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import SiteBreadcrumb from '@/components/Breadcrumb';

const TermsPage = () => {
  const isMobile = isMobileUserAgent();

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Terms & Conditions - SmartKenya",
          "description": "Terms and conditions for using SmartKenya services",
          "url": "https://smartkenya.co.ke/terms"
        })}
      </script>

      <div className={`min-h-screen ${!isMobile ? 'min-w-max' : ''}`}>
        <main className={`flex-grow mx-auto px-4 container py-8 ${!isMobile ? 'xl:px-24' : ''}`}>
          <SiteBreadcrumb 
            items={[
              { label: 'Home', href: '/' },
              { label: 'Terms & Conditions' }
            ]}
            className="mb-6"
          />

          <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>
          <div className="bg-white rounded-lg shadow-md p-6 prose prose-orange max-w-none">
            <p className="text-sm text-gray-500 mb-2">Last Updated: January 19, 2025</p>
            <p className="text-sm text-gray-600 mb-6">Effective Date: January 19, 2025</p>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">1. Agreement to Terms</h2>
              <p>
                Welcome to SmartKenya. These Terms and Conditions constitute a legally binding agreement between you and SmartKenya Limited governing your access to and use of our website, mobile applications (iOS and Android), and related services.
              </p>
              <p className="mt-3">
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">2. Eligibility and Age Requirements</h2>
              <p className="mb-3">
                You must be at least 13 years old to use our Service. Users under 18 must have parental consent.
              </p>
              <p>
                Use of our mobile applications is subject to Apple App Store and Google Play Store terms.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <p className="mb-4">
                When creating an account, you must provide accurate information. You are responsible for safeguarding your password and all activities under your account.
              </p>
              <p>
                We reserve the right to suspend or terminate accounts for Terms violations or fraudulent activity.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">4. Mobile Application License</h2>
              <p className="mb-3">
                We grant you a limited, non-exclusive license to use our mobile application for personal use.
              </p>
              <p className="mb-3">You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Copy, modify, or reverse engineer the app</li>
                <li>Remove copyright notices</li>
                <li>Transfer or sublicense to third parties</li>
                <li>Use for unauthorized purposes</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">5. Orders and Transactions</h2>
              <p className="mb-3">
                By placing an order, you make an offer to purchase. We reserve the right to refuse or cancel orders for product unavailability, pricing errors, or suspected fraud.
              </p>
              <p>
                All prices are in Kenyan Shillings (KES). We accept M-Pesa and other payment methods as available.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">6. Shipping and Delivery</h2>
              <p>
                We deliver across Kenya. Delivery times are estimates and not guaranteed. Risk of loss passes to you upon delivery to the carrier.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">7. Returns and Refunds</h2>
              <p>
                Please refer to our Returns Policy for details. Products must be unused and in original condition. Return requests must be made within the specified period.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">8. Prohibited Uses</h2>
              <p className="mb-3">You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violate any laws or regulations</li>
                <li>Infringe intellectual property rights</li>
                <li>Transmit viruses or malware</li>
                <li>Engage in fraudulent practices</li>
                <li>Harass or harm other users</li>
                <li>Attempt unauthorized access to systems</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">9. Intellectual Property</h2>
              <p className="mb-3">
                The Service and its contents are owned by SmartKenya and protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p>
                By posting content, you grant us a license to use, reproduce, and distribute it.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">10. Disclaimers</h2>
              <p>
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee uninterrupted, error-free operation or accuracy of information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">11. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SMARTKENYA SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID IN THE 12 MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">12. Privacy</h2>
              <p>
                Your use is also governed by our Privacy Policy, which complies with GDPR and Kenya Data Protection Act 2019.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">13. Modifications</h2>
              <p>
                We may modify these Terms at any time. We will notify you of material changes. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">14. Termination</h2>
              <p>
                We may terminate your access immediately for Terms violations. Upon termination, your right to use the Service ceases.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">15. Governing Law</h2>
              <p>
                These Terms are governed by the laws of Kenya. Disputes shall be subject to the exclusive jurisdiction of Kenyan courts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">16. Contact Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="mb-2"><strong>SmartKenya Limited</strong></p>
                <p className="mb-2">Email: legal@smartkenya.co.ke</p>
                <p className="mb-2">Phone: +254 758 475 467</p>
                <p>Address: 38-60100 Embu Town, Embu, Kenya</p>
              </div>
            </section>

            <div className="mt-8 p-4 bg-orange-50 border-l-4 border-primary rounded">
              <p className="text-sm font-semibold mb-2">Important Notice</p>
              <p className="text-sm">
                By using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default TermsPage;
