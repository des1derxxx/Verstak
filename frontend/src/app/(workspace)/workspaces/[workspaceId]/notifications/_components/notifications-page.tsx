'use client';

import { NotificationPanel } from '@/components/notification/notifications';
import { taskPath } from '@/lib/routes';
import { useSettingsPage } from '@/lib/workspace/use-settings-page';
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
