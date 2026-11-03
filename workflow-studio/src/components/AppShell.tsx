import { TriangleAlert, Workflow as WorkflowIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useWorkflows } from '../store/workflows';
import { ThemeSwitcher } from '../theme/ThemeSwitcher';
import { Toaster } from './ui/Toaster';

function StorageBanner() {
  const error = useWorkflows((s) => s.storageError);
  const clear = useWorkflows((s) => s.clearStorageError);
  if (!error) return null;
  return (
    <div role="alert" className="border-b border-line bg-warning-soft px-4 py-2 text-sm text-fg">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
        <TriangleAlert size={16} aria-hidden="true" className="text-warning" />
        <p className="m-0 flex-1">{error}</p>
        <button type="button" className="btn btn-sm" onClick={clear}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-2.5 py-1.5 text-sm font-semibold no-underline ${
    isActive ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg'
  }`;

export function AppShell() {
  const location = useLocation();
  const first = useRef(true);

  // Move focus to the new page heading after client-side navigation.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const heading = document.querySelector<HTMLElement>('main h1');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: false });
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2 font-bold text-fg no-underline">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-fg">
              <WorkflowIcon size={18} aria-hidden="true" />
            </span>
            <span>Workflow Studio</span>
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-1">
            <NavLink to="/" end className={navClass}>
              Workflows
            </NavLink>
            <NavLink to="/about" className={navClass}>
              About
            </NavLink>
          </nav>
          <div className="ml-auto">
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <StorageBanner />
      <main id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
