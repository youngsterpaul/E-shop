import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useAboutContent } from '@/hooks/useSiteContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Users, DollarSign, Shield, ArrowRight } from 'lucide-react';

const valueIcons: Record<string, React.ReactNode> = {
  Quality: <Check className="w-6 h-6 text-primary" />,
  Affordability: <DollarSign className="w-6 h-6 text-primary" />,
  Community: <Users className="w-6 h-6 text-primary" />,
  Trust: <Shield className="w-6 h-6 text-primary" />,
};

const AboutPage = () => {
  const isMobile = isMobileUserAgent();
  const { aboutContent, isLoading } = useAboutContent();

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "About Our Store",
          "description": "Learn more about our store and mission",
          "url": "https://smartkenya.co.ke/about",
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://smartkenya.co.ke" },
              { "@type": "ListItem", "position": 2, "name": "About", "item": "https://smartkenya.co.ke/about" }
            ]
          }
        })}
      </script>
          
      <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
        <main className={`${!isMobile ? 'max-w-[1200px] mx-auto px-4 lg:px-6 py-8' : 'px-4 py-8 pb-24'}`}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">About Our Store</h1>
            <p className="text-muted-foreground">Learn more about our story, mission, and values</p>
          </div>
          
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : aboutContent ? (
            <div className="space-y-8">
              {/* Our Story Section */}
              <Card className="border-0 shadow-md overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <img 
                    src="/placeholder.svg"
                    alt="SmartKenya Team" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <CardContent className="p-6 md:p-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">{aboutContent.story.title}</h2>
                  <div className="space-y-4">
                    {aboutContent.story.paragraphs.map((paragraph, index) => (
                      <p key={index} className="text-muted-foreground leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Mission Section */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground">{aboutContent.mission.title}</h2>
                  </div>
                  <div className="space-y-4">
                    {aboutContent.mission.paragraphs.map((paragraph, index) => (
                      <p key={index} className="text-muted-foreground leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Values Section */}
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-6">Our Values</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aboutContent.values.map((value, index) => (
                    <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-6 flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          {valueIcons[value.name] || <Check className="w-6 h-6 text-primary" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">{value.name}</h3>
                          <p className="text-sm text-muted-foreground">{value.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              {/* CTA Section */}
              <Card className="border-0 bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="p-8 text-center">
                  <h2 className="text-2xl font-semibold text-foreground mb-3">{aboutContent.cta.title}</h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {aboutContent.cta.description}
                  </p>
                  <Button 
                    onClick={() => window.location.href = "/careers"}
                    className="px-8"
                  >
                    View Careers
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Content not available.</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default AboutPage;
