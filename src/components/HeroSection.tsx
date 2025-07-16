
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import HeroSkeleton from './skeletons/HeroSkeleton';
import { useImagePreloader } from '@/hooks/useImagePreloader';

interface HeroSlide {
  id: number;
  title: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
}

const heroSlides: HeroSlide[] = [
  {
    id: 1,
    title: "Summer Sale",
    description: "Up to 50% off on all summer items. Limited time offer.",
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
    buttonText: "Shop Now",
    buttonLink: "/products",
  },
  {
    id: 2,
    title: "New Arrivals",
    description: "Check out our latest products. Fresh designs for you.",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
    buttonText: "Explore",
    buttonLink: "/products",
  },
  {
    id: 3,
    title: "Tech Gadgets",
    description: "Discover amazing tech gadgets for your everyday life.",
    image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1",
    buttonText: "View Collection",
    buttonLink: "/products",
  },
];

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroImages = heroSlides.map(slide => slide.image);
  const { isLoading } = useImagePreloader({ 
    images: heroImages,
    priority: true 
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return <HeroSkeleton />;
  }

  return (
    <section>
      <div className="relative overflow-hidden h-[300px] sm:h-[400px] md:h-[500px]">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${slide.image}?auto=format&fit=crop&w=1200&q=80&fm=webp)` 
              }}
            >
              <div className="absolute inset-0 bg-black/40" />
            </div>

            <div className="container h-full flex items-center justify-center relative z-10">
              <div className="text-center text-white max-w-xl px-4">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">{slide.title}</h1>
                <p className="text-sm md:text-lg mb-6">{slide.description}</p>
                <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600">
                  <Link to={slide.buttonLink}>{slide.buttonText}</Link>
                </Button>
              </div>
            </div>
          </div>
        ))}

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide ? 'w-8 bg-orange-500' : 'w-2 bg-white/60'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
