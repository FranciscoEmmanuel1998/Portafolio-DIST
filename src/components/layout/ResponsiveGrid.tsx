import React from 'react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ResponsiveGridProps {
  children: ReactNode;
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
    wide: number;
  };
  gap?: number;
  className?: string;
}

/**
 * Professional Responsive Grid System
 * 
 * NO MORE ABSOLUTE POSITIONING CHAOS
 * Proper responsive design for all screen sizes
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3, wide: 4 },
  gap = 6,
  className = ''
}) => {
  const gridClasses = [
    `grid`,
    `grid-cols-${columns.mobile}`,
    `md:grid-cols-${columns.tablet}`,
    `lg:grid-cols-${columns.desktop}`,
    `xl:grid-cols-${columns.wide}`,
    `gap-${gap}`,
    className
  ].join(' ');

  return (
    <motion.div
      className={gridClasses}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
};

interface GridItemProps {
  children: ReactNode;
  span?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    wide?: number;
  };
  className?: string;
}

export const GridItem: React.FC<GridItemProps> = ({
  children,
  span = {},
  className = ''
}) => {
  const spanClasses = [
    span.mobile && `col-span-${span.mobile}`,
    span.tablet && `md:col-span-${span.tablet}`,
    span.desktop && `lg:col-span-${span.desktop}`,
    span.wide && `xl:col-span-${span.wide}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <motion.div
      className={spanClasses}
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

// Predefined responsive breakpoints for trading dashboard
export const TradingLayoutConfigs = {
  // Main dashboard layout
  dashboard: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
    wide: 4
  },
  
  // Chart grid layout
  charts: {
    mobile: 1,
    tablet: 1,
    desktop: 2,
    wide: 3
  },
  
  // Sidebar panels layout
  panels: {
    mobile: 1,
    tablet: 2,
    desktop: 1,
    wide: 1
  },
  
  // Alert and indicator layout
  widgets: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
    wide: 4
  }
} as const;
