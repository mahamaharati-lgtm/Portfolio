import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { useToasts } from '../../store/toast';

const ICONS = { success: CheckCircle2, error: TriangleAlert, info: Info };
const TONE_LABEL = { success: 'Success', error: 'Error', info: 'Notice' };

export function Toaster() {
  const { toasts, announcement, dismiss } = useToasts();
  return (
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <section
        aria-label="Notifications"
        className="pointer-events-none fixed right-4 bottom-4 left-4 z-[60] flex flex-col items-end gap-2 sm:left-auto"
      >
        <div role="status" aria-live="polite" className="contents">
          {toasts.map((t) => {
            const Icon = ICONS[t.tone];
            return (
              <div
                key={t.id}
                className="card pointer-events-auto flex w-full max-w-sm items-start gap-3 p-3 text-sm"
                style={{
                  borderLeft: `4px solid var(--${t.tone === 'error' ? 'danger' : t.tone === 'success' ? 'success' : 'accent'})`,
                }}
              >
                <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
                <p className="m-0 flex-1">
                  <span className="sr-only">{TONE_LABEL[t.tone]}: </span>
                  {t.message}
                </p>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-icon -my-1"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
