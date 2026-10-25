'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/queries/keys';
export type Token = {
  id: string;
  name: string;
  workspaceId: string;
  scopes: string[];
  last4: string;
  expiresAt: string;
};
export type NewToken = {
  workspaceId: string;
  name: string;
  scopes: string[];
  expiresInDays: number;
};
export const useApiTokens = () =>
  useQuery({ queryKey: queryKeys.apiTokens, queryFn: () => api<Token[]>('/api-tokens') });
export const useCreateApiToken = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (token: NewToken) => api<Token & { token: string }>('/api-tokens', 'POST', token),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.apiTokens }),
  });
};
export const useRevokeApiToken = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api-tokens/${id}`, 'DELETE', {}),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.apiTokens }),
  });
};
