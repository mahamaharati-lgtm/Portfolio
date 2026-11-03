import { isRouteErrorResponse, useRouteError } from 'react-router';

export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unknown error';
  return (
    <main id="main" className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted">
        Workflow Studio hit an unexpected problem. Your saved workflows are still in this browser’s
        storage.
      </p>
      <pre className="overflow-auto rounded-lg bg-surface-2 p-3 text-left text-xs">{message}</pre>
      <div className="mt-6 flex justify-center gap-2">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => window.location.assign('/')}
        >
          Reload Workflow Studio
        </button>
      </div>
    </main>
  );
}
