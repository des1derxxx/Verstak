import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/ui/cn';
import { useState } from 'react';
import { api } from '@/shared/api/client';
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
        'auth-page flex items-center justify-center min-h-dvh py-10 px-5 bg-[#f4f5f7]',
        'max-[520px]:py-[25px] max-[520px]:px-4.5',
      )}
    >
      <div className={'auth-panel flex flex-col items-center gap-7 w-full max-[520px]:gap-6'}>
        <div
          className={cn(
            'auth-logo flex items-center gap-[9px] text-[#253858] text-[29px] font-bold tracking-[-.8px]',
            '[&_.brand-mark]:w-[31px] [&_.brand-mark]:h-[33px] [&_.brand-mark]:text-[25px]',
            '[&_.brand-mark]:font-semibold [&_.brand-period]:hidden',
          )}
        >
          Verstak
        </div>
        <form
          className={cn(
            'auth-form',
            'w-full max-w-105 p-8 border',
            'border-[#dfe1e6] rounded-md bg-white shadow-[0_4px_12px_#091e420d] [&_h2]:text-[22px]',
            '[&_h2]:leading-7.5 [&_h2]:font-semibold [&_h2]:text-center [&_h2]:mb-3 [&_h2]:tracking-[-.3px]',
            '[&>p]:text-muted [&>p]:text-[13px] [&>p]:leading-[21px] [&>p]:text-center [&>p]:mb-[27px]',
            '[&_fieldset]:flex [&_fieldset]:flex-col [&_fieldset]:gap-5 [&_.button]:min-h-10',
            '[&_.field-hint]:mt-0 max-[520px]:py-[27px] max-[520px]:px-[23px] max-[520px]:[&_h2]:text-[21px]',
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
                'error-text py-2.5 px-3 text-[#ae2e24] bg-[#fff1f0] border border-[#f5c8c5] rounded text-xs',
                'leading-[19px]',
              )}
            >
              {error}
            </p>
          )}
          <button
            type="button"
            className={cn(
              'text-button inline-flex items-center gap-[5px] py-1 px-0 text-[13px] text-muted',
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
