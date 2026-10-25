'use client';

import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { MutationContext } from '@/components/ui/modal';
import type { Session, Space } from '@/lib/api/types';
import { CalendarProvider } from '@/lib/calendar';
import type { Calendar } from '@/lib/calendar';
import { NavigationGuardProvider } from '@/lib/navigation-guard';
import { useWorkspace, WorkspaceProvider } from '@/lib/workspace/workspace-context';
import { useWorkspaceUi, WorkspaceUiProvider } from '@/lib/workspace/workspace-ui';
import { useClearSaveError, useWorkspaceSaveState } from '@/queries/workspace';
// Lets forms and modals disable themselves while the workspace saves.
const SaveStateProvider = ({ children }: { children: ReactNode }) => {
  const { readOnly } = useWorkspace();
  const { dialog } = useWorkspaceUi();
  const { saving, error } = useWorkspaceSaveState();
  const clearError = useClearSaveError();
  useEffect(() => clearError(), [dialog]);
  const value = useMemo(() => ({ saving, readOnly, error }), [saving, readOnly, error]);
  return <MutationContext.Provider value={value}>{children}</MutationContext.Provider>;
};
export const WorkspaceProviders = ({
  session,
  spaces,
  info,
  calendar,
  children,
}: {
  session: Session;
  spaces: Space[];
  info: Space;
  calendar: Calendar;
  children: ReactNode;
}) => (
  <CalendarProvider initial={calendar}>
    <NavigationGuardProvider>
      <WorkspaceProvider info={info} spaces={spaces} session={session}>
        <WorkspaceUiProvider>
          <SaveStateProvider>{children}</SaveStateProvider>
        </WorkspaceUiProvider>
      </WorkspaceProvider>
    </NavigationGuardProvider>
  </CalendarProvider>
);
