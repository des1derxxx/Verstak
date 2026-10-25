'use client';

import { ProfilePanel } from '../../account/ProfilePanel';
import { useSettingsPage } from './useSettingsPage';
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
