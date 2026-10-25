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
          'editor-form flex flex-col gap-5 p-6 [&_h2]:text-heading-sm [&_h2]:font-semibold [&_h3]:text-lead',
          '[&_h3]:font-semibold',
          '[&_.title-input]:text-heading-lg [&_.title-input]:font-semibold [&_.title-input]:pt-0.75',
          '[&_.title-input]:px-0 [&_.title-input]:pb-3 [&_.title-input]:border-0 [&_.title-input]:border-b',
          '[&_.title-input]:border-line [&_.title-input]:rounded-none [&_.note-textarea]:min-h-85',
          '[&_.note-textarea]:font-mono [&_.note-textarea]:text-body [&_.note-textarea]:leading-5.75',
          'max-phone:p-5 max-phone:gap-4.5',
        )}
      >
        <p className={'body-muted text-body text-muted leading-5.25'}>
          Изменения в задачах, которые ты создал, которые назначены тебе или где ты оставил
          комментарий.
        </p>
        {error && (
          <p
            className={cn(
              'error-text py-2.5 px-3 text-danger-strong bg-danger-soft border border-danger-border rounded text-xs',
              'leading-4.75',
            )}
            role="alert"
          >
            {error}
          </p>
        )}
        {!ready && !error && <p>Загружаем…</p>}
        {ready && !items.length && (
          <p className={'body-muted text-body text-muted leading-5.25'}>Пока нет уведомлений</p>
        )}
        {items.map((item) => (
          <button
            className={cn(
              'notification-row [&_time]:text-muted [&_time]:text-caption grid gap-1.5 w-full bg-surface',
              'border border-line-muted rounded-card text-left p-3.25 [&.unread]:border-l-3',
              '[&.unread]:border-brand [&.unread]:bg-brand-wash [&:hover]:bg-brand-soft',
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
