'use client';

import { Button } from '@/shared/ui/Button';
const WorkspaceError = ({ reset }: { reset: () => void }) => (
  <div role="alert" className="flex min-h-60 flex-col items-center justify-center gap-4 p-8">
    <h1>Не удалось загрузить страницу</h1>
    <p className="text-muted">Проверь подключение и повтори попытку.</p>
    <Button onClick={reset}>Повторить</Button>
  </div>
);
export default WorkspaceError;
