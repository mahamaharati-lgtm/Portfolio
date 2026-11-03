import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, CircleCheck, CircleX, Play, RotateCcw } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { formatINR, NODE_META } from '../../domain/nodeMeta';
import { act, availableActions, startSimulation } from '../../domain/simulation';
import type {
  HistoryEntry,
  SampleRequest,
  SimulationAction,
  SimulationState,
  Workflow,
} from '../../domain/types';
import { formatDateTime, formatTime } from '../../lib/format';
import { uid } from '../../lib/id';
import { useEditor } from '../../store/editor';
import { toast } from '../../store/toast';
import { useWorkflows } from '../../store/workflows';

const requestSchema = z.object({
  title: z.string().trim().min(1, 'Enter a request title.').max(120),
  requester: z.string().trim().min(1, 'Enter the requester’s name.').max(80),
  amount: z
    .number({ error: 'Enter an amount in rupees.' })
    .min(0, 'Amount cannot be negative.')
    .max(1e10, 'Amount is too large.'),
  days: z
    .number({ error: 'Enter a number of days.' })
    .min(0, 'Days cannot be negative.')
    .max(365, 'Use 365 days or fewer.'),
  category: z.string().trim().max(80),
  priority: z.string().trim().max(40),
});

const ACTION_BUTTON: Record<SimulationAction, { label: string; className: string }> = {
  approve: { label: 'Approve', className: 'btn-primary' },
  reject: { label: 'Reject', className: 'btn-danger' },
  return: { label: 'Return for changes', className: '' },
  complete: { label: 'Mark task complete', className: 'btn-primary' },
};

function Timeline({ history }: { history: HistoryEntry[] }) {
  return (
    <ol className="m-0 list-none space-y-0 border-l-2 border-line p-0 pl-4">
      {history.map((h) => (
        <li key={h.id} className="relative pb-3 text-sm">
          <span
            className="absolute top-1.5 -left-[1.4rem] h-2.5 w-2.5 rounded-full border-2 border-surface"
            style={{ background: `var(--node-${h.nodeType})` }}
            aria-hidden="true"
          />
          <p className="m-0">
            <strong>{h.action}</strong> <span className="text-muted">· {h.nodeLabel}</span>
          </p>
          <p className="m-0 text-muted">
            {h.actor} · <time dateTime={h.at}>{formatTime(h.at)}</time>
          </p>
          {h.detail ? <p className="m-0 mt-0.5">{h.detail}</p> : null}
        </li>
      ))}
    </ol>
  );
}

const OUTCOME_STYLE = {
  approved: { Icon: CircleCheck, tone: 'success', text: 'Approved' },
  completed: { Icon: CircleCheck, tone: 'success', text: 'Completed' },
  rejected: { Icon: CircleX, tone: 'danger', text: 'Rejected' },
  cancelled: { Icon: CircleX, tone: 'danger', text: 'Cancelled' },
} as const;

interface Props {
  workflow: Workflow;
  errorCount: number;
  onShowIssues: () => void;
}

export function SimulationPanel({ workflow, errorCount, onShowIssues }: Props) {
  const id = useId();
  const draft = useEditor((s) => s.draft);
  const simulation = useEditor((s) => s.simulation);
  const setSimulation = useEditor((s) => s.setSimulation);
  const setSampleRequest = useEditor((s) => s.setSampleRequest);
  const recordRun = useWorkflows((s) => s.recordRun);
  const runs = useWorkflows((s) => s.runs).filter((r) => r.workflowId === workflow.id);
  const [comment, setComment] = useState('');
  const graph = { id: workflow.id, nodes: draft.nodes, edges: draft.edges };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SampleRequest>({
    resolver: zodResolver(requestSchema),
    defaultValues: draft.sampleRequest,
  });

  const finish = (state: SimulationState) => {
    if (state.status === 'completed' || state.status === 'error') {
      recordRun({
        id: uid('run'),
        workflowId: workflow.id,
        startedAt: state.startedAt,
        finishedAt: new Date().toISOString(),
        outcome: state.status === 'error' ? 'error' : (state.outcome ?? 'completed'),
        request: state.request,
        history: state.history,
      });
    }
  };

  const announceState = (state: SimulationState) => {
    if (state.status === 'completed')
      toast.announce(`Simulation finished. Outcome: ${state.outcome}.`);
    else if (state.status === 'error') toast.announce(`Simulation stopped: ${state.error}`);
    else {
      const node = draft.nodes.find((n) => n.id === state.currentNodeId);
      if (node) toast.announce(`Waiting at ${node.data.label}.`);
    }
  };

  if (errorCount > 0 && !simulation) {
    return (
      <div className="p-4">
        <div className="rounded-lg border border-danger bg-danger-soft p-3 text-sm">
          <p className="m-0 font-semibold">Fix validation errors before simulating.</p>
          <p className="mt-1 mb-2 text-muted">
            The simulator only runs workflows that pass validation, so results match what would be
            published.
          </p>
          <button type="button" className="btn btn-sm" onClick={onShowIssues}>
            View {errorCount} {errorCount === 1 ? 'error' : 'errors'}
          </button>
        </div>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="p-4">
        <p className="mt-0 text-sm text-muted">
          Run a sample request through the current draft. Decisions are evaluated automatically; you
          act as each assignee or approver.
        </p>
        <form
          noValidate
          onSubmit={handleSubmit((request) => {
            setSampleRequest(request);
            const state = startSimulation(graph, request);
            setSimulation(state);
            setComment('');
            finish(state);
            announceState(state);
          })}
        >
          {(
            [
              ['title', 'Request title', 'text'],
              ['requester', 'Requested by', 'text'],
              ['amount', 'Amount (₹)', 'number'],
              ['days', 'Duration (days)', 'number'],
              ['category', 'Category', 'text'],
              ['priority', 'Priority', 'text'],
            ] as const
          ).map(([name, label, type]) => {
            const err = errors[name];
            return (
              <div key={name} className="mb-3">
                <label htmlFor={`${id}-${name}`} className="field-label">
                  {label}
                </label>
                <input
                  id={`${id}-${name}`}
                  className="input"
                  type={type}
                  inputMode={type === 'number' ? 'decimal' : undefined}
                  min={type === 'number' ? 0 : undefined}
                  aria-invalid={err ? 'true' : 'false'}
                  aria-describedby={
                    err
                      ? `${id}-${name}-error`
                      : name === 'priority'
                        ? `${id}-priority-hint`
                        : undefined
                  }
                  {...register(name, type === 'number' ? { valueAsNumber: true } : {})}
                />
                {name === 'priority' && !err ? (
                  <p id={`${id}-priority-hint`} className="field-hint mb-0">
                    For example Normal or Emergency.
                  </p>
                ) : null}
                {err ? (
                  <p id={`${id}-${name}-error`} className="field-error mb-0">
                    {err.message}
                  </p>
                ) : null}
              </div>
            );
          })}
          <button type="submit" className="btn btn-primary mt-1 w-full">
            <Play size={16} aria-hidden="true" /> Start simulation
          </button>
        </form>

        {runs.length > 0 ? (
          <section aria-labelledby={`${id}-runs`} className="mt-6">
            <h3 id={`${id}-runs`} className="m-0 mb-2 text-sm font-semibold">
              Recent runs
            </h3>
            <ul className="m-0 list-none space-y-2 p-0">
              {runs.slice(0, 5).map((run) => (
                <li key={run.id} className="rounded-lg border border-line text-sm">
                  <details>
                    <summary className="cursor-pointer p-2.5">
                      <span className="font-semibold capitalize">{run.outcome}</span> ·{' '}
                      {run.request.title}{' '}
                      <span className="text-muted">({formatDateTime(run.finishedAt)})</span>
                    </summary>
                    <div className="px-3 pb-3">
                      <Timeline history={run.history} />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    );
  }

  const current = draft.nodes.find((n) => n.id === simulation.currentNodeId);
  const actions = availableActions(graph, simulation);

  return (
    <div className="p-4">
      <div className="mb-4 rounded-lg border border-line bg-surface-2 p-3 text-sm">
        <p className="m-0 font-semibold">{simulation.request.title}</p>
        <p className="m-0 text-muted">
          {simulation.request.requester} · {formatINR(simulation.request.amount)}
          {simulation.request.days ? ` · ${simulation.request.days} days` : ''} ·{' '}
          {simulation.request.category}
        </p>
      </div>

      {simulation.status === 'awaiting-action' && current ? (
        <section
          aria-labelledby={`${id}-current`}
          className="mb-5 rounded-lg border-2 p-3"
          style={{ borderColor: 'var(--focus)' }}
        >
          <p className="m-0 text-xs font-bold tracking-wide text-muted uppercase">
            Waiting for{' '}
            {(current.type === 'approval'
              ? current.data.approverRole
              : current.data.assigneeRole) || 'assignee'}
          </p>
          <h3 id={`${id}-current`} className="mt-0.5 mb-1 text-base font-semibold">
            {NODE_META[current.type].label}: {current.data.label}
          </h3>
          {current.data.description ? (
            <p className="mt-0 mb-2 text-sm text-muted">{current.data.description}</p>
          ) : null}
          <label htmlFor={`${id}-comment`} className="field-label">
            Comment <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id={`${id}-comment`}
            className="input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((a) => (
              <button
                key={a}
                type="button"
                className={`btn ${ACTION_BUTTON[a].className}`}
                onClick={() => {
                  const next = act(graph, simulation, a, comment);
                  setSimulation(next);
                  setComment('');
                  finish(next);
                  announceState(next);
                }}
              >
                {ACTION_BUTTON[a].label}
              </button>
            ))}
          </div>
          {current.type === 'approval' && !actions.includes('return') ? (
            <p className="mt-2 mb-0 text-xs text-muted">
              “Return for changes” is unavailable because this approval has no Returned connection.
            </p>
          ) : null}
        </section>
      ) : null}

      {simulation.status === 'completed' && simulation.outcome
        ? (() => {
            const o = OUTCOME_STYLE[simulation.outcome];
            return (
              <div
                className="mb-5 flex items-start gap-3 rounded-lg border p-3 text-sm"
                style={{ borderColor: `var(--${o.tone})`, background: `var(--${o.tone}-soft)` }}
              >
                <o.Icon
                  size={20}
                  aria-hidden="true"
                  style={{ color: `var(--${o.tone})` }}
                  className="shrink-0"
                />
                <div>
                  <p className="m-0 font-semibold">Outcome: {o.text}</p>
                  <p className="m-0 text-muted">The run was saved to this workflow’s history.</p>
                </div>
              </div>
            );
          })()
        : null}

      {simulation.status === 'error' ? (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-lg border border-danger bg-danger-soft p-3 text-sm"
        >
          <CircleAlert size={20} aria-hidden="true" className="shrink-0 text-danger" />
          <p className="m-0">{simulation.error}</p>
        </div>
      ) : null}

      <h3 className="m-0 mb-2 text-sm font-semibold">Request history</h3>
      <Timeline history={simulation.history} />

      <button type="button" className="btn mt-2 w-full" onClick={() => setSimulation(null)}>
        <RotateCcw size={16} aria-hidden="true" />{' '}
        {simulation.status === 'awaiting-action' ? 'Cancel simulation' : 'New simulation'}
      </button>
    </div>
  );
}
