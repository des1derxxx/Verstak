'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoading } from '../shared/ui/PageLoading';
export const EntryRedirect = ({ destination }: { destination: string }) => {
  const router = useRouter();
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.has('reset')) router.replace(`/reset-password${window.location.hash}`);
    else if (hash.has('invite')) router.replace(`/invite${window.location.hash}`);
    else router.replace(destination);
  }, [destination, router]);
  return <PageLoading label="Открываем твой Verstak…" />;
};
