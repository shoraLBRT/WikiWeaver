import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'onClick'> & {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export const Switch = ({ checked, onChange, disabled, className, ...props }: SwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-[var(--color-focus-ring)]',
      checked ? 'bg-[var(--color-brand-forest)]' : 'bg-[var(--color-border-soft)]',
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      className,
    )}
    {...props}
  >
    <span
      className={cn(
        'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200',
        checked ? 'translate-x-4' : 'translate-x-0',
      )}
    />
  </button>
);

Switch.displayName = 'Switch';
