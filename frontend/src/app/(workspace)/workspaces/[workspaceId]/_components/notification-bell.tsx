'use client';

import { IconButton } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/queries/notifications';
export const NotificationBell = ({ onOpen }: { onOpen: () => void }) => {
  const { data = [] } = useNotifications({ poll: true });
  const unread = data.filter((item) => !item.readAt).length;
  return (
    <IconButton
      className={cn(
        'notification-bell',
        'relative [&>span]:absolute [&>span]:-top-0.75 [&>span]:-right-1 [&>span]:min-w-3.75',
        '[&>span]:py-px [&>span]:px-0.75 [&>span]:rounded-lg [&>span]:bg-danger [&>span]:text-white',
        '[&>span]:text-micro [&>span]:leading-3.25 [&>span]:font-bold',
      )}
      aria-label={unread ? `Уведомления: ${unread} непрочитанных` : 'Уведомления'}
      onClick={onOpen}
    >
      <Bell size={19} />
      {unread > 0 && <span>{unread > 99 ? '99+' : unread}</span>}
    </IconButton>
  );
};
