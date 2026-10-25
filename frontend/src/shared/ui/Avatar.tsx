import { cn } from '@/shared/ui/cn';
import { useState } from 'react';
import type { User } from '@/shared/api/types';
/** One avatar presentation everywhere; a failed image falls back to initials. */
export const Avatar = ({
  user,
  className = '',
}: {
  user: Pick<User, 'name' | 'avatarUrl'>;
  className?: string;
}) => {
  const [failed, setFailed] = useState('');
  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('ru');
  return (
    <span
      className={cn(
        'avatar inline-flex items-center justify-center w-7.5 h-7.5 shrink-0 rounded-full bg-[#deebff]',
        'text-[#0747a6] text-xs font-semibold overflow-hidden [&_img]:w-full [&_img]:h-full',
        '[&_img]:[object-fit:cover] [&.profile-avatar]:w-21 [&.profile-avatar]:h-21',
        '[&.profile-avatar]:text-[28px]',
        className,
      )}
      aria-hidden="true"
    >
      {user.avatarUrl && failed !== user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" onError={() => setFailed(user.avatarUrl!)} />
      ) : (
        initials
      )}
    </span>
  );
};
