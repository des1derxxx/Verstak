'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/queries/keys';
export type Notification = {
  id: string;
  workspaceId: string;
  taskId: string;
  taskKey: string;
  taskTitle: string;
  actorName: string;
  event: string;
  createdAt: string;
  readAt: string | null;
};
// The bell polls; the panel only reads the same cache and refreshes when it opens.
export const useNotifications = ({ poll = false } = {}) =>
  useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => api<Notification[]>('/notifications'),
    ...(poll
      ? { refetchInterval: 30_000, refetchOnWindowFocus: true }
      : { refetchOnMount: 'always' as const }),
  });
export const useMarkNotificationRead = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/notifications/${id}/read`, 'PATCH', {}),
    onSuccess: (_, id) =>
      client.setQueryData<Notification[]>(queryKeys.notifications, (items) =>
        items?.map((item) =>
          item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
        ),
      ),
  });
};
