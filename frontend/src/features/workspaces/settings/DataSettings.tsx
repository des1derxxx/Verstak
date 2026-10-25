'use client';

import { DataModal } from '../DataModal';
import { useSettingsPage } from './useSettingsPage';
export const DataSettings = () => {
  const { model, close, router } = useSettingsPage();
  return (
    <DataModal
      inline
      workspace={model.workspace}
      canImport={model.info.role === 'owner'}
      onClose={close}
      onImport={async (next) => {
        if (await model.commit(next, 'Данные импортированы', true)) {
          close();
          router.refresh();
        }
      }}
    />
  );
};
