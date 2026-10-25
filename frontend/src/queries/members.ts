'use client';

import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { Member } from '@/lib/api/types';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { queryKeys } from '@/queries/keys';
export const membersQuery = (workspaceId: string) =>
  queryOptions({
    queryKey: queryKeys.members(workspaceId),
    queryFn: () => api<Member[]>(`/workspaces/${workspaceId}/members`),
  });
export const useMembers = () => {
  const { info } = useWorkspace();
  const query = useQuery(membersQuery(info.id));
  return { members: query.data ?? [], error: query.error?.message ?? '' };
};
