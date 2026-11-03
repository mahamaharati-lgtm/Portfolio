import {
  CircleAlert,
  CircleCheck,
  Copy,
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { lazy, Suspense, useId, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toWorkflowFile } from '../domain/exportFile';
import type { Workflow } from '../domain/types';
import { hasErrors, validateWorkflow } from '../domain/validation';
import { downloadText, formatDateTime, slugify } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { toast } from '../store/toast';
import { useWorkflows } from '../store/workflows';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ImportButton } from '../components/workflows/ImportButton';

// Form dialogs (react-hook-form + zod) load on first use to keep the initial bundle small.
const CreateWorkflowDialog = lazy(() =>
  import('../components/workflows/CreateWorkflowDialog').then((m) => ({
    default: m.CreateWorkflowDialog,
  })),
);
const RenameDialog = lazy(() =>
  import('../components/workflows/RenameDialog').then((m) => ({ default: m.RenameDialog })),
);

type StatusFilter = 'all' | 'draft' | 'published';
const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  draft: 'Drafts',
  published: 'Published',
};

function ValidationSummary({ workflow }: { workflow: Workflow }) {
  const issues = useMemo(() => validateWorkflow(workflow), [workflow]);
  const errors = issues.filter((i) => i.severity === 'error').length;
  if (!hasErrors(issues)) {
    return (
      <span className="inline-flex items-center gap-1 text-success">
        <CircleCheck size={14} aria-hidden="true" /> Valid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-danger">
      <CircleAlert size={14} aria-hidden="true" /> {errors} {errors === 1 ? 'issue' : 'issues'} to
      fix
    </span>
  );
}

export function WorkflowsPage() {
  useDocumentTitle('Workflows');
  const navigate = useNavigate();
  const ids = useId();
  const store = useWorkflows();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<Workflow | null>(null);
  const [deleting, setDeleting] = useState<Workflow | null>(null);
  const [resetting, setResetting] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...store.workflows]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .filter((w) => status === 'all' || w.status === status)
      .filter((w) => !q || `${w.name} ${w.category} ${w.description}`.toLowerCase().includes(q));
  }, [store.workflows, query, status]);

  const counts = {
    all: store.workflows.length,
    draft: store.workflows.filter((w) => w.status === 'draft').length,
    published: store.workflows.filter((w) => w.status === 'published').length,
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-bold sm:text-3xl">Workflows</h1>
          <p className="mt-1 mb-0 max-w-2xl text-muted">
            Design approval processes, check them against business rules, publish them, and simulate
            real requests.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportButton
            onImport={(data) => {
              const id = store.importWorkflow(data);
              toast.success(`Imported “${data.name}” as a draft.`);
              navigate(`/workflows/${id}`);
            }}
          />
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus size={16} aria-hidden="true" /> New workflow
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-80">
          <label htmlFor={`${ids}-search`} className="field-label">
            Search workflows
          </label>
          <div className="relative">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
            />
            <input
              id={`${ids}-search`}
              type="search"
              className="input pl-9"
              placeholder="Name, category or description"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <fieldset className="m-0 border-0 p-0">
          <legend className="field-label">Status</legend>
          <div className="theme-switcher flex-wrap">
            {(['all', 'draft', 'published'] as const).map((s) => (
              <label key={s} className="theme-switcher__option px-3">
                <input
                  type="radio"
                  name={`${ids}-status`}
                  className="sr-only"
                  checked={status === s}
                  onChange={() => setStatus(s)}
                />
                <span>{STATUS_LABELS[s]}</span>
                <span className="text-muted">({counts[s]})</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {visible.length} {visible.length === 1 ? 'workflow' : 'workflows'} shown
      </p>

      {store.workflows.length === 0 ? (
        <div className="card mt-8 p-8 text-center">
          <h2 className="m-0 text-lg font-semibold">No workflows yet</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Create your first workflow, import a JSON definition, or restore the example purchase,
            leave, expense, document and change workflows.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
              <Plus size={16} aria-hidden="true" /> New workflow
            </button>
            <button type="button" className="btn" onClick={() => store.resetDemoData()}>
              <RotateCcw size={16} aria-hidden="true" /> Restore examples
            </button>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="card mt-8 p-8 text-center">
          <h2 className="m-0 text-lg font-semibold">No matching workflows</h2>
          <p className="mt-2 text-muted">Try a different search term or status filter.</p>
          <button
            type="button"
            className="btn mt-2"
            onClick={() => {
              setQuery('');
              setStatus('all');
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul
          className="m-0 mt-6 grid list-none gap-4 p-0 md:grid-cols-2 xl:grid-cols-3"
          aria-label="Workflows"
        >
          {visible.map((w) => (
            <li key={w.id} className="card flex flex-col p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge workflow={w} />
                <span className="badge badge-neutral">{w.category}</span>
              </div>
              <h2 className="mt-3 mb-1 text-lg font-semibold">
                <Link to={`/workflows/${w.id}`} className="no-underline hover:underline">
                  {w.name}
                </Link>
              </h2>
              <p className="m-0 line-clamp-3 flex-1 text-sm text-muted">
                {w.description || 'No description.'}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted">Steps</dt>
                <dd className="m-0">{w.nodes.length}</dd>
                <dt className="text-muted">Updated</dt>
                <dd className="m-0">{formatDateTime(w.updatedAt)}</dd>
                <dt className="text-muted">Validation</dt>
                <dd className="m-0">
                  <ValidationSummary workflow={w} />
                </dd>
              </dl>
              <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-line pt-3">
                <Link
                  to={`/workflows/${w.id}`}
                  className="btn btn-primary btn-sm mr-auto"
                  aria-label={`Open editor for ${w.name}`}
                >
                  Open editor
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => setRenaming(w)}
                  aria-label={`Rename ${w.name}`}
                  title="Rename"
                >
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-icon"
                  aria-label={`Duplicate ${w.name}`}
                  title="Duplicate"
                  onClick={() => {
                    store.duplicateWorkflow(w.id);
                    toast.success(`Created a draft copy of “${w.name}”.`);
                  }}
                >
                  <Copy size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-icon"
                  aria-label={`Export ${w.name} as JSON`}
                  title="Export JSON"
                  onClick={() => {
                    downloadText(
                      `${slugify(w.name)}.workflow.json`,
                      JSON.stringify(toWorkflowFile(w), null, 2),
                    );
                    toast.success(`Exported “${w.name}”.`);
                  }}
                >
                  <Download size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-icon text-danger"
                  onClick={() => setDeleting(w)}
                  aria-label={`Delete ${w.name}`}
                  title="Delete"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section
        aria-labelledby={`${ids}-storage`}
        className="mt-10 rounded-lg border border-dashed border-line-strong p-4 text-sm text-muted"
      >
        <h2 id={`${ids}-storage`} className="m-0 text-sm font-semibold text-fg">
          Where is my data?
        </h2>
        <p className="mt-1 mb-2">
          This is a browser demonstration. Workflows and simulation history are saved in this
          browser’s local storage only. There is no server, sign-in, or multi-user collaboration.
        </p>
        <button type="button" className="btn btn-sm" onClick={() => setResetting(true)}>
          <RotateCcw size={14} aria-hidden="true" /> Reset example data
        </button>
      </section>

      <Suspense fallback={null}>
        {creating ? (
          <CreateWorkflowDialog
            open={creating}
            onOpenChange={setCreating}
            onCreate={({ name, templateKey }) => {
              const id = store.createWorkflow({
                name,
                templateKey: templateKey === 'blank' ? undefined : templateKey,
              });
              setCreating(false);
              toast.success(`Created “${name.trim()}”.`);
              navigate(`/workflows/${id}`);
            }}
          />
        ) : null}
        {renaming ? (
          <RenameDialog
            open={renaming !== null}
            currentName={renaming?.name ?? ''}
            onOpenChange={(o) => !o && setRenaming(null)}
            onRename={(name) => {
              if (renaming) store.renameWorkflow(renaming.id, name);
              setRenaming(null);
              toast.success(`Renamed to “${name}”.`);
            }}
          />
        ) : null}
      </Suspense>
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.name ?? ''}”?`}
        description="The workflow and its simulation history will be removed from this browser. This cannot be undone. Export it first if you may need it later."
        confirmLabel="Delete workflow"
        onConfirm={() => {
          if (deleting) {
            store.deleteWorkflow(deleting.id);
            toast.success(`Deleted “${deleting.name}”.`);
          }
          setDeleting(null);
        }}
      />
      <ConfirmDialog
        open={resetting}
        onOpenChange={setResetting}
        title="Reset example data?"
        description="All workflows in this browser will be replaced with the five example workflows, and simulation history will be cleared."
        confirmLabel="Reset data"
        onConfirm={() => {
          store.resetDemoData();
          setResetting(false);
          toast.success('Example workflows restored.');
        }}
      />
    </div>
  );
}
