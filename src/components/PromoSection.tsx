
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const PromoSection = () => {
  return (
    <section className="py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative overflow-hidden rounded-lg group h-[250px]">
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80" 
              alt="Electronics Sale" 
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/50 flex flex-col justify-center p-8">
              <h3 className="text-white text-3xl font-bold mb-2">
                Electronics Sale
              </h3>
              <p className="text-white/80 mb-4">
                Up to 40% off on selected items
              </p>
              <Button asChild className="w-fit bg-orange-500 hover:bg-orange-600">
                <Link to="/categories/electronics">Shop Now</Link>
              </Button>
            </div>
          </div>
          
          <div className="relative overflow-hidden rounded-lg group h-[250px]">
            <img 
              src="https://images.unsplash.com/photo-1721322800607-8c38375eef04?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80" 
              alt="Home Decor" 
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/50 flex flex-col justify-center p-8">
              <h3 className="text-white text-3xl font-bold mb-2">
                Home & Living
              </h3>
              <p className="text-white/80 mb-4">
                New collection available now
              </p>
              <Button asChild className="w-fit bg-orange-500 hover:bg-orange-600">
                <Link to="/categories/home">Discover</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoSection;
