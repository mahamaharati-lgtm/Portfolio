import { CircleAlert, MousePointerClick, Trash2 } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { checkConnection } from '../../domain/connections';
import {
  FIELD_LABELS,
  HANDLE_LABELS,
  NODE_META,
  NUMERIC_FIELDS,
  describeCondition,
} from '../../domain/nodeMeta';
import {
  CONDITION_FIELDS,
  END_OUTCOMES,
  OPERATORS,
  ROLES,
  type Condition,
  type ConditionField,
  type HandleId,
  type Operator,
  type Role,
  type ValidationIssue,
  type WorkflowNode,
} from '../../domain/types';
import { useEditor } from '../../store/editor';
import { toast } from '../../store/toast';
import { NodeIcon } from '../ui/NodeIcon';

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: (describedBy: string | undefined, invalid: boolean) => ReactNode;
}

function Field({ id, label, hint, error, children }: FieldProps) {
  const describedBy =
    [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className="mb-4">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children(describedBy, Boolean(error))}
      {hint ? (
        <p id={`${id}-hint`} className="field-hint mb-0">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="field-error mb-0">
          <CircleAlert size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

function RoleSelect({
  id,
  value,
  onChange,
  describedBy,
  invalid,
}: {
  id: string;
  value: string | undefined;
  onChange: (role: Role | '') => void;
  describedBy?: string;
  invalid: boolean;
}) {
  return (
    <select
      id={id}
      className="input"
      value={value ?? ''}
      aria-describedby={describedBy}
      aria-invalid={invalid}
      onChange={(e) => onChange(e.target.value as Role | '')}
    >
      <option value="">Choose a role…</option>
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}

function Connections({ node }: { node: WorkflowNode }) {
  const id = useId();
  const draft = useEditor((s) => s.draft);
  const setOutput = useEditor((s) => s.setOutput);
  const meta = NODE_META[node.type];
  const incoming = draft.edges.filter((e) => e.target === node.id);
  const targets = draft.nodes.filter((n) => n.id !== node.id && NODE_META[n.type].acceptsInput);
  const name = (nodeId: string) =>
    draft.nodes.find((n) => n.id === nodeId)?.data.label || 'Untitled step';

  return (
    <fieldset className="m-0 mb-4 rounded-lg border border-line p-3">
      <legend className="px-1 text-sm font-semibold">Connections</legend>
      {meta.outputs.length === 0 ? (
        <p className="m-0 text-sm text-muted">End steps have no outgoing connections.</p>
      ) : (
        meta.outputs.map((handle: HandleId) => {
          const current = draft.edges.find(
            (e) => e.source === node.id && e.sourceHandle === handle,
          );
          const required = meta.requiredOutputs.includes(handle);
          const selectId = `${id}-${handle}`;
          return (
            <div key={handle} className="mb-3 last:mb-0">
              <label htmlFor={selectId} className="field-label">
                {meta.outputs.length > 1 ? `When “${HANDLE_LABELS[handle]}”, go to` : 'Then go to'}
                {!required ? <span className="font-normal text-muted"> (optional)</span> : null}
              </label>
              <select
                id={selectId}
                className="input"
                value={current?.target ?? ''}
                aria-invalid={required && !current}
                onChange={(e) => {
                  const target = e.target.value || null;
                  const result = setOutput(node.id, handle, target);
                  if (!result.ok) toast.error(result.reason);
                  else
                    toast.announce(
                      target
                        ? `${HANDLE_LABELS[handle]} now goes to ${name(target)}.`
                        : `${HANDLE_LABELS[handle]} disconnected.`,
                    );
                }}
              >
                <option value="">Not connected</option>
                {targets.map((t) => {
                  const ok = checkConnection(
                    draft.nodes,
                    draft.edges.filter((e) => !(e.source === node.id && e.sourceHandle === handle)),
                    node.id,
                    handle,
                    t.id,
                  ).ok;
                  return (
                    <option key={t.id} value={t.id} disabled={!ok}>
                      {NODE_META[t.type].label}: {t.data.label || 'Untitled'}
                    </option>
                  );
                })}
              </select>
            </div>
          );
        })
      )}
      <p className="mt-3 mb-0 text-xs text-muted">
        {incoming.length === 0
          ? node.type === 'start'
            ? 'Start steps have no incoming connections.'
            : 'No steps lead here yet.'
          : `Reached from: ${incoming.map((e) => `${name(e.source)}${e.sourceHandle !== 'next' ? ` (${HANDLE_LABELS[e.sourceHandle]})` : ''}`).join(', ')}`}
      </p>
    </fieldset>
  );
}

interface PropertiesPanelProps {
  node: WorkflowNode | null;
  issues: ValidationIssue[];
  onDelete: (node: WorkflowNode) => void;
}

export function PropertiesPanel({ node, issues, onDelete }: PropertiesPanelProps) {
  const id = useId();
  const update = useEditor((s) => s.updateNodeData);

  if (!node) {
    return (
      <div className="flex flex-col items-center px-4 py-10 text-center text-sm text-muted">
        <MousePointerClick size={28} aria-hidden="true" />
        <p className="mt-2 mb-0">
          Select a step on the canvas or in the list to edit its properties and connections.
        </p>
      </div>
    );
  }

  const meta = NODE_META[node.type];
  const d = node.data;
  const nodeIssues = issues.filter((i) => i.nodeId === node.id);
  const condition: Condition = d.condition ?? { field: 'amount', operator: '>', value: '' };
  const numeric = NUMERIC_FIELDS.has(condition.field);
  const setCondition = (patch: Partial<Condition>) => {
    const next = { ...condition, ...patch };
    if (
      patch.field &&
      !NUMERIC_FIELDS.has(patch.field) &&
      next.operator !== '==' &&
      next.operator !== '!='
    ) {
      next.operator = '==';
    }
    update(node.id, { condition: next });
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-3">
        <NodeIcon type={node.type} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-xs font-bold tracking-wide text-muted uppercase">
            {meta.label} step
          </p>
          <h3 className="m-0 truncate text-base font-semibold">{d.label || 'Untitled'}</h3>
        </div>
        <button
          type="button"
          className="btn btn-sm text-danger"
          onClick={() => onDelete(node)}
          aria-label={`Delete step ${d.label || 'Untitled'}`}
        >
          <Trash2 size={15} aria-hidden="true" /> Delete
        </button>
      </div>
      <p className="mt-0 mb-4 text-sm text-muted">{meta.summary}</p>

      {nodeIssues.length > 0 ? (
        <div className="mb-4 rounded-lg border border-danger bg-danger-soft p-3 text-sm">
          <p className="m-0 font-semibold text-danger">
            {nodeIssues.length === 1
              ? '1 problem with this step'
              : `${nodeIssues.length} problems with this step`}
          </p>
          <ul className="m-0 mt-1 list-disc pl-5">
            {nodeIssues.map((i) => (
              <li key={i.id}>
                <span className="sr-only">{i.severity}: </span>
                {i.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Field
        id={`${id}-label`}
        label="Step name"
        error={d.label.trim() ? undefined : 'Enter a name for this step.'}
      >
        {(describedBy, invalid) => (
          <input
            id={`${id}-label`}
            className="input"
            value={d.label}
            maxLength={80}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            onChange={(e) => update(node.id, { label: e.target.value })}
          />
        )}
      </Field>

      <Field
        id={`${id}-desc`}
        label="Description"
        hint="Optional. Shown to people working on this step."
      >
        {(describedBy) => (
          <textarea
            id={`${id}-desc`}
            className="input"
            value={d.description ?? ''}
            maxLength={500}
            aria-describedby={describedBy}
            onChange={(e) => update(node.id, { description: e.target.value })}
          />
        )}
      </Field>

      {node.type === 'task' ? (
        <Field
          id={`${id}-assignee`}
          label="Assigned role"
          error={d.assigneeRole ? undefined : 'Choose who performs this task.'}
        >
          {(describedBy, invalid) => (
            <RoleSelect
              id={`${id}-assignee`}
              value={d.assigneeRole}
              describedBy={describedBy}
              invalid={invalid}
              onChange={(assigneeRole) => update(node.id, { assigneeRole })}
            />
          )}
        </Field>
      ) : null}

      {node.type === 'approval' ? (
        <>
          <Field
            id={`${id}-approver`}
            label="Approver role"
            error={d.approverRole ? undefined : 'Choose an approver role.'}
          >
            {(describedBy, invalid) => (
              <RoleSelect
                id={`${id}-approver`}
                value={d.approverRole}
                describedBy={describedBy}
                invalid={invalid}
                onChange={(approverRole) => update(node.id, { approverRole })}
              />
            )}
          </Field>
          <Field
            id={`${id}-sla`}
            label="Response time (hours)"
            hint="Target time for the approver to respond."
          >
            {(describedBy) => (
              <input
                id={`${id}-sla`}
                className="input"
                type="number"
                inputMode="numeric"
                min={0}
                max={720}
                value={d.slaHours ?? ''}
                aria-describedby={describedBy}
                onChange={(e) =>
                  update(node.id, {
                    slaHours:
                      e.target.value === ''
                        ? undefined
                        : Math.max(0, Math.min(720, Math.round(Number(e.target.value)))),
                  })
                }
              />
            )}
          </Field>
        </>
      ) : null}

      {node.type === 'decision' ? (
        <fieldset className="m-0 mb-4 rounded-lg border border-line p-3">
          <legend className="px-1 text-sm font-semibold">Condition</legend>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div>
              <label htmlFor={`${id}-field`} className="field-label">
                Field
              </label>
              <select
                id={`${id}-field`}
                className="input"
                value={condition.field}
                onChange={(e) => setCondition({ field: e.target.value as ConditionField })}
              >
                {CONDITION_FIELDS.map((f) => (
                  <option key={f} value={f}>
                    {FIELD_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-op`} className="field-label">
                Operator
              </label>
              <select
                id={`${id}-op`}
                className="input"
                value={condition.operator}
                onChange={(e) => setCondition({ operator: e.target.value as Operator })}
              >
                {OPERATORS.filter((o) => numeric || o === '==' || o === '!=').map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-2">
            <Field
              id={`${id}-value`}
              label="Value"
              hint={numeric ? undefined : 'Text comparison ignores upper and lower case.'}
              error={
                condition.value.trim() === ''
                  ? 'Enter a value to compare against.'
                  : numeric && Number.isNaN(Number(condition.value))
                    ? 'Enter a number.'
                    : undefined
              }
            >
              {(describedBy, invalid) => (
                <input
                  id={`${id}-value`}
                  className="input"
                  inputMode={numeric ? 'decimal' : 'text'}
                  value={condition.value}
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                  onChange={(e) => setCondition({ value: e.target.value })}
                />
              )}
            </Field>
          </div>
          <p className="m-0 text-sm">
            Requests where <strong>{describeCondition({ ...d, condition })}</strong> follow{' '}
            <strong>Yes</strong>; all others follow <strong>No</strong>.
          </p>
        </fieldset>
      ) : null}

      {node.type === 'notification' ? (
        <>
          <Field
            id={`${id}-recipient`}
            label="Recipient role"
            error={d.recipientRole ? undefined : 'Choose who is notified.'}
          >
            {(describedBy, invalid) => (
              <RoleSelect
                id={`${id}-recipient`}
                value={d.recipientRole}
                describedBy={describedBy}
                invalid={invalid}
                onChange={(recipientRole) => update(node.id, { recipientRole })}
              />
            )}
          </Field>
          <Field id={`${id}-message`} label="Message">
            {(describedBy) => (
              <textarea
                id={`${id}-message`}
                className="input"
                value={d.message ?? ''}
                maxLength={500}
                aria-describedby={describedBy}
                onChange={(e) => update(node.id, { message: e.target.value })}
              />
            )}
          </Field>
        </>
      ) : null}

      {node.type === 'end' ? (
        <Field id={`${id}-outcome`} label="Outcome">
          {(describedBy) => (
            <select
              id={`${id}-outcome`}
              className="input capitalize"
              value={d.outcome ?? 'completed'}
              aria-describedby={describedBy}
              onChange={(e) =>
                update(node.id, { outcome: e.target.value as (typeof END_OUTCOMES)[number] })
              }
            >
              {END_OUTCOMES.map((o) => (
                <option key={o} value={o}>
                  {o[0]!.toUpperCase() + o.slice(1)}
                </option>
              ))}
            </select>
          )}
        </Field>
      ) : null}

      <Connections node={node} />
    </div>
  );
}
