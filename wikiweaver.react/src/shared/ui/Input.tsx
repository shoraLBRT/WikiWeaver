import type { InputHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, ...props }: InputProps) => (
  <input
    className={cn(
      'w-full rounded-xl border border-[var(--color-border-soft)] bg-white px-3 py-2 text-sm text-[var(--color-ink-strong)] outline-none transition-colors placeholder:text-[var(--color-ink-subtle)] focus:border-[var(--color-brand-forest)] focus:ring-4 focus:ring-[var(--color-focus-ring)]',
      className,
    )}
    {...props}
  />
);
