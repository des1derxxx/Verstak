import { cn } from '@/lib/cn';
export const Logo = () => {
  return (
    <div
      className={cn(
        'auth-logo flex items-center gap-[9px] text-[#253858] text-[29px] font-bold tracking-[-.8px]',
        '[&_.brand-mark]:w-[31px] [&_.brand-mark]:h-[33px] [&_.brand-mark]:text-[25px]',
        '[&_.brand-mark]:font-semibold [&_.brand-period]:hidden',
      )}
    >
      <span
        className={cn(
          'brand-mark w-7 h-7.5 inline-flex items-center justify-center bg-brand rounded-[5px] text-white',
          '[&_svg]:w-[27px] [&_svg]:h-[27px]',
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
