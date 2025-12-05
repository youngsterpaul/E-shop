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
import { Card, CardContent } from '@/components/ui/card';
import { Search, HelpCircle, MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const FAQPage = () => {
  const isMobile = isMobileUserAgent();
  const { faqByCategory, isLoading } = useFAQ();
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
      <main className={`${!isMobile ? 'max-w-[1400px] mx-auto px-4 lg:px-6 py-8' : 'px-4 py-8 pb-24'}`}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">
            Find answers to commonly asked questions about our products, ordering, shipping, and more.
          </p>
        </div>
        
        {/* Search */}
        <Card className="border-0 shadow-sm mb-8">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input 
                type="search"
                placeholder="Search for answers..." 
                className="pl-10 h-12 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : !hasResults ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
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
          <div className="space-y-8">
            {Object.entries(filteredCategories).map(([category, faqs], index) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-foreground mb-4">{category}</h2>
                
                <Card className="border-0 shadow-sm">
                  <Accordion type="single" collapsible>
                    {faqs.map((faq, faqIndex) => (
                      <AccordionItem key={faq.id} value={`item-${index}-${faqIndex}`} className="border-b last:border-0">
                        <AccordionTrigger className="px-4 py-4 text-left hover:no-underline hover:bg-muted/50 text-foreground">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>
              </div>
            ))}
          </div>
        )}
        
        {/* CTA Section */}
        <Card className="border-0 bg-gradient-to-br from-primary/10 to-primary/5 mt-12">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Couldn't find what you're looking for?</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Our customer support team is always ready to help with any questions or concerns.
            </p>
            <Button 
              onClick={() => window.location.href = "/contact"}
              className="px-8"
            >
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FAQPage;
