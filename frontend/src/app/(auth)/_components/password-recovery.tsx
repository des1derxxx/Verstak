import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useState } from 'react';
import { api } from '@/lib/api/client';
export const PasswordRecovery = ({ token, onClose }: { token?: string; onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  return (
    <div
      className={cn(
        'auth-page flex items-center justify-center min-h-dvh py-10 px-5 bg-surface-muted',
        'max-phone:py-6.25 max-phone:px-4.5',
      )}
    >
      <div className={'auth-panel flex flex-col items-center gap-7 w-full max-phone:gap-6'}>
        <div
          className={cn(
            'auth-logo flex items-center gap-2.25 text-ink-strong text-hero font-bold tracking-[-.8px]',
            '[&_.brand-mark]:w-7.75 [&_.brand-mark]:h-8.25 [&_.brand-mark]:text-display-sm',
            '[&_.brand-mark]:font-semibold [&_.brand-period]:hidden',
          )}
        >
          Verstak
        </div>
        <form
          className={cn(
            'auth-form',
            'w-full max-w-105 p-8 border',
            'border-line rounded-md bg-surface shadow-panel [&_h2]:text-heading',
            '[&_h2]:leading-7.5 [&_h2]:font-semibold [&_h2]:text-center [&_h2]:mb-3 [&_h2]:tracking-[-.3px]',
            '[&>p]:text-muted [&>p]:text-body [&>p]:leading-5.25 [&>p]:text-center [&>p]:mb-6.75',
            '[&_fieldset]:flex [&_fieldset]:flex-col [&_fieldset]:gap-5 [&_.button]:min-h-10',
            '[&_.field-hint]:mt-0 max-phone:py-6.75 max-phone:px-5.75 max-phone:[&_h2]:text-heading-sm',
          )}
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            if (token && password !== confirm) {
              setError('Пароли не совпадают');
              return;
            }
            setBusy(true);
            setError('');
            try {
              await api(
                `/auth/${token ? 'reset-password' : 'forgot-password'}`,
                'POST',
                token ? { token, password } : { email },
              );
              setDone(true);
              setPassword('');
              setConfirm('');
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>{token ? 'Новый пароль' : 'Восстановление доступа'}</h2>
          {done ? (
            <p role="status">
              {token
                ? 'Пароль изменён. Войди с новым паролем.'
                : 'Если аккаунт существует, письмо со ссылкой придёт на почту. Проверь также папку «Спам».'}
            </p>
          ) : (
            <>
              <p>
                {token
                  ? 'Не меньше 12 символов. После смены пароля потребуется войти заново.'
                  : 'Пришлём ссылку для сброса пароля. Она действует 30 минут.'}
              </p>
              <fieldset disabled={busy}>
                {token ? (
                  <>
                    <label>
                      Новый пароль
                      <input
                        autoFocus
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={12}
                        maxLength={256}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </label>
                    <label>
                      Повтори пароль
                      <input
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={12}
                        maxLength={256}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                      />
                    </label>
                  </>
                ) : (
                  <label>
                    Email
                    <input
                      autoFocus
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                )}
                <Button className={'full-width w-full'} type="submit" variant="primary">
                  {busy ? 'Подожди…' : token ? 'Сменить пароль' : 'Отправить ссылку'}
                </Button>
              </fieldset>
            </>
          )}
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
          <button
            type="button"
            className={cn(
              'text-button inline-flex items-center gap-1.25 py-1 px-0 text-body text-muted',
              '[&:hover]:text-brand [&.danger]:text-danger',
            )}
            disabled={busy}
            onClick={onClose}
          >
            Вернуться ко входу
          </button>
        </form>
      </div>
    </div>
  );
};
