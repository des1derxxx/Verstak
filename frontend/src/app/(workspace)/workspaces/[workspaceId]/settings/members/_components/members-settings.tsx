'use client';

import { TeamPanel } from '@/app/(workspace)/workspaces/[workspaceId]/settings/members/_components/team-panel';
import { useSettingsPage } from '@/lib/workspace/use-settings-page';
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
