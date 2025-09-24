import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'shopping-cart' | 'boxes' | 'wave' | 'cube' | 'gradient-spin' | 'pulse-rings';
  text?: string;
  className?: string;
  overlay?: boolean;
  color?: 'primary' | 'secondary' | 'white';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'shopping-cart',
  text,
  className,
  overlay = false,
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const colorClasses = {
    primary: 'text-orange-500',
    secondary: 'text-gray-600',
    white: 'text-white'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'shopping-cart':
        return (
          <div className={cn('relative', sizeClasses[size])}>
            <div className="absolute inset-0 animate-spin">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                <path
                  d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 16.1 19 15 19H9C7.9 19 7 18.1 7 17V13M17 13H7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={colorClasses[color]}
                />
              </svg>
            </div>
            <div className="absolute inset-0 animate-pulse">
              <div className={cn(
                'w-2 h-2 rounded-full absolute top-3 right-3 animate-bounce',
                color === 'primary' ? 'bg-orange-400' : color === 'white' ? 'bg-white' : 'bg-gray-400'
              )} style={{ animationDelay: '0.1s' }} />
              <div className={cn(
                'w-1.5 h-1.5 rounded-full absolute bottom-4 left-4 animate-bounce',
                color === 'primary' ? 'bg-orange-400' : color === 'white' ? 'bg-white' : 'bg-gray-400'
              )} style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        );

      case 'boxes':
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-lg animate-pulse',
                  size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : size === 'lg' ? 'w-8 h-8' : 'w-12 h-12',
                  color === 'primary' ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 
                  color === 'white' ? 'bg-white' : 'bg-gray-400'
                )}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.4s'
                }}
              />
            ))}
          </div>
        );

      case 'wave':
        return (
          <div className="flex space-x-1 items-end">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full animate-bounce',
                  size === 'sm' ? 'w-2 h-6' : size === 'md' ? 'w-3 h-8' : size === 'lg' ? 'w-4 h-12' : 'w-6 h-16',
                  color === 'primary' ? 'bg-gradient-to-t from-orange-600 to-orange-400' : 
                  color === 'white' ? 'bg-white' : 'bg-gray-400'
                )}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1.0s'
                }}
              />
            ))}
          </div>
        );

      case 'cube':
        return (
          <div className={cn('relative', sizeClasses[size])}>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }}>
              <div className={cn(
                'w-full h-full border-4 border-transparent rounded-lg',
                color === 'primary' ? 'border-l-orange-500 border-t-orange-400' : 
                color === 'white' ? 'border-l-white border-t-gray-200' : 'border-l-gray-600 border-t-gray-400'
              )} />
            </div>
            <div className="absolute inset-2 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}>
              <div className={cn(
                'w-full h-full border-2 border-transparent rounded',
                color === 'primary' ? 'border-r-orange-400 border-b-orange-300' : 
                color === 'white' ? 'border-r-gray-200 border-b-gray-300' : 'border-r-gray-400 border-b-gray-300'
              )} />
            </div>
          </div>
        );

      case 'gradient-spin':
        return (
          <div className={cn('relative', sizeClasses[size])}>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '1s' }}>
              <div className={cn(
                'w-full h-full rounded-full',
                color === 'primary' ? 'bg-gradient-to-r from-orange-400 via-orange-500 to-transparent' : 
                color === 'white' ? 'bg-gradient-to-r from-white via-gray-200 to-transparent' : 'bg-gradient-to-r from-gray-400 via-gray-600 to-transparent'
              )} />
            </div>
            <div className="absolute inset-2 bg-white rounded-full" />
          </div>
        );

      case 'pulse-rings':
        return (
          <div className={cn('relative', sizeClasses[size])}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'absolute inset-0 rounded-full border-2 animate-ping',
                  color === 'primary' ? 'border-orange-400' : 
                  color === 'white' ? 'border-white' : 'border-gray-400'
                )}
                style={{
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: '2s'
                }}
              />
            ))}
            <div className={cn(
              'absolute inset-4 rounded-full',
              color === 'primary' ? 'bg-orange-500' : 
              color === 'white' ? 'bg-white' : 'bg-gray-600'
            )} />
          </div>
        );

      default:
        return null;
    }
  };

  const motivationalTexts = [
    "Loading your amazing products...",
    "Preparing something special...",
    "Almost ready to shop...",
    "Curating the best deals...",
    //"Setting up your experience..."
  ];

  const displayText = text || motivationalTexts[Math.floor(Math.random() * motivationalTexts.length)];

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-6',
      className
    )}>
      <div className="relative">
        {renderSpinner()}
        
        {/* Add some sparkle effects for extra flair */}
        {variant === 'shopping-cart' && (
          <>
            <div className="absolute -top-2 -right-2 w-1 h-1 bg-yellow-400 rounded-full animate-pulse" 
                 style={{ animationDelay: '0.5s' }} />
            <div className="absolute -bottom-1 -left-1 w-0.5 h-0.5 bg-yellow-400 rounded-full animate-pulse" 
                 style={{ animationDelay: '1s' }} />
          </>
        )}
      </div>
      
      {displayText && (
        <div className="text-center space-y-2">
          <p className={cn(
            'font-medium text-gray-700 animate-pulse',
            textSizeClasses[size],
            color === 'white' && 'text-white'
          )}>
            {displayText}
          </p>
          
          {/* Progress dots */}
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full animate-bounce',
                  color === 'primary' ? 'bg-orange-400' : 
                  color === 'white' ? 'bg-white' : 'bg-gray-400'
                )}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-white via-gray-50 to-orange-50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-white/60" />
        <div className="relative z-10">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-gray-50 to-orange-50">
      {content}
    </div>
  );
};

export default LoadingSpinner;