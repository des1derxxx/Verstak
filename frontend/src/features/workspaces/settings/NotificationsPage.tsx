'use client';

import { NotificationPanel } from '@/features/notifications/Notifications';
import { taskPath } from '@/shared/lib/routes';
import { useSettingsPage } from '@/features/workspaces/settings/useSettingsPage';
export const NotificationsPage = () => {
  const { model, close } = useSettingsPage();
  return (
    <NotificationPanel
      inline
      onClose={close}
      onOpen={(workspaceId, taskId) => model.navigate(taskPath(workspaceId, taskId))}
    />
  );
};
