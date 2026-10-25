'use client';

import { ProfilePanel } from '@/features/account/ProfilePanel';
import { useSettingsPage } from '@/features/workspaces/settings/useSettingsPage';
export const ProfileSettings = () => {
  const { model, close } = useSettingsPage();
  return (
    <ProfilePanel
      inline
      user={model.session.user}
      onUser={(user) => model.onUser?.(user)}
      onClose={close}
    />
  );
};
