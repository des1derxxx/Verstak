'use client';

import { TokenPanel } from '@/app/(workspace)/workspaces/[workspaceId]/settings/tokens/_components/token-panel';
import { useSettingsPage } from '@/lib/workspace/use-settings-page';
export const TokenSettings = () => {
  const { model, close } = useSettingsPage();
  return <TokenPanel inline space={model.info} onClose={close} />;
};
