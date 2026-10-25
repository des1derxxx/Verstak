import { Button, IconButton } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useRef, useState } from 'react';
import { Camera, Trash2, UserRound } from 'lucide-react';
import { api, ApiError } from '@/lib/api/client';
import type { User } from '@/lib/api/types';
import { Modal, useDiscardConfirmation } from '@/components/ui/modal';
import { Avatar } from '@/components/ui/avatar';
export const prepareAvatar = async (file: File): Promise<string> => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Выбери фото в формате PNG, JPEG или WebP.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Выбери изображение размером до 10 МБ.');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('Не удалось прочитать изображение. Попробуй другое фото.');
  }
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 40000000)
      throw new Error('Изображение слишком большое. Выбери фото до 40 мегапикселей.');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Не удалось подготовить фото в этом браузере.');
    const edge = Math.min(bitmap.width, bitmap.height);
    context.drawImage(
      bitmap,
      (bitmap.width - edge) / 2,
      (bitmap.height - edge) / 2,
      edge,
      edge,
      0,
      0,
      512,
      512,
    );
    return canvas.toDataURL('image/webp', 0.85);
  } finally {
    bitmap.close();
  }
};
export const ProfilePanel = ({
  user,
  onUser,
  onClose,
  inline = false,
}: {
  user: User;
  onUser: (user: User) => void;
  onClose: () => void;
  inline?: boolean;
}) => {
  const [initial, setInitial] = useState(user);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState(user.bio ?? '');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<string | null | undefined>();
  const [pending, setPending] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [notice, setNotice] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const busy = pending || processing;
  const emailChanged = email.trim().toLocaleLowerCase('en') !== initial.email;
  const dirty =
    name !== initial.name ||
    email !== initial.email ||
    bio !== (initial.bio ?? '') ||
    avatar !== undefined;
  const close = useDiscardConfirmation(dirty, onClose);
  const preview = {
    name: name || initial.name,
    avatarUrl: avatar === undefined ? initial.avatarUrl : avatar,
  };
  const loadCurrent = async () => {
    setPending(true);
    setError('');
    try {
      const current = await api<{
        user: User;
      }>('/auth/me');
      setInitial(current.user);
      setName(current.user.name);
      setEmail(current.user.email);
      setBio(current.user.bio ?? '');
      setAvatar(undefined);
      setPassword('');
      setConflict(false);
      onUser(current.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  const chooseFile = async (file?: File) => {
    if (!file || busy) return;
    setProcessing(true);
    setError('');
    setNotice('');
    try {
      setAvatar(await prepareAvatar(file));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcessing(false);
    }
  };
  return (
    <Modal inline={inline} title="Мой профиль" onClose={close.requestClose} pending={busy}>
      <form
        className={cn(
          'editor-form flex flex-col gap-5 p-6 [&_h2]:text-heading-sm [&_h2]:font-semibold [&_h3]:text-lead',
          '[&_h3]:font-semibold',
          '[&_.title-input]:text-heading-lg [&_.title-input]:font-semibold [&_.title-input]:pt-0.75',
          '[&_.title-input]:px-0 [&_.title-input]:pb-3 [&_.title-input]:border-0 [&_.title-input]:border-b',
          '[&_.title-input]:border-line [&_.title-input]:rounded-none [&_.note-textarea]:min-h-85',
          '[&_.note-textarea]:font-mono [&_.note-textarea]:text-body [&_.note-textarea]:leading-5.75',
          'max-phone:p-5 max-phone:gap-4.5 profile-form [&_h3]:text-sm [&_h3]:mb-1',
          '[&_.draft-conflict]:m-0 max-phablet:[&_.modal-footer]:items-end',
        )}
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy || !dirty || conflict || !name.trim()) return;
          setPending(true);
          setError('');
          setNotice('');
          try {
            const result = await api<User>('/auth/profile', 'PATCH', {
              revision: initial.profileRevision ?? 0,
              name: name.trim(),
              email: email.trim(),
              bio,
              ...(emailChanged ? { currentPassword: password } : {}),
              ...(avatar !== undefined ? { avatarData: avatar } : {}),
            });
            setInitial(result);
            setName(result.name);
            setEmail(result.email);
            setBio(result.bio ?? '');
            setAvatar(undefined);
            setPassword('');
            onUser(result);
            setNotice('Профиль сохранён');
          } catch (e) {
            setError((e as Error).message);
            if (e instanceof ApiError && e.status === 409 && !e.message.includes('email'))
              setConflict(true);
          } finally {
            setPending(false);
          }
        }}
      >
        <div
          className={cn(
            'profile-avatar-row flex gap-5 items-center pt-0.75 px-0 pb-3.75 border-b border-line',
            'max-phablet:gap-3',
          )}
        >
          <Avatar user={preview} className={'profile-avatar'} />
          <div>
            <h3>Фото профиля</h3>
            <p className={'field-hint text-tiny font-normal text-muted'}>
              PNG, JPEG или WebP до 10 МБ.
              <br />
              Фото будет обрезано по центру.
            </p>
            <div className={'profile-photo-actions flex items-center gap-2 mt-2.5'}>
              <Button
                type="button"
                disabled={busy}
                onClick={() => fileInput.current?.click()}
                variant="secondary"
                size="compact"
              >
                <Camera size={15} />
                {processing ? 'Готовим фото…' : 'Загрузить фото'}
              </Button>
              {preview.avatarUrl && (
                <IconButton
                  type="button"
                  aria-label="Удалить аватарку"
                  disabled={busy}
                  onClick={() => {
                    setAvatar(null);
                    setNotice('');
                  }}
                  tone="danger"
                >
                  <Trash2 size={16} />
                </IconButton>
              )}
            </div>
          </div>
        </div>
        <input
          ref={fileInput}
          type="file"
          tabIndex={-1}
          className={
            'sr-only absolute w-px h-px p-0 overflow-hidden [clip:rect(0,0,0,0)] whitespace-nowrap border-0'
          }
          aria-label="Файл аватарки"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={(event) => {
            void chooseFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        <label>
          Имя
          <input
            autoFocus
            autoComplete="name"
            required
            maxLength={80}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNotice('');
            }}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setNotice('');
            }}
          />
        </label>
        {emailChanged && (
          <label>
            Текущий пароль
            <input
              aria-label="Текущий пароль"
              type="password"
              autoComplete="current-password"
              required
              maxLength={256}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <span className={'field-hint text-tiny font-normal text-muted'}>
              Нужен для смены адреса входа. На остальных устройствах потребуется войти заново.
            </span>
          </label>
        )}
        <label>
          О себе
          <textarea
            aria-label="О себе"
            maxLength={500}
            rows={3}
            placeholder="Роль в команде или пара слов о себе"
            value={bio}
            onChange={(event) => {
              setBio(event.target.value);
              setNotice('');
            }}
          />
          <span className={'field-hint text-tiny font-normal text-muted'}>{bio.length} / 500</span>
        </label>
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
        {conflict && (
          <div
            className={cn(
              'draft-conflict my-4 mx-6 p-3 bg-warning-soft border border-warning-bold rounded-card [&_p]:my-2',
              '[&_p]:mx-0 [&_p]:text-xs [&_p]:leading-[1.5]',
            )}
          >
            <p>Загрузка актуального профиля заменит несохранённые изменения в этой форме.</p>
            <Button
              type="button"
              onClick={() => {
                void loadCurrent();
              }}
              variant="secondary"
            >
              Загрузить актуальный профиль
            </Button>
          </div>
        )}
        {notice && (
          <p
            role="status"
            className={'profile-saved flex items-center gap-1.75 text-success text-body'}
          >
            <UserRound size={15} />
            {notice}
          </p>
        )}
        {close.confirmation}
        <div
          className={cn(
            'modal-footer flex items-center justify-between gap-3.75 pt-4.5 border-t border-line',
            'max-phone:gap-2.5 max-phone:flex-wrap max-phone:[&_.button]:text-xs',
            'max-phone:[&_.button]:px-2.75',
          )}
        >
          <span className={'body-muted text-body text-muted leading-5.25'}>
            {dirty ? 'Есть несохранённые изменения' : 'Данные аккаунта'}
          </span>
          <div className={'footer-actions flex items-center justify-end gap-2 ml-auto'}>
            <Button type="button" onClick={close.requestClose} variant="secondary">
              Закрыть
            </Button>
            <Button
              type="submit"
              disabled={busy || !dirty || conflict || !name.trim() || (emailChanged && !password)}
              variant="primary"
            >
              {pending ? 'Сохраняем…' : 'Сохранить профиль'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
