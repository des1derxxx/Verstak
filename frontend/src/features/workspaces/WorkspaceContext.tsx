'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { MutationContext } from '../../shared/ui/Modal';
import type { WorkspaceController } from './hooks/useWorkspaceController';
export const WorkspaceContext = createContext<WorkspaceController | null>(null);
export const useWorkspace = () => {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error('WorkspaceProvider is required');
  return workspace;
};

export const WorkspaceProvider = ({
  model,
  children,
}: {
  model: WorkspaceController;
  children: ReactNode;
}) => (
  <WorkspaceContext.Provider value={model}>
    <MutationContext.Provider
      value={{ saving: model.saving, readOnly: model.readOnly, error: model.mutationError }}
    >
      {children}
    </MutationContext.Provider>
  </WorkspaceContext.Provider>
);
