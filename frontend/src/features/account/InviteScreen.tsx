'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setCsrf } from '@/shared/api/client';
import type { Session, Space } from '@/shared/api/types';
import { viewPath } from '@/shared/lib/routes';
import { PageLoading } from '@/shared/ui/PageLoading';
import { Button } from '@/shared/ui/Button';
export const InviteScreen = ({ session }: { session: Session | null }) => {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setToken(new URLSearchParams(window.location.hash.slice(1)).get('invite') ?? '');
    setReady(true);
    if (session) setCsrf(session.csrf);
  }, [session]);
  const hash = `#invite=${encodeURIComponent(token)}`;
  if (!ready) return <PageLoading label="Проверяем приглашение…" />;
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-5 p-6 text-center">
      <h1>Приглашение в пространство</h1>
      {!token ? (
        <p>Открой полную ссылку приглашения.</p>
      ) : session ? (
        <>
          <p>Ты вошёл как {session.user.email}. Прими приглашение, чтобы открыть пространство.</p>
          <Button
            disabled={busy}
            variant="primary"
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                const space = await api<Space>('/invitations/accept', 'POST', { token });
                router.replace(viewPath(space.id));
                router.refresh();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Принять приглашение
          </Button>
        </>
      ) : (
        <>
          <p>Войди или зарегистрируйся с email, на который тебя пригласили.</p>
          <Link href={`/login${hash}`}>Войти</Link>
          <Link href={`/register${hash}`}>Создать аккаунт</Link>
        </>
      )}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <Link href="/">На главную</Link>
    </main>
  );
};
