'use client';

import { NotificationPanel } from '@/app/(workspace)/workspaces/[workspaceId]/notifications/_components/notification-panel';
import { useNavigation } from '@/lib/navigation-guard';
import { taskPath } from '@/lib/routes';
import { useBackToWorkspace } from '@/lib/workspace/use-workspace-actions';
export const NotificationsPage = () => {
  const { navigate } = useNavigation();
  return (
    <NotificationPanel
      inline
      onClose={useBackToWorkspace()}
      onOpen={(workspaceId, taskId) => navigate(taskPath(workspaceId, taskId))}
    />
  );
};
