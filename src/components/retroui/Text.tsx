import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { cn } from '@/lib/utils';

const textVariants = cva('font-head', {
  variants: {
    as: {
      p: 'font-sans text-base',
      li: 'font-sans text-base',
      a: 'font-sans text-base hover:underline underline-offset-2 decoration-primary',
      h1: 'text-4xl lg:text-5xl font-bold',
      h2: 'text-3xl lg:text-4xl font-semibold',
      h3: 'text-2xl font-medium',
      h4: 'text-xl font-normal',
      h5: 'text-lg font-normal',
      h6: 'text-base font-normal',
    },
  },
  defaultVariants: {
    as: 'p',
  },
});

type AsProp<T extends ElementType> = {
  as?: T;
};

type TextProps<T extends ElementType = 'p'> = AsProp<T> &
  Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'> &
  VariantProps<typeof textVariants> & {
    className?: string;
  };

export const Text = <T extends ElementType = 'p'>(props: TextProps<T>) => {
  const { className, as, ...otherProps } = props;
  const Tag: ElementType = as || 'p';

  return (
    <Tag
      className={cn(textVariants({ as: as as any }), className)}
      {...otherProps}
    />
  );
};
