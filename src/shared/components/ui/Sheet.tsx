/* v1.0.1 | 2026-06-20 | Mobile sheet with focus-safe scrolling above navbar and keyboard */
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useRef } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';

type Props = {
  open: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
};

export function Sheet({ open, title, subtitle, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose, open);

  function handleFocusCapture(event: React.FocusEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

    window.setTimeout(() => {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 180);
  }

  if (!open) return null;

  return (
    <div className="sheet-backdrop" role="presentation">
      <div className="sheet" ref={ref} role="dialog" aria-modal="true" aria-label={title} onFocusCapture={handleFocusCapture}>
        <div className="sheet-header">
          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Tutup panel">
            <X size={18} />
          </button>
        </div>
        <div className="sheet-content">{children}</div>
      </div>
    </div>
  );
}
