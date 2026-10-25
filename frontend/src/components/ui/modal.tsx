import { useRouteDraft } from '@/lib/navigation-guard';
import { Button, IconButton } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
export const MutationContext = createContext({ saving: false, readOnly: false, error: '' });
export const useDiscardConfirmation = (dirty: boolean, onClose: () => void) => {
  useRouteDraft(dirty);
  const [discarding, setDiscarding] = useState(false);
  useEffect(() => {
    if (!dirty) setDiscarding(false);
  }, [dirty]);
  const requestClose = () => {
    if (dirty) setDiscarding(true);
    else onClose();
  };
  const confirmation =
    discarding && dirty ? (
      <div
        className={cn(
          'discard-confirm p-3.75 border border-danger-border bg-danger-soft rounded text-xs leading-5',
          'text-danger-ink mt-0 mx-5 mb-4 [&>div]:flex [&>div]:flex-wrap [&>div]:justify-end [&>div]:gap-2',
          '[&>div]:mt-3.5 max-phone:mx-3.75 max-phone:[&_.button]:text-caption',
          'max-phone:[&_.button]:whitespace-normal',
        )}
        role="alert"
      >
        <strong>Есть несохранённые изменения</strong>
        <div>
          <Button type="button" onClick={() => setDiscarding(false)} variant="secondary">
            Продолжить редактирование
          </Button>
          <Button type="button" onClick={onClose} variant="danger">
            Закрыть без сохранения
          </Button>
        </div>
      </div>
    ) : null;
  return { requestClose, confirmation };
};
export const Modal = ({
  title,
  children,
  onClose,
  wide = false,
  pending = false,
  drawer = false,
  inline = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  pending?: boolean;
  drawer?: boolean;
  inline?: boolean;
  readOnly?: boolean;
}) => {
  const ref = useRef<HTMLDialogElement>(null);
  const mutation = useContext(MutationContext);
  const locked = mutation.saving || pending;
  useEffect(() => {
    if (inline) return;
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, [inline]);
  const content = (
    <>
      <div
        className={cn(
          'modal-heading flex items-center justify-between gap-4 py-3.75 px-5 border-b border-line',
          'min-h-14.25 text-base font-semibold [&>span]:overflow-hidden [&>span]:text-ellipsis',
          '[&>span]:whitespace-nowrap max-phone:py-3.25 max-phone:px-4.25 max-phone:text-base',
        )}
      >
        <span>{title}</span>
        <IconButton type="button" aria-label="Закрыть" disabled={locked} onClick={onClose}>
          <X size={20} />
        </IconButton>
      </div>
      {mutation.error && (
        <p
          role="alert"
          className={cn(
            'error-text py-2.5 px-3 text-danger-strong bg-danger-soft border border-danger-border rounded text-xs',
            'leading-4.75 modal-error mt-3.5 mx-5 mb-0',
          )}
        >
          {mutation.error}
        </p>
      )}
      <fieldset className={'modal-fields border-0 min-w-0 m-0 p-0'} disabled={locked}>
        {children}
      </fieldset>
    </>
  );
  if (inline)
    return (
      <section
        className="mx-auto w-full max-w-5xl overflow-hidden rounded-md border border-line bg-surface"
        aria-label={title}
      >
        {content}
      </section>
    );
  return (
    <dialog
      ref={ref}
      className={cn(
        'modal p-0 w-120 max-w-[calc(100vw_-_32px)] max-h-[90dvh] overflow-auto border border-line',
        'rounded-dialog text-ink bg-surface shadow-modal [&::backdrop]:bg-overlay-strong',
        'max-tablet:max-w-[calc(100vw_-_24px)] max-tablet:max-h-[94dvh]',
        wide ? 'modal-wide w-170' : '',
        drawer
          ? 'modal-drawer fixed [inset:0_0_0_auto] m-0 w-[min(880px,90vw)] h-dvh max-h-dvh max-w-screen rounded-none [border-width:0_0_0_1px] shadow-drawer [&::backdrop]:bg-overlay-light [&_.modal-heading]:text-xs [&_.modal-heading]:font-normal [&_.modal-heading]:text-muted max-tablet:w-screen max-tablet:max-w-screen max-tablet:max-h-dvh'
          : 'fixed inset-0 m-auto',
      )}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        if (!locked) onClose();
      }}
      onClick={(event) => {
        if (locked || event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
    >
      {content}
    </dialog>
  );
};
