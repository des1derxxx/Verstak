'use client';

import { TokenPanel } from '@/features/account/TokenPanel';
import { useSettingsPage } from '@/features/workspaces/settings/useSettingsPage';
export const TokenSettings = () => {
  const { model, close } = useSettingsPage();
  return <TokenPanel inline space={model.info} onClose={close} />;
};
