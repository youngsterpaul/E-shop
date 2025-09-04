
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
    image: "/hero1.webp",
    buttonText: "Shop Now",
    buttonLink: "/products",
    badge: "50% OFF"
  },
  {
    id: 2,
    title: "New Arrivals",
    subtitle: "Cutting-Edge Technology",
    description: "Discover the latest innovations in tech. Premium quality, best prices guaranteed.",
    image: "/hero2.jpg",
    buttonText: "Explore Collection",
    buttonLink: "/products",
    badge: "NEW"
  },
  {
    id: 3,
    title: "Smart Living",
    subtitle: "Transform Your Lifestyle",
    description: "Smart home solutions that make life easier. Connect, control, and customize your space.",
    image: "/hero3.webp",
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
  const heroHeight = isMobile ? 'h-[180px]' : 'h-[500px]';

  return (
    <section className={`relative overflow-hidden ${heroHeight} bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 ${!isMobile ? '' : 'mx-2 rounded-lg mt-4' }`}>
      {/* Background Image with Overlay */}
      <div className="/absolute inset-0 aspect-square/ ">
        <LazyImage
          src={`${currentSlideData.image}`}
          alt={currentSlideData.title}
          priority={true}
          width={100}
          height={100}
          className="w-full h-2/3 object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
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
