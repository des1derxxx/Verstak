import { Button, IconButton } from '../../../shared/ui/Button';
import { cn } from '../../../shared/ui/cn';
import { ChevronRight, FolderKanban, RefreshCw, Settings2, Users } from 'lucide-react';
import type { WorkspaceController } from '../hooks/useWorkspaceController';
export const WorkspaceHeading = ({ model }: { model: WorkspaceController }) => {
  const {
    storageError,
    saving,
    refreshing,
    refresh,
    select,
    project,
    info,
    title,
    selected,
    onTeam,
    readOnly,
    setModal,
  } = model;
  return (
    <>
      {storageError && (
        <div
          role="alert"
          className={cn(
            'storage-alert flex justify-between items-center gap-[15px] py-3 px-[15px] bg-[#fff7d6] border',
            'border-[#f5cd47] rounded text-xs leading-5 mb-[17px] max-[760px]:flex-wrap',
            'max-[760px]:gap-[9px]',
          )}
        >
          <span>{storageError}</span>
          <Button
            disabled={saving || refreshing}
            onClick={() => {
              void refresh(true);
            }}
            variant="secondary"
            size="compact"
          >
            Повторить
          </Button>
        </div>
      )}
      <div
        className={cn(
          'breadcrumbs flex items-center gap-[7px] text-muted text-xs leading-5 mb-[13px] [&_button]:p-0',
          '[&_button]:text-xs [&_button]:text-muted [&_button:hover]:text-brand [&_button:hover]:underline',
          '[&>span]:overflow-hidden [&>span]:text-ellipsis [&>span]:whitespace-nowrap [&>span]:max-w-60',
          'max-[760px]:text-[11px] max-[760px]:mb-3 max-[760px]:gap-[5px]',
          'max-[760px]:[&_button]:text-[11px] max-[760px]:[&>span]:max-w-42.5',
          'max-[520px]:[&>span]:max-w-32.5',
        )}
      >
        <button onClick={() => select('all')}>Пространство</button>
        <ChevronRight size={12} />
        <span>{project ? 'Проекты' : info.name}</span>
        {project && (
          <>
            <ChevronRight size={12} />
            <span>{project.name}</span>
          </>
        )}
      </div>
      <div
        className={cn(
          'project-heading flex justify-between items-center gap-5 mb-5 max-[760px]:mb-[19px]',
          'max-[760px]:gap-2.5',
        )}
      >
        <div
          className={cn(
            'project-title-group flex items-center gap-3 min-w-0 [&>div]:min-w-0 max-[760px]:gap-2.5',
            'max-[520px]:gap-[9px]',
          )}
        >
          {project && (
            <span
              className={cn(
                'project-heading-icon flex items-center justify-center w-10.5 h-10.5 text-white rounded-md',
                'shrink-0 max-[760px]:w-[35px] max-[760px]:h-[35px] max-[520px]:hidden',
              )}
              style={{ background: project.color }}
            >
              <FolderKanban size={23} />
            </span>
          )}
          <div>
            <h1>{title}</h1>
            <p
              className={cn(
                'project-description text-xs text-muted mt-1 leading-4.5 overflow-hidden text-ellipsis',
                'whitespace-nowrap max-w-162.5 max-[1200px]:max-w-102.5 max-[1000px]:max-w-77.5',
                'max-[760px]:text-[11px] max-[760px]:max-w-87.5 max-[520px]:max-w-60',
              )}
              title={project?.description}
            >
              {selected === 'today'
                ? 'Задачи на сегодня и задачи с прошедшим сроком'
                : project?.description || 'Планируй работу и отслеживай задачи команды'}
            </p>
          </div>
        </div>
        <div
          className={
            'project-heading-actions flex items-center gap-[9px] shrink-0 max-[760px]:gap-0.5'
          }
        >
          {saving && (
            <span
              className={'save-indicator text-muted text-[11px] max-[760px]:hidden'}
              role="status"
            >
              Сохраняем…
            </span>
          )}
          <IconButton
            className={
              refreshing ? 'is-refreshing [&_svg]:[animation:spin_1s_linear_infinite]' : ''
            }
            aria-label="Обновить пространство"
            title="Обновить"
            disabled={saving || refreshing}
            onClick={() => {
              void refresh(true);
            }}
          >
            <RefreshCw size={17} />
          </IconButton>
          <Button
            className={'team-button max-[1000px]:hidden'}
            onClick={onTeam}
            variant="secondary"
            size="compact"
          >
            <Users size={15} />
            Участники
          </Button>
          {project && !readOnly && (
            <IconButton
              title="Настройки проекта"
              aria-label="Настройки проекта"
              onClick={() => setModal({ kind: 'project', project })}
            >
              <Settings2 size={18} />
            </IconButton>
          )}
        </div>
      </div>
    </>
  );
};
