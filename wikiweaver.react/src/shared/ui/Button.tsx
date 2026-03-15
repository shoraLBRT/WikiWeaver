import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-[var(--color-brand-forest)] bg-[var(--color-brand-forest)] text-white hover:bg-[var(--color-brand-forest-strong)] hover:border-[var(--color-brand-forest-strong)]',
  secondary:
    'border border-[var(--color-border-soft)] bg-white text-[var(--color-ink-default)] hover:bg-[var(--color-surface-muted)]',
  ghost:
    'border border-transparent bg-transparent text-[var(--color-ink-muted)] hover:bg-[var(--color-page-panel)] hover:text-[var(--color-ink-strong)]',
};

export const Button = ({ className, variant = 'secondary', type = 'button', ...props }: ButtonProps) => (
  <button
    type={type}
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-4 focus:ring-[var(--color-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60',
      variantClasses[variant],
      className,
    )}
    {...props}
  />
);
