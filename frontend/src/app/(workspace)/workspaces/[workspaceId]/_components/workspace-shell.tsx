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
            'max-[760px]:ml-0',
          )}
        >
          <div
            className={cn(
              'content pt-5.5 px-7 pb-4 max-w-500 my-0 mx-auto px-9 max-[1200px]:px-5.5 max-[1000px]:px-5',
              'max-[760px]:pt-4.5 max-[760px]:px-4.5 max-[760px]:pb-4 max-[520px]:py-4 max-[520px]:px-3.5',
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
          '[transform:translate(-50%,10px)] opacity-[0] [pointer-events:none] py-3 px-[17px] bg-white',
          'border border-[#baf3db] rounded-[5px] shadow-[0_5px_20px_#091e4226] text-[#216e4e] text-[13px]',
          'z-50 max-w-[calc(100vw_-_30px)] [transition:opacity_.16s,transform_.16s]',
          '[&.visible]:opacity-[1] [&.visible]:[transform:translate(-50%,0)]',
          'max-[1000px]:left-[calc(50%_+_107px)] max-[760px]:left-[50%] max-[760px]:text-xs',
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
