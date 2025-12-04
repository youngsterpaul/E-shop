import { useEffect, useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Testimonial {
  id: string;
  customer_name: string;
  customer_title: string | null;
  customer_image: string | null;
  content: string;
  rating: number;
}

interface TestimonialsProps {
  variant?: 'default' | 'carousel' | 'grid';
  maxItems?: number;
  className?: string;
}

export const Testimonials = ({ 
  variant = 'default',
  maxItems = 6,
  className = '' 
}: TestimonialsProps) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('id, customer_name, customer_title, customer_image, content, rating')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(maxItems);

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  if (loading || testimonials.length === 0) {
    return null;
  }

  if (variant === 'carousel') {
    const current = testimonials[currentIndex];
    return (
      <section className={`py-12 ${className}`}>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">What Our Customers Say</h2>
          <p className="text-muted-foreground">Trusted by thousands of happy customers</p>
        </div>
        
        <div className="relative max-w-3xl mx-auto px-4">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 p-8 text-center">
            <Quote className="w-10 h-10 text-primary/20 mx-auto mb-4" />
            
            {current.customer_image ? (
              <img
                src={current.customer_image}
                alt={current.customer_name}
                className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {current.customer_name.charAt(0)}
                </span>
              </div>
            )}
            
            <p className="text-lg text-foreground mb-4 italic">"{current.content}"</p>
            
            <div className="flex items-center justify-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < current.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            
            <h4 className="font-semibold text-foreground">{current.customer_name}</h4>
            {current.customer_title && (
              <p className="text-sm text-muted-foreground">{current.customer_title}</p>
            )}
          </Card>

          {testimonials.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full"
                onClick={prevSlide}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full"
                onClick={nextSlide}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center justify-center gap-2 mt-4">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  if (variant === 'grid') {
    return (
      <section className={`py-12 ${className}`}>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">What Our Customers Say</h2>
          <p className="text-muted-foreground">Trusted by thousands of happy customers</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card 
              key={testimonial.id} 
              className="bg-card/80 backdrop-blur-sm border-border/50 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                {testimonial.customer_image ? (
                  <img
                    src={testimonial.customer_image}
                    alt={testimonial.customer_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {testimonial.customer_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-foreground">{testimonial.customer_name}</h4>
                  {testimonial.customer_title && (
                    <p className="text-xs text-muted-foreground">{testimonial.customer_title}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < testimonial.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-4">"{testimonial.content}"</p>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  // Default variant - single featured testimonial
  const featured = testimonials[0];
  return (
    <section className={`py-12 ${className}`}>
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 p-8 text-center max-w-2xl mx-auto">
        <Quote className="w-8 h-8 text-primary/30 mx-auto mb-4" />
        <p className="text-lg text-foreground mb-4 italic">"{featured.content}"</p>
        <div className="flex items-center justify-center gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < featured.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          ))}
        </div>
        <h4 className="font-semibold text-foreground">{featured.customer_name}</h4>
        {featured.customer_title && (
          <p className="text-sm text-muted-foreground">{featured.customer_title}</p>
        )}
      </Card>
    </section>
  );
};

export default Testimonials;
