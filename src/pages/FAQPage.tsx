import { useState } from 'react';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useFAQ } from '@/hooks/useFAQ';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, HelpCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const FAQPage = () => {
  const isMobile = isMobileUserAgent();
  const { faqByCategory, isLoading } = useFAQ();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter FAQs based on search query
  const filteredCategories = Object.entries(faqByCategory).reduce((acc, [category, faqs]) => {
    const filteredFaqs = faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filteredFaqs.length > 0) {
      acc[category] = filteredFaqs;
    }
    return acc;
  }, {} as typeof faqByCategory);

  const hasResults = Object.keys(filteredCategories).length > 0;

  return (
    <div className={`min-h-screen ${!isMobile ? 'min-w-max' : ''}`}>
      <main className={`flex-grow mx-auto px-4 container py-8 ${!isMobile ? 'xl:px-24' : ''}`}>
        <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mb-8">
          Find answers to commonly asked questions about our products, ordering, shipping, and more.
        </p>
        
        <div className="mb-8">
          <div className="relative">
            <Input 
              type="search"
              placeholder="Search for answers..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-40 w-full" />
              </div>
            ))}
          </div>
        ) : !hasResults ? (
          <div className="text-center py-12">
            <HelpCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No results found' : 'No FAQs available'}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? 'Try adjusting your search terms or contact support for help.'
                : 'Check back later for frequently asked questions.'
              }
            </p>
          </div>
        ) : (
          Object.entries(filteredCategories).map(([category, faqs], index) => (
            <div key={category} className="mb-10">
              <h2 className="text-xl font-semibold mb-4">{category}</h2>
              
              <Accordion type="single" collapsible className="bg-card rounded-lg shadow-md border">
                {faqs.map((faq, faqIndex) => (
                  <AccordionItem key={faq.id} value={`item-${index}-${faqIndex}`}>
                    <AccordionTrigger className="px-4 py-3 hover:bg-muted/50">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-1 text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))
        )}
        
        <div className="bg-primary/10 rounded-lg shadow-sm p-6 text-center mt-8">
          <h3 className="text-xl font-semibold mb-3">Couldn't find what you're looking for?</h3>
          <p className="text-muted-foreground mb-6">
            Our customer support team is always ready to help with any questions or concerns.
          </p>
          <Button 
            onClick={() => window.location.href = "/contact"}
            className="bg-primary hover:bg-primary/90"
          >
            Contact Support
          </Button>
        </div>
      </main>
    </div>
  );
};

export default FAQPage;
