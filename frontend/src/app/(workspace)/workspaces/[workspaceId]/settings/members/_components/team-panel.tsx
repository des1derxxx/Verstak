import { IconButton, Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useEffect, useState } from 'react';
import { Check, Copy, Plus, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Invitation, Member, Role, Session, Space } from '@/lib/api/types';
import { Modal } from '@/components/ui/modal';
import { Dropdown } from '@/components/ui/dropdown';
import { Avatar } from '@/components/ui/avatar';
export const roleNames: Record<Role, string> = {
  owner: 'Владелец',
  editor: 'Редактор',
  viewer: 'Наблюдатель',
};
export const TeamPanel = ({
  space,
  session,
  onClose,
  inline = false,
  onAccessChanged,
}: {
  space: Space;
  session: Session;
  onClose: () => void;
  inline?: boolean;
  onAccessChanged: () => Promise<void>;
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [removal, setRemoval] = useState('');
  const load = async () => {
    const [people, invites] = await Promise.all([
      api<Member[]>(`/workspaces/${space.id}/members`),
      space.role === 'owner'
        ? api<Invitation[]>(`/workspaces/${space.id}/invitations`)
        : Promise.resolve([]),
    ]);
    setMembers(people);
    setInvitations(invites);
    setReady(true);
  };
  useEffect(() => {
    void load().catch((error) => setError(error.message));
  }, []);
  const perform = async (action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await action();
      await load();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal inline={inline} title="Участники пространства" onClose={onClose} wide pending={busy}>
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
        <h2>{space.name}</h2>
        <p className={'body-muted text-[13px] text-muted leading-[21px]'}>
          Проекты, задачи и заметки доступны всем участникам этого пространства.
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
          <p className={'body-muted text-[13px] text-muted leading-[21px]'}>
            Загружаем участников…
          </p>
        )}
        <div className={'member-list flex flex-col gap-[17px]'}>
          {members.map((member) => (
            <div
              className={cn(
                'member-row',
                'flex items-center gap-2.5',
                'max-[520px]:gap-[7px] max-[520px]:[&_.dropdown-trigger]:w-25',
                'max-[520px]:[&_.dropdown-trigger]:text-[10px] [&>.dropdown]:w-35 [&>.dropdown]:shrink-0',
              )}
              key={member.user.id}
            >
              <Avatar user={member.user} />
              <span
                className={cn(
                  'member-info flex-1 min-w-0 [&_strong]:block [&_strong]:text-[13px] [&_strong]:font-medium',
                  '[&_small]:block [&_small]:text-[11px] [&_small]:text-muted [&_small]:mt-[3px]',
                  '[&_small]:wrap-anywhere max-[520px]:[&_strong]:text-xs max-[520px]:[&_small]:text-[10px]',
                )}
              >
                <strong>
                  {member.user.name}
                  {member.user.id === session.user.id && ' · ты'}
                </strong>
                <small>{member.user.email}</small>
              </span>
              {space.role === 'owner' && member.role !== 'owner' ? (
                <>
                  <Dropdown
                    aria-label={`Роль: ${member.user.name}`}
                    disabled={busy}
                    value={member.role}
                    onValueChange={(value) => {
                      const next = value;
                      void perform(async () => {
                        await api(`/workspaces/${space.id}/members/${member.user.id}`, 'PATCH', {
                          role: next,
                        });
                        await onAccessChanged();
                      });
                    }}
                    options={[
                      { value: 'editor', label: 'Редактор' },
                      { value: 'viewer', label: 'Наблюдатель' },
                    ]}
                  />
                  <IconButton
                    disabled={busy}
                    aria-label={`Удалить участника ${member.user.name}`}
                    onClick={() => setRemoval(member.user.id)}
                    tone="danger"
                  >
                    <X size={15} />
                  </IconButton>
                </>
              ) : (
                <span className={'role-label text-[11px] text-muted'}>
                  {roleNames[member.role]}
                </span>
              )}
            </div>
          ))}
        </div>
        {removal && (
          <div
            className={cn(
              'delete-confirm p-[15px] border border-[#f5c8c5] bg-[#fff1f0] rounded text-xs leading-5',
              'text-[#5d1f1a] flex items-center flex-wrap gap-2.5 [&>span]:flex-1 [&>span]:min-w-42.5',
            )}
          >
            <span>Участник потеряет доступ к пространству.</span>
            <Button onClick={() => setRemoval('')} variant="secondary">
              Отмена
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                void perform(async () => {
                  await api(`/workspaces/${space.id}/members/${removal}`, 'DELETE', {});
                  setRemoval('');
                  await onAccessChanged();
                });
              }}
              variant="danger"
            >
              Удалить
            </Button>
          </div>
        )}
        {space.role === 'owner' && (
          <>
            <div className={'section-divider border-t border-line mt-[3px]'} />
            <h3>Пригласить в команду</h3>
            <p className={'body-muted text-[13px] text-muted leading-[21px]'}>
              Создай ссылку для конкретного email и отправь её участнику. Ссылка действует 7 дней.
            </p>
            <form
              className={cn(
                'invite-form',
                'grid grid-cols-[1fr_160px] gap-3.5 [&>.button]:col-[1/-1]',
                '[&>.button]:[justify-self:start] max-[520px]:grid-cols-[1fr]',
              )}
              onSubmit={(event) => {
                event.preventDefault();
                void perform(async () => {
                  const result = await api<{
                    url: string;
                  }>(`/workspaces/${space.id}/invitations`, 'POST', { email, role });
                  setLink(result.url);
                  setCopied(false);
                  setEmail('');
                });
              }}
            >
              <label>
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="colleague@example.com"
                />
              </label>
              <label>
                Доступ
                <Dropdown
                  value={role}
                  onValueChange={(value) => setRole(value as 'editor' | 'viewer')}
                  options={[
                    { value: 'editor', label: 'Редактирование' },
                    { value: 'viewer', label: 'Только просмотр' },
                  ]}
                />
              </label>
              <Button type="submit" disabled={busy || !ready} variant="primary">
                <Plus size={16} />
                Создать приглашение
              </Button>
            </form>
            {link && (
              <div
                className={cn(
                  'invite-link',
                  'flex flex-col gap-3 p-3.5 bg-[#f7f8f9] border',
                  'border-line rounded-[5px] [&>.button]:[align-self:flex-end]',
                )}
              >
                <label>
                  Ссылка приглашения
                  <input
                    readOnly
                    aria-label="Ссылка приглашения"
                    value={link}
                    onFocus={(event) => event.target.select()}
                  />
                </label>
                <Button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(link);
                      setCopied(true);
                    } catch {
                      setError('Выдели и скопируй ссылку вручную.');
                    }
                  }}
                  variant="secondary"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'Скопировано' : 'Копировать'}
                </Button>
              </div>
            )}
            {invitations.length > 0 && (
              <div
                className={
                  'pending-invites [&_h4]:text-xs [&_h4]:font-medium [&_h4]:text-muted [&_h4]:mb-2.5'
                }
              >
                <h4>Ожидают принятия</h4>
                {invitations.map((invite) => (
                  <div
                    className={cn(
                      'pending-invite flex items-center justify-between py-2.5 px-0 border-b border-line text-xs',
                      '[&_small]:block [&_small]:text-[10px] [&_small]:text-muted [&_small]:mt-[3px]',
                    )}
                    key={invite.id}
                  >
                    <span>
                      {invite.email}
                      <small>{roleNames[invite.role]}</small>
                    </span>
                    <IconButton
                      disabled={busy}
                      aria-label={`Отозвать приглашение ${invite.email}`}
                      onClick={() => {
                        void perform(() =>
                          api(`/workspaces/${space.id}/invitations/${invite.id}`, 'DELETE', {}),
                        );
                      }}
                      tone="danger"
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
