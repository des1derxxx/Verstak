'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setCsrf } from '@/shared/api/client';
import type { Space } from '@/shared/api/types';
import { viewPath } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
export const NewWorkspace = ({ csrf }: { csrf: string }) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => setCsrf(csrf), [csrf]);
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-5 p-6">
      <h1>Новое пространство</h1>
      <form
        className="flex flex-col gap-5"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy || !name.trim()) return;
          setBusy(true);
          setError('');
          try {
            const space = await api<Space>('/workspaces', 'POST', { name: name.trim() });
            router.replace(viewPath(space.id));
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Название
          <input
            autoFocus
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" disabled={busy || !name.trim()}>
          Создать пространство
        </Button>
      </form>
      <Link href="/">Назад к пространствам</Link>
    </main>
  );
};
