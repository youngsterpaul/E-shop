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
    <div className="flex flex-col items-center justify-center gap-5">
      <div className="relative">
        <div
          className={cn(
            "rounded-full border-[4px] border-orange-200/70 bg-white/70 shadow-[0_0_0_8px_rgba(249,115,22,0.08)]",
            sizeClasses[size]
          )}
        />
        <div
          className={cn(
            "absolute inset-0 rounded-full border-[4px] border-transparent border-t-orange-500 animate-spin",
            sizeClasses[size]
          )}
          style={{ animationDuration: "0.8s" }}
        />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-orange-100 via-orange-50 to-white" />
      </div>
      {text && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-foreground/80 text-sm font-semibold tracking-[0.2em] uppercase">
            {text}
          </p>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-orange-300 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[rgba(255,250,245,0.8)] backdrop-blur-md z-50">
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
