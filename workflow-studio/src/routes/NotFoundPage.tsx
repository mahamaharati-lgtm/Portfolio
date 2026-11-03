import { Link } from 'react-router';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function NotFoundPage({
  message = 'The page you’re looking for doesn’t exist.',
}: {
  message?: string;
}) {
  useDocumentTitle('Not found');
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
      <p className="m-0 text-sm font-semibold text-muted">404</p>
      <h1 className="mt-1 mb-2 text-2xl font-bold">Not found</h1>
      <p className="mt-0 mb-6 text-muted">{message}</p>
      <Link to="/" className="btn btn-primary">
        Go to workflows
      </Link>
    </div>
  );
}
