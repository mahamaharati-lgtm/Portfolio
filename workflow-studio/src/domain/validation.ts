import { HANDLE_LABELS, NODE_META, NUMERIC_FIELDS } from './nodeMeta';
import type { ValidationIssue, Workflow, WorkflowEdge, WorkflowNode } from './types';

function nodeName(node: WorkflowNode): string {
  return node.data.label.trim() || `Untitled ${NODE_META[node.type].label.toLowerCase()}`;
}

function adjacency(edges: WorkflowEdge[], skipReturn = false): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const e of edges) {
    if (skipReturn && e.sourceHandle === 'return') continue;
    const list = map.get(e.source) ?? [];
    list.push(e.target);
    map.set(e.source, list);
  }
  return map;
}

function reachableFrom(startIds: string[], adj: Map<string, string[]>): Set<string> {
  const seen = new Set<string>(startIds);
  const queue = [...startIds];
  while (queue.length) {
    const id = queue.shift()!;
    for (const next of adj.get(id) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

/** Returns the node ids that take part in a cycle formed without "return" edges. */
function findForwardCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] | null {
  const adj = adjacency(edges, true);
  const state = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];
  let cycle: string[] | null = null;

  const visit = (id: string): boolean => {
    state.set(id, 'visiting');
    stack.push(id);
    for (const next of adj.get(id) ?? []) {
      const s = state.get(next);
      if (s === 'visiting') {
        cycle = stack.slice(stack.indexOf(next));
        return true;
      }
      if (!s && visit(next)) return true;
    }
    stack.pop();
    state.set(id, 'done');
    return false;
  };

  for (const n of nodes) {
    if (!state.has(n.id) && visit(n.id)) break;
  }
  return cycle;
}

/**
 * Validates a workflow against the business rules. Errors block publishing;
 * warnings are advisory.
 */
export function validateWorkflow(
  workflow: Pick<Workflow, 'name' | 'nodes' | 'edges'>,
): ValidationIssue[] {
  const { nodes, edges } = workflow;
  const issues: ValidationIssue[] = [];
  const add = (issue: Omit<ValidationIssue, 'id'>) =>
    issues.push({ ...issue, id: `${issues.length}-${issue.nodeId ?? issue.edgeId ?? 'wf'}` });
  const byId = new Map(nodes.map((n) => [n.id, n]));

  if (!workflow.name.trim()) add({ severity: 'error', message: 'The workflow needs a name.' });

  if (nodes.length === 0) {
    add({ severity: 'error', message: 'The workflow is empty. Add a Start step to begin.' });
    return issues;
  }

  // Start / end rules
  const starts = nodes.filter((n) => n.type === 'start');
  const ends = nodes.filter((n) => n.type === 'end');
  if (starts.length === 0) add({ severity: 'error', message: 'Add exactly one Start step.' });
  if (starts.length > 1) {
    for (const s of starts.slice(1)) {
      add({
        severity: 'error',
        nodeId: s.id,
        message: `Only one Start step is allowed. Remove “${nodeName(s)}”.`,
      });
    }
  }
  if (ends.length === 0) add({ severity: 'error', message: 'Add at least one End step.' });

  // Edge integrity
  const seenHandles = new Set<string>();
  for (const e of edges) {
    const source = byId.get(e.source);
    const target = byId.get(e.target);
    if (!source || !target) {
      add({
        severity: 'error',
        edgeId: e.id,
        message: 'A connection points to a step that no longer exists.',
      });
      continue;
    }
    if (source.id === target.id) {
      add({
        severity: 'error',
        edgeId: e.id,
        nodeId: source.id,
        message: `“${nodeName(source)}” connects to itself.`,
      });
    }
    if (!NODE_META[source.type].outputs.includes(e.sourceHandle)) {
      add({
        severity: 'error',
        edgeId: e.id,
        nodeId: source.id,
        message: `“${nodeName(source)}” uses an output (${e.sourceHandle}) that ${NODE_META[source.type].label} steps do not have.`,
      });
    }
    if (!NODE_META[target.type].acceptsInput) {
      add({
        severity: 'error',
        edgeId: e.id,
        nodeId: target.id,
        message: 'The Start step cannot have incoming connections.',
      });
    }
    const key = `${e.source}:${e.sourceHandle}`;
    if (seenHandles.has(key)) {
      add({
        severity: 'error',
        edgeId: e.id,
        nodeId: source.id,
        message: `“${nodeName(source)}” has more than one “${HANDLE_LABELS[e.sourceHandle] ?? e.sourceHandle}” connection.`,
      });
    }
    seenHandles.add(key);
  }

  // Per-node configuration and required outputs
  for (const node of nodes) {
    const name = nodeName(node);
    const meta = NODE_META[node.type];
    if (!node.data.label.trim()) {
      add({ severity: 'error', nodeId: node.id, message: `A ${meta.label} step needs a name.` });
    }
    const outgoing = edges.filter((e) => e.source === node.id);
    for (const handle of meta.requiredOutputs) {
      if (!outgoing.some((e) => e.sourceHandle === handle)) {
        const which = meta.outputs.length > 1 ? `“${HANDLE_LABELS[handle]}” ` : '';
        add({
          severity: 'error',
          nodeId: node.id,
          message: `“${name}” is missing its ${which}connection.`,
        });
      }
    }
    switch (node.type) {
      case 'task':
        if (!node.data.assigneeRole) {
          add({ severity: 'error', nodeId: node.id, message: `Choose who performs “${name}”.` });
        }
        break;
      case 'approval':
        if (!node.data.approverRole) {
          add({
            severity: 'error',
            nodeId: node.id,
            message: `Choose an approver role for “${name}”.`,
          });
        }
        break;
      case 'notification':
        if (!node.data.recipientRole) {
          add({ severity: 'error', nodeId: node.id, message: `Choose who “${name}” notifies.` });
        }
        break;
      case 'decision': {
        const c = node.data.condition;
        if (!c || c.value.trim() === '') {
          add({
            severity: 'error',
            nodeId: node.id,
            message: `Configure the condition for “${name}”.`,
          });
        } else if (NUMERIC_FIELDS.has(c.field) && Number.isNaN(Number(c.value))) {
          add({
            severity: 'error',
            nodeId: node.id,
            message: `“${name}” compares ${c.field} to “${c.value}”, which is not a number.`,
          });
        } else if (!NUMERIC_FIELDS.has(c.field) && c.operator !== '==' && c.operator !== '!=') {
          add({
            severity: 'error',
            nodeId: node.id,
            message: `“${name}” can only use “==” or “!=” with ${c.field}.`,
          });
        }
        const yes = outgoing.find((e) => e.sourceHandle === 'true');
        const no = outgoing.find((e) => e.sourceHandle === 'false');
        if (yes && no && yes.target === no.target) {
          add({
            severity: 'warning',
            nodeId: node.id,
            message: `Both branches of “${name}” lead to the same step, so the decision has no effect.`,
          });
        }
        break;
      }
    }
  }

  // Reachability
  if (starts.length === 1) {
    const start = starts[0]!;
    const reachable = reachableFrom([start.id], adjacency(edges));
    for (const node of nodes) {
      if (!reachable.has(node.id)) {
        add({
          severity: 'error',
          nodeId: node.id,
          message: `“${nodeName(node)}” cannot be reached from the Start step.`,
        });
      }
    }
    if (ends.length > 0 && !ends.some((e) => reachable.has(e.id))) {
      add({ severity: 'error', message: 'No End step can be reached from the Start step.' });
    }
    // Every reachable step must be able to finish
    const reverse = new Map<string, string[]>();
    for (const e of edges) {
      const list = reverse.get(e.target) ?? [];
      list.push(e.source);
      reverse.set(e.target, list);
    }
    const canFinish = reachableFrom(
      ends.map((e) => e.id),
      reverse,
    );
    for (const node of nodes) {
      if (node.type !== 'end' && reachable.has(node.id) && !canFinish.has(node.id)) {
        add({
          severity: 'error',
          nodeId: node.id,
          message: `There is no path from “${nodeName(node)}” to an End step.`,
        });
      }
    }
  }

  const cycle = findForwardCycle(nodes, edges);
  if (cycle) {
    const names = cycle.map((id) => nodeName(byId.get(id)!)).join(' → ');
    add({
      severity: 'error',
      nodeId: cycle[0],
      message: `Steps form a loop (${names}). Loops are only allowed through an approval’s “Returned” output.`,
    });
  }

  return issues;
}

export function hasErrors(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.severity === 'error');
}
