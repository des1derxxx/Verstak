'use client';

import { useCalendar } from '@/shared/ui/CalendarContext';

import { RouteLink } from '@/shared/ui/RouteLink';
import { useWorkspace } from '@/features/workspaces/WorkspaceContext';
import { workspacePath } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/ui/cn';
import { FileText, Plus } from 'lucide-react';
export const NotesPanel = () => {
  const { timeZone } = useCalendar();
  const model = useWorkspace();
  const { workspace, readOnly, notes, filters, openPage } = model;
  return (
    <div
      className={cn(
        'notes-grid grid grid-cols-[repeat(auto-fill,minmax(245px,1fr))] gap-4',
        'max-[520px]:grid-cols-[1fr]',
      )}
    >
      {notes.map((note) => (
        <RouteLink
          href={`${workspacePath(model.info.id)}/pages/${encodeURIComponent(note.id)}`}
          navigate={model.navigate}
          className={cn(
            'note-card text-left p-[21px] border border-line rounded-[5px] bg-white min-h-55 flex flex-col',
            '[&:hover]:border-[#85b8ff] [&:hover]:shadow-[0_2px_6px_#091e421a] [&_h2]:text-[15px]',
            '[&_h2]:font-semibold [&_h2]:leading-5.5 [&_h2]:wrap-anywhere [&_p]:text-xs [&_p]:leading-5',
            '[&_p]:mt-[9px] [&_p]:mx-0 [&_p]:mb-5 [&_p]:text-muted [&_p]:[display:-webkit-box]',
            '[&_p]:[-webkit-box-orient:vertical] [&_p]:[-webkit-line-clamp:3] [&_p]:overflow-hidden',
            '[&_p]:wrap-anywhere [&>div]:flex [&>div]:justify-between [&>div]:gap-3 [&>div]:text-[10px]',
            '[&>div]:text-muted [&>div]:mt-auto',
          )}
          key={note.id}
        >
          <span className={'note-icon inline-flex text-brand mb-[15px]'}>
            <FileText size={23} />
          </span>
          <h2>{note.title}</h2>
          <p>
            {note.body.replace(/^#+\s/gm, '').replace(/^-\s/gm, '').slice(0, 180) ||
              'Пустая страница'}
          </p>
          <div>
            <span>{workspace.projects.find((item) => item.id === note.projectId)?.name}</span>
            <time dateTime={note.updatedAt}>
              {new Intl.DateTimeFormat('ru', { timeZone, day: 'numeric', month: 'short' }).format(
                new Date(note.updatedAt),
              )}
            </time>
          </div>
        </RouteLink>
      ))}
      {!notes.length && (
        <div
          className={cn(
            'empty-state flex flex-col items-center justify-center gap-[15px] text-center min-h-65 py-12.5',
            'px-6 text-muted col-[1/-1] [&>svg]:text-[#8590a2] [&_h2]:text-[19px] [&_h2]:font-semibold',
            '[&_h2]:leading-7 [&_h2]:text-ink [&_p]:text-[13px] [&_p]:leading-[21px] [&_p]:max-w-102.5',
            '[&_p]:text-muted max-[520px]:py-9.5 max-[520px]:px-[15px] max-[520px]:[&_h2]:text-[17px]',
            'max-[520px]:[&_p]:text-xs',
          )}
        >
          <FileText size={34} strokeWidth={1.5} />
          <h2>{filters.query ? 'Страницы не найдены' : 'Знания команды — в одном месте'}</h2>
          <p>
            {filters.query
              ? 'Попробуй изменить поисковый запрос.'
              : 'Сохраняй требования, решения и полезные заметки рядом с задачами.'}
          </p>
          {!filters.query && (
            <Button disabled={readOnly} onClick={openPage} variant="primary">
              <Plus size={16} />
              Создать страницу
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
