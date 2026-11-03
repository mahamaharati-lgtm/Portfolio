import { profile } from '../content/profile';
import { ThemeSwitcher } from '../theme/ThemeSwitcher';

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container-page flex flex-col gap-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0">
          © 2026 {profile.name}. Built with React, TypeScript and Tailwind CSS.{' '}
          <a
            className="link"
            href="https://github.com/mahamaharati-lgtm/portfolio/tree/main/developer-portfolio"
          >
            View source
          </a>
        </p>
        <ThemeSwitcher showLabels />
      </div>
    </footer>
  );
}
