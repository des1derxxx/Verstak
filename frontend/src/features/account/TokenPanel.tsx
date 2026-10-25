import { Button, IconButton } from '../../shared/ui/Button';
import { cn } from '../../shared/ui/cn';
import { Dropdown } from '../../shared/ui/Dropdown';
import { useEffect, useState } from 'react';
import { Copy, KeyRound, Trash2 } from 'lucide-react';
import { api } from '../../shared/api/client';
import type { Space } from '../../shared/api/types';
import { Modal, useDiscardConfirmation } from '../../shared/ui/Modal';
import { formatTime } from '../../shared/lib/dates';
type Token = {
  id: string;
  name: string;
  workspaceId: string;
  scopes: string[];
  last4: string;
  expiresAt: string;
};
export const TokenPanel = ({
  space,
  onClose,
  inline = false,
}: {
  space: Space;
  onClose: () => void;
  inline?: boolean;
}) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [name, setName] = useState('');
  const [write, setWrite] = useState(false);
  const [days, setDays] = useState(90);
  const [secret, setSecret] = useState('');
  const [savedSecret, setSavedSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const close = useDiscardConfirmation(Boolean(secret && !savedSecret), onClose);
  const load = async () => {
    setTokens(await api<Token[]>('/api-tokens'));
    setReady(true);
  };
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, []);
  const perform = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await action();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal inline={inline} title="API-токены" onClose={close.requestClose} pending={busy}>
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
          Для бота или скрипта. Токен действует от твоего имени только в пространстве «{space.name}»
          и учитывает твою текущую роль.
        </p>
        {error && (
          <p
            role="alert"
            className={cn(
              'error-text py-2.5 px-3 text-[#ae2e24] bg-[#fff1f0] border border-[#f5c8c5] rounded text-xs',
              'leading-[19px]',
            )}
          >
            {error}
          </p>
        )}
        {!ready && !error && (
          <p className={'body-muted text-[13px] text-muted leading-[21px]'}>Загружаем токены…</p>
        )}
        {secret ? (
          <div
            className={cn(
              'token-secret grid gap-3 p-3.5 bg-[#e9f2ff] border border-[#85b8ff] rounded-[5px]',
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
                  setError('Выдели токен и скопируй вручную.');
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
                  'text-button inline-flex items-center gap-[5px] py-1 px-0 text-[13px] text-muted',
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
              void perform(async () => {
                const result = await api<
                  Token & {
                    token: string;
                  }
                >('/api-tokens', 'POST', {
                  workspaceId: space.id,
                  name: name.trim(),
                  scopes: write ? ['tasks:read', 'tasks:write'] : ['tasks:read'],
                  expiresInDays: days,
                });
                setSecret(result.token);
                setSavedSecret(false);
                setCopied(false);
                setName('');
              });
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
                  'token-row flex items-center justify-between py-3.5 px-0 border-b border-[#ebecf0]',
                  '[&_small]:block [&_small]:text-[#626f86] [&_small]:leading-[1.6] [&_small]:mt-1',
                )}
                key={t.id}
              >
                <div>
                  <strong>{t.name}</strong>
                  <small>
                    ••••{t.last4} ·{' '}
                    {t.scopes.includes('tasks:write') ? 'Чтение и запись' : 'Чтение'}
                    <br />
                    Истекает {formatTime(t.expiresAt)}
                  </small>
                </div>
                <IconButton
                  type="button"
                  aria-label={`Отозвать токен ${t.name}`}
                  disabled={busy}
                  onClick={() => {
                    void perform(async () => {
                      await api(`/api-tokens/${t.id}`, 'DELETE', {});
                    });
                  }}
                  tone="danger"
                >
                  <Trash2 size={16} />
                </IconButton>
              </div>
            ))}
        </div>
        {close.confirmation}
        <p className={'small-print text-[11px] text-muted leading-4.5 text-center'}>
          REST: /api/tasks · Authorization: Bearer …<br />
          Примеры запросов — в README проекта.
        </p>
      </div>
    </Modal>
  );
};
