import { Button } from '../../shared/ui/Button';
import { cn } from '../../shared/ui/cn';
import { formatTime } from '../../shared/lib/dates';
import { useEffect, useState } from 'react';
import { api } from '../../shared/api/client';
import { statusNames } from '../../shared/model/workspace';
import type { Status } from '../../shared/model/workspace';
import { Markdown } from '../../shared/ui/Markdown';
type Comment = {
  id: string;
  authorName: string;
  body: string;
  kind: string;
  createdAt: string;
};
type Entry = {
  id: string;
  actorName: string;
  event: string;
  changes: Record<
    string,
    {
      from: unknown;
      to: unknown;
    }
  >;
  createdAt: string;
};
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
}: {
  workspaceId: string;
  taskId: string;
  readOnly: boolean;
  onDirty: (value: boolean) => void;
  onBusy: (value: boolean) => void;
  onActivity: () => Promise<void>;
}) => {
  const [tab, setTab] = useState<'comments' | 'history'>('comments');
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<Entry[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const base = `/tasks/${encodeURIComponent(taskId)}`;
  const query = `?workspaceId=${encodeURIComponent(workspaceId)}`;
  const load = async () => {
    const [comments, history] = await Promise.all([
      api<Comment[]>(`${base}/comments${query}`),
      api<Entry[]>(`${base}/history${query}`),
    ]);
    setComments(comments);
    setHistory(history);
    setReady(true);
  };
  useEffect(() => {
    let live = true;
    void load().catch((e) => {
      if (live) setError(e.message);
    });
    return () => {
      live = false;
    };
  }, [taskId, workspaceId]);
  const send = async () => {
    if (!body.trim() || busy || readOnly) return;
    setBusy(true);
    onBusy(true);
    setError('');
    try {
      const item = await api<Comment>(`${base}/comments${query}`, 'POST', { body: body.trim() });
      setComments((old) => [...old, item]);
      setBody('');
      onDirty(false);
      await onActivity();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      onBusy(false);
    }
  };
  return (
    <section
      className={cn(
        'issue-section flex flex-col gap-2.5 [&>textarea]:min-h-28 activity [&_h3]:mb-3 pt-0 px-6 pb-6',
        '[&>.segmented]:mb-3.5 max-[620px]:pt-0 max-[620px]:px-4 max-[620px]:pb-5',
      )}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <h3>Активность</h3>
      <div
        className={cn(
          'segmented flex p-[3px] rounded bg-[#f1f2f4] ml-auto shrink-0 [&_button]:py-[5px]',
          '[&_button]:px-2.5 [&_button]:text-[11px] [&_button]:rounded-[3px] [&_button]:text-muted',
          '[&_button[aria-pressed=true]]:bg-white [&_button[aria-pressed=true]]:text-ink',
          '[&_button[aria-pressed=true]]:shadow-[0_1px_3px_#091e421f] max-[520px]:[&_button]:text-[10px]',
          'max-[520px]:[&_button]:px-[7px]',
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
            'error-text py-2.5 px-3 text-[#ae2e24] bg-[#fff1f0] border border-[#f5c8c5] rounded text-xs',
            'leading-[19px]',
          )}
        >
          {error}{' '}
          <button
            type="button"
            className={cn(
              'text-button inline-flex items-center gap-[5px] py-1 px-0 text-[13px] text-muted',
              '[&:hover]:text-brand [&.danger]:text-danger',
            )}
            onClick={() => {
              setError('');
              void load().catch((e) => setError(e.message));
            }}
          >
            Повторить
          </button>
        </p>
      )}
      {!ready && !error && (
        <p className={'body-muted text-[13px] text-muted leading-[21px]'}>Загружаем активность…</p>
      )}
      {tab === 'comments' ? (
        <>
          {ready && !comments.length && (
            <p className={'body-muted text-[13px] text-muted leading-[21px]'}>
              Пока нет комментариев
            </p>
          )}
          {comments.map((c) => (
            <article
              className={cn(
                'task-comment my-4.5 mx-0 border-b border-[#ebecf0] pb-3.5 [&>div:first-child]:flex',
                '[&>div:first-child]:items-center [&>div:first-child]:flex-wrap [&>div:first-child]:gap-2.5',
                '[&>div:first-child]:mb-2 [&_time]:text-[#626f86] [&_time]:text-[11px]',
              )}
              key={c.id}
            >
              <div>
                <strong>{c.authorName}</strong>
                <time dateTime={c.createdAt}>{formatTime(c.createdAt)}</time>
                {c.kind === 'resolution' && (
                  <span
                    className={
                      'resolution-badge bg-[#dcfff1] text-[#216e4e] rounded-[3px] py-0.5 px-1.5 text-[11px]'
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
            'task-history [&_time]:text-[#626f86] [&_time]:text-[11px] [&_time]:block [&_time]:mt-[3px] pl-5',
            '[&_li]:my-3.5 [&_li]:mx-0 [&_li]:pl-[5px] [&_p]:my-1 [&_p]:mx-0 [&_p]:text-[#44546f]',
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
                  {statusNames[e.changes.status.from as Status]} →{' '}
                  {statusNames[e.changes.status.to as Status]}
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
