import type { WorkflowEdge, WorkflowNode } from './types';

const HANDLE_ORDER = ['next', 'approve', 'true', 'false', 'reject', 'return'];

/** Orders steps as a reader would follow them: breadth-first from Start, then anything unreachable. */
export function orderSteps(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const start = nodes.find((n) => n.type === 'start');
  const order: string[] = [];
  const seen = new Set<string>();
  const queue = start ? [start.id] : [];
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(id);
    const outs = edges
      .filter((e) => e.source === id)
      .sort((a, b) => HANDLE_ORDER.indexOf(a.sourceHandle) - HANDLE_ORDER.indexOf(b.sourceHandle));
    for (const e of outs) if (!seen.has(e.target)) queue.push(e.target);
  }
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const ordered = order.map((id) => byId.get(id)).filter((n): n is WorkflowNode => Boolean(n));
  return [...ordered, ...nodes.filter((n) => !seen.has(n.id))];
}
