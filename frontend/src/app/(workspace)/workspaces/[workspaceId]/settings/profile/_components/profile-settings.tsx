'use client';

import { ProfilePanel } from '@/app/(workspace)/workspaces/[workspaceId]/settings/profile/_components/profile-panel';
import { useSettingsPage } from '@/lib/workspace/use-settings-page';
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
