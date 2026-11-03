import { Link } from 'react-router';
import { PAGE_META } from '../content/meta';
import { usePageMeta } from '../lib/usePageMeta';

export function NotFoundPage() {
  usePageMeta(PAGE_META['/404']);
  return (
    <section className="container-page py-28 text-center" aria-labelledby="nf-title">
      <p className="eyebrow m-0">404</p>
      <h1 id="nf-title" className="mt-3 mb-4 text-4xl font-semibold">
        Page not found
      </h1>
      <p className="mx-auto mt-0 mb-8 max-w-md text-lg text-muted">
        The page you were looking for doesn’t exist or has moved.
      </p>
      <Link to="/" className="btn btn-primary">
        Back to the home page
      </Link>
    </section>
  );
}
