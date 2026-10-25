'use client';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/features/workspaces/WorkspaceContext';
import { viewPath } from '@/shared/lib/routes';
export const useSettingsPage = () => {
  const model = useWorkspace();
  const router = useRouter();
  const close = () => model.navigate(viewPath(model.info.id), { discard: true });
  return { model, router, close };
};
