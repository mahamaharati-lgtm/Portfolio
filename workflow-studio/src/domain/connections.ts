import { NODE_META } from './nodeMeta';
import type { HandleId, WorkflowEdge, WorkflowNode } from './types';

export type ConnectionCheck = { ok: true } | { ok: false; reason: string };

/**
 * Rules applied whenever a connection is created, from the canvas or from the
 * keyboard connection editor. Validation re-checks the same rules on import.
 */
export function checkConnection(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  sourceId: string,
  handle: HandleId,
  targetId: string,
): ConnectionCheck {
  const source = nodes.find((n) => n.id === sourceId);
  const target = nodes.find((n) => n.id === targetId);
  if (!source || !target) return { ok: false, reason: 'Both steps must exist.' };
  if (source.id === target.id) return { ok: false, reason: 'A step cannot connect to itself.' };
  const meta = NODE_META[source.type];
  if (!meta.outputs.includes(handle)) {
    return { ok: false, reason: `${meta.label} steps have no “${handle}” output.` };
  }
  if (!NODE_META[target.type].acceptsInput) {
    return { ok: false, reason: 'Nothing can connect into the Start step.' };
  }
  if (edges.some((e) => e.source === sourceId && e.sourceHandle === handle)) {
    return {
      ok: false,
      reason: 'That output is already connected. Remove the existing connection first.',
    };
  }
  return { ok: true };
}

export function edgeId(source: string, handle: HandleId, target: string): string {
  return `e-${source}-${handle}-${target}`;
}
