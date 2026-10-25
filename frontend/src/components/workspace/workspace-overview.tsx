'use client';

import type { ReactNode } from 'react';
import { CalendarDays, Check, Keyboard } from 'lucide-react';
import { WorkspaceHeading } from '@/components/workspace/workspace-heading';
import { WorkspaceToolbar } from '@/components/workspace/workspace-toolbar';
import { NoProjects } from '@/components/workspace/no-projects';
import { cn } from '@/lib/cn';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { useWorkspaceUi } from '@/lib/workspace/workspace-ui';
import { useTaskView } from '@/lib/workspace/workspace-location';
import { useWorkspaceData } from '@/queries/workspace';
export const WorkspaceOverview = ({ children }: { children: ReactNode }) => {
  const { readOnly } = useWorkspace();
  const { openDialog } = useWorkspaceUi();
  const { error: storageError } = useWorkspaceData();
  const { view, workspace, scope: selected, scoped, counts } = useTaskView();
  return (
    <>
      <WorkspaceHeading />
      <WorkspaceToolbar />
      <div id="view-panel" role="tabpanel" aria-labelledby={`tab-${view}`}>
        {!workspace.projects.length && !storageError ? (
          <NoProjects readOnly={readOnly} onCreate={() => openDialog({ kind: 'project' })} />
        ) : (
          children
        )}
      </div>
      {view !== 'notes' && workspace.projects.length > 0 && (
        <div
          className={cn(
            'workspace-status flex items-center justify-between pt-4 px-px pb-0 text-tiny text-muted',
            '[&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5 [&_button]:inline-flex',
            '[&_button]:items-center [&_button]:gap-1.5 [&_button]:text-tiny [&_button]:text-muted',
            '[&_button:hover]:text-brand max-tablet:text-tiny max-tablet:[&_button]:text-tiny',
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
                Готово {counts.done} из {scoped.length}
              </>
            )}
          </span>
          <button onClick={() => openDialog({ kind: 'shortcuts' })}>
            <Keyboard size={13} />
            Сочетания клавиш
          </button>
        </div>
      )}
    </>
  );
};
