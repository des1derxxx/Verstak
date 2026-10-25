'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/queries/keys';
export type Comment = {
  id: string;
  authorName: string;
  body: string;
  kind: string;
  createdAt: string;
};
export type HistoryEntry = {
  id: string;
  actorName: string;
  event: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  createdAt: string;
};
const taskUrl = (workspaceId: string, taskId: string, part: 'comments' | 'history') =>
  `/tasks/${encodeURIComponent(taskId)}/${part}?workspaceId=${encodeURIComponent(workspaceId)}`;
export const useTaskActivity = (workspaceId: string, taskId: string) => {
  const comments = useQuery({
    queryKey: queryKeys.taskComments(workspaceId, taskId),
    queryFn: () => api<Comment[]>(taskUrl(workspaceId, taskId, 'comments')),
  });
  const history = useQuery({
    queryKey: queryKeys.taskHistory(workspaceId, taskId),
    queryFn: () => api<HistoryEntry[]>(taskUrl(workspaceId, taskId, 'history')),
  });
  return {
    comments: comments.data ?? [],
    history: history.data ?? [],
    ready: comments.isSuccess && history.isSuccess,
    error: (comments.error ?? history.error)?.message ?? '',
    retry: () => Promise.all([comments.refetch(), history.refetch()]),
  };
};
export const useAddComment = (workspaceId: string, taskId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api<Comment>(taskUrl(workspaceId, taskId, 'comments'), 'POST', { body }),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.taskComments(workspaceId, taskId) }),
        client.invalidateQueries({ queryKey: queryKeys.taskHistory(workspaceId, taskId) }),
      ]),
  });
};
