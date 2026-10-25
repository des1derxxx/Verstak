'use client';

import { ProfilePanel } from '@/app/(workspace)/workspaces/[workspaceId]/settings/profile/_components/profile-panel';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { useBackToWorkspace } from '@/lib/workspace/use-workspace-actions';
export const ProfileSettings = () => {
  const { session, setUser } = useWorkspace();
  return (
    <ProfilePanel inline user={session.user} onUser={setUser} onClose={useBackToWorkspace()} />
  );
};
