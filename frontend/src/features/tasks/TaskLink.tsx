'use client';

import { useContext } from 'react';
import type { HTMLAttributes } from 'react';
import { WorkspaceContext } from '@/features/workspaces/WorkspaceContext';
import type { Task } from '@/shared/model/workspace';
import { taskPath } from '@/shared/lib/routes';
import { RouteLink } from '@/shared/ui/RouteLink';
type Props = HTMLAttributes<HTMLElement> & { task: Task; onOpen: (task: Task) => void };
export const TaskLink = ({ task, onOpen, ...props }: Props) => {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) return <button {...props} type="button" onClick={() => onOpen(task)} />;
  return (
    <RouteLink
      {...props}
      href={taskPath(workspace.info.id, task.key ?? task.id)}
      prefetch={false}
      navigate={() => onOpen(task)}
    />
  );
};
