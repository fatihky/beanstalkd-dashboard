import { cva, type VariantProps } from 'class-variance-authority';
import React, { type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const outline =
  'shadow-md hover:shadow-none bg-transparent border-2 transition hover:translate-y-1';

export const buttonVariants = cva(
  'font-head transition-all outline-hidden cursor-pointer duration-200 font-medium flex items-center',
  {
    variants: {
      variant: {
        default:
          'shadow-md hover:shadow-none bg-primary text-black border-2 border-black transition hover:translate-y-1 hover:bg-primary-hover',
        secondary:
          'shadow-md hover:shadow-none bg-secondary shadow-primary text-secondary-foreground border-2 border-black transition hover:translate-y-1',
        outline,
        link: 'bg-transparent hover:underline',
        danger: `${outline} border-red-600 text-red-600 shadow-red-900`,
      },
      size: {
        sm: 'px-3 py-1 text-sm shadow hover:shadow-none',
        md: 'px-4 py-1.5 text-base',
        lg: 'px-8 py-3 text-lg',
        icon: 'p-2',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  },
);

export interface IButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, IButtonProps>(
  (
    {
      children,
      size = 'md',
      className = '',
      variant = 'default',
      ...props
    }: IButtonProps,
    forwardedRef,
  ) => (
    <button
      ref={forwardedRef}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  ),
);

Button.displayName = 'Button';
