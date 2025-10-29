
import { isMobileUserAgent } from '@/hooks/use-mobile';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Settings } from 'lucide-react';

const FAQPage = () => {
  const isMobile = isMobileUserAgent();

  const faqCategories = [
    {
      category: "Orders & Payments",
      questions: [
        {
          question: "How do I place an order?",
          answer: "To place an order, browse our products, add items to your cart, and proceed to checkout. You'll need to provide delivery information and select a payment method. Once your order is confirmed, you'll receive an order confirmation email."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept M-Pesa payments only. All payments are processed securely through our payment gateways."
        },
        {
          question: "Can I cancel my order?",
          answer: "You can cancel your order within 1 hour of placing it if it hasn't been processed yet. Contact our customer service team immediately to request cancellation."
        },
        {
          question: "How do I track my order?",
          answer: "Once your order is shipped, you'll receive a tracking number via email and SMS. You can use this number to track your order on our website under 'My Orders' in your account dashboard."
        }
      ]
    },
    {
      category: "Shipping & Delivery",
      questions: [
        {
          question: "How long does delivery take?",
          answer: "Delivery times vary by location. Within Embu, delivery typically takes 1 or 2 hours. For other major cities in Kenya, delivery takes 1-3 hours."
        },
        {
          question: "Do you ship internationally?",
          answer: "No, we only ship to some countries in kenya. This include Murang'a and Embu county."
        },
        {
          question: "How much does shipping cost?",
          answer: "Shipping costs are calculated based on delivery location, package size, and weight. Free shipping is available for orders above Ksh 5,000 within Kenya. You can see the exact shipping cost during checkout before payment."
        },
        {
          question: "What if I'm not available when my package arrives?",
          answer: "Our delivery partners will attempt delivery up to 3 times. If you're not available, they'll leave a delivery notice with instructions on how to reschedule delivery or collect your package from their nearest pickup point."
        }
      ]
    },
    {
      category: "Returns & Refunds",
      questions: [
        {
          question: "What is your return policy?",
          answer: "We accept returns within 7 days of delivery for most products, provided they are in their original condition with packaging and tags intact. Certain items like personal care products, underwear, and food items cannot be returned due to hygiene concerns."
        },
        {
          question: "How do I return an item?",
          answer: "To return an item, log into your account, go to 'My Orders', select the order containing the item you wish to return, and click 'Request Return'. Follow the instructions to complete your return request. Once approved, you'll receive return shipping instructions."
        },
        {
          question: "How long does it take to process a refund?",
          answer: "After we receive and inspect your return, refunds are processed within 3-5 business days. The time it takes for the refund to appear in your account depends on your payment method: M-Pesa (1-2 days), credit/debit cards (5-10 business days), and bank transfers (5-7 business days)."
        },
        {
          question: "Do I have to pay for return shipping?",
          answer: "Return shipping costs are typically the responsibility of the customer, except in cases where the item received was defective, damaged in transit, or incorrect. In these cases, we'll provide a free return shipping label or arrange for pickup."
        }
      ]
    },
    {
      category: "Product Information",
      questions: [
        {
          question: "How can I tell if a product is in stock?",
          answer: "Product availability is displayed on each product page. If an item is out of stock, you'll see an 'Out of Stock' label or 'Notify Me' button to receive alerts when the item is back in stock."
        },
        {
          question: "Are your products authentic?",
          answer: "Yes, all products sold on SmartKenya are 100% authentic. We source directly from authorized distributors and brand owners, and have a strict anti-counterfeit policy. If you ever receive a product you suspect is not authentic, please contact us immediately."
        },
        {
          question: "What is the warranty period for electronics?",
          answer: "Warranty periods vary by product and brand. Most electronics come with a standard manufacturer's warranty of 1 year. Extended warranties may be available for certain products. Specific warranty information is provided on product pages and in the documentation that comes with your purchase."
        },
        {
          question: "Can I purchase in bulk for my business?",
          answer: "Yes, we offer wholesale options for businesses. Please contact our business sales team at business@smartkenya.co.ke with details of your requirements for special pricing and terms."
        }
      ]
    }
  ];

  return (
    <div className={`min-h-screen ${!isMobile ? 'min-w-max' : ''}`}>
      <main className={`flex-grow mx-auto px-4 container py-8 ${!isMobile ? 'xl:px-24' : ''}`}>
          <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-600 mb-8">
            Find answers to commonly asked questions about our products, ordering, shipping, and more.
          </p>
          
          <div className="mb-8">
            <div className="relative">
              <Input 
                type="search"
                placeholder="Search for answers..." 
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
          </div>
          
          {faqCategories.map((category, index) => (
            <div key={index} className="mb-10">
              <h2 className="text-xl font-semibold mb-4">{category.category}</h2>
              
              <Accordion type="single" collapsible className="bg-white rounded-lg shadow-md">
                {category.questions.map((faq, faqIndex) => (
                  <AccordionItem key={faqIndex} value={`item-${index}-${faqIndex}`}>
                    <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-1 text-gray-700">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
          
          <div className="bg-orange-50 rounded-lg shadow-sm p-6 text-center mt-8">
            <h3 className="text-xl font-semibold mb-3">Couldn't find what you're looking for?</h3>
            <p className="text-gray-700 mb-6">
              Our customer support team is always ready to help with any questions or concerns.
            </p>
            <Button 
              onClick={() => window.location.href = "/contact"}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md font-medium"
            >
              Contact Support
            </Button>
          </div>
      </main>
    </div>
  );
};

export default FAQPage;
