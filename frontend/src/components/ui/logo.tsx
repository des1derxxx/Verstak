import { cn } from '@/lib/cn';
export const Logo = () => {
  return (
    <div
      className={cn(
        'auth-logo flex items-center gap-2.25 text-ink-strong text-hero font-bold tracking-[-.8px]',
        '[&_.brand-mark]:w-7.75 [&_.brand-mark]:h-8.25 [&_.brand-mark]:text-display-sm',
        '[&_.brand-mark]:font-semibold [&_.brand-period]:hidden',
      )}
    >
      <span
        className={cn(
          'brand-mark w-7 h-7.5 inline-flex items-center justify-center bg-brand rounded-card text-white',
          '[&_svg]:w-6.75 [&_svg]:h-6.75',
        )}
      >
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="m7 8 9 17 9-17M12 8l4 8 4-8"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      Verstak
    </div>
  );
};
