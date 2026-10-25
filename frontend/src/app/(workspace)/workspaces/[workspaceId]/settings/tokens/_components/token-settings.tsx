'use client';

import { TokenPanel } from '@/app/(workspace)/workspaces/[workspaceId]/settings/tokens/_components/token-panel';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { useBackToWorkspace } from '@/lib/workspace/use-workspace-actions';
export const TokenSettings = () => (
  <TokenPanel inline space={useWorkspace().info} onClose={useBackToWorkspace()} />
);
