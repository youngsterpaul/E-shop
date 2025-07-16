
interface PasswordStrengthIndicatorProps {
  password: string;
  score: number;
}

const PasswordStrengthIndicator = ({ password, score }: PasswordStrengthIndicatorProps) => {
  if (!password) return null;

  const getStrengthText = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return 'Very weak';
      case 2:
        return 'Weak';
      case 3:
        return 'Fair';
      case 4:
        return 'Good';
      case 5:
        return 'Strong';
      default:
        return 'Very weak';
    }
  };

  const getStrengthColor = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-blue-500';
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-red-500';
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-500">Password strength</span>
        <span className={`font-medium ${
          score <= 1 ? 'text-red-600' :
          score === 2 ? 'text-orange-600' :
          score === 3 ? 'text-yellow-600' :
          score === 4 ? 'text-blue-600' :
          'text-green-600'
        }`}>
          {getStrengthText(score)}
        </span>
      </div>
      <div className="flex space-x-1">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full ${
              index < score ? getStrengthColor(score) : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
