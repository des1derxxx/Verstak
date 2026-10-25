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
        'relative [&>span]:absolute [&>span]:top-[-3px] [&>span]:right-[-4px] [&>span]:min-w-[15px]',
        '[&>span]:py-px [&>span]:px-[3px] [&>span]:rounded-lg [&>span]:bg-[#c9372c] [&>span]:text-white',
        '[&>span]:text-[9px] [&>span]:leading-[13px] [&>span]:font-bold',
      )}
      aria-label={unread ? `Уведомления: ${unread} непрочитанных` : 'Уведомления'}
      onClick={onOpen}
    >
      <Bell size={19} />
      {unread > 0 && <span>{unread > 99 ? '99+' : unread}</span>}
    </IconButton>
  );
};
