import React from 'react';
import { Star } from 'lucide-react';

interface GemFashionStyleProps {
  name: string;
  rating?: number;
  reviews?: number;
}

const GemFashionStyle: React.FC<GemFashionStyleProps> = ({ name, rating, reviews }) => {
  return (
    <div className="font-sans tracking-wide max-w-md p-4 bg-stone-50 rounded-xl shadow-sm border border-stone-100">
      {/* Brand & Product Title styling */}
      <h1 className="text-2xl font-light uppercase tracking-widest text-neutral-800 mb-2 font-serif">
        {name}
      </h1>
      
      {rating && (
        <div className="flex items-center gap-3 mt-3">
          {/* Custom Fashion Star Palette: Emerald / Gold Accent */}
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 transition-colors duration-300 ${
                  i < Math.floor(rating)
                    ? 'text-emerald-700 fill-emerald-700' // Rich Gem color
                    : 'text-stone-200'
                }`}
              />
            ))}
          </div>
          
          {/* Minimalist Review Count */}
          <span className="text-xs tracking-wider text-stone-500 uppercase font-medium">
            {reviews || 0} Client Reviews
          </span>
        </div>
      )}
    </div>
  );
};

export default GemFashionStyle;