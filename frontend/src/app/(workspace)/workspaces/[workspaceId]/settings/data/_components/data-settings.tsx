'use client';

import { useRouter } from 'next/navigation';
import { DataPanel } from '@/app/(workspace)/workspaces/[workspaceId]/settings/data/_components/data-panel';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { useWorkspaceUi } from '@/lib/workspace/workspace-ui';
import { useBackToWorkspace } from '@/lib/workspace/use-workspace-actions';
import { useCommitWorkspace, useWorkspaceData } from '@/queries/workspace';
export const DataSettings = () => {
  const { info } = useWorkspace();
  const { notify } = useWorkspaceUi();
  const { workspace } = useWorkspaceData();
  const commit = useCommitWorkspace();
  const close = useBackToWorkspace();
  const router = useRouter();
  return (
    <DataPanel
      inline
      workspace={workspace}
      canImport={info.role === 'owner'}
      onClose={close}
      onImport={async (next) => {
        if (await commit(() => next, true)) {
          notify('Данные импортированы');
          close();
          router.refresh();
        }
      }}
    />
  );
};
