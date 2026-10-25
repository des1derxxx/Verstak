import { IconButton } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Modal } from '@/components/ui/modal';
import { formatTime } from '@/lib/dates';
type Notification = {
  id: string;
  workspaceId: string;
  taskId: string;
  taskKey: string;
  taskTitle: string;
  actorName: string;
  event: string;
  createdAt: string;
  readAt: string | null;
};
const eventNames: Record<string, string> = {
  created: 'создал задачу',
  updated: 'изменил задачу',
  status_changed: 'сменил статус',
  commented: 'прокомментировал',
  resolution: 'добавил итог работы',
  deleted: 'удалил задачу',
};
export const NotificationBell = ({ onOpen }: { onOpen: () => void }) => {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let live = true;
    const update = () => {
      if (document.visibilityState === 'hidden') return;
      void api<Notification[]>('/notifications')
        .then((items) => {
          if (live) setUnread(items.filter((n) => !n.readAt).length);
        })
        .catch(() => {
          /* The panel reports request errors. */
        });
    };
    update();
    const timer = setInterval(update, 30000);
    window.addEventListener('focus', update);
    window.addEventListener('verstak:notifications', update);
    return () => {
      live = false;
      clearInterval(timer);
      window.removeEventListener('focus', update);
      window.removeEventListener('verstak:notifications', update);
    };
  }, []);
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
export const NotificationPanel = ({
  onClose,
  inline = false,
  onOpen,
}: {
  onClose: () => void;
  inline?: boolean;
  onOpen: (workspaceId: string, taskId: string) => void;
}) => {
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const busy = useRef(false);
  useEffect(() => {
    void api<Notification[]>('/notifications')
      .then((items) => {
        setItems(items);
        setReady(true);
      })
      .catch((e) => setError(e.message));
  }, []);
  return (
    <Modal inline={inline} title="Уведомления" onClose={onClose}>
      <div
        className={cn(
          'editor-form flex flex-col gap-5 p-6 [&_h2]:text-[21px] [&_h2]:font-semibold [&_h3]:text-[15px]',
          '[&_h3]:font-semibold',
          '[&_.title-input]:text-[23px] [&_.title-input]:font-semibold [&_.title-input]:pt-[3px]',
          '[&_.title-input]:px-0 [&_.title-input]:pb-3 [&_.title-input]:border-0 [&_.title-input]:border-b',
          '[&_.title-input]:border-line [&_.title-input]:rounded-none [&_.note-textarea]:min-h-85',
          '[&_.note-textarea]:font-mono [&_.note-textarea]:text-[13px] [&_.note-textarea]:leading-[23px]',
          'max-[520px]:p-5 max-[520px]:gap-4.5',
        )}
      >
        <p className={'body-muted text-[13px] text-muted leading-[21px]'}>
          Изменения в задачах, которые ты создал, которые назначены тебе или где ты оставил
          комментарий.
        </p>
        {error && (
          <p
            className={cn(
              'error-text py-2.5 px-3 text-[#ae2e24] bg-[#fff1f0] border border-[#f5c8c5] rounded text-xs',
              'leading-[19px]',
            )}
            role="alert"
          >
            {error}
          </p>
        )}
        {!ready && !error && <p>Загружаем…</p>}
        {ready && !items.length && (
          <p className={'body-muted text-[13px] text-muted leading-[21px]'}>Пока нет уведомлений</p>
        )}
        {items.map((item) => (
          <button
            className={cn(
              'notification-row [&_time]:text-[#626f86] [&_time]:text-[11px] grid gap-1.5 w-full bg-white',
              'border border-[#dcdfe4] rounded-[5px] text-left p-[13px] [&.unread]:border-l-3',
              '[&.unread]:border-[#0c66e4] [&.unread]:bg-[#f7faff] [&:hover]:bg-[#e9f2ff]',
              item.readAt ? '' : 'unread',
            )}
            key={item.id}
            onClick={async () => {
              if (busy.current) return;
              busy.current = true;
              try {
                await api(`/notifications/${item.id}/read`, 'PATCH', {});
                setItems((old) =>
                  old.map((n) =>
                    n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n,
                  ),
                );
                window.dispatchEvent(new Event('verstak:notifications'));
                onOpen(item.workspaceId, item.taskId);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                busy.current = false;
              }
            }}
          >
            <span>
              <strong>{item.actorName}</strong> {eventNames[item.event] ?? item.event}
            </span>
            <span>
              <b>{item.taskKey}</b> · {item.taskTitle}
            </span>
            <time dateTime={item.createdAt}>{formatTime(item.createdAt)}</time>
          </button>
        ))}
      </div>
    </Modal>
  );
};
