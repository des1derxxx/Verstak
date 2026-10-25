import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'default' | 'compact';
};
const variants = {
  primary: 'primary bg-brand text-white hover:bg-brand-hover',
  secondary: 'secondary border-line bg-surface text-ink-secondary hover:bg-neutral',
  danger: 'danger-button bg-danger text-white hover:bg-danger-strong',
};
const sizes = {
  default: 'min-h-9 px-3.25 py-1.75 text-sm',
  compact: 'compact min-h-8 px-2.5 py-1.25 text-body',
};
export const Button = ({
  variant = 'secondary',
  size = 'default',
  className,
  type = 'button',
  ...props
}: ButtonProps) => (
  <button
    {...props}
    type={type}
    className={cn(
      'button inline-flex items-center justify-center gap-1.75 rounded border border-transparent font-medium leading-5 whitespace-nowrap',
      variants[variant],
      sizes[size],
      className,
    )}
  />
);
type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'muted' | 'danger';
};
export const IconButton = ({
  tone = 'muted',
  className,
  type = 'button',
  ...props
}: IconButtonProps) => (
  <button
    {...props}
    type={type}
    className={cn(
      'icon-button inline-flex size-7.5 shrink-0 items-center justify-center rounded p-1.25 hover:bg-overlay-pressed',
      tone === 'danger' ? 'danger text-danger' : 'text-muted hover:text-ink',
      className,
    )}
  />
);
