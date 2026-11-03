import { CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react';
import type { ValidationIssue } from '../../domain/types';

interface Props {
  issues: ValidationIssue[];
  onShowNode: (nodeId: string) => void;
}

export function IssuesPanel({ issues, onShowNode }: Props) {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  return (
    <div className="p-4">
      {errors.length === 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-success bg-success-soft p-3 text-sm">
          <CircleCheck size={20} aria-hidden="true" className="shrink-0 text-success" />
          <div>
            <p className="m-0 font-semibold">This workflow passes validation.</p>
            <p className="m-0 text-muted">It can be published and simulated.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-lg border border-danger bg-danger-soft p-3 text-sm">
          <CircleAlert size={20} aria-hidden="true" className="shrink-0 text-danger" />
          <div>
            <p className="m-0 font-semibold">
              {errors.length} {errors.length === 1 ? 'error' : 'errors'} must be fixed before
              publishing.
            </p>
            <p className="m-0 text-muted">
              Select “Show step” to jump to the step that needs attention.
            </p>
          </div>
        </div>
      )}

      {issues.length > 0 ? (
        <ul className="m-0 mt-4 list-none space-y-2 p-0" aria-label="Validation results">
          {[...errors, ...warnings].map((issue) => {
            const isError = issue.severity === 'error';
            const Icon = isError ? CircleAlert : TriangleAlert;
            return (
              <li key={issue.id} className="rounded-lg border border-line bg-surface p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Icon
                    size={16}
                    aria-hidden="true"
                    className={`mt-0.5 shrink-0 ${isError ? 'text-danger' : 'text-warning'}`}
                  />
                  <p className="m-0 flex-1">
                    <span className={`font-semibold ${isError ? 'text-danger' : 'text-warning'}`}>
                      {isError ? 'Error' : 'Warning'}:
                    </span>{' '}
                    {issue.message}
                  </p>
                </div>
                {issue.nodeId ? (
                  <button
                    type="button"
                    className="btn btn-sm mt-2 ml-6"
                    onClick={() => onShowNode(issue.nodeId!)}
                  >
                    Show step
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      <details className="mt-5 text-sm">
        <summary className="cursor-pointer font-semibold">Rules checked</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          <li>Exactly one Start step, and at least one reachable End step.</li>
          <li>Every step is reachable from Start and can reach an End step.</li>
          <li>Approval, task and notification steps have their roles configured.</li>
          <li>Decisions have a valid condition and both Yes and No branches.</li>
          <li>Approvals have Approved and Rejected branches.</li>
          <li>No self-connections, duplicate outputs, or connections into Start.</li>
          <li>Loops are only allowed through an approval’s Returned branch.</li>
        </ul>
      </details>
    </div>
  );
}
