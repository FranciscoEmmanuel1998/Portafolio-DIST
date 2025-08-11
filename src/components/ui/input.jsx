import { cn } from '@/lib/utils';
import React from 'react';
import { Search } from 'lucide-react';

const Input = React.forwardRef(({ className, type, icon, ...props }, ref) => {
  const hasIcon = React.isValidElement(icon);
  return (
    <div className={cn('relative flex items-center', className)}>
      {hasIcon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {React.cloneElement(icon, { className: cn('h-4 w-4 text-muted-foreground', icon.props.className) })}
        </div>
      )}
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          hasIcon ? 'pl-10' : '',
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
});
Input.displayName = 'Input';

export { Input };
