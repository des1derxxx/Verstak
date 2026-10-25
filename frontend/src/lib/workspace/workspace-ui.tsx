'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import type { Note, Project, Status, Task } from '@/lib/model/workspace';
export type Dialog =
  | { kind: 'task'; task?: Task; seed?: Task; status?: Status }
  | { kind: 'project'; project?: Project }
  | { kind: 'note'; note?: Note }
  | { kind: 'shortcuts' };
type WorkspaceUi = {
  dialog: Dialog | null;
  openDialog: (dialog: Dialog) => void;
  closeDialog: () => void;
  toast: string;
  notify: (message: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  searchRef: RefObject<HTMLInputElement | null>;
};
const WorkspaceUiContext = createContext<WorkspaceUi | null>(null);
export const useWorkspaceUi = () => {
  const ui = useContext(WorkspaceUiContext);
  if (!ui) throw new Error('WorkspaceUiProvider is required');
  return ui;
};
export const WorkspaceUiProvider = ({ children }: { children: ReactNode }) => {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [toast, setToast] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  const value = useMemo<WorkspaceUi>(
    () => ({
      dialog,
      openDialog: setDialog,
      closeDialog: () => setDialog(null),
      toast,
      notify: setToast,
      sidebarOpen,
      setSidebarOpen,
      searchRef,
    }),
    [dialog, toast, sidebarOpen],
  );
  return <WorkspaceUiContext.Provider value={value}>{children}</WorkspaceUiContext.Provider>;
};
