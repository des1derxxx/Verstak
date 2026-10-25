import { cn } from '@/lib/cn';
import { Dropdown } from '@/components/ui/dropdown';
import { Markdown } from '@/components/ui/markdown';
import { taskKey } from '@/lib/model/task';
import { TaskMetadata } from '@/components/task/task-editor/task-metadata';
import { TaskChecklist } from '@/components/task/task-editor/task-checklist';
import { TaskLinks } from '@/components/task/task-editor/task-links';
import type { TaskEditorModel } from '@/components/task/task-editor/use-task-editor';

export const TaskMainFields = ({ model }: { model: TaskEditorModel }) => {
  const { task, titleRef, draft, update, parent, projects, preview, setPreview, closing } = model;
  const metadata = <TaskMetadata model={model} />;
  const checklist = <TaskChecklist model={model} />;
  return (
    <div className={'issue-main-fields flex flex-col gap-5.75 p-5.5 min-w-0 max-tablet:p-5'}>
      <label className={task ? 'issue-title-label' : ''}>
        <span
          className={
            task
              ? 'sr-only absolute w-px h-px p-0 overflow-hidden [clip:rect(0,0,0,0)] whitespace-nowrap border-0'
              : ''
          }
        >
          Название <span className={'required-mark text-danger'}>*</span>
        </span>
        {task ? (
          <textarea
            ref={titleRef}
            autoFocus
            aria-label="Название задачи"
            required
            maxLength={180}
            rows={1}
            className="issue-title-input resize-none overflow-hidden border-transparent px-1.25 py-1 text-heading-lg font-semibold leading-7.75 hover:bg-surface-soft focus:border-brand"
            value={draft.title}
            onChange={(event) => update('title', event.target.value.replace(/\n/g, ' '))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) event.preventDefault();
            }}
          />
        ) : (
          <input
            autoFocus
            aria-label="Название задачи"
            required
            maxLength={180}
            placeholder="Например, настроить авторизацию"
            value={draft.title}
            onChange={(event) => update('title', event.target.value)}
          />
        )}
      </label>
      {!task && parent && (
        <p className={'body-muted text-body text-muted leading-5.25'}>
          Подзадача для {taskKey(parent)} · {parent.title}
        </p>
      )}
      {!task && (
        <label>
          <span>
            Проект <span className={'required-mark text-danger'}>*</span>
          </span>
          <Dropdown
            aria-label="Проект задачи"
            value={draft.projectId}
            onValueChange={(value) => {
              update('projectId', value);
              update('parentId', null);
            }}
            options={[...projects.map((project) => ({ value: project.id, label: project.name }))]}
          />
        </label>
      )}
      <section className={'issue-section flex flex-col gap-2.5 [&>textarea]:min-h-28'}>
        <div
          className={cn(
            'issue-section-heading [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-ink flex items-center',
            'gap-2.5 [&>span]:text-caption [&>span]:text-muted [&_.segmented]:ml-auto',
          )}
        >
          <h3>Описание</h3>
          <div
            className={cn(
              'segmented flex p-0.75 rounded bg-neutral ml-auto shrink-0 [&_button]:py-1.25',
              '[&_button]:px-2.5 [&_button]:text-caption [&_button]:rounded-chip [&_button]:text-muted',
              '[&_button[aria-pressed=true]]:bg-surface [&_button[aria-pressed=true]]:text-ink',
              '[&_button[aria-pressed=true]]:shadow-raised max-phone:[&_button]:text-tiny',
              'max-phone:[&_button]:px-1.75',
            )}
          >
            <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>
              Текст
            </button>
            <button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>
              Просмотр
            </button>
          </div>
        </div>
        {preview ? (
          <Markdown text={draft.description || 'Описание пока не добавлено.'} />
        ) : (
          <textarea
            aria-label="Описание задачи"
            rows={task ? 6 : 3}
            maxLength={20000}
            placeholder="Описание в Markdown: требования, списки, код…"
            value={draft.description}
            onChange={(e) => update('description', e.target.value)}
          />
        )}
      </section>
      {closing && (
        <label
          className={'resolution-field p-3.5 bg-brand-soft border border-brand-border rounded-card'}
        >
          Итоговый комментарий <span className={'required-mark text-danger'}>*</span>
          <textarea
            aria-label="Итоговый комментарий"
            required
            rows={3}
            maxLength={10000}
            value={draft.resolutionComment ?? ''}
            onChange={(e) => update('resolutionComment', e.target.value)}
            placeholder="Что сделано и как проверено?"
          />
          <span className={'field-hint text-tiny font-normal text-muted'}>
            Будет сохранён вместе со сменой статуса.
          </span>
        </label>
      )}
      <TaskLinks model={model} />
      {task ? (
        checklist
      ) : (
        <details
          className={cn(
            'create-extra-fields border-t border-line pt-3.75 [&>summary]:text-muted',
            '[&>summary]:text-body [&>summary]:cursor-pointer [&[open]>summary]:mb-5',
            '[&>.issue-metadata-fields]:grid [&>.issue-metadata-fields]:grid-cols-[1fr_1fr]',
            '[&>.issue-metadata-fields]:gap-4 [&>.checklist-editor]:mt-5.5',
            'max-phone:[&>.issue-metadata-fields]:grid-cols-[1fr]',
          )}
        >
          <summary>Дополнительные поля</summary>
          {metadata}
          {checklist}
        </details>
      )}
    </div>
  );
};
