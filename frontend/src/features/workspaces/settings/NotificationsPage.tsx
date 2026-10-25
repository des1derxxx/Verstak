'use client';

import { NotificationPanel } from '../../notifications/Notifications';
import { taskPath } from '../../../shared/lib/routes';
import { useSettingsPage } from './useSettingsPage';
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
