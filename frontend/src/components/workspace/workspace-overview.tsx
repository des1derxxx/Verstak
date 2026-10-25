'use client';

import type { ReactNode } from 'react';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { WorkspaceHeading } from '@/components/workspace/workspace-heading';
import { WorkspaceToolbar } from '@/components/workspace/workspace-toolbar';
import { NoProjects } from '@/components/workspace/no-projects';
import { CalendarDays, Check, Keyboard } from 'lucide-react';
import { cn } from '@/lib/cn';
export const WorkspaceOverview = ({ children }: { children: ReactNode }) => {
  const model = useWorkspace();
  const { view, workspace, storageError, readOnly, setModal, selected, scoped, done } = model;
  return (
    <>
      <WorkspaceHeading model={model} />
      <WorkspaceToolbar model={model} />
      <div id="view-panel" role="tabpanel" aria-labelledby={`tab-${view}`}>
        {!workspace.projects.length && !storageError ? (
          <NoProjects readOnly={readOnly} onCreate={() => setModal({ kind: 'project' })} />
        ) : (
          children
        )}
      </div>
      {view !== 'notes' && workspace.projects.length > 0 && (
        <div
          className={cn(
            'workspace-status flex items-center justify-between pt-4 px-px pb-0 text-[10px] text-muted',
            '[&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5 [&_button]:inline-flex',
            '[&_button]:items-center [&_button]:gap-1.5 [&_button]:text-[10px] [&_button]:text-muted',
            '[&_button:hover]:text-brand max-[760px]:text-[10px] max-[760px]:[&_button]:text-[10px]',
          )}
        >
          <span>
            {selected === 'today' ? (
              <>
                <CalendarDays size={13} />
                Актуальных задач: {scoped.length}
              </>
            ) : (
              <>
                <Check size={13} />
                Готово {done} из {scoped.length}
              </>
            )}
          </span>
          <button onClick={() => setModal({ kind: 'shortcuts' })}>
            <Keyboard size={13} />
            Сочетания клавиш
          </button>
        </div>
      )}
    </>
  );
};
