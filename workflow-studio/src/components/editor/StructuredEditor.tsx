import { ArrowRight, CircleAlert, Pencil, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { HANDLE_LABELS, NODE_META, nodeDetail } from '../../domain/nodeMeta';
import { orderSteps } from '../../domain/order';
import type { WorkflowNode } from '../../domain/types';
import { useEditor } from '../../store/editor';
import { NodeIcon } from '../ui/NodeIcon';

interface Props {
  issuesByNode: Map<string, number>;
  onEdit: (nodeId: string) => void;
  onDelete: (node: WorkflowNode) => void;
}

export function StructuredEditor({ issuesByNode, onEdit, onDelete }: Props) {
  const draft = useEditor((s) => s.draft);
  const selectedNodeId = useEditor((s) => s.selectedNodeId);
  const simulation = useEditor((s) => s.simulation);
  const steps = useMemo(() => orderSteps(draft.nodes, draft.edges), [draft.nodes, draft.edges]);
  const label = (id: string) => draft.nodes.find((n) => n.id === id)?.data.label || 'Untitled step';

  if (steps.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted">
        <p className="m-0">This workflow has no steps. Use “Add a step” to add a Start step.</p>
      </div>
    );
  }

  return (
    <ol className="m-0 list-none space-y-3 p-3 sm:p-4" aria-label="Workflow steps in order">
      {steps.map((node, index) => {
        const meta = NODE_META[node.type];
        const outs = draft.edges.filter((e) => e.source === node.id);
        const issues = issuesByNode.get(node.id) ?? 0;
        const detail = nodeDetail(node);
        const selected = node.id === selectedNodeId;
        const current = simulation?.currentNodeId === node.id;
        return (
          <li
            key={node.id}
            className="card p-3"
            style={{
              borderLeft: `5px solid var(--node-${node.type})`,
              boxShadow: current
                ? '0 0 0 3px var(--focus)'
                : selected
                  ? '0 0 0 2px var(--accent)'
                  : undefined,
            }}
          >
            <div className="flex items-start gap-3">
              <NodeIcon type={node.type} />
              <div className="min-w-0 flex-1">
                <p className="m-0 text-xs font-bold tracking-wide text-muted uppercase">
                  <span className="sr-only">Step {index + 1}, </span>
                  {meta.label}
                  {current ? (
                    <span className="ml-2 normal-case" style={{ color: 'var(--focus)' }}>
                      · Current simulation step
                    </span>
                  ) : null}
                </p>
                <h3 className="m-0 text-base font-semibold break-words">
                  {node.data.label || 'Untitled'}
                </h3>
                {detail ? <p className="m-0 text-sm text-muted">{detail}</p> : null}
                {issues > 0 ? (
                  <p className="m-0 mt-1 inline-flex items-center gap-1 text-sm font-semibold text-danger">
                    <CircleAlert size={14} aria-hidden="true" /> {issues}{' '}
                    {issues === 1 ? 'issue' : 'issues'}
                  </p>
                ) : null}
                {meta.outputs.length > 0 ? (
                  <ul className="m-0 mt-2 list-none space-y-0.5 p-0 text-sm">
                    {meta.outputs.map((h) => {
                      const edge = outs.find((e) => e.sourceHandle === h);
                      return (
                        <li key={h} className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold">
                            {h === 'next' ? 'Then' : HANDLE_LABELS[h]}
                          </span>
                          <ArrowRight size={14} aria-label="goes to" />
                          {edge ? (
                            <span>{label(edge.target)}</span>
                          ) : (
                            <span className="text-muted italic">not connected</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => onEdit(node.id)}
                aria-label={`Edit ${node.data.label || 'untitled step'}`}
              >
                <Pencil size={14} aria-hidden="true" /> Edit
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost text-danger"
                onClick={() => onDelete(node)}
                aria-label={`Delete ${node.data.label || 'untitled step'}`}
              >
                <Trash2 size={14} aria-hidden="true" /> Delete
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
