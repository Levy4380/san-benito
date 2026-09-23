import TextInput from '@/Components/Form/TextInput';
import Empty from '@/Components/Surfaces/Empty';
import { controlClass } from '@/lib/clinico-control';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, X } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

export type ComboboxOption = {
    value: string;
    label: string;
};

type ComboboxBase = {
    id?: string;
    name?: string;
    options: ComboboxOption[];
    placeholder?: string;
    searchLabel?: string;
    empty?: string;
    emptyFiltered?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
};

export type ComboboxProps =
    | (ComboboxBase & {
          multiple?: false;
          value?: string;
          defaultValue?: string;
          onChange?: (value: string) => void;
      })
    | (ComboboxBase & {
          multiple: true;
          value?: string[];
          defaultValue?: string[];
          onChange?: (value: string[]) => void;
      });

type PanelBox = {
    top: number;
    left: number;
    width: number;
    maxHeight: number;
};

function placePanel(trigger: HTMLElement): PanelBox | null {
    const rect = trigger.getBoundingClientRect();

    if (rect.width < 1 || rect.height < 1) {
        return null;
    }

    const gap = 4;
    const viewportPad = 8;
    const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPad;
    const spaceAbove = rect.top - gap - viewportPad;
    const openBelow = spaceBelow >= 12 * 16 || spaceBelow >= spaceAbove;
    const maxHeight = Math.max(8 * 16, Math.min(16 * 16, openBelow ? spaceBelow : spaceAbove));

    return {
        top: openBelow ? rect.bottom + gap : Math.max(viewportPad, rect.top - gap - maxHeight),
        left: Math.min(rect.left, window.innerWidth - rect.width - viewportPad),
        width: rect.width,
        maxHeight,
    };
}

function toValues(props: ComboboxProps): string[] {
    if (props.multiple) {
        return props.value ?? props.defaultValue ?? [];
    }

    const single = props.value ?? props.defaultValue ?? '';

    return single === '' ? [] : [single];
}

export default function Combobox(props: ComboboxProps) {
    const {
        id,
        name,
        options,
        placeholder = 'Elegí una opción',
        searchLabel = 'Buscar',
        empty,
        emptyFiltered = 'No hay coincidencias.',
        disabled = false,
        required = false,
        className,
    } = props;
    const multiple = props.multiple === true;
    const autoId = useId();
    const triggerId = id ?? autoId;
    const listId = `${triggerId}-list`;
    const searchId = `${triggerId}-search`;
    const triggerRef = useRef<HTMLElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const openedAtRef = useRef(0);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlight, setHighlight] = useState(0);
    const [box, setBox] = useState<PanelBox | null>(null);
    const [internal, setInternal] = useState<string[]>(() => toValues(props));
    const selectedValues = useMemo(() => {
        if (multiple) {
            return Array.isArray(props.value) ? props.value : internal;
        }

        if (typeof props.value === 'string') {
            return props.value === '' ? [] : [props.value];
        }

        return internal;
    }, [internal, multiple, props.value]);
    const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
    const selectedOptions = selectedValues
        .map((value) => options.find((option) => option.value === value))
        .filter((option): option is ComboboxOption => option !== undefined);
    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();

        if (needle === '') {
            return options;
        }

        return options.filter((option) => option.label.toLowerCase().includes(needle));
    }, [options, query]);

    const closePanel = useCallback((focusTrigger = false) => {
        setOpen(false);
        setQuery('');
        setBox(null);

        if (focusTrigger) {
            triggerRef.current?.focus();
        }
    }, []);

    const commit = useCallback(
        (next: string[]) => {
            if (props.multiple) {
                if (props.value === undefined) {
                    setInternal(next);
                }

                props.onChange?.(next);
                return;
            }

            const single = next[0] ?? '';

            if (props.value === undefined) {
                setInternal(single === '' ? [] : [single]);
            }

            props.onChange?.(single);
        },
        [props],
    );

    const openPanel = useCallback(() => {
        if (disabled) {
            return;
        }

        openedAtRef.current = Date.now();
        setQuery('');
        setHighlight(
            Math.max(
                0,
                options.findIndex((option) => selectedSet.has(option.value)),
            ),
        );

        const nextBox = triggerRef.current ? placePanel(triggerRef.current) : null;

        if (!nextBox) {
            return;
        }

        setBox(nextBox);
        setOpen(true);
    }, [disabled, options, selectedSet]);

    const choose = useCallback(
        (next: string) => {
            if (multiple) {
                const already = selectedSet.has(next);
                commit(already ? selectedValues.filter((value) => value !== next) : [...selectedValues, next]);
                return;
            }

            commit([next]);
            closePanel(true);
        },
        [closePanel, commit, multiple, selectedSet, selectedValues],
    );

    const updateBox = useCallback(() => {
        const next = triggerRef.current ? placePanel(triggerRef.current) : null;

        if (next) {
            setBox(next);
        }
    }, []);

    useEffect(() => {
        if (open && multiple) {
            updateBox();
        }
    }, [multiple, open, selectedValues, updateBox]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onPointer = (event: MouseEvent) => {
            const target = event.target as Node | null;

            if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
                return;
            }

            closePanel();
        };

        const onReposition = (event: Event) => {
            if (event.type === 'scroll' && panelRef.current?.contains(event.target as Node)) {
                return;
            }

            updateBox();
        };

        const focusId = window.setTimeout(() => searchRef.current?.focus(), 0);
        const listenId = window.setTimeout(() => {
            document.addEventListener('mousedown', onPointer);
        }, 0);

        window.addEventListener('resize', onReposition);
        window.addEventListener('scroll', onReposition, true);

        return () => {
            window.clearTimeout(focusId);
            window.clearTimeout(listenId);
            document.removeEventListener('mousedown', onPointer);
            window.removeEventListener('resize', onReposition);
            window.removeEventListener('scroll', onReposition, true);
        };
    }, [closePanel, open, updateBox]);

    useEffect(() => {
        optionRefs.current[highlight]?.scrollIntoView({ block: 'nearest' });
    }, [highlight, visible]);

    const moveHighlight = (delta: number) => {
        if (visible.length === 0) {
            return;
        }

        setHighlight((current) => (current + delta + visible.length) % visible.length);
    };

    const toggleOpen = () => {
        if (disabled) {
            return;
        }

        if (open) {
            if (Date.now() - openedAtRef.current < 300) {
                return;
            }

            closePanel();
            return;
        }

        openPanel();
    };

    const onTriggerKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPanel();
        }
    };

    const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveHighlight(1);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveHighlight(-1);
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            const option = visible[highlight];

            if (option) {
                choose(option.value);
            }

            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            closePanel(true);
        }
    };

    const highlighted = visible[highlight];
    const triggerClass = cn(
        controlClass(),
        multiple && 'h-auto py-[0.35rem]',
        'flex items-center gap-2 pr-2 text-left disabled:cursor-not-allowed disabled:opacity-45',
    );
    const triggerAria = {
        id: triggerId,
        role: 'combobox' as const,
        'aria-haspopup': 'listbox' as const,
        'aria-expanded': open,
        'aria-controls': listId,
        ...(open && highlighted ? { 'aria-activedescendant': `${listId}-${highlight}` } : {}),
    };

    if (options.length === 0 && empty) {
        return <Empty>{empty}</Empty>;
    }

    return (
        <div className={cn('relative min-w-0', className)}>
            {name && !multiple ? <input type="hidden" name={name} value={selectedValues[0] ?? ''} required={required} /> : null}
            {name && multiple ? selectedValues.map((value) => <input key={value} type="hidden" name={`${name}[]`} value={value} />) : null}
            {multiple ? (
                <div
                    ref={(node) => {
                        triggerRef.current = node;
                    }}
                    tabIndex={disabled ? -1 : 0}
                    className={cn(triggerClass, disabled && 'pointer-events-none opacity-45')}
                    {...triggerAria}
                    onClick={toggleOpen}
                    onKeyDown={onTriggerKeyDown}
                >
                    <span className="flex min-w-0 flex-1 flex-wrap content-center gap-[0.35rem]">
                        {selectedOptions.length === 0 ? (
                            <span className="text-ink-2">{placeholder}</span>
                        ) : (
                            selectedOptions.map((option) => (
                                <span
                                    key={option.value}
                                    className="bg-accent-soft text-ink inline-flex max-w-full items-center gap-[0.2rem] rounded-md px-[0.45rem] py-[0.15rem] text-xs leading-[1.3]"
                                >
                                    <span className="min-w-0 truncate">{option.label}</span>
                                    <button
                                        type="button"
                                        className="text-ink-2 hover:text-ink grid size-4 shrink-0 place-items-center rounded-sm"
                                        aria-label={`Quitar ${option.label}`}
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            choose(option.value);
                                        }}
                                    >
                                        <X className="size-3" aria-hidden strokeWidth={2} />
                                    </button>
                                </span>
                            ))
                        )}
                    </span>
                    <ChevronDown
                        className={cn('text-ink-2 duration-short size-4 shrink-0 transition-transform ease-out', open && 'rotate-180')}
                        aria-hidden
                        strokeWidth={2}
                    />
                </div>
            ) : (
                <button
                    ref={(node) => {
                        triggerRef.current = node;
                    }}
                    type="button"
                    disabled={disabled}
                    className={triggerClass}
                    {...triggerAria}
                    onClick={toggleOpen}
                    onKeyDown={onTriggerKeyDown}
                >
                    <span className={cn('min-w-0 flex-1 truncate', selectedOptions[0] ? 'text-ink' : 'text-ink-2')}>
                        {selectedOptions[0]?.label ?? placeholder}
                    </span>
                    <ChevronDown
                        className={cn('text-ink-2 duration-short size-4 shrink-0 transition-transform ease-out', open && 'rotate-180')}
                        aria-hidden
                        strokeWidth={2}
                    />
                </button>
            )}
            {open && box
                ? createPortal(
                      <div
                          ref={panelRef}
                          className="border-rule bg-paper fixed z-[110] flex flex-col overflow-hidden rounded-lg border p-[0.35rem] shadow-md"
                          style={{ top: box.top, left: box.left, width: box.width, maxHeight: box.maxHeight }}
                      >
                          <label className="sr-only" htmlFor={searchId}>
                              {searchLabel}
                          </label>
                          <TextInput
                              ref={searchRef}
                              id={searchId}
                              value={query}
                              placeholder={searchLabel}
                              autoComplete="off"
                              className="h-[var(--control-h-sm)] min-h-[var(--control-h-sm)] shrink-0 focus-visible:outline-offset-1"
                              onChange={(event) => {
                                  setQuery(event.target.value);
                                  setHighlight(0);
                              }}
                              onKeyDown={onSearchKeyDown}
                          />
                          <div
                              id={listId}
                              role="listbox"
                              className="mt-[0.35rem] min-h-0 overflow-y-auto"
                              {...(multiple ? { 'aria-multiselectable': true } : {})}
                          >
                              {visible.length === 0 ? (
                                  <Empty className="px-[0.45rem] py-[0.55rem]">{emptyFiltered}</Empty>
                              ) : (
                                  visible.map((option, index) => {
                                      const isSelected = selectedSet.has(option.value);
                                      const isHighlighted = index === highlight;

                                      return (
                                          <button
                                              key={`${option.value}:${option.label}`}
                                              ref={(node) => {
                                                  optionRefs.current[index] = node;
                                              }}
                                              type="button"
                                              id={`${listId}-${index}`}
                                              role="option"
                                              aria-selected={isSelected}
                                              className={cn(
                                                  'text-ink flex w-full min-w-0 cursor-pointer items-center gap-[0.45rem] rounded-md px-[0.55rem] py-[0.45rem] text-left text-sm',
                                                  (isSelected || isHighlighted) && 'bg-accent-soft',
                                              )}
                                              onMouseEnter={() => setHighlight(index)}
                                              onClick={() => choose(option.value)}
                                          >
                                              <Check
                                                  className={cn('size-4 shrink-0', isSelected ? 'text-accent' : 'opacity-0')}
                                                  aria-hidden
                                                  strokeWidth={2}
                                              />
                                              <span className="min-w-0 flex-1 truncate">{option.label}</span>
                                          </button>
                                      );
                                  })
                              )}
                          </div>
                      </div>,
                      document.body,
                  )
                : null}
        </div>
    );
}
