'use client';

import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { cn } from '@/lib/cn';
import { useNavigation } from '@/lib/navigation-guard';
import { useWorkspaceUi } from '@/lib/workspace/workspace-ui';
import { useWorkspaceData, useWorkspaceSync } from '@/queries/workspace';
import { useWorkspaceHotkeys } from '@/app/(workspace)/workspaces/[workspaceId]/_components/use-workspace-hotkeys';
import { WorkspaceHeader } from '@/app/(workspace)/workspaces/[workspaceId]/_components/workspace-header';
import { WorkspaceSidebar } from '@/app/(workspace)/workspaces/[workspaceId]/_components/workspace-sidebar';
import { WorkspaceDialogs } from '@/app/(workspace)/workspaces/[workspaceId]/_components/workspace-dialogs';
export const WorkspaceShell = ({ children }: { children: ReactNode }) => {
  const { dialog, toast } = useWorkspaceUi();
  const { hasDraft } = useNavigation();
  const { loading } = useWorkspaceData();
  useWorkspaceSync(Boolean(dialog) || hasDraft);
  useWorkspaceHotkeys();
  if (loading) return <PageLoading label="Загружаем пространство…" />;
  return (
    <>
      <div className={'app-shell min-h-dvh'}>
        <WorkspaceHeader />
        <WorkspaceSidebar />
        <main
          className={cn(
            'main-area ml-[var(--sidebar-width)] pt-[var(--header-height)] min-h-dvh min-w-0',
            'max-tablet:ml-0',
          )}
        >
          <div
            className={cn(
              'content pt-5.5 px-7 pb-4 max-w-500 my-0 mx-auto px-9 max-desktop:px-5.5 max-laptop:px-5',
              'max-tablet:pt-4.5 max-tablet:px-4.5 max-tablet:pb-4 max-phone:py-4 max-phone:px-3.5',
            )}
          >
            {children}
          </div>
        </main>
      </div>
      <WorkspaceDialogs />
      <div
        className={cn(
          'toast flex items-center gap-2 fixed bottom-6 left-[calc(50%_+_120px)]',
          '[transform:translate(-50%,10px)] opacity-0 [pointer-events:none] py-3 px-4.25 bg-surface',
          'border border-success-border rounded-card shadow-toast text-success-strong text-body',
          'z-50 max-w-[calc(100vw_-_30px)] [transition:opacity_.16s,transform_.16s]',
          '[&.visible]:opacity-100 [&.visible]:[transform:translate(-50%,0)]',
          'max-laptop:left-[calc(50%_+_107px)] max-tablet:left-[50%] max-tablet:text-xs',
          toast ? 'visible' : '',
        )}
        role="status"
        aria-live="polite"
      >
        {toast && (
          <>
            <Check size={17} />
            {toast}
          </>
        )}
      </div>
    </>
  );
};
