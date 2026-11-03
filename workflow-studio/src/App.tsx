import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppShell } from './components/AppShell';
import { AboutPage } from './routes/AboutPage';
import { NotFoundPage } from './routes/NotFoundPage';
import { RouteError } from './routes/RouteError';
import { WorkflowsPage } from './routes/WorkflowsPage';

const EditorPage = lazy(() => import('./routes/EditorPage'));

function EditorLoading() {
  return (
    <div role="status" className="grid flex-1 place-items-center p-10 text-muted">
      Loading editor…
    </div>
  );
}

// BASE_URL is '/' locally and '/Portfolio/workflow-studio/' on GitHub Pages.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppShell />,
      errorElement: <RouteError />,
      children: [
        { index: true, element: <WorkflowsPage /> },
        {
          path: 'workflows/:id',
          element: (
            <Suspense fallback={<EditorLoading />}>
              <EditorPage />
            </Suspense>
          ),
        },
        { path: 'about', element: <AboutPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename },
);

export function App() {
  return <RouterProvider router={router} />;
}
