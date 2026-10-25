import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useRef, useState } from 'react';
import { Download, FolderKanban, Upload } from 'lucide-react';
import { localDate, parseWorkspace } from '@/lib/model/workspace';
import type { Workspace } from '@/lib/model/workspace';
import { Modal } from '@/components/ui/modal';
const download = (text: string, name: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
export const DataPanel = ({
  workspace,
  canImport,
  onImport,
  onClose,
  inline = false,
}: {
  workspace: Workspace;
  canImport: boolean;
  onImport: (workspace: Workspace) => void;
  onClose: () => void;
  inline?: boolean;
}) => {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  const readFile = async (file?: File) => {
    if (!file) return;
    setPending(null);
    setError('');
    if (file.size > 10 * 1024 * 1024) {
      setError('Размер копии должен быть не больше 10 МБ.');
      return;
    }
    try {
      setPending(parseWorkspace(JSON.parse(await file.text())));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не удалось прочитать файл.');
    }
  };
  return (
    <Modal inline={inline} title="Твои данные" onClose={onClose} readOnly={false}>
      <div
        className={cn(
          'editor-form flex flex-col gap-5 p-6 [&_h2]:text-heading-sm [&_h2]:font-semibold [&_h3]:text-lead',
          '[&_h3]:font-semibold',
          '[&_.title-input]:text-heading-lg [&_.title-input]:font-semibold [&_.title-input]:pt-0.75',
          '[&_.title-input]:px-0 [&_.title-input]:pb-3 [&_.title-input]:border-0 [&_.title-input]:border-b',
          '[&_.title-input]:border-line [&_.title-input]:rounded-none [&_.note-textarea]:min-h-85',
          '[&_.note-textarea]:font-mono [&_.note-textarea]:text-body [&_.note-textarea]:leading-5.75',
          'max-phone:p-5 max-phone:gap-4.5',
        )}
      >
        <div
          className={cn(
            'data-illustration flex items-center justify-center w-16 h-16 rounded-xl text-brand',
            'bg-brand-soft [align-self:center]',
          )}
        >
          <FolderKanban size={32} strokeWidth={1.3} />
        </div>
        <h2 className={'data-title text-center'}>Данные пространства</h2>
        <p className={'body-muted text-body text-muted leading-5.25'}>
          Скачай проекты, задачи и заметки одним файлом. Владелец пространства может восстановить их
          из копии. Участники, аккаунты, комментарии и история в этот файл не входят. Для полной
          копии нужна резервная копия MongoDB.
        </p>
        <div
          className={cn(
            'data-stats flex [justify-content:space-around] gap-2 [border-block:1px_solid_var(--color-line)]',
            'py-4.25 px-0 text-muted text-xs [&_b]:text-ink [&_b]:text-base [&_b]:font-semibold',
            '[&_b]:mr-0.75',
          )}
        >
          <span>
            <b>{workspace.projects.length}</b> проектов
          </span>
          <span>
            <b>{workspace.tasks.length}</b> задач
          </span>
          <span>
            <b>{workspace.notes.length}</b> заметок
          </span>
        </div>
        <Button
          className={'full-width w-full'}
          onClick={() =>
            download(JSON.stringify(workspace, null, 2), `verstak-${localDate()}.json`)
          }
          variant="secondary"
        >
          <Download size={17} />
          Скачать резервную копию
        </Button>
        {canImport && (
          <Button
            className={'full-width w-full'}
            onClick={() => input.current?.click()}
            variant="secondary"
          >
            <Upload size={17} />
            Импортировать из файла
          </Button>
        )}
        <input
          ref={input}
          className={
            'sr-only absolute w-px h-px p-0 overflow-hidden [clip:rect(0,0,0,0)] whitespace-nowrap border-0'
          }
          type="file"
          accept=".json,application/json"
          onChange={(event) => {
            void readFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        {error && (
          <p
            role="alert"
            className={cn(
              'error-text py-2.5 px-3 text-danger-strong bg-danger-soft border border-danger-border rounded text-xs',
              'leading-4.75',
            )}
          >
            {error}
          </p>
        )}
        {pending && (
          <div
            className={cn(
              'import-confirm p-3.75 border border-danger-border bg-danger-soft rounded text-xs leading-5',
              'text-danger-ink [&_p]:mt-2.5 [&_p]:mx-0 [&_p]:mb-3.5',
            )}
          >
            <b>Заменить текущие данные?</b>
            <p>
              В файле: {pending.projects.length} проектов, {pending.tasks.length} задач,{' '}
              {pending.notes.length} заметок. Сначала скачай копию текущих данных.
            </p>
            <div className={'footer-actions flex items-center justify-end gap-2 ml-auto'}>
              <Button onClick={() => setPending(null)} variant="secondary">
                Отмена
              </Button>
              <Button onClick={() => onImport(pending)} variant="primary">
                Заменить данные
              </Button>
            </div>
          </div>
        )}
        <p className={'small-print text-caption text-muted leading-4.5 text-center'}>
          Verstak · Версия 0.1
        </p>
      </div>
    </Modal>
  );
};
