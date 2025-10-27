<<<<<<< HEAD

import React from 'react';
import Header from '@/components/Header';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import SiteBreadcrumb from '@/components/Breadcrumb';
import { MobileHeader } from '@/components/ui/mobile-header';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyPage = () => {
  const isMobile = isMobileUserAgent();

  return (   
  <>
      {/* Privacy Policy Page Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Privacy Policy - SmartKenya",
          "description": "Know about your pricvacy at SmartKenya",
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
                "name": "About",
                "item": "https://smartkenya.co.ke/privacy"
              }
            ]
          }
        })}
      </script>

    <div className={`min-h-screen ${!isMobile ? 'min-w-max' : ''}`}>
        {isMobile && ( 
          <MobileHeader
          title="Privacy Policy"
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        /> 
        )}
      <main className={`flex-grow mx-auto px-4 container py-8 ${!isMobile ? 'xl:px-24' : ''}`}>
        <SiteBreadcrumb 
          items={[
            { label: 'Home', href: '/' },
            { label: 'Privacy Policy' }
          ]}
          className="mb-6"
        />

          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          <div className="bg-white rounded-lg shadow-md p-6 prose prose-orange max-w-none">
            <p className="text-sm text-gray-500 mb-6">Last Updated: May 20, 2025</p>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p>
                SmartKenya ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile applications, and services (collectively, the "Service"). Please read this Privacy Policy carefully. By using the Service, you consent to the practices described in this policy.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
              <h3 className="text-lg font-medium mb-2">Personal Information</h3>
              <p className="mb-4">
                We may collect personal information that you voluntarily provide to us when you:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Create an account or profile</li>
                <li>Place an order</li>
                <li>Sign up for our newsletter</li>
                <li>Contact our customer service</li>
                <li>Participate in surveys or contests</li>
                <li>Post reviews or comments</li>
              </ul>
              <p className="mb-4">
                This information may include your name, email address, phone number, shipping and billing address, payment information, and other details necessary to process your transactions or provide the services you request.
              </p>
              
              <h3 className="text-lg font-medium mb-2">Automatically Collected Information</h3>
              <p className="mb-4">
                When you access or use our Service, we may automatically collect certain information, including:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Device information (such as your IP address, browser type, and operating system)</li>
                <li>Log information (such as access times and pages viewed)</li>
                <li>Location information (with your consent)</li>
                <li>Usage information (such as products viewed, items in your cart, and search queries)</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
              <p className="mb-4">We may use the information we collect for various purposes, including to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Process and fulfill your orders</li>
                <li>Provide, maintain, and improve our Service</li>
                <li>Communicate with you about orders, products, services, and promotions</li>
                <li>Respond to your requests, inquiries, and customer service needs</li>
                <li>Personalize your experience and deliver content and product recommendations</li>
                <li>Monitor and analyze trends, usage, and activities in connection with our Service</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">4. Sharing Your Information</h2>
              <p className="mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>With third-party service providers who perform services on our behalf (such as payment processing, order fulfillment, data analysis, and customer service)</li>
                <li>With third-party sellers whose products you purchase through our marketplace</li>
                <li>As required by law or in response to legal process</li>
                <li>To protect the rights, property, or safety of SmartKenya, our users, or others</li>
                <li>In connection with a business transaction such as a merger, acquisition, or sale of assets</li>
              </ul>
              <p className="mb-4">
                We may also share aggregated or de-identified information that cannot reasonably be used to identify you.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">5. Cookies and Similar Technologies</h2>
              <p className="mb-4">
                We and our service providers may use cookies, web beacons, and similar technologies to track and analyze your usage of our Service, personalize content, and display targeted advertising.
              </p>
              <p className="mb-4">
                You can set your browser to refuse all or some browser cookies, or to alert you when cookies are being sent. However, if you disable or refuse cookies, some parts of our Service may not function properly.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">6. Your Rights and Choices</h2>
              <p className="mb-4">
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Access to your personal information</li>
                <li>Correction of inaccurate or incomplete information</li>
                <li>Deletion of your personal information</li>
                <li>Restriction or objection to processing</li>
                <li>Data portability</li>
                <li>Withdrawal of consent</li>
              </ul>
              <p className="mb-4">
                To exercise these rights, please contact us at privacy@SmartKenya.co.ke Please note that we may need to verify your identity before responding to your request.
              </p>
              <p className="mb-4">
                You can also opt out of receiving promotional emails from us by following the instructions in those emails. Even if you opt out, we may still send you non-promotional messages, such as those about your account or our ongoing business relations.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">7. Data Security</h2>
              <p className="mb-4">
                We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. All information you provide to us is stored on secure servers behind firewalls.
              </p>
              <p className="mb-4">
                Unfortunately, the transmission of information via the internet is not completely secure. Although we do our best to protect your personal information, we cannot guarantee the security of your personal information transmitted to our Service. Any transmission of personal information is at your own risk.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
              <p>
                Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn we have collected or received personal information from a child under 13 without verification of parental consent, we will delete that information.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">9. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at privacy@SmartKenya.co.ke.
              </p>
            </section>
          </div>
      </main>
      
      
    </div>
    </>
  );
};

export default PrivacyPage;
=======

import React from 'react';
import Header from '@/components/Header';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import SiteBreadcrumb from '@/components/Breadcrumb';
import { MobileHeader } from '@/components/ui/mobile-header';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyPage = () => {
  const isMobile = isMobileUserAgent();

  return (   
  <>
      {/* Privacy Policy Page Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Privacy Policy - SmartKenya",
          "description": "Know about your pricvacy at SmartKenya",
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
                "name": "About",
                "item": "https://smartkenya.co.ke/privacy"
              }
            ]
          }
        })}
      </script>

    <div className={`min-h-screen ${!isMobile ? 'min-w-max' : ''}`}>
        {!isMobile && <Header />}
        {isMobile && ( 
          <MobileHeader
          title="Privacy Policy"
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        /> 
        )}
      <main className={`flex-grow mx-auto px-4 container py-8 ${!isMobile ? 'xl:px-24' : ''}`}>
        <SiteBreadcrumb 
          items={[
            { label: 'Home', href: '/' },
            { label: 'Privacy Policy' }
          ]}
          className="mb-6"
        />

          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          <div className="bg-white rounded-lg shadow-md p-6 prose prose-orange max-w-none">
            <p className="text-sm text-gray-500 mb-6">Last Updated: May 20, 2025</p>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p>
                SmartKenya ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile applications, and services (collectively, the "Service"). Please read this Privacy Policy carefully. By using the Service, you consent to the practices described in this policy.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
              <h3 className="text-lg font-medium mb-2">Personal Information</h3>
              <p className="mb-4">
                We may collect personal information that you voluntarily provide to us when you:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Create an account or profile</li>
                <li>Place an order</li>
                <li>Sign up for our newsletter</li>
                <li>Contact our customer service</li>
                <li>Participate in surveys or contests</li>
                <li>Post reviews or comments</li>
              </ul>
              <p className="mb-4">
                This information may include your name, email address, phone number, shipping and billing address, payment information, and other details necessary to process your transactions or provide the services you request.
              </p>
              
              <h3 className="text-lg font-medium mb-2">Automatically Collected Information</h3>
              <p className="mb-4">
                When you access or use our Service, we may automatically collect certain information, including:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Device information (such as your IP address, browser type, and operating system)</li>
                <li>Log information (such as access times and pages viewed)</li>
                <li>Location information (with your consent)</li>
                <li>Usage information (such as products viewed, items in your cart, and search queries)</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
              <p className="mb-4">We may use the information we collect for various purposes, including to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Process and fulfill your orders</li>
                <li>Provide, maintain, and improve our Service</li>
                <li>Communicate with you about orders, products, services, and promotions</li>
                <li>Respond to your requests, inquiries, and customer service needs</li>
                <li>Personalize your experience and deliver content and product recommendations</li>
                <li>Monitor and analyze trends, usage, and activities in connection with our Service</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">4. Sharing Your Information</h2>
              <p className="mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>With third-party service providers who perform services on our behalf (such as payment processing, order fulfillment, data analysis, and customer service)</li>
                <li>With third-party sellers whose products you purchase through our marketplace</li>
                <li>As required by law or in response to legal process</li>
                <li>To protect the rights, property, or safety of SmartKenya, our users, or others</li>
                <li>In connection with a business transaction such as a merger, acquisition, or sale of assets</li>
              </ul>
              <p className="mb-4">
                We may also share aggregated or de-identified information that cannot reasonably be used to identify you.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">5. Cookies and Similar Technologies</h2>
              <p className="mb-4">
                We and our service providers may use cookies, web beacons, and similar technologies to track and analyze your usage of our Service, personalize content, and display targeted advertising.
              </p>
              <p className="mb-4">
                You can set your browser to refuse all or some browser cookies, or to alert you when cookies are being sent. However, if you disable or refuse cookies, some parts of our Service may not function properly.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">6. Your Rights and Choices</h2>
              <p className="mb-4">
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Access to your personal information</li>
                <li>Correction of inaccurate or incomplete information</li>
                <li>Deletion of your personal information</li>
                <li>Restriction or objection to processing</li>
                <li>Data portability</li>
                <li>Withdrawal of consent</li>
              </ul>
              <p className="mb-4">
                To exercise these rights, please contact us at privacy@SmartKenya.co.ke Please note that we may need to verify your identity before responding to your request.
              </p>
              <p className="mb-4">
                You can also opt out of receiving promotional emails from us by following the instructions in those emails. Even if you opt out, we may still send you non-promotional messages, such as those about your account or our ongoing business relations.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">7. Data Security</h2>
              <p className="mb-4">
                We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. All information you provide to us is stored on secure servers behind firewalls.
              </p>
              <p className="mb-4">
                Unfortunately, the transmission of information via the internet is not completely secure. Although we do our best to protect your personal information, we cannot guarantee the security of your personal information transmitted to our Service. Any transmission of personal information is at your own risk.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
              <p>
                Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn we have collected or received personal information from a child under 13 without verification of parental consent, we will delete that information.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">9. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at privacy@SmartKenya.co.ke.
              </p>
            </section>
          </div>
      </main>
      
      
    </div>
    </>
  );
};

export default PrivacyPage;
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
