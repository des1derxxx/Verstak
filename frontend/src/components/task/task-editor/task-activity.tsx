import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/dates';
import { useState } from 'react';
import { useAddComment, useTaskActivity } from '@/queries/task-activity';
import { Markdown } from '@/components/ui/markdown';
const events: Record<string, string> = {
  created: 'создал задачу',
  updated: 'изменил задачу',
  status_changed: 'сменил статус',
  commented: 'добавил комментарий',
  resolution: 'добавил итоговый комментарий',
  deleted: 'удалил задачу',
};
const fields: Record<string, string> = {
  title: 'Название',
  description: 'Описание',
  status: 'Статус',
  priority: 'Приоритет',
  due: 'Срок',
  labels: 'Метки',
  checklist: 'Чеклист',
  parentId: 'Родитель',
  assigneeId: 'Исполнитель',
  type: 'Тип',
  links: 'Ссылки',
};
export const TaskActivity = ({
  workspaceId,
  taskId,
  readOnly,
  onDirty,
  onBusy,
  onActivity,
  statusName = (id) => id,
}: {
  workspaceId: string;
  taskId: string;
  readOnly: boolean;
  onDirty: (value: boolean) => void;
  onBusy: (value: boolean) => void;
  onActivity: () => Promise<void>;
  statusName?: (id: string) => string;
}) => {
  const [tab, setTab] = useState<'comments' | 'history'>('comments');
  const [body, setBody] = useState('');
  const activity = useTaskActivity(workspaceId, taskId);
  const addComment = useAddComment(workspaceId, taskId);
  const { comments, history, ready } = activity;
  const busy = addComment.isPending;
  const error = activity.error || (addComment.error?.message ?? '');
  const send = async () => {
    if (!body.trim() || busy || readOnly) return;
    onBusy(true);
    try {
      await addComment.mutateAsync(body.trim());
      setBody('');
      onDirty(false);
      await onActivity();
    } catch {
      /* The mutation error is shown above the composer and the draft stays. */
    } finally {
      onBusy(false);
    }
  };
  return (
    <section
      className={cn(
        'issue-section flex flex-col gap-2.5 [&>textarea]:min-h-28 activity [&_h3]:mb-3 pt-0 px-6 pb-6',
        '[&>.segmented]:mb-3.5 max-phablet:pt-0 max-phablet:px-4 max-phablet:pb-5',
      )}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <h3>Активность</h3>
      <div
        className={cn(
          'segmented flex p-0.75 rounded bg-neutral ml-auto shrink-0 [&_button]:py-1.25',
          '[&_button]:px-2.5 [&_button]:text-caption [&_button]:rounded-chip [&_button]:text-muted',
          '[&_button[aria-pressed=true]]:bg-surface [&_button[aria-pressed=true]]:text-ink',
          '[&_button[aria-pressed=true]]:shadow-raised max-phone:[&_button]:text-tiny',
          'max-phone:[&_button]:px-1.75',
        )}
      >
        <button type="button" aria-pressed={tab === 'comments'} onClick={() => setTab('comments')}>
          Комментарии
        </button>
        <button type="button" aria-pressed={tab === 'history'} onClick={() => setTab('history')}>
          История
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className={cn(
            'error-text py-2.5 px-3 text-danger-strong bg-danger-soft border border-danger-border rounded text-xs',
            'leading-4.75',
          )}
        >
          {error}{' '}
          <button
            type="button"
            className={cn(
              'text-button inline-flex items-center gap-1.25 py-1 px-0 text-body text-muted',
              '[&:hover]:text-brand [&.danger]:text-danger',
            )}
            onClick={() => {
              addComment.reset();
              void activity.retry();
            }}
          >
            Повторить
          </button>
        </p>
      )}
      {!ready && !error && (
        <p className={'body-muted text-body text-muted leading-5.25'}>Загружаем активность…</p>
      )}
      {tab === 'comments' ? (
        <>
          {ready && !comments.length && (
            <p className={'body-muted text-body text-muted leading-5.25'}>Пока нет комментариев</p>
          )}
          {comments.map((c) => (
            <article
              className={cn(
                'task-comment my-4.5 mx-0 border-b border-line-soft pb-3.5 [&>div:first-child]:flex',
                '[&>div:first-child]:items-center [&>div:first-child]:flex-wrap [&>div:first-child]:gap-2.5',
                '[&>div:first-child]:mb-2 [&_time]:text-muted [&_time]:text-caption',
              )}
              key={c.id}
            >
              <div>
                <strong>{c.authorName}</strong>
                <time dateTime={c.createdAt}>{formatTime(c.createdAt)}</time>
                {c.kind === 'resolution' && (
                  <span
                    className={
                      'resolution-badge bg-success-soft text-success-strong rounded-chip py-0.5 px-1.5 text-caption'
                    }
                  >
                    Итог работы
                  </span>
                )}
              </div>
              <Markdown text={c.body} />
            </article>
          ))}
          {!readOnly && (
            <div className={'comment-composer grid [justify-items:start] gap-2.5 [&_label]:w-full'}>
              <label>
                Новый комментарий
                <textarea
                  aria-label="Новый комментарий"
                  rows={3}
                  maxLength={10000}
                  disabled={busy}
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    onDirty(Boolean(e.target.value.trim()));
                  }}
                  placeholder="Результат, вопрос или контекст. Поддерживается Markdown."
                />
              </label>
              <Button
                type="button"
                disabled={busy || !body.trim()}
                onClick={() => {
                  void send();
                }}
                variant="secondary"
                size="compact"
              >
                {busy ? 'Отправляем…' : 'Отправить комментарий'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <ol
          className={cn(
            'task-history [&_time]:text-muted [&_time]:text-caption [&_time]:block [&_time]:mt-0.75 pl-5',
            '[&_li]:my-3.5 [&_li]:mx-0 [&_li]:pl-1.25 [&_p]:my-1 [&_p]:mx-0 [&_p]:text-ink-secondary',
            '[&_p]:text-xs',
          )}
        >
          {ready && !history.length && <li>История появится после следующего изменения</li>}
          {history.map((e) => (
            <li key={e.id}>
              <strong>{e.actorName}</strong> {events[e.event] ?? e.event}
              <time dateTime={e.createdAt}>{formatTime(e.createdAt)}</time>
              {e.changes.status && (
                <p>
                  {statusName(String(e.changes.status.from))} →{' '}
                  {statusName(String(e.changes.status.to))}
                </p>
              )}
              {Object.keys(e.changes).filter((f) => f !== 'status').length > 0 && (
                <p>
                  {Object.keys(e.changes)
                    .filter((f) => f !== 'status')
                    .map((f) => fields[f] ?? f)
                    .join(', ')}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
