'use client';

import { cn } from '@/lib/cn';
import { Modal } from '@/components/ui/modal';
import { formatTime } from '@/lib/dates';
import { useMarkNotificationRead, useNotifications } from '@/queries/notifications';
const eventNames: Record<string, string> = {
  created: 'создал задачу',
  updated: 'изменил задачу',
  status_changed: 'сменил статус',
  commented: 'прокомментировал',
  resolution: 'добавил итог работы',
  deleted: 'удалил задачу',
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
  const { data: items = [], error: loadError, isSuccess: ready } = useNotifications();
  const markRead = useMarkNotificationRead();
  const error = (loadError ?? markRead.error)?.message ?? '';
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
              if (markRead.isPending) return;
              try {
                await markRead.mutateAsync(item.id);
                onOpen(item.workspaceId, item.taskId);
              } catch {
                /* The mutation error is shown above the list. */
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
