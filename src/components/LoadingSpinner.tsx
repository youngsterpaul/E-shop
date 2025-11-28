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
  text = "Loading",
  overlay = false,
  className,
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div
          className={cn(
            "rounded-full border-[3px] border-primary/20",
            sizeClasses[size]
          )}
        />
        <div
          className={cn(
            "absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin",
            sizeClasses[size]
          )}
          style={{ animationDuration: "0.8s" }}
        />
      </div>
      {text && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-foreground/80 text-sm font-medium tracking-wide">
            {text}
          </p>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-md z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-screen bg-background",
        className
      )}
    >
      {spinner}
    </div>
  );
};

export default LoadingSpinner;
