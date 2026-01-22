import React from 'react';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import SiteBreadcrumb from '@/components/Breadcrumb';

const PrivacyPage = () => {
  const isMobile = isMobileUserAgent();

  return (   
    <>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Privacy Policy - SmartKenya",
          "description": "Know about your privacy at SmartKenya",
          "url": "https://smartkenya.co.ke/privacy",
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://smartkenya.co.ke"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Privacy Policy",
                "item": "https://smartkenya.co.ke/privacy"
              }
            ]
          }
        })}
      </script>

      <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
        <main className={`${!isMobile ? 'max-w-[1200px] mx-auto px-4 lg:px-6 py-8' : 'px-4 py-8 pb-24'}`}>
          <SiteBreadcrumb 
            items={[
              { label: 'Home', href: '/' },
              { label: 'Privacy Policy' }
            ]}
            className="mb-6"
          />

          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground tracking-tight mb-6">Privacy Policy</h1>
            
            <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 md:p-8 prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-sm text-muted-foreground mb-2">Last Updated: January 19, 2025</p>
              <p className="text-sm text-muted-foreground mb-6">Effective Date: January 19, 2025</p>
              
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-foreground">1. Introduction</h2>
                <p className="text-muted-foreground">
                  SmartKenya ("we," "our," or "us") is committed to protecting your privacy and ensuring the security of your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile applications (iOS and Android), and services (collectively, the "Service").
                </p>
                <p className="mt-3 text-muted-foreground">
                  This policy complies with the General Data Protection Regulation (GDPR), Kenya Data Protection Act 2019, and other applicable data protection laws. By using our Service, you consent to the data practices described in this policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-foreground">2. Data Controller Information</h2>
                <p className="mb-2 text-muted-foreground"><strong className="text-foreground">Company Name:</strong> SmartKenya Online Shopping Limited</p>
                <p className="mb-2 text-muted-foreground"><strong className="text-foreground">Registered Address:</strong> 38-60100 Embu Town, Embu, Kenya</p>
                <p className="mb-2 text-muted-foreground"><strong className="text-foreground">Email:</strong> privacy@smartkenya.co.ke</p>
                <p className="mb-2 text-muted-foreground"><strong className="text-foreground">Phone:</strong> +254 798 229 783</p>
                <p className="mt-3 text-muted-foreground">
                  For data protection inquiries, please contact our Data Protection Officer at: legal@smartkenya.co.ke
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-foreground">3. Information We Collect</h2>
                
                <h3 className="text-lg font-medium mb-2 mt-4 text-foreground">3.1 Personal Information You Provide</h3>
                <p className="mb-4 text-muted-foreground">
                  We collect personal information that you voluntarily provide when you:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Create an Account:</strong> Name, email address, phone number, password</li>
                  <li><strong className="text-foreground">Place an Order:</strong> Shipping address, billing address, payment information (processed securely through M-Pesa and other payment providers)</li>
                  <li><strong className="text-foreground">Contact Us:</strong> Name, email, phone number, message content</li>
                  <li><strong className="text-foreground">Leave Reviews:</strong> Username, rating, review text, optional photos</li>
                  <li><strong className="text-foreground">Use Chat Support:</strong> Messages, conversation history</li>
                  <li><strong className="text-foreground">Apply for Jobs:</strong> Resume, cover letter, contact information</li>
                </ul>

                <h3 className="text-lg font-medium mb-2 mt-4 text-foreground">3.2 Information Collected Automatically</h3>
                <p className="mb-4 text-muted-foreground">When you use our Service, we automatically collect:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Device Information:</strong> IP address, browser type, operating system, device model, unique device identifiers</li>
                  <li><strong className="text-foreground">Usage Data:</strong> Pages viewed, time spent on pages, clicks, search queries, products viewed</li>
                  <li><strong className="text-foreground">Location Data:</strong> Approximate location based on IP address (precise location only with your explicit consent)</li>
                  <li><strong className="text-foreground">Cookies and Tracking:</strong> Session cookies, preference cookies, analytics cookies</li>
                  <li><strong className="text-foreground">Mobile App Data:</strong> App version, crash reports, performance data</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-foreground">4. How We Use Your Information</h2>
                <p className="mb-4 text-muted-foreground">We use your information to:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Process and fulfill your orders</li>
                  <li>Communicate about your orders (confirmations, shipping updates, delivery notifications)</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Process payments through M-Pesa and other payment methods</li>
                  <li>Send account-related notifications and service updates</li>
                  <li>Personalize your shopping experience and product recommendations</li>
                  <li>Improve our website and mobile apps through analytics</li>
                  <li>Prevent fraud and enhance security</li>
                  <li>Send marketing communications (with your consent)</li>
                  <li>Comply with legal obligations and enforce our terms</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-foreground">5. Your Data Protection Rights</h2>
                <p className="mb-4 text-muted-foreground">Under GDPR and Kenya Data Protection Act, you have the following rights:</p>
                <ul className="list-disc pl-6 mb-4 space-y-3 text-muted-foreground">
                  <li><strong className="text-foreground">Right to Access:</strong> Request copies of your personal data</li>
                  <li><strong className="text-foreground">Right to Rectification:</strong> Request correction of inaccurate or incomplete data</li>
                  <li><strong className="text-foreground">Right to Erasure:</strong> Request deletion of your personal data</li>
                  <li><strong className="text-foreground">Right to Restriction:</strong> Request limitation of processing in certain circumstances</li>
                  <li><strong className="text-foreground">Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
                  <li><strong className="text-foreground">Right to Object:</strong> Object to processing based on legitimate interests or for direct marketing</li>
                  <li><strong className="text-foreground">Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent</li>
                </ul>
                <p className="mt-4 text-muted-foreground">
                  <strong className="text-foreground">To exercise these rights, contact us at:</strong> privacy@smartkenya.co.ke
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-foreground">6. Contact Information</h2>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="mb-2 font-medium text-foreground">SmartKenya Online Shopping Limited</p>
                  <p className="mb-2 text-muted-foreground">Email: privacy@smartkenya.co.ke</p>
                  <p className="mb-2 text-muted-foreground">Phone: +254 798 229 783</p>
                  <p className="text-muted-foreground">Address: 38-60100 Embu Town, Embu, Kenya</p>
                </div>
              </section>

              <div className="mt-8 p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg">
                <p className="text-sm font-semibold mb-2 text-foreground">Important Notice</p>
                <p className="text-sm text-muted-foreground">
                  By using our Service, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PrivacyPage;
