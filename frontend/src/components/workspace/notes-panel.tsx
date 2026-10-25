'use client';

import { useCalendar } from '@/lib/calendar';
import { RouteLink } from '@/components/ui/route-link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { FileText, Plus } from 'lucide-react';
import { useNavigation } from '@/lib/navigation-guard';
import { notePath } from '@/lib/routes';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import { useNoteActions } from '@/lib/workspace/use-workspace-actions';
import { useTaskFilters, useTaskView } from '@/lib/workspace/workspace-location';
export const NotesPanel = () => {
  const { timeZone } = useCalendar();
  const { info, readOnly } = useWorkspace();
  const { navigate } = useNavigation();
  const { workspace, notes } = useTaskView();
  const { filters } = useTaskFilters();
  const { newNote: openPage } = useNoteActions();
  return (
    <div
      className={cn(
        'notes-grid grid grid-cols-[repeat(auto-fill,minmax(245px,1fr))] gap-4',
        'max-phone:grid-cols-[1fr]',
      )}
    >
      {notes.map((note) => (
        <RouteLink
          href={notePath(info.id, note.id)}
          navigate={navigate}
          className={cn(
            'note-card text-left p-5.25 border border-line rounded-card bg-surface min-h-55 flex flex-col',
            '[&:hover]:border-brand-border [&:hover]:shadow-tile-hover [&_h2]:text-lead',
            '[&_h2]:font-semibold [&_h2]:leading-5.5 [&_h2]:wrap-anywhere [&_p]:text-xs [&_p]:leading-5',
            '[&_p]:mt-2.25 [&_p]:mx-0 [&_p]:mb-5 [&_p]:text-muted [&_p]:[display:-webkit-box]',
            '[&_p]:[-webkit-box-orient:vertical] [&_p]:[-webkit-line-clamp:3] [&_p]:overflow-hidden',
            '[&_p]:wrap-anywhere [&>div]:flex [&>div]:justify-between [&>div]:gap-3 [&>div]:text-tiny',
            '[&>div]:text-muted [&>div]:mt-auto',
          )}
          key={note.id}
        >
          <span className={'note-icon inline-flex text-brand mb-3.75'}>
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
            'empty-state flex flex-col items-center justify-center gap-3.75 text-center min-h-65 py-12.5',
            'px-6 text-muted col-[1/-1] [&>svg]:text-placeholder [&_h2]:text-title [&_h2]:font-semibold',
            '[&_h2]:leading-7 [&_h2]:text-ink [&_p]:text-body [&_p]:leading-5.25 [&_p]:max-w-102.5',
            '[&_p]:text-muted max-phone:py-9.5 max-phone:px-3.75 max-phone:[&_h2]:text-title-sm',
            'max-phone:[&_p]:text-xs',
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
