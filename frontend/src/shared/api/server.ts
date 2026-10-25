import 'server-only';
import axios from 'axios';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { safeReturnPath } from '@/shared/lib/routes';
import type { Member, Session, Snapshot, Space } from '@/shared/api/types';
import { parseWorkspace } from '@/shared/model/workspace';
export class ServerApiError extends Error {
  constructor(public readonly status: number) {
    super('Не удалось загрузить данные с сервера');
    this.name = 'ServerApiError';
  }
}
export const serverApi = async <T>(path: string): Promise<T> => {
  const jar = await cookies();
  const token = jar.get('verstak_session')?.value;
  const origin = process.env.API_INTERNAL_ORIGIN ?? 'http://127.0.0.1:8000';
  try {
    const result = await axios.get<T>(`${origin}/api${path}`, {
      timeout: 15000,
      headers: token ? { Cookie: `verstak_session=${encodeURIComponent(token)}` } : {},
      proxy: false,
    });
    return result.data;
  } catch (error) {
    throw new ServerApiError(axios.isAxiosError(error) ? (error.response?.status ?? 503) : 503);
  }
};
// React cache deduplicates calls within one server render, never between users.
export const getSession = cache(async (): Promise<Session | null> => {
  if (!(await cookies()).has('verstak_session')) return null;
  try {
    return await serverApi<Session>('/auth/me');
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 401) return null;
    throw error;
  }
});
export const requireSession = cache(async () => {
  const session = await getSession();
  if (!session) {
    const path = safeReturnPath((await headers()).get('x-verstak-path'));
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }
  return session;
});
export const getSpaces = cache(async () => {
  await requireSession();
  return serverApi<Space[]>('/workspaces');
});
export const getWorkspace = cache(async (id: string) => {
  const [session, spaces] = await Promise.all([requireSession(), getSpaces()]);
  const info = spaces.find((space) => space.id === id);
  if (!info) notFound();
  try {
    const [snapshot, members] = await Promise.all([
      serverApi<Snapshot>(`/workspaces/${encodeURIComponent(id)}/data`),
      serverApi<Member[]>(`/workspaces/${encodeURIComponent(id)}/members`),
    ]);
    return {
      session,
      calendar: { today: new Date().toISOString().slice(0, 10), timeZone: 'UTC' },
      spaces,
      info,
      snapshot: { ...snapshot, data: parseWorkspace(snapshot.data) },
      members,
    };
  } catch (error) {
    if (error instanceof ServerApiError) {
      if (error.status === 401) redirect('/login');
      if ([403, 404].includes(error.status)) notFound();
    }
    throw error;
  }
});
export const requireProject = async (workspaceId: string, projectId: string) => {
  const seed = await getWorkspace(workspaceId);
  const project = seed.snapshot.data.projects.find((item) => item.id === projectId);
  if (!project) notFound();
  return project;
};
export const requireTask = async (workspaceId: string, ref: string) => {
  const seed = await getWorkspace(workspaceId);
  const task = seed.snapshot.data.tasks.find((item) => item.id === ref || item.key === ref);
  if (!task) notFound();
  return task;
};
