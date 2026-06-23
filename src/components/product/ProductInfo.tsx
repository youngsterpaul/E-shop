import { Star } from 'lucide-react';

interface ProductInfoProps {
  name: string;
  rating?: number;
  reviews?: number;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ name, rating, reviews }) => {
  return (
    <div>
      <h1 className="text-md font-bold text-gray-900">
        {name}
      </h1>
      {rating && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">({reviews || 0} reviews)</span>
        </div>
      )}
    </div>
  );
};

export default ProductInfo;
