'use client';

import { useEffect } from 'react';
import { isTypingTarget } from '@/lib/model/task';
import { useTaskActions } from '@/lib/workspace/use-workspace-actions';
import { useWorkspaceUi } from '@/lib/workspace/workspace-ui';
export const useWorkspaceHotkeys = () => {
  const { dialog, openDialog, setSidebarOpen, searchRef } = useWorkspaceUi();
  const { newTask } = useTaskActions();
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const blocked = Boolean(dialog || document.querySelector('dialog[open]'));
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        if (blocked) return;
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      if (isTypingTarget(event.target) || blocked || event.altKey || event.ctrlKey || event.metaKey)
        return;
      if (event.key.toLowerCase() === 'c') {
        event.preventDefault();
        newTask();
      }
      if (event.key === '/') {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === '?') {
        event.preventDefault();
        openDialog({ kind: 'shortcuts' });
      }
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });
};
