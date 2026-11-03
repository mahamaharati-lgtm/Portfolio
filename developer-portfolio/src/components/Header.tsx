import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { profile } from '../content/profile';
import { ThemeSwitcher } from '../theme/ThemeSwitcher';

const NAV = [
  { href: '/#work', label: 'Work' },
  { href: '/#about', label: 'About' },
  { href: '/#experience', label: 'Experience' },
  { href: '/#skills', label: 'Skills' },
  { href: '/#contact', label: 'Contact' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    const mql = window.matchMedia('(min-width: 768px)');
    const onResize = () => mql.matches && setOpen(false);
    document.addEventListener('keydown', onKey);
    mql.addEventListener('change', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      mql.removeEventListener('change', onResize);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg">
      <div className="container-page flex min-h-16 flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
        <Link
          to="/"
          className="mr-auto flex items-center gap-2.5 font-semibold tracking-tight no-underline"
        >
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-full bg-fg font-mono text-xs font-semibold text-bg"
          >
            HS
          </span>
          <span>{profile.name}</span>
        </Link>
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="m-0 flex list-none gap-1 p-0">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="rounded-full px-3 py-2 text-[0.95rem] text-muted no-underline transition-colors hover:text-fg"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden sm:block">
          <ThemeSwitcher />
        </div>
        <button
          ref={button}
          type="button"
          className="btn !min-h-10 !px-3 md:!hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          Menu
        </button>
      </div>
      <div id="mobile-menu" hidden={!open} className="border-t border-line bg-bg md:hidden">
        <nav aria-label="Mobile" className="container-page py-3">
          <ul className="m-0 list-none p-0">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-3 text-lg font-medium no-underline hover:bg-surface-2"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-line pt-4 pb-2">
            <ThemeSwitcher showLabels />
          </div>
        </nav>
      </div>
    </header>
  );
}
