import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...props }: CardProps) => (
  <div
    className={cn(
      'rounded-[var(--radius-card)] bg-[var(--color-surface)] text-[var(--color-ink-default)] shadow-[var(--shadow-soft)]',
      className,
    )}
    {...props}
  />
);
