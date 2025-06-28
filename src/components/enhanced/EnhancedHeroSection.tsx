
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const heroSlides = [
  {
    id: 1,
    title: "Latest Smartphones",
    subtitle: "Up to 50% Off",
    description: "Discover the newest iPhone, Samsung, and Android devices",
    image: "/placeholder.svg",
    cta: "Shop Now",
    backgroundColor: "bg-gradient-to-r from-blue-600 to-purple-600"
  },
  {
    id: 2,
    title: "Gaming Laptops",
    subtitle: "Performance Unleashed",
    description: "High-end gaming laptops for the ultimate experience",
    image: "/placeholder.svg",
    cta: "Explore",
    backgroundColor: "bg-gradient-to-r from-red-600 to-orange-600"
  },
  {
    id: 3,
    title: "Smart Home Devices",
    subtitle: "Connect Your World",
    description: "Transform your home with smart technology",
    image: "/placeholder.svg",
    cta: "Discover",
    backgroundColor: "bg-gradient-to-r from-green-600 to-teal-600"
  }
];

const EnhancedHeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-64 md:h-96 lg:h-[500px]">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            } ${slide.backgroundColor}`}
          >
            <div className="container mx-auto px-4 h-full flex items-center">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center w-full">
                <div className="text-white space-y-4">
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold">
                    {slide.title}
                  </h2>
                  <p className="text-xl md:text-2xl font-semibold text-yellow-300">
                    {slide.subtitle}
                  </p>
                  <p className="text-lg opacity-90">
                    {slide.description}
                  </p>
                  <Button 
                    size={isMobile ? "default" : "lg"} 
                    className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    {slide.cta}
                  </Button>
                </div>
                {!isMobile && (
                  <div className="hidden lg:block">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-64 object-cover rounded-lg shadow-2xl"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default EnhancedHeroSection;
