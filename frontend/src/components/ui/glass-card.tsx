"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  animate?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  onClick = () => {},
  hover = false,
  glow = false,
  animate = false,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-card rounded-2xl p-6",
        hover && "glass-card-hover cursor-pointer",
        glow && "animate-pulse-glow",
        animate && "animate-fade-in-up opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

export function GlassInput({ icon, className, ...props }: GlassInputProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input
        className={cn(
          "w-full glass-input rounded-xl py-3 px-4 text-white placeholder:text-gray-500",
          icon && "pl-12",
          className
        )}
        {...props}
      />
    </div>
  );
}
