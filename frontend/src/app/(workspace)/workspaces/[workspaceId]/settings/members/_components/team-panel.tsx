import { IconButton, Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useState } from 'react';
import { Check, Copy, Plus, Trash2, X } from 'lucide-react';
import type { Role, Session, Space } from '@/lib/api/types';
import {
  useTeam,
  useTeamActions,
} from '@/app/(workspace)/workspaces/[workspaceId]/settings/members/_queries/team';
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
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [removal, setRemoval] = useState('');
  const team = useTeam(space);
  const { members, invitations, ready } = team;
  const actions = useTeamActions(space.id);
  const all = Object.values(actions);
  const busy = all.some((action) => action.isPending);
  const error =
    copyError || team.error || (all.find((action) => action.error)?.error?.message ?? '');
  // One action at a time; starting a new one clears the previous error.
  const start = () => {
    if (busy) return false;
    setCopyError('');
    for (const action of all) action.reset();
    return true;
  };
  return (
    <Modal inline={inline} title="Участники пространства" onClose={onClose} wide pending={busy}>
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
        <h2>{space.name}</h2>
        <p className={'body-muted text-body text-muted leading-5.25'}>
          Проекты, задачи и заметки доступны всем участникам этого пространства.
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
          <p className={'body-muted text-body text-muted leading-5.25'}>Загружаем участников…</p>
        )}
        <div className={'member-list flex flex-col gap-4.25'}>
          {members.map((member) => (
            <div
              className={cn(
                'member-row',
                'flex items-center gap-2.5',
                'max-phone:gap-1.75 max-phone:[&_.dropdown-trigger]:w-25',
                'max-phone:[&_.dropdown-trigger]:text-tiny [&>.dropdown]:w-35 [&>.dropdown]:shrink-0',
              )}
              key={member.user.id}
            >
              <Avatar user={member.user} />
              <span
                className={cn(
                  'member-info flex-1 min-w-0 [&_strong]:block [&_strong]:text-body [&_strong]:font-medium',
                  '[&_small]:block [&_small]:text-caption [&_small]:text-muted [&_small]:mt-0.75',
                  '[&_small]:wrap-anywhere max-phone:[&_strong]:text-xs max-phone:[&_small]:text-tiny',
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
                      if (start())
                        actions.changeRole.mutate(
                          { userId: member.user.id, role: value as Role },
                          { onSuccess: onAccessChanged },
                        );
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
                <span className={'role-label text-caption text-muted'}>
                  {roleNames[member.role]}
                </span>
              )}
            </div>
          ))}
        </div>
        {removal && (
          <div
            className={cn(
              'delete-confirm p-3.75 border border-danger-border bg-danger-soft rounded text-xs leading-5',
              'text-danger-ink flex items-center flex-wrap gap-2.5 [&>span]:flex-1 [&>span]:min-w-42.5',
            )}
          >
            <span>Участник потеряет доступ к пространству.</span>
            <Button onClick={() => setRemoval('')} variant="secondary">
              Отмена
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                if (start())
                  actions.removeMember.mutate(removal, {
                    onSuccess: async () => {
                      setRemoval('');
                      await onAccessChanged();
                    },
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
            <div className={'section-divider border-t border-line mt-0.75'} />
            <h3>Пригласить в команду</h3>
            <p className={'body-muted text-body text-muted leading-5.25'}>
              Создай ссылку для конкретного email и отправь её участнику. Ссылка действует 7 дней.
            </p>
            <form
              className={cn(
                'invite-form',
                'grid grid-cols-[1fr_160px] gap-3.5 [&>.button]:col-[1/-1]',
                '[&>.button]:[justify-self:start] max-phone:grid-cols-[1fr]',
              )}
              onSubmit={(event) => {
                event.preventDefault();
                if (start())
                  actions.invite.mutate(
                    { email, role },
                    {
                      onSuccess: (result) => {
                        setLink(result.url);
                        setCopied(false);
                        setEmail('');
                      },
                    },
                  );
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
                  'flex flex-col gap-3 p-3.5 bg-surface-soft border',
                  'border-line rounded-card [&>.button]:[align-self:flex-end]',
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
                      setCopyError('Выдели и скопируй ссылку вручную.');
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
                      '[&_small]:block [&_small]:text-tiny [&_small]:text-muted [&_small]:mt-0.75',
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
                        if (start()) actions.revokeInvitation.mutate(invite.id);
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
