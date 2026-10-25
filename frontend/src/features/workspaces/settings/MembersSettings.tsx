'use client';

import { TeamPanel } from '../TeamPanel';
import { useSettingsPage } from './useSettingsPage';
export const MembersSettings = () => {
  const { model, close, router } = useSettingsPage();
  return (
    <TeamPanel
      inline
      space={model.info}
      session={model.session}
      onClose={close}
      onAccessChanged={async () => {
        await model.refresh();
        router.refresh();
      }}
    />
  );
};
