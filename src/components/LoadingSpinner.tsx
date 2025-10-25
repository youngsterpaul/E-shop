import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  overlay?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  text = "Loading, please wait...",
  overlay = false,
  className,
}) => {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-3",
    lg: "w-16 h-16 border-4",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div
        className={cn(
          "rounded-full border-solid border-t-green-500 border-r-green-500 border-l-transparent border-b-transparent animate-spin",
          sizeClasses[size]
        )}
        style={{ animationDuration: "0.9s" }}
      ></div>
      {text && (
        <p className="text-gray-700 text-sm md:text-base font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-screen bg-white",
        className
      )}
    >
      {spinner}
    </div>
  );
};

export default LoadingSpinner;
