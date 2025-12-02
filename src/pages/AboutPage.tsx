import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useAboutContent } from '@/hooks/useSiteContent';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Users, DollarSign, Shield } from 'lucide-react';

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
          "name": "About SmartKenya - SmartKenya",
          "description": "Know more about SmartKenya",
          "url": "https://smartkenya.co.ke/about",
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
                "item": "https://smartkenya.co.ke/about"
              }
            ]
          }
        })}
      </script>
          
      <div className={`min-h-screen ${!isMobile ? 'min-w-max' : ''}`}>
        <main className={`flex-grow mx-auto px-4 container py-8 ${!isMobile ? 'xl:px-24' : ''}`}>
          <h1 className="text-3xl font-bold mb-6">About SmartKenya</h1>
          
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          ) : aboutContent ? (
            <>
              {/* Our Story Section */}
              <div className="bg-card rounded-lg shadow-md overflow-hidden mb-8">
                <img 
                  src="/placeholder.svg"
                  alt="SmartKenya Team" 
                  className="w-full h-64 object-cover" 
                />
                <div className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">{aboutContent.story.title}</h2>
                  {aboutContent.story.paragraphs.map((paragraph, index) => (
                    <p key={index} className="text-muted-foreground mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
              
              {/* Mission Section */}
              <div className="bg-card rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-4">{aboutContent.mission.title}</h2>
                {aboutContent.mission.paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-muted-foreground mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
              
              {/* Values Section */}
              <div className="bg-card rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {aboutContent.values.map((value, index) => (
                    <div key={index} className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                      <div className="bg-primary/10 p-3 rounded-full mb-3">
                        {valueIcons[value.name] || <Check className="w-6 h-6 text-primary" />}
                      </div>
                      <h3 className="font-medium mb-2">{value.name}</h3>
                      <p className="text-muted-foreground text-sm">{value.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* CTA Section */}
              <div className="bg-primary/10 rounded-lg shadow-sm p-6 text-center">
                <h2 className="text-2xl font-semibold mb-4">{aboutContent.cta.title}</h2>
                <p className="text-muted-foreground mb-6">
                  {aboutContent.cta.description}
                </p>
                <Button 
                  onClick={() => window.location.href = "/careers"}
                  className="bg-primary hover:bg-primary/90"
                >
                  View Careers
                </Button>
              </div>
            </>
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
