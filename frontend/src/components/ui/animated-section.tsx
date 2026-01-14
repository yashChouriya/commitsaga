'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-down' | 'scale' | 'slide-left' | 'slide-right';
  delay?: number;
}

export function AnimatedSection({
  children,
  className,
  animation = 'fade-up',
  delay = 0,
}: AnimatedSectionProps) {
  const animationClasses = {
    'fade-up': 'animate-fade-in-up',
    'fade-down': 'animate-fade-in-down',
    'scale': 'animate-scale-in',
    'slide-left': 'animate-slide-in-left',
    'slide-right': 'animate-slide-in-right',
  };

  const delayClasses: Record<number, string> = {
    0: '',
    100: 'animation-delay-100',
    200: 'animation-delay-200',
    300: 'animation-delay-300',
    400: 'animation-delay-400',
    500: 'animation-delay-500',
    600: 'animation-delay-600',
    700: 'animation-delay-700',
    800: 'animation-delay-800',
    1000: 'animation-delay-1000',
  };

  return (
    <div
      className={cn(
        'opacity-0',
        animationClasses[animation],
        delayClasses[delay] || '',
        className
      )}
      style={delay && !delayClasses[delay] ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
