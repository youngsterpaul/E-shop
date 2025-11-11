interface PriceDisplayProps {
  currentPrice: number;
  originalPrice?: number;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ currentPrice, originalPrice }) => {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(price);

  const showOriginalPrice = originalPrice && currentPrice !== originalPrice;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold text-orange-500">
          {formatPrice(currentPrice)}
        </span>
        {showOriginalPrice && (
          <span className="text-xl text-gray-500 line-through">
            {formatPrice(originalPrice)}
          </span>
        )}
      </div>
    </div>
  );
};

export default PriceDisplay;
