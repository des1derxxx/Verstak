// Every query key lives here so invalidation always matches the query it targets.
export const queryKeys = {
  workspace: (id: string) => ['workspaces', id] as const,
  workspaceData: (id: string) => ['workspaces', id, 'data'] as const,
  workspaceSave: (id: string) => ['workspaces', id, 'save'] as const,
  members: (id: string) => ['workspaces', id, 'members'] as const,
  invitations: (id: string) => ['workspaces', id, 'invitations'] as const,
  notifications: ['notifications'] as const,
  apiTokens: ['api-tokens'] as const,
};
