import { IconButton, Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { api, setCsrf } from '@/lib/api/client';
import type { Session } from '@/lib/api/types';
import { Logo } from '@/components/ui/logo';
import { PasswordRecovery } from '@/app/(auth)/_components/password-recovery';
export const AuthForm = ({
  invitation,
  initialMode = 'login',
  onMode,
  onForgot,
  onSession,
}: {
  invitation: string;
  initialMode?: 'login' | 'register';
  onMode?: (mode: 'login' | 'register') => void;
  onForgot?: () => void;
  onSession: (session: Session) => void;
}) => {
  const [forgot, setForgot] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  if (forgot) return <PasswordRecovery onClose={() => setForgot(false)} />;
  return (
    <div
      className={cn(
        'auth-page flex items-center justify-center min-h-dvh py-10 px-5 bg-surface-muted',
        'max-phone:py-6.25 max-phone:px-4.5',
      )}
    >
      <div className={'auth-panel flex flex-col items-center gap-7 w-full max-phone:gap-6'}>
        <Logo />
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
          onSubmit={async (event) => {
            event.preventDefault();
            if (pending) return;
            setPending(true);
            setError('');
            try {
              const session = await api<Session>(`/auth/${mode}`, 'POST', {
                email,
                password,
                ...(mode === 'register' ? { name, invitationToken: invitation } : {}),
              });
              setCsrf(session.csrf);
              onSession(session);
            } catch (error) {
              setError((error as Error).message);
            } finally {
              setPending(false);
            }
          }}
        >
          <h2>{mode === 'login' ? 'Войти в Verstak' : 'Создать аккаунт'}</h2>
          <p>
            {invitation
              ? 'Используй email, на который тебя пригласили в пространство.'
              : mode === 'login'
                ? 'Войди, чтобы продолжить работу с проектами.'
                : 'Создай аккаунт и своё первое пространство.'}
          </p>
          <fieldset disabled={pending}>
            {mode === 'register' && (
              <label>
                Имя
                <input
                  autoFocus
                  autoComplete="name"
                  required
                  maxLength={80}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Как к тебе обращаться"
                />
              </label>
            )}
            <label>
              Email
              <input
                autoFocus={mode === 'login'}
                type="email"
                autoComplete="email"
                autoCapitalize="off"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <div className={'auth-field flex flex-col gap-1.5'}>
              <label htmlFor="auth-password">Пароль</label>
              <div
                className={cn(
                  'password-field relative [&>input]:pr-9.75 [&>button]:absolute [&>button]:right-1.25',
                  '[&>button]:top-1.25',
                )}
              >
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={mode === 'register' ? 12 : 1}
                  maxLength={256}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <IconButton
                  type="button"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </IconButton>
              </div>
              {mode === 'register' && (
                <span className={'field-hint text-tiny font-normal text-muted'}>
                  Не меньше 12 символов
                </span>
              )}
            </div>
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
            <Button className={'full-width w-full'} type="submit" variant="primary">
              {pending ? 'Подожди…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
              <ArrowRight size={16} />
            </Button>
          </fieldset>
          {mode === 'login' && (
            <button
              type="button"
              className={cn(
                'text-button inline-flex items-center gap-1.25 py-1 px-0 text-body text-muted',
                '[&:hover]:text-brand [&.danger]:text-danger',
              )}
              disabled={pending}
              onClick={() => (onForgot ? onForgot() : setForgot(true))}
            >
              Забыл пароль?
            </button>
          )}
          <div
            className={cn(
              'auth-switch pt-6.25 mt-6.25 border-t border-line text-center text-muted text-xs leading-5.5',
              '[&_button]:text-brand [&_button]:text-xs [&_button]:py-0 [&_button]:px-0.5',
            )}
          >
            {mode === 'login' ? 'Ещё нет аккаунта?' : 'Уже зарегистрирован?'}{' '}
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (onMode) {
                  onMode(mode === 'login' ? 'register' : 'login');
                  return;
                }
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
                setPassword('');
                setShowPassword(false);
              }}
            >
              {mode === 'login' ? 'Создать аккаунт' : 'Войти'}
            </button>
          </div>
        </form>
        <p className={'auth-footer max-w-95 text-center text-caption text-muted leading-4.5'}>
          Проекты, задачи и документация команды
          <br />в одном рабочем пространстве.
        </p>
      </div>
    </div>
  );
};
