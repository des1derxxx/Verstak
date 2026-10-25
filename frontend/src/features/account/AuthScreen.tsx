'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageLoading } from '../../shared/ui/PageLoading';
import { AuthForm } from './AuthForm';
import { PasswordRecovery } from './PasswordRecovery';
import { safeReturnPath } from '../../shared/lib/routes';
export const AuthScreen = ({ mode }: { mode: 'login' | 'register' | 'forgot' | 'reset' }) => {
  const router = useRouter();
  const search = useSearchParams();
  const [ready, setReady] = useState(false);
  const [tokens, setTokens] = useState({ invite: '', reset: '' });
  useEffect(() => {
    const read = () => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      setTokens({ invite: hash.get('invite') ?? '', reset: hash.get('reset') ?? '' });
      setReady(true);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  const suffix = tokens.invite ? `#invite=${encodeURIComponent(tokens.invite)}` : '';
  const next = safeReturnPath(search.get('next'));
  if (mode === 'reset' && !ready) return <PageLoading label="Проверяем ссылку…" />;
  if (mode === 'reset' && !tokens.reset)
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 p-6">
        <h1>Нужна ссылка из письма</h1>
        <p>Открой ссылку восстановления или запроси новую.</p>
        <button className="text-brand" onClick={() => router.push('/forgot-password')}>
          Запросить ссылку
        </button>
      </main>
    );
  if (mode === 'forgot' || mode === 'reset')
    return (
      <PasswordRecovery
        token={mode === 'reset' ? tokens.reset : undefined}
        onClose={() => {
          router.replace('/login');
          router.refresh();
        }}
      />
    );
  return (
    <AuthForm
      key={mode}
      initialMode={mode}
      invitation={tokens.invite}
      onMode={(value) =>
        router.push(`/${value}${next === '/' ? '' : `?next=${encodeURIComponent(next)}`}${suffix}`)
      }
      onForgot={() => router.push('/forgot-password')}
      onSession={() => {
        router.replace(tokens.invite ? `/invite${suffix}` : next);
        router.refresh();
      }}
    />
  );
};
