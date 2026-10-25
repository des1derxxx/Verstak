import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/ui/cn';
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'default' | 'compact';
};
const variants = {
  primary: 'primary bg-brand text-white hover:bg-brand-hover',
  secondary: 'secondary border-line bg-white text-[#44546f] hover:bg-[#f1f2f4]',
  danger: 'danger-button bg-danger text-white hover:bg-[#ae2e24]',
};
const sizes = {
  default: 'min-h-9 px-[13px] py-[7px] text-sm',
  compact: 'compact min-h-8 px-2.5 py-[5px] text-[13px]',
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
      'button inline-flex items-center justify-center gap-[7px] rounded border border-transparent font-medium leading-5 whitespace-nowrap',
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
      'icon-button inline-flex size-[30px] shrink-0 items-center justify-center rounded p-[5px] hover:bg-[#091e420f]',
      tone === 'danger' ? 'danger text-danger' : 'text-muted hover:text-ink',
      className,
    )}
  />
);
