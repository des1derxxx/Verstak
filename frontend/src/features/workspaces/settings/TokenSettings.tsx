'use client';

import { TokenPanel } from '../../account/TokenPanel';
import { useSettingsPage } from './useSettingsPage';
export const TokenSettings = () => {
  const { model, close } = useSettingsPage();
  return <TokenPanel inline space={model.info} onClose={close} />;
};
