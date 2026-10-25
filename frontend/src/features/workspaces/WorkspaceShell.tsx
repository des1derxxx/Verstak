'use client';

import type { ReactNode } from 'react';
import { useWorkspace } from '@/features/workspaces/WorkspaceContext';
import { cn } from '@/shared/ui/cn';
import { Check } from 'lucide-react';
import { WorkspaceHeader } from '@/features/workspaces/components/WorkspaceHeader';
import { WorkspaceSidebar } from '@/features/workspaces/components/WorkspaceSidebar';
import { WorkspaceDialogs } from '@/features/workspaces/components/WorkspaceDialogs';
export const WorkspaceShell = ({ children }: { children: ReactNode }) => {
  const model = useWorkspace();
  if (model.loading)
    return (
      <div
        className={cn(
          'loading-page flex flex-col items-center justify-center gap-5 min-h-dvh text-[13px] text-muted',
          'bg-white',
        )}
      >
        <span
          className={cn(
            'loading-spinner w-[25px] h-[25px] border-2 border-[#deebff] [border-top-color:var(--blue)]',
            'rounded-full [animation:spin_1s_linear_infinite]',
          )}
        />
        <p>Загружаем пространство…</p>
      </div>
    );
  return (
    <>
      <div className={'app-shell min-h-dvh'}>
        <WorkspaceHeader model={model} />
        <WorkspaceSidebar model={model} />
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
      <WorkspaceDialogs model={model} />
      <div
        className={cn(
          'toast flex items-center gap-2 fixed bottom-6 left-[calc(50%_+_120px)]',
          '[transform:translate(-50%,10px)] opacity-[0] [pointer-events:none] py-3 px-[17px] bg-white',
          'border border-[#baf3db] rounded-[5px] shadow-[0_5px_20px_#091e4226] text-[#216e4e] text-[13px]',
          'z-50 max-w-[calc(100vw_-_30px)] [transition:opacity_.16s,transform_.16s]',
          '[&.visible]:opacity-[1] [&.visible]:[transform:translate(-50%,0)]',
          'max-[1000px]:left-[calc(50%_+_107px)] max-[760px]:left-[50%] max-[760px]:text-xs',
          model.toast ? 'visible' : '',
        )}
        role="status"
        aria-live="polite"
      >
        {model.toast && (
          <>
            <Check size={17} />
            {model.toast}
          </>
        )}
      </div>
    </>
  );
};
