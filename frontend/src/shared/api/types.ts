import type { Workspace } from '@/shared/model/workspace';
export type Role = 'owner' | 'editor' | 'viewer';
export type User = {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string | null;
  profileRevision?: number;
};
export type Session = {
  user: User;
  csrf: string;
};
export type Space = {
  id: string;
  name: string;
  role: Role;
};
export type Member = {
  user: User;
  role: Role;
};
export type Invitation = {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
};
export type Snapshot = {
  revision: number;
  data: Workspace;
};
