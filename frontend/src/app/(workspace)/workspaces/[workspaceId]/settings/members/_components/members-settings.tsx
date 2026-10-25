'use client';

import { useRouter } from 'next/navigation';
import { TeamPanel } from '@/app/(workspace)/workspaces/[workspaceId]/settings/members/_components/team-panel';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { useBackToWorkspace } from '@/lib/workspace/use-workspace-actions';
import { useRefreshWorkspace } from '@/queries/workspace';
export const MembersSettings = () => {
  const { info, session } = useWorkspace();
  const router = useRouter();
  const refresh = useRefreshWorkspace();
  return (
    <TeamPanel
      inline
      space={info}
      session={session}
      onClose={useBackToWorkspace()}
      onAccessChanged={async () => {
        await refresh();
        router.refresh();
      }}
    />
  );
};
