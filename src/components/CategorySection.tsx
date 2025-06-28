
import { useCategories } from '@/hooks/useCategories';
import { Link } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import CategoriesSkeleton from './skeletons/CategoriesSkeleton';
import OptimizedImage from './OptimizedImage';
import { useImagePreloader } from '@/hooks/useImagePreloader';

const placeholderImages = [
  "https://images.unsplash.com/photo-1498049794561-7780e7231661",
  "https://images.unsplash.com/photo-1445205170230-053b83016050",
  "https://images.unsplash.com/photo-1556911220-bff31c812dba",
  "https://images.unsplash.com/photo-1571781926291-c477ebfd024b",
  "https://images.unsplash.com/photo-1517649763962-0c623066013b",
  "https://images.unsplash.com/photo-1495446815901-a7297e633e8d",
];

const CategorySection = () => {
  const { categories } = useCategories();
  const { isLoading } = useImagePreloader({ 
    images: placeholderImages,
    priority: true 
  });

  return (
    <section className="py-12">
      {isLoading ? (
        <CategoriesSkeleton />
      ) : (
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.length === 0 ? (
              <p className="text-center col-span-full">No categories found.</p>
            ) : (
              categories.map((category, index) => {
                const image = placeholderImages[index % placeholderImages.length];
                const itemCount = Math.floor(Math.random() * 500) + 50;

                return (
                  <Link key={category.id} to={`/products?category=${encodeURIComponent(category.category)}`}>
                    <Card className="h-full overflow-hidden transition-transform hover:scale-105">
                      <div className="aspect-square relative">
                        <OptimizedImage
                          src={image}
                          alt={category.category}
                          width={50}
                          height={50}
                          aspectRatio="square"
                          className="object-cover w-full h-full"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                          priority={index < 6} // Prioritize first 6 images
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                          <h3 className="text-white font-medium">{category.category}</h3>
                          <p className="text-white/80 text-sm">{itemCount} items</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default CategorySection;
