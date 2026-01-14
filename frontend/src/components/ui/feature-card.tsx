"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient?: string;
  className?: string;
  delay?: number;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient = "from-violet-500 to-purple-500",
  className,
  delay = 0,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "glass-card glass-card-hover rounded-2xl p-6 opacity-0 animate-fade-in-up",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center mb-5",
          "bg-linear-to-br",
          gradient
        )}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

interface StatCardProps {
  value: string;
  label: string;
  icon?: LucideIcon;
  delay?: number;
}

export function StatCard({
  value,
  label,
  icon: Icon,
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className="text-center opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        {Icon && <Icon className="w-6 h-6 text-violet-400" />}
        <span className="text-4xl font-bold gradient-text">{value}</span>
      </div>
      <p className="text-gray-400">{label}</p>
    </div>
  );
}
