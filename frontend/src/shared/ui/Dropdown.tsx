import { cn } from '@/shared/ui/cn';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
export type DropdownOption = {
  value: string | number;
  label: ReactNode;
  disabled?: boolean;
  searchText?: string;
};
type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onChange' | 'children'> & {
  value: string | number;
  options: DropdownOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
};
const textOf = (node: ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (node && typeof node === 'object' && 'props' in node)
    return textOf(
      (
        node.props as {
          children?: ReactNode;
        }
      ).children,
    );
  return '';
};
/** Controlled select with one implementation for forms, filters and inline edits. */
export const Dropdown = ({
  value,
  options,
  onValueChange,
  placeholder = 'Выбрать…',
  disabled,
  className = '',
  onKeyDown,
  ...props
}: Props) => {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [implicitLabel, setImplicitLabel] = useState('');
  const reposition = useRef<(() => void) | null>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(String(value));
  const [position, setPosition] = useState<CSSProperties>({ left: 0, top: 0 });
  const typed = useRef({ text: '', at: 0 });
  const selected = options.find((option) => String(option.value) === String(value));
  const visible = options.filter((option) =>
    (option.searchText ?? textOf(option.label))
      .toLocaleLowerCase('ru')
      .includes(query.trim().toLocaleLowerCase('ru')),
  );
  const enabled = visible.filter((option) => !option.disabled);
  const searchable = options.length > 8;
  const activeId = `${id}-option-${encodeURIComponent(active)}`;
  const activeDescendant = visible.some((o) => String(o.value) === active) ? activeId : undefined;
  const usable = () => !disabled && !trigger.current?.matches(':disabled');
  const label = props['aria-label'] ?? (implicitLabel || 'Выбор');
  const close = (restoreFocus = false) => {
    setOpen(false);
    setQuery('');
    if (restoreFocus) trigger.current?.focus();
  };
  const show = (initial?: string) => {
    if (!usable()) return;
    setQuery('');
    setActive(
      initial ??
        (selected && !selected.disabled
          ? String(selected.value)
          : String(options.find((o) => !o.disabled)?.value ?? '')),
    );
    setOpen(true);
  };
  const choose = (option: DropdownOption) => {
    if (!usable() || option.disabled) return;
    if (String(option.value) !== String(value)) onValueChange(String(option.value));
    close(true);
  };
  const keyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (!usable()) return;
    const key = event.key;
    if (key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    if (key === 'Tab' && open) {
      close(true);
      return;
    }
    if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
      event.preventDefault();
      event.stopPropagation();
      if (!open) {
        show(
          key === 'End'
            ? String(options.filter((o) => !o.disabled).at(-1)?.value ?? '')
            : key === 'Home'
              ? String(options.find((o) => !o.disabled)?.value ?? '')
              : undefined,
        );
        return;
      }
      const index = enabled.findIndex((o) => String(o.value) === active);
      const next =
        key === 'Home'
          ? 0
          : key === 'End'
            ? enabled.length - 1
            : (index + (key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length;
      if (enabled[next]) setActive(String(enabled[next].value));
    } else if ((key === 'Enter' || key === ' ') && event.target !== search.current) {
      event.preventDefault();
      event.stopPropagation();
      if (!open) show();
      else {
        const option = enabled.find((o) => String(o.value) === active);
        if (option) choose(option);
      }
    } else if (key === 'Enter' && event.target === search.current) {
      event.preventDefault();
      event.stopPropagation();
      const option = enabled.find((o) => String(o.value) === active);
      if (option) choose(option);
    } else if (
      key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      event.target !== search.current
    ) {
      event.preventDefault();
      event.stopPropagation();
      const current = Date.now();
      typed.current.text = current - typed.current.at > 600 ? key : typed.current.text + key;
      typed.current.at = current;
      const prefix = typed.current.text.toLocaleLowerCase('ru');
      const match = options.find(
        (o) =>
          !o.disabled &&
          (o.searchText ?? textOf(o.label)).toLocaleLowerCase('ru').startsWith(prefix),
      );
      if (match) {
        if (!open) show(String(match.value));
        else setActive(String(match.value));
      }
    }
  };
  useLayoutEffect(() => {
    const owner = trigger.current?.labels?.[0];
    if (!owner || props['aria-label']) return;
    const copy = owner.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('.dropdown').forEach((node) => node.remove());
    setImplicitLabel(copy.textContent?.trim() ?? '');
  }, [props.id, props['aria-label']]);
  useLayoutEffect(() => {
    if (!open || !popup.current) return;
    const menu = popup.current;
    if (typeof menu.showPopover === 'function') menu.showPopover();
    const place = () => {
      if (!trigger.current || !popup.current) return;
      const rect = trigger.current.getBoundingClientRect();
      const width = Math.min(Math.max(rect.width, 210), window.innerWidth - 16);
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const up = below < 200 && above > below;
      const maxHeight = Math.max(80, Math.min(340, up ? above : below));
      const height = Math.min(popup.current.scrollHeight, maxHeight);
      setPosition({
        width,
        maxHeight,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        top: up ? Math.max(8, rect.top - height - 5) : rect.bottom + 5,
      });
    };
    reposition.current = place;
    place();
    if (searchable) search.current?.focus();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      reposition.current = null;
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      if (menu.isConnected && typeof menu.hidePopover === 'function') menu.hidePopover();
    };
  }, [open, searchable]);
  useLayoutEffect(() => {
    reposition.current?.();
  }, [query, options.length]);
  useEffect(() => {
    if (!open) return;
    if (!usable()) {
      close();
      return;
    }
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!trigger.current?.contains(target) && !popup.current?.contains(target)) close();
    };
    const focusOutside = (event: FocusEvent) => {
      const target = event.target as Node;
      if (!trigger.current?.contains(target) && !popup.current?.contains(target)) close();
    };
    const observer = new window.MutationObserver(() => {
      if (!usable()) close();
    });
    let ancestor = trigger.current?.parentElement;
    while (ancestor) {
      observer.observe(ancestor, { attributes: true, attributeFilter: ['disabled'] });
      ancestor = ancestor.parentElement;
    }
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('focusin', focusOutside);
    return () => {
      observer.disconnect();
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('focusin', focusOutside);
    };
  }, [open, disabled]);
  useEffect(() => {
    if (open) document.getElementById(activeId)?.scrollIntoView?.({ block: 'nearest' });
  }, [activeId, open]);
  return (
    <span className={'dropdown inline-block min-w-0 w-full align-middle'}>
      <button
        {...props}
        ref={trigger}
        type="button"
        role="combobox"
        disabled={disabled}
        className={cn(
          'dropdown-trigger [font:inherit] [-webkit-tap-highlight-color:transparent] flex items-center',
          'justify-between gap-2 w-full min-w-0 min-h-9 py-[7px] px-2.5 border border-[#b6beca] rounded',
          'bg-white text-ink text-left text-[13px] font-normal leading-5 cursor-pointer',
          '[&:focus-visible]:[outline:2px_solid_#388bff] [&:focus-visible]:outline-offset-0.5',
          '[&:hover:not(:disabled)]:bg-[#f7f8f9] [&:hover:not(:disabled)]:border-[#8590a2]',
          '[&[aria-expanded=true]]:border-brand [&[aria-expanded=true]]:shadow-[0_0_0_1px_var(--blue)]',
          '[&>svg]:text-[#626f86] [&.filter-select]:bg-[#f1f2f4] [&.filter-select]:border-transparent',
          '[&.filter-select]:min-h-8 [&.filter-select]:text-xs [&.filter-select.is-active]:bg-[#e9f2ff]',
          '[&.filter-select.is-active]:text-[#0052cc] [&.filter-select.is-active]:border-[#85b8ff]',
          '[&.inline-status]:w-full [&.inline-status]:min-h-7 [&.inline-status]:border-0',
          '[&.inline-status]:text-[10px] [&.inline-status]:font-semibold [&.inline-status]:uppercase',
          '[&.inline-status]:py-1 [&.inline-status]:px-1.5 [&.status-select]:w-full',
          '[&.status-select]:min-h-7 [&.status-select]:border-0 [&.status-select]:text-[10px]',
          '[&.status-select]:font-semibold [&.status-select]:uppercase [&.status-select]:py-1',
          '[&.status-select]:px-1.5',
          className,
        )}
        aria-label={props['aria-label'] ?? (implicitLabel || undefined)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-activedescendant={open ? activeDescendant : undefined}
        onClick={() => (open ? close() : show())}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (!event.defaultPrevented) keyboard(event);
        }}
      >
        <span className={'dropdown-value block overflow-hidden text-ellipsis whitespace-nowrap'}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={popup}
          popover={typeof HTMLElement.prototype.showPopover === 'function' ? 'manual' : undefined}
          className={cn(
            'dropdown-popup flex flex-col fixed [inset:auto] m-0 p-1 overflow-hidden border border-[#dfe1e6]',
            'rounded-md bg-white text-ink shadow-[0_8px_24px_#091e4229,_0_1px_4px_#091e421f] z-1000',
            'text-[13px] font-normal text-left normal-case tracking-[normal] [&::backdrop]:bg-transparent',
          )}
          style={position}
          onKeyDown={keyboard}
        >
          {searchable && (
            <div
              className={cn(
                'dropdown-search flex items-center gap-[7px] pt-1 px-[7px] pb-2 mb-1 border-b border-line',
                'text-muted [&_input]:w-full [&_input]:min-w-0 [&_input]:min-h-7.5 [&_input]:h-7.5 [&_input]:p-1',
                '[&_input]:border-0 [&_input]:outline-none [&_input]:bg-transparent [&_input]:text-[13px]',
                '[&_input:focus-visible]:outline-none',
              )}
            >
              <Search size={14} />
              <input
                ref={search}
                type="search"
                aria-label={`${label}: поиск`}
                aria-controls={`${id}-list`}
                aria-activedescendant={activeDescendant}
                placeholder="Найти…"
                value={query}
                onChange={(event) => {
                  const next = event.target.value;
                  setQuery(next);
                  const match = options.find(
                    (o) =>
                      !o.disabled &&
                      (o.searchText ?? textOf(o.label))
                        .toLocaleLowerCase('ru')
                        .includes(next.trim().toLocaleLowerCase('ru')),
                  );
                  setActive(match ? String(match.value) : '');
                }}
              />
            </div>
          )}
          <div
            id={`${id}-list`}
            role="listbox"
            aria-label={label}
            className={'dropdown-options overflow-y-auto overscroll-contain min-h-0'}
          >
            {visible.map((option) => (
              <div
                key={option.value}
                id={`${id}-option-${encodeURIComponent(String(option.value))}`}
                role="option"
                aria-selected={String(option.value) === String(value)}
                aria-disabled={Boolean(option.disabled)}
                className={cn(
                  'dropdown-option flex items-center justify-between gap-3 py-2 px-2.5 rounded-[3px] leading-5',
                  'cursor-pointer [&>span]:wrap-anywhere [&>span]:min-w-0 [&.is-focused]:bg-[#f1f2f4]',
                  '[&[aria-selected=true]]:bg-[#e9f2ff] [&[aria-selected=true]]:text-[#0052cc]',
                  '[&[aria-selected=true]]:font-medium [&[aria-disabled=true]]:opacity-[.45]',
                  '[&[aria-disabled=true]]:cursor-default',
                  active === String(option.value) ? 'is-focused' : '',
                )}
                onMouseMove={() => {
                  if (!option.disabled) setActive(String(option.value));
                }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  choose(option);
                }}
              >
                <span>{option.label}</span>
                {String(option.value) === String(value) && <Check size={15} aria-hidden="true" />}
              </div>
            ))}
            {!visible.length && (
              <p className={'dropdown-empty p-3 text-muted text-xs'}>Ничего не найдено</p>
            )}
          </div>
        </div>
      )}
    </span>
  );
};
