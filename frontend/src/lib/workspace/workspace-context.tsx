'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { setCsrf } from '@/lib/api/client';
import type { Session, Space, User } from '@/lib/api/types';
type Workspace = {
  info: Space;
  spaces: Space[];
  session: Session;
  readOnly: boolean;
  setUser: (user: User) => void;
};
export const WorkspaceContext = createContext<Workspace | null>(null);
export const useWorkspace = () => {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error('WorkspaceProvider is required');
  return workspace;
};
export const WorkspaceProvider = ({
  info,
  spaces,
  session: initialSession,
  children,
}: {
  info: Space;
  spaces: Space[];
  session: Session;
  children: ReactNode;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState(initialSession);
  useEffect(() => {
    setCsrf(initialSession.csrf);
    setSession(initialSession);
  }, [initialSession]);
  useEffect(() => {
    const expired = () => {
      setCsrf('');
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      router.refresh();
    };
    window.addEventListener('verstak:unauthorized', expired);
    return () => window.removeEventListener('verstak:unauthorized', expired);
  }, [router, pathname]);
  const value = useMemo<Workspace>(
    () => ({
      info,
      spaces,
      session,
      readOnly: info.role === 'viewer',
      setUser: (user) => {
        setSession((previous) => ({ ...previous, user }));
        router.refresh();
      },
    }),
    [info, spaces, session, router],
  );
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};
