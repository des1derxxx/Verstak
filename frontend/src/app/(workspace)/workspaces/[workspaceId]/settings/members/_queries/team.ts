'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { Invitation, Role, Space } from '@/lib/api/types';
import { queryKeys } from '@/queries/keys';
import { membersQuery } from '@/queries/members';
export const useTeam = (space: Space) => {
  const members = useQuery(membersQuery(space.id));
  const invitations = useQuery({
    queryKey: queryKeys.invitations(space.id),
    queryFn: () => api<Invitation[]>(`/workspaces/${space.id}/invitations`),
    enabled: space.role === 'owner',
  });
  return {
    members: members.data ?? [],
    invitations: invitations.data ?? [],
    ready: members.isSuccess && (space.role !== 'owner' || invitations.isSuccess),
    error: (members.error ?? invitations.error)?.message ?? '',
  };
};
const useTeamMutation = <T, R>(workspaceId: string, mutationFn: (variables: T) => Promise<R>) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.members(workspaceId) }),
        client.invalidateQueries({ queryKey: queryKeys.invitations(workspaceId) }),
      ]),
  });
};
export const useTeamActions = (workspaceId: string) => {
  const base = `/workspaces/${workspaceId}`;
  return {
    changeRole: useTeamMutation(workspaceId, ({ userId, role }: { userId: string; role: Role }) =>
      api(`${base}/members/${userId}`, 'PATCH', { role }),
    ),
    removeMember: useTeamMutation(workspaceId, (userId: string) =>
      api(`${base}/members/${userId}`, 'DELETE', {}),
    ),
    invite: useTeamMutation(workspaceId, (invitation: { email: string; role: Role }) =>
      api<{ url: string }>(`${base}/invitations`, 'POST', invitation),
    ),
    revokeInvitation: useTeamMutation(workspaceId, (id: string) =>
      api(`${base}/invitations/${id}`, 'DELETE', {}),
    ),
  };
};
