'use client';

import { DataPanel } from '@/app/(workspace)/workspaces/[workspaceId]/settings/data/_components/data-panel';
import { useSettingsPage } from '@/lib/workspace/use-settings-page';
export const DataSettings = () => {
  const { model, close, router } = useSettingsPage();
  return (
    <DataPanel
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
