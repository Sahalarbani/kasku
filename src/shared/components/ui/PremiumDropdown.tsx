/* v1.0.0 | 2026-06-20 | Custom dropdown with keyboard navigation and touch-safe sizing */
import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';

export type DropdownOption = {
  value: string;
  label: string;
  meta?: string;
};

type Props = {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function PremiumDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = 'Pilih',
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((option) => option.value === value) ?? null;

  const optionIds = useMemo(
    () => options.map((option) => `dropdown-${label.replace(/\s+/g, '-').toLowerCase()}-${option.value}`),
    [label, options],
  );

  useClickOutside(rootRef, () => setOpen(false), open);

  useEffect(() => {
    const nextIndex = Math.max(
      0,
      options.findIndex((option) => option.value === value),
    );
    setActiveIndex(nextIndex);
  }, [options, value]);

  function commit(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen((current) => !current);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, options.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  function handleListKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, options.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) commit(option.value);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    }
  }

  return (
    <div className="field" ref={rootRef}>
      <span className="field-label">{label}</span>
      <button
        ref={buttonRef}
        className="dropdown-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <span className="dropdown-copy">
          <strong>{selected?.label ?? placeholder}</strong>
          <small>{selected?.meta ?? 'Sentuh untuk memilih'}</small>
        </span>
        <ChevronDown size={18} />
      </button>
      {open ? (
        <div className="dropdown-panel" onKeyDown={handleListKeyDown} role="listbox" tabIndex={-1}>
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;

            return (
              <button
                aria-selected={isSelected}
                className={`dropdown-option${isSelected ? ' is-selected' : ''}${isActive ? ' is-active' : ''}`}
                id={optionIds[index]}
                key={option.value}
                onClick={() => commit(option.value)}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
                type="button"
              >
                <span>
                  <strong>{option.label}</strong>
                  {option.meta ? <small>{option.meta}</small> : null}
                </span>
                {isSelected ? <Check size={16} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

