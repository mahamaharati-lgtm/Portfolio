import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

// Remember the last element focused outside any dialog so focus can return there on close,
// even when the dialog was opened programmatically rather than by a Radix Trigger.
let lastFocused: HTMLElement | null = null;
if (typeof document !== 'undefined') {
  document.addEventListener('focusin', (e) => {
    const el = e.target as HTMLElement;
    if (!el.closest?.('[role="dialog"], [role="alertdialog"]')) lastFocused = el;
  });
}

function restoreFocus(e: Event) {
  e.preventDefault();
  const target =
    lastFocused?.isConnected && lastFocused !== document.body
      ? lastFocused
      : document.querySelector<HTMLElement>('main h1');
  if (target) {
    if (!target.hasAttribute('tabindex') && target.tagName === 'H1')
      target.setAttribute('tabindex', '-1');
    target.focus();
  }
}

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  wide?: boolean;
  role?: 'dialog' | 'alertdialog';
}

/** Radix dialog: traps focus, restores focus on close, closes on Escape. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  wide,
  role = 'dialog',
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="dialog-overlay" />
        <RadixDialog.Content
          role={role}
          className={`dialog-content ${wide ? 'dialog-content--wide' : ''}`}
          {...(description ? {} : { 'aria-describedby': undefined })}
          onCloseAutoFocus={restoreFocus}
          onOpenAutoFocus={(e) => {
            // Put focus in the first form field rather than on the close button.
            const field = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(
              'input:not([type="hidden"]):not([type="radio"]), textarea, select',
            );
            if (field) {
              e.preventDefault();
              field.focus();
            }
          }}
        >
          <div className="mb-3 flex items-start justify-between gap-4">
            <RadixDialog.Title className="m-0 text-lg font-semibold">{title}</RadixDialog.Title>
            <RadixDialog.Close
              className="btn btn-ghost btn-sm btn-icon -mt-1 -mr-1"
              aria-label="Close dialog"
            >
              <X size={18} aria-hidden="true" />
            </RadixDialog.Close>
          </div>
          {description ? (
            <RadixDialog.Description className="mt-0 mb-4 text-sm text-muted">
              {description}
            </RadixDialog.Description>
          ) : null}
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export const DialogClose = RadixDialog.Close;
