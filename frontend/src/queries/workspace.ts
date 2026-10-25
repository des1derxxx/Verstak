'use client';

import {
  useIsMutating,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';
import type { Snapshot } from '@/lib/api/types';
import { loadSnapshot, saveSnapshot } from '@/lib/api/workspace-data';
import type { Workspace } from '@/lib/model/workspace';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { queryKeys } from '@/queries/keys';
import { membersQuery } from '@/queries/members';
const emptyWorkspace: Workspace = { version: 1, projects: [], tasks: [], notes: [] };
// A slow response must never replace data that a newer save already returned.
const keepNewest = (client: QueryClient, id: string, snapshot: Snapshot) => {
  const current = client.getQueryData<Snapshot>(queryKeys.workspaceData(id));
  return current && current.revision > snapshot.revision ? current : snapshot;
};
const useWorkspaceQuery = (polling?: { paused: boolean }) => {
  const { info } = useWorkspace();
  const client = useQueryClient();
  return useQuery({
    queryKey: queryKeys.workspaceData(info.id),
    queryFn: async () => keepNewest(client, info.id, await loadSnapshot(info.id)),
    ...(polling && {
      refetchInterval: polling.paused ? false : 30_000,
      refetchOnWindowFocus: !polling.paused,
    }),
  });
};
export const useWorkspaceData = () => {
  const query = useWorkspaceQuery();
  return {
    workspace: query.data?.data ?? emptyWorkspace,
    loading: query.isPending,
    error: query.error?.message ?? '',
  };
};
// Mounted once by the shell; pauses while the user edits so data does not move under them.
export const useWorkspaceSync = (paused: boolean) => {
  const { info } = useWorkspace();
  useWorkspaceQuery({ paused });
  useQuery({
    ...membersQuery(info.id),
    refetchInterval: paused ? false : 30_000,
    refetchOnWindowFocus: !paused,
  });
};
export const useRefreshWorkspace = () => {
  const { info } = useWorkspace();
  const client = useQueryClient();
  return () => client.refetchQueries({ queryKey: queryKeys.workspace(info.id) });
};
export const useCommitWorkspace = () => {
  const { info, readOnly } = useWorkspace();
  const client = useQueryClient();
  const key = queryKeys.workspaceData(info.id);
  const mutation = useMutation({
    mutationKey: queryKeys.workspaceSave(info.id),
    mutationFn: ({
      previous,
      next,
      replace,
    }: {
      previous: Snapshot;
      next: Workspace;
      replace: boolean;
    }) => saveSnapshot(info.id, previous.revision, previous.data, next, replace),
    onSuccess: (snapshot) => client.setQueryData(key, keepNewest(client, info.id, snapshot)),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409)
        void client.invalidateQueries({ queryKey: key });
    },
  });
  // The update always applies to the latest cached data, never to a stale render.
  return async (update: (workspace: Workspace) => Workspace, replace = false): Promise<boolean> => {
    const previous = client.getQueryData<Snapshot>(key);
    if (
      readOnly ||
      !previous ||
      client.isMutating({ mutationKey: queryKeys.workspaceSave(info.id) })
    )
      return false;
    try {
      await mutation.mutateAsync({ previous, next: update(previous.data), replace });
      return true;
    } catch {
      return false;
    }
  };
};
export const useWorkspaceSaveState = () => {
  const { info } = useWorkspace();
  const filters = { mutationKey: queryKeys.workspaceSave(info.id) };
  const saving = useIsMutating(filters) > 0;
  const errors = useMutationState({ filters, select: (mutation) => mutation.state.error });
  const last = errors.at(-1);
  return { saving, error: last instanceof Error ? last.message : '' };
};
export const useClearSaveError = () => {
  const { info } = useWorkspace();
  const client = useQueryClient();
  return () => {
    const cache = client.getMutationCache();
    for (const mutation of cache.findAll({ mutationKey: queryKeys.workspaceSave(info.id) }))
      if (mutation.state.status !== 'pending') cache.remove(mutation);
  };
};
