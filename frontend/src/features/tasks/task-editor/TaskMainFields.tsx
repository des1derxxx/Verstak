import { cn } from '@/shared/ui/cn';
import { Dropdown } from '@/shared/ui/Dropdown';
import { Markdown } from '@/shared/ui/Markdown';
import { taskKey } from '@/features/tasks/task-view';
import { TaskMetadata } from '@/features/tasks/task-editor/TaskMetadata';
import { TaskChecklist } from '@/features/tasks/task-editor/TaskChecklist';
import { TaskLinks } from '@/features/tasks/task-editor/TaskLinks';
import type { TaskEditorModel } from '@/features/tasks/task-editor/useTaskEditor';

export const TaskMainFields = ({ model }: { model: TaskEditorModel }) => {
  const { task, titleRef, draft, update, parent, projects, preview, setPreview, closing } = model;
  const metadata = <TaskMetadata model={model} />;
  const checklist = <TaskChecklist model={model} />;
  return (
    <div className={'issue-main-fields flex flex-col gap-[23px] p-5.5 min-w-0 max-[760px]:p-5'}>
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
            className="issue-title-input resize-none overflow-hidden border-transparent px-[5px] py-1 text-[23px] font-semibold leading-[31px] hover:bg-surface-soft focus:border-brand"
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
        <p className={'body-muted text-[13px] text-muted leading-[21px]'}>
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
            'gap-2.5 [&>span]:text-[11px] [&>span]:text-muted [&_.segmented]:ml-auto',
          )}
        >
          <h3>Описание</h3>
          <div
            className={cn(
              'segmented flex p-[3px] rounded bg-[#f1f2f4] ml-auto shrink-0 [&_button]:py-[5px]',
              '[&_button]:px-2.5 [&_button]:text-[11px] [&_button]:rounded-[3px] [&_button]:text-muted',
              '[&_button[aria-pressed=true]]:bg-white [&_button[aria-pressed=true]]:text-ink',
              '[&_button[aria-pressed=true]]:shadow-[0_1px_3px_#091e421f] max-[520px]:[&_button]:text-[10px]',
              'max-[520px]:[&_button]:px-[7px]',
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
          className={'resolution-field p-3.5 bg-[#e9f2ff] border border-[#85b8ff] rounded-[5px]'}
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
          <span className={'field-hint text-[10px] font-normal text-muted'}>
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
            'create-extra-fields border-t border-line pt-[15px] [&>summary]:text-muted',
            '[&>summary]:text-[13px] [&>summary]:cursor-pointer [&[open]>summary]:mb-5',
            '[&>.issue-metadata-fields]:grid [&>.issue-metadata-fields]:grid-cols-[1fr_1fr]',
            '[&>.issue-metadata-fields]:gap-4 [&>.checklist-editor]:mt-5.5',
            'max-[520px]:[&>.issue-metadata-fields]:grid-cols-[1fr]',
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
