import { useEffect, useRef, type ReactNode } from 'react';
import { Card } from '@/components/Card';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalDialogProps {
  /** Accessible name for the dialog. */
  label: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
}

/** A modal that behaves like one for keyboard and screen reader users: focus
 * moves in on open, Tab stays inside, Escape closes, and focus goes back to
 * what opened it. Clicking the backdrop closes it too. */
export function ModalDialog({ label, onClose, children, maxWidth = 460 }: ModalDialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const node = panel.current;
    const focusables = () => (node ? Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)) : []);
    (focusables()[0] ?? node)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !node?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !node?.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, []);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-xl)' }}
      onClick={() => onCloseRef.current()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth, width: '100%', maxHeight: '100%', overflowY: 'auto', outline: 'none' }}
      >
        <Card style={{ padding: 'var(--space-2xl)' }}>{children}</Card>
      </div>
    </div>
  );
}
