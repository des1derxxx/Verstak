import { Button, IconButton } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { Dropdown } from '@/components/ui/dropdown';
import { useState } from 'react';
import { Copy, KeyRound, Trash2 } from 'lucide-react';
import {
  useApiTokens,
  useCreateApiToken,
  useRevokeApiToken,
} from '@/app/(workspace)/workspaces/[workspaceId]/settings/tokens/_queries/api-tokens';
import type { Space } from '@/lib/api/types';
import { Modal, useDiscardConfirmation } from '@/components/ui/modal';
import { formatTime } from '@/lib/dates';
export const TokenPanel = ({
  space,
  onClose,
  inline = false,
}: {
  space: Space;
  onClose: () => void;
  inline?: boolean;
}) => {
  const [name, setName] = useState('');
  const [write, setWrite] = useState(false);
  const [pages, setPages] = useState(false);
  const [days, setDays] = useState(90);
  const [secret, setSecret] = useState('');
  const [savedSecret, setSavedSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const { data: tokens = [], isSuccess: ready, error: loadError } = useApiTokens();
  const create = useCreateApiToken();
  const revoke = useRevokeApiToken();
  const busy = create.isPending || revoke.isPending;
  const error = copyError || ((loadError ?? create.error ?? revoke.error)?.message ?? '');
  const close = useDiscardConfirmation(Boolean(secret && !savedSecret), onClose);
  return (
    <Modal inline={inline} title="API-токены" onClose={close.requestClose} pending={busy}>
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
          Для бота или скрипта. Токен действует от твоего имени только в пространстве «{space.name}»
          и учитывает твою текущую роль.
        </p>
        {error && (
          <p
            role="alert"
            className={cn(
              'error-text py-2.5 px-3 text-danger-strong bg-danger-soft border border-danger-border rounded text-xs',
              'leading-4.75',
            )}
          >
            {error}
          </p>
        )}
        {!ready && !error && (
          <p className={'body-muted text-body text-muted leading-5.25'}>Загружаем токены…</p>
        )}
        {secret ? (
          <div
            className={cn(
              'token-secret grid gap-3 p-3.5 bg-brand-soft border border-brand-border rounded-card',
              '[&_input[readonly]]:font-mono [&_.checkbox-label]:flex [&_.checkbox-label]:items-center',
              '[&_.checkbox-label]:gap-2 [&_input[type=checkbox]]:w-auto',
            )}
          >
            <strong>Сохрани токен — повторно его увидеть нельзя</strong>
            <input
              aria-label="Новый API-токен"
              readOnly
              value={secret}
              onFocus={(e) => e.target.select()}
            />
            <Button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(secret);
                  setCopied(true);
                } catch {
                  setCopyError('Выдели токен и скопируй вручную.');
                }
              }}
              variant="secondary"
            >
              <Copy size={15} />
              {copied ? 'Скопирован' : 'Копировать'}
            </Button>
            <label className={'checkbox-label'}>
              <input
                type="checkbox"
                checked={savedSecret}
                onChange={(e) => setSavedSecret(e.target.checked)}
              />
              Я сохранил токен
            </label>
            {savedSecret && (
              <button
                type="button"
                className={cn(
                  'text-button inline-flex items-center gap-1.25 py-1 px-0 text-body text-muted',
                  '[&:hover]:text-brand [&.danger]:text-danger',
                )}
                onClick={() => setSecret('')}
              >
                Скрыть токен
              </button>
            )}
          </div>
        ) : (
          <form
            className={'token-form grid gap-3.5'}
            onSubmit={(e) => {
              e.preventDefault();
              if (busy) return;
              revoke.reset();
              create.mutate(
                {
                  workspaceId: space.id,
                  name: name.trim(),
                  scopes: [
                    'tasks:read',
                    ...(write ? ['tasks:write'] : []),
                    ...(pages ? ['notes:read'] : []),
                  ],
                  expiresInDays: days,
                },
                {
                  onSuccess: (result) => {
                    setSecret(result.token);
                    setSavedSecret(false);
                    setCopied(false);
                    setName('');
                  },
                },
              );
            }}
          >
            <label>
              Название токена
              <input
                required
                maxLength={80}
                placeholder="Например, Telegram-бот"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Доступ
              <Dropdown
                aria-label="Права токена"
                value={write ? 'write' : 'read'}
                onValueChange={(value) => setWrite(value === 'write')}
                options={[
                  { value: 'read', label: 'Чтение задач' },
                  ...(space.role !== 'viewer'
                    ? [{ value: 'write', label: 'Чтение и изменение задач' }]
                    : []),
                ]}
              />
            </label>
            <label className={'flex items-center gap-2 [&_input]:w-auto'}>
              <input type="checkbox" checked={pages} onChange={(e) => setPages(e.target.checked)} />
              Чтение страниц
            </label>
            <label>
              Срок
              <Dropdown
                value={days}
                onValueChange={(value) => setDays(Number(value))}
                options={[
                  { value: 30, label: '30 дней' },
                  { value: 90, label: '90 дней' },
                  { value: 365, label: '1 год' },
                ]}
              />
            </label>
            <Button type="submit" disabled={busy || !name.trim() || !ready} variant="primary">
              <KeyRound size={15} />
              Создать токен
            </Button>
          </form>
        )}
        <div className={'token-list'}>
          {tokens
            .filter((t) => t.workspaceId === space.id)
            .map((t) => (
              <div
                className={cn(
                  'token-row flex items-center justify-between py-3.5 px-0 border-b border-line-soft',
                  '[&_small]:block [&_small]:text-muted [&_small]:leading-[1.6] [&_small]:mt-1',
                )}
                key={t.id}
              >
                <div>
                  <strong>{t.name}</strong>
                  <small>
                    ••••{t.last4} ·{' '}
                    {t.scopes.includes('tasks:write') ? 'Чтение и запись' : 'Чтение'}
                    {t.scopes.includes('notes:read') && ' · страницы'}
                    <br />
                    Истекает {formatTime(t.expiresAt)}
                  </small>
                </div>
                <IconButton
                  type="button"
                  aria-label={`Отозвать токен ${t.name}`}
                  disabled={busy}
                  onClick={() => {
                    create.reset();
                    revoke.mutate(t.id);
                  }}
                  tone="danger"
                >
                  <Trash2 size={16} />
                </IconButton>
              </div>
            ))}
        </div>
        {close.confirmation}
        <p className={'small-print text-caption text-muted leading-4.5 text-center'}>
          REST: /api/tasks · MCP: /api/mcp · Authorization: Bearer …<br />
          Примеры запросов — в README проекта.
        </p>
      </div>
    </Modal>
  );
};
