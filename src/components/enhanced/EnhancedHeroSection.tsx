
import { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronDown, Star, TrendingUp } from 'lucide-react';
import LazyImage from '@/components/LazyImage';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  badge?: string;
}

const heroSlides: HeroSlide[] = [
  {
    id: 1,
    title: "Summer Tech Sale",
    subtitle: "Latest Gadgets & Electronics",
    description: "Up to 50% off on premium electronics. Free delivery on orders over KES 10,000.",
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
    buttonText: "Shop Now",
    buttonLink: "/products",
    badge: "50% OFF"
  },
  {
    id: 2,
    title: "New Arrivals",
    subtitle: "Cutting-Edge Technology",
    description: "Discover the latest innovations in tech. Premium quality, best prices guaranteed.",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
    buttonText: "Explore Collection",
    buttonLink: "/products",
    badge: "NEW"
  },
  {
    id: 3,
    title: "Smart Living",
    subtitle: "Transform Your Lifestyle",
    description: "Smart home solutions that make life easier. Connect, control, and customize your space.",
    image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1",
    buttonText: "Discover More",
    buttonLink: "/products",
    badge: "TRENDING"
  },
];

const EnhancedHeroSection = memo(() => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const isMobile = isMobileUserAgent();

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const currentSlideData = heroSlides[currentSlide];

  // Dynamic height based on device type
  const heroHeight = isMobile ? 'min-h-[40vh]' : 'min-h-[70vh]';

  return (
    <section className={`relative overflow-hidden ${heroHeight} bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900`}>
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <LazyImage
          src={`${currentSlideData.image}?auto=format&fit=crop&w=1920&q=80&fm=webp`}
          alt={currentSlideData.title}
          priority={true}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className={`relative z-10 container mx-auto px-4 h-full ${heroHeight} flex items-center`}>
        <div className="max-w-2xl text-white">
          {/* Badge */}
          {currentSlideData.badge && (
            <div className="inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4 animate-pulse">
              <TrendingUp size={16} />
              {currentSlideData.badge}
            </div>
          )}

          {/* Subtitle */}
          <p className="text-gray-800 font-medium mb-2 tracking-wide uppercase text-sm">
            {currentSlideData.subtitle}
          </p>

          {/* Title */}
          <h1 className={`font-bold mb-4 leading-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent ${
            isMobile ? 'text-2xl md:text-4xl' : 'text-4xl md:text-6xl'
          }`}>
            {currentSlideData.title}
          </h1>

          {/* Description */}
          <p className={`mb-8 text-gray-200 leading-relaxed ${
            isMobile ? 'text-base md:text-lg' : 'text-lg md:text-xl'
          }`}>
            {currentSlideData.description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button 
              asChild 
              size={isMobile ? "default" : "lg"}
              className="bg-gray-800 hover:bg-gray-600 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <Link to={currentSlideData.buttonLink}>
                {currentSlideData.buttonText}
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size={isMobile ? "default" : "lg"}
              className="border-white text-gray-900 hover:bg-white hover:text-gray-900 font-semibold px-8 py-4 rounded-lg transition-all duration-300"
            >
              <Link to="/products">
                Browse Categories
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gray-400 text-gray-400" />
                ))}
              </div>
              <span>4.8/5 Customer Rating</span>
            </div>
            <div className="hidden sm:block">•</div>
            <div className="hidden sm:block">Free Delivery KES 10,000+</div>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'w-12 bg-gray-800' 
                : 'w-2 bg-white/60 hover:bg-white/80'
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Scroll Indicator - Only show on desktop */}
      {!isMobile && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
          <ChevronDown size={24} />
        </div>
      )}
    </section>
  );
});

EnhancedHeroSection.displayName = 'EnhancedHeroSection';

export default EnhancedHeroSection;
