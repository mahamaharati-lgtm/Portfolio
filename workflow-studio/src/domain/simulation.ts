import {
  describeCondition,
  FIELD_LABELS,
  formatINR,
  HANDLE_LABELS,
  NUMERIC_FIELDS,
} from './nodeMeta';
import type {
  Condition,
  HandleId,
  HistoryEntry,
  SampleRequest,
  SimulationAction,
  SimulationState,
  Workflow,
  WorkflowNode,
} from './types';

type Graph = Pick<Workflow, 'id' | 'nodes' | 'edges'>;
type Clock = () => string;

const defaultClock: Clock = () => new Date().toISOString();
const MAX_AUTOMATIC_STEPS = 200;

export function evaluateCondition(condition: Condition, request: SampleRequest): boolean {
  const actual = request[condition.field];
  if (NUMERIC_FIELDS.has(condition.field)) {
    const a = Number(actual);
    const b = Number(condition.value);
    switch (condition.operator) {
      case '>':
        return a > b;
      case '>=':
        return a >= b;
      case '<':
        return a < b;
      case '<=':
        return a <= b;
      case '==':
        return a === b;
      case '!=':
        return a !== b;
    }
  }
  const a = String(actual).trim().toLowerCase();
  const b = condition.value.trim().toLowerCase();
  return condition.operator === '!=' ? a !== b : a === b;
}

function describeActual(condition: Condition, request: SampleRequest): string {
  const value = request[condition.field];
  return condition.field === 'amount' ? formatINR(Number(value)) : String(value);
}

function entry(
  state: SimulationState,
  node: WorkflowNode,
  actor: string,
  action: string,
  clock: Clock,
  detail?: string,
): HistoryEntry {
  return {
    id: `h${state.history.length + 1}`,
    at: clock(),
    nodeId: node.id,
    nodeLabel: node.data.label,
    nodeType: node.type,
    actor,
    action,
    detail,
  };
}

function fail(state: SimulationState, message: string): SimulationState {
  return { ...state, status: 'error', error: message, currentNodeId: state.currentNodeId };
}

function follow(graph: Graph, nodeId: string, handle: HandleId): WorkflowNode | undefined {
  const edge = graph.edges.find((e) => e.source === nodeId && e.sourceHandle === handle);
  return edge ? graph.nodes.find((n) => n.id === edge.target) : undefined;
}

/** Moves through automatic steps until a person must act or the workflow ends. */
function run(graph: Graph, initial: SimulationState, clock: Clock): SimulationState {
  let state = initial;
  for (let i = 0; i < MAX_AUTOMATIC_STEPS; i++) {
    const node = graph.nodes.find((n) => n.id === state.currentNodeId);
    if (!node) return fail(state, 'The simulation reached a step that does not exist.');

    let handle: HandleId;
    switch (node.type) {
      case 'task':
      case 'approval':
        return { ...state, status: 'awaiting-action' };
      case 'end': {
        const outcome = node.data.outcome ?? 'completed';
        return {
          ...state,
          status: 'completed',
          outcome,
          currentNodeId: node.id,
          history: [
            ...state.history,
            entry(state, node, 'System', `Workflow finished: ${outcome}`, clock),
          ],
        };
      }
      case 'start':
        handle = 'next';
        state = {
          ...state,
          history: [
            ...state.history,
            entry(
              state,
              node,
              state.request.requester,
              'Submitted request',
              clock,
              state.request.title,
            ),
          ],
        };
        break;
      case 'notification':
        handle = 'next';
        state = {
          ...state,
          history: [
            ...state.history,
            entry(
              state,
              node,
              'System',
              `Notified ${node.data.recipientRole || 'recipient'}`,
              clock,
              node.data.message || undefined,
            ),
          ],
        };
        break;
      case 'decision': {
        const c = node.data.condition;
        if (!c) return fail(state, `“${node.data.label}” has no condition.`);
        const result = evaluateCondition(c, state.request);
        handle = result ? 'true' : 'false';
        state = {
          ...state,
          history: [
            ...state.history,
            entry(
              state,
              node,
              'System',
              `Evaluated condition → ${HANDLE_LABELS[handle]}`,
              clock,
              `${describeCondition(node.data)} (${FIELD_LABELS[c.field]} is ${describeActual(c, state.request)})`,
            ),
          ],
        };
        break;
      }
    }

    const next = follow(graph, node.id, handle);
    if (!next) {
      return fail(state, `“${node.data.label}” has no “${HANDLE_LABELS[handle]}” connection.`);
    }
    state = { ...state, currentNodeId: next.id };
  }
  return fail(state, 'The simulation stopped after too many automatic steps. Check for loops.');
}

export function startSimulation(
  graph: Graph,
  request: SampleRequest,
  clock: Clock = defaultClock,
): SimulationState {
  const start = graph.nodes.find((n) => n.type === 'start');
  const base: SimulationState = {
    workflowId: graph.id,
    startedAt: clock(),
    request,
    currentNodeId: start?.id ?? null,
    status: 'awaiting-action',
    history: [],
  };
  if (!start) return fail(base, 'The workflow has no Start step.');
  return run(graph, base, clock);
}

export function availableActions(graph: Graph, state: SimulationState): SimulationAction[] {
  if (state.status !== 'awaiting-action') return [];
  const node = graph.nodes.find((n) => n.id === state.currentNodeId);
  if (!node) return [];
  if (node.type === 'task') return ['complete'];
  if (node.type === 'approval') {
    const actions: SimulationAction[] = ['approve', 'reject'];
    if (graph.edges.some((e) => e.source === node.id && e.sourceHandle === 'return')) {
      actions.push('return');
    }
    return actions;
  }
  return [];
}

const ACTION_TO_HANDLE: Record<SimulationAction, HandleId> = {
  complete: 'next',
  approve: 'approve',
  reject: 'reject',
  return: 'return',
};

const ACTION_LABEL: Record<SimulationAction, string> = {
  complete: 'Completed task',
  approve: 'Approved',
  reject: 'Rejected',
  return: 'Returned for changes',
};

export function act(
  graph: Graph,
  state: SimulationState,
  action: SimulationAction,
  comment = '',
  clock: Clock = defaultClock,
): SimulationState {
  if (!availableActions(graph, state).includes(action)) {
    return fail(state, `“${action}” is not available at this step.`);
  }
  const node = graph.nodes.find((n) => n.id === state.currentNodeId)!;
  const actor =
    (node.type === 'approval' ? node.data.approverRole : node.data.assigneeRole) || 'Unassigned';
  const recorded: SimulationState = {
    ...state,
    history: [
      ...state.history,
      entry(state, node, actor, ACTION_LABEL[action], clock, comment.trim() || undefined),
    ],
  };
  const next = follow(graph, node.id, ACTION_TO_HANDLE[action]);
  if (!next) return fail(recorded, `“${node.data.label}” has no connection for this action.`);
  return run(graph, { ...recorded, currentNodeId: next.id }, clock);
}
