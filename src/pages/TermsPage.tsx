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

      <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
        <main className={`${!isMobile ? 'max-w-[1200px] mx-auto px-4 lg:px-6 py-8' : 'px-4 py-8 pb-24'}`}>
          <SiteBreadcrumb 
            items={[
              { label: 'Home', href: '/' },
              { label: 'Terms & Conditions' }
            ]}
            className="mb-6"
          />

          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground tracking-tight mb-6">Terms & Conditions</h1>
            
            <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 md:p-8 prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-sm text-muted-foreground mb-2">Last Updated: January 19, 2025</p>
              <p className="text-sm text-muted-foreground mb-6">Effective Date: January 19, 2025</p>
              
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-foreground">1. Agreement to Terms</h2>
                <p className="text-muted-foreground">
                  Welcome to our store. These Terms and Conditions constitute a legally binding agreement between you and our store governing your access to and use of our website, mobile applications (iOS and Android), and related services.
                </p>
                <p className="mt-3 text-muted-foreground">
                  By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part, you may not access the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-foreground">2. Eligibility and Age Requirements</h2>
                <p className="mb-3 text-muted-foreground">
                  You must be at least 13 years old to use our Service. Users under 18 must have parental consent.
                </p>
                <p className="text-muted-foreground">
                  Use of our mobile applications is subject to Apple App Store and Google Play Store terms.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-foreground">3. User Accounts</h2>
                <p className="mb-4 text-muted-foreground">
                  When creating an account, you must provide accurate information. You are responsible for safeguarding your password and all activities under your account.
                </p>
                <p className="text-muted-foreground">
                  We reserve the right to suspend or terminate accounts for Terms violations or fraudulent activity.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-foreground">4. Orders and Transactions</h2>
                <p className="mb-3 text-muted-foreground">
                  By placing an order, you make an offer to purchase. We reserve the right to refuse or cancel orders for product unavailability, pricing errors, or suspected fraud.
                </p>
                <p className="text-muted-foreground">
                  All prices are in Kenyan Shillings (KES). We accept M-Pesa and other payment methods as available.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-foreground">5. Shipping and Delivery</h2>
                <p className="text-muted-foreground">
                  We deliver across Kenya. Delivery times are estimates and not guaranteed. Risk of loss passes to you upon delivery to the carrier.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-foreground">6. Returns and Refunds</h2>
                <p className="text-muted-foreground">
                  Please refer to our Returns Policy for details. Products must be unused and in original condition. Return requests must be made within the specified period.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-foreground">7. Prohibited Uses</h2>
                <p className="mb-3 text-muted-foreground">You agree NOT to:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Violate any laws or regulations</li>
                  <li>Infringe intellectual property rights</li>
                  <li>Transmit viruses or malware</li>
                  <li>Engage in fraudulent practices</li>
                  <li>Harass or harm other users</li>
                  <li>Attempt unauthorized access to systems</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-foreground">8. Intellectual Property</h2>
                <p className="mb-3 text-muted-foreground">
                  The Service and its contents are owned by our store and protected by copyright, trademark, and other intellectual property laws.
                </p>
                <p className="text-muted-foreground">
                  By posting content, you grant us a license to use, reproduce, and distribute it.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-foreground">9. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR STORE SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID IN THE 12 MONTHS PRECEDING THE CLAIM.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-foreground">10. Governing Law</h2>
                <p className="text-muted-foreground">
                  These Terms are governed by the laws of Kenya. Disputes shall be subject to the exclusive jurisdiction of Kenyan courts.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-foreground">11. Contact Information</h2>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="mb-2 font-medium text-foreground">SmartKenya Online Shopping Limited</p>
                  <p className="mb-2 text-muted-foreground">Email: legal@smartkenya.co.ke</p>
                  <p className="mb-2 text-muted-foreground">Phone: +254 798 229 783</p>
                  <p className="text-muted-foreground">Address: 38-60100 Embu Town, Embu, Kenya</p>
                </div>
              </section>

              <div className="mt-8 p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg">
                <p className="text-sm font-semibold mb-2 text-foreground">Important Notice</p>
                <p className="text-sm text-muted-foreground">
                  By using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default TermsPage;
