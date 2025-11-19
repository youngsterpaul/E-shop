
import React from 'react';
import Header from '@/components/Header';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import SiteBreadcrumb from '@/components/Breadcrumb';
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
            <p className="text-sm text-gray-500 mb-6">Last Updated: January 19, 2025</p>
            <p className="text-sm text-gray-600 mb-6">
              Effective Date: January 19, 2025
            </p>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p>
                SmartKenya ("we," "our," or "us") is committed to protecting your privacy and ensuring the security of your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile applications (iOS and Android), and services (collectively, the "Service").
              </p>
              <p className="mt-3">
                This policy complies with the General Data Protection Regulation (GDPR), Kenya Data Protection Act 2019, and other applicable data protection laws. By using our Service, you consent to the data practices described in this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">2. Data Controller Information</h2>
              <p className="mb-2"><strong>Company Name:</strong> SmartKenya Limited</p>
              <p className="mb-2"><strong>Registered Address:</strong> 38-60100 Embu Town, Embu, Kenya</p>
              <p className="mb-2"><strong>Email:</strong> privacy@smartkenya.co.ke</p>
              <p className="mb-2"><strong>Phone:</strong> +254 758 475 467</p>
              <p className="mt-3">
                For data protection inquiries, please contact our Data Protection Officer at: dpo@smartkenya.co.ke
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">3. Information We Collect</h2>
              
              <h3 className="text-lg font-medium mb-2 mt-4">3.1 Personal Information You Provide</h3>
              <p className="mb-4">
                We collect personal information that you voluntarily provide when you:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Create an Account:</strong> Name, email address, phone number, password</li>
                <li><strong>Place an Order:</strong> Shipping address, billing address, payment information (processed securely through M-Pesa and other payment providers)</li>
                <li><strong>Contact Us:</strong> Name, email, phone number, message content</li>
                <li><strong>Leave Reviews:</strong> Username, rating, review text, optional photos</li>
                <li><strong>Use Chat Support:</strong> Messages, conversation history</li>
                <li><strong>Apply for Jobs:</strong> Resume, cover letter, contact information</li>
              </ul>

              <h3 className="text-lg font-medium mb-2 mt-4">3.2 Information Collected Automatically</h3>
              <p className="mb-4">When you use our Service, we automatically collect:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Device Information:</strong> IP address, browser type, operating system, device model, unique device identifiers</li>
                <li><strong>Usage Data:</strong> Pages viewed, time spent on pages, clicks, search queries, products viewed</li>
                <li><strong>Location Data:</strong> Approximate location based on IP address (precise location only with your explicit consent)</li>
                <li><strong>Cookies and Tracking:</strong> Session cookies, preference cookies, analytics cookies</li>
                <li><strong>Mobile App Data:</strong> App version, crash reports, performance data</li>
              </ul>

              <h3 className="text-lg font-medium mb-2 mt-4">3.3 Mobile App Permissions</h3>
              <p className="mb-4">Our mobile apps may request access to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Camera:</strong> For taking product photos in reviews (optional)</li>
                <li><strong>Photo Library:</strong> For uploading review images (optional)</li>
                <li><strong>Location:</strong> For delivery address suggestions and store locator (optional)</li>
                <li><strong>Notifications:</strong> For order updates and promotional messages (optional)</li>
                <li><strong>Storage:</strong> For caching and offline functionality</li>
              </ul>
              <p className="text-sm text-gray-600 mt-2">
                You can manage these permissions in your device settings at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">4. Legal Basis for Processing (GDPR)</h2>
              <p className="mb-4">We process your personal data based on the following legal grounds:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Contract Performance:</strong> Processing necessary to fulfill orders and provide services you requested</li>
                <li><strong>Consent:</strong> You have given explicit consent for specific processing activities (e.g., marketing emails, location tracking)</li>
                <li><strong>Legitimate Interests:</strong> For fraud prevention, security, service improvement, and analytics</li>
                <li><strong>Legal Obligation:</strong> To comply with tax, accounting, and legal requirements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">5. How We Use Your Information</h2>
              <p className="mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2">
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
              <h2 className="text-xl font-semibold mb-3">6. Information Sharing and Disclosure</h2>
              <p className="mb-4">We may share your information with:</p>
              
              <h3 className="text-lg font-medium mb-2 mt-4">6.1 Service Providers</h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Payment Processors:</strong> Safaricom M-Pesa for payment processing</li>
                <li><strong>Hosting Services:</strong> Supabase for database and authentication</li>
                <li><strong>Delivery Partners:</strong> Courier services for order fulfillment</li>
                <li><strong>Analytics:</strong> Vercel Analytics for performance monitoring</li>
                <li><strong>Email Services:</strong> For transactional and marketing emails</li>
              </ul>

              <h3 className="text-lg font-medium mb-2 mt-4">6.2 Legal Requirements</h3>
              <p className="mb-4">We may disclose your information if required by law, court order, or government request, or to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Protect our rights, property, or safety</li>
                <li>Enforce our terms and conditions</li>
                <li>Prevent fraud or security threats</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h3 className="text-lg font-medium mb-2 mt-4">6.3 Business Transfers</h3>
              <p>
                In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">7. International Data Transfers</h2>
              <p className="mb-3">
                Your data may be transferred to and processed in countries outside Kenya, including the United States and European Union, where our service providers operate.
              </p>
              <p>
                We ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) approved by the European Commission and adequate data protection agreements with all third-party processors.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">8. Your Data Protection Rights (GDPR)</h2>
              <p className="mb-4">Under GDPR and Kenya Data Protection Act, you have the following rights:</p>
              
              <ul className="list-disc pl-6 mb-4 space-y-3">
                <li><strong>Right to Access:</strong> Request copies of your personal data</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> Request deletion of your personal data</li>
                <li><strong>Right to Restriction:</strong> Request limitation of processing in certain circumstances</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or for direct marketing</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent</li>
                <li><strong>Right to Lodge a Complaint:</strong> File a complaint with the Office of the Data Protection Commissioner (Kenya) or your local supervisory authority</li>
              </ul>

              <p className="mt-4">
                <strong>To exercise these rights, contact us at:</strong> privacy@smartkenya.co.ke
              </p>
              <p className="mt-2 text-sm text-gray-600">
                We will respond to your request within 30 days. You may be required to verify your identity before we process your request.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">9. Data Retention</h2>
              <p className="mb-4">We retain your personal data for as long as necessary to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Account Data:</strong> Retained while your account is active and for 3 years after closure</li>
                <li><strong>Order History:</strong> Retained for 7 years for accounting and legal compliance</li>
                <li><strong>Marketing Data:</strong> Retained until you unsubscribe or object</li>
                <li><strong>Chat Logs:</strong> Retained for 1 year for customer service quality</li>
                <li><strong>Security Logs:</strong> Retained for 2 years for fraud prevention</li>
              </ul>
              <p>
                After the retention period, we will securely delete or anonymize your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">10. Cookies and Tracking Technologies</h2>
              <p className="mb-4">We use cookies and similar technologies for:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for authentication and shopping cart functionality</li>
                <li><strong>Analytics Cookies:</strong> To understand how you use our Service (Google Analytics, Vercel Analytics)</li>
                <li><strong>Preference Cookies:</strong> To remember your settings and preferences</li>
                <li><strong>Marketing Cookies:</strong> For personalized advertising (with consent)</li>
              </ul>
              <p className="mt-3">
                You can manage cookie preferences in your browser settings. Note that disabling essential cookies may affect Service functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">11. Children's Privacy</h2>
              <p className="mb-3">
                Our Service is not intended for children under 13 years of age (or 16 in the EU). We do not knowingly collect personal information from children.
              </p>
              <p className="mb-3">
                If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately at privacy@smartkenya.co.ke.
              </p>
              <p>
                Upon verification, we will promptly delete such information from our systems.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">12. Security Measures</h2>
              <p className="mb-4">We implement industry-standard security measures to protect your data:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Encryption:</strong> SSL/TLS encryption for data in transit</li>
                <li><strong>Secure Storage:</strong> Encrypted databases with access controls</li>
                <li><strong>Authentication:</strong> Secure password hashing and multi-factor authentication</li>
                <li><strong>Access Controls:</strong> Limited employee access on a need-to-know basis</li>
                <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
                <li><strong>Monitoring:</strong> Real-time security monitoring and incident response</li>
              </ul>
              <p className="text-sm text-gray-600 mt-3">
                While we strive to protect your data, no method of transmission over the Internet is 100% secure. Please use strong passwords and keep your account credentials confidential.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">13. Third-Party Links</h2>
              <p>
                Our Service may contain links to third-party websites, apps, or services (e.g., social media, payment processors). We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">14. Marketing Communications</h2>
              <p className="mb-3">
                With your consent, we may send you promotional emails about new products, special offers, and other updates.
              </p>
              <p className="mb-3">
                <strong>You can opt out at any time by:</strong>
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Clicking "unsubscribe" in any marketing email</li>
                <li>Updating your preferences in your account settings</li>
                <li>Contacting us at privacy@smartkenya.co.ke</li>
              </ul>
              <p className="text-sm text-gray-600">
                Note: You will still receive transactional emails (order confirmations, shipping updates) even after opting out of marketing communications.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">15. Data Breach Notification</h2>
              <p className="mb-3">
                In the event of a data breach that poses a risk to your rights and freedoms, we will:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Notify the relevant supervisory authority within 72 hours</li>
                <li>Inform affected individuals without undue delay</li>
                <li>Provide details of the breach and measures taken</li>
                <li>Offer guidance on protective steps you can take</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">16. Mobile App Specific Provisions</h2>
              <p className="mb-4"><strong>Push Notifications:</strong> With your permission, we send notifications about:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Order status updates</li>
                <li>Delivery notifications</li>
                <li>Special offers and promotions</li>
                <li>Cart reminders</li>
              </ul>
              <p className="mb-4">You can disable notifications in your device settings or app preferences.</p>

              <p className="mb-4"><strong>App Analytics:</strong> We collect app performance data including:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Crash reports and error logs</li>
                <li>Feature usage statistics</li>
                <li>Screen views and navigation paths</li>
                <li>App version and device information</li>
              </ul>
              <p className="text-sm text-gray-600">This data is anonymized and used solely to improve app performance and user experience.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">17. Changes to This Privacy Policy</h2>
              <p className="mb-3">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors.
              </p>
              <p className="mb-3">
                We will notify you of material changes by:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Posting the updated policy on our website and apps</li>
                <li>Updating the "Last Updated" date</li>
                <li>Sending an email notification for significant changes</li>
                <li>Displaying an in-app notification</li>
              </ul>
              <p>
                Your continued use of the Service after changes become effective constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">18. Contact Us</h2>
              <p className="mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="mb-2"><strong>SmartKenya Limited</strong></p>
                <p className="mb-2">Data Protection Officer</p>
                <p className="mb-2">Email: privacy@smartkenya.co.ke</p>
                <p className="mb-2">Alternate: dpo@smartkenya.co.ke</p>
                <p className="mb-2">Phone: +254 758 475 467</p>
                <p className="mb-2">Address: 38-60100 Embu Town, Embu, Kenya</p>
              </div>

              <p className="mt-4 text-sm text-gray-600">
                <strong>Supervisory Authority (Kenya):</strong><br />
                Office of the Data Protection Commissioner<br />
                Website: <a href="https://www.odpc.go.ke" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.odpc.go.ke</a>
              </p>

              <p className="mt-4 text-sm text-gray-600">
                <strong>For EU Residents:</strong><br />
                You have the right to lodge a complaint with your local data protection authority.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">19. Governing Law</h2>
              <p>
                This Privacy Policy is governed by the laws of Kenya and the GDPR where applicable. Any disputes shall be subject to the exclusive jurisdiction of the courts of Kenya.
              </p>
            </section>

            <div className="mt-8 p-4 bg-blue-50 border-l-4 border-primary rounded">
              <p className="text-sm font-semibold mb-2">Your Privacy Matters</p>
              <p className="text-sm">
                We are committed to transparency and protecting your rights. If you have any questions or need to exercise your data protection rights, please don't hesitate to contact our Data Protection Officer at dpo@smartkenya.co.ke.
              </p>
            </div>
          </div>
      </main>
    </div>
  </>
  );
};

export default PrivacyPage;
