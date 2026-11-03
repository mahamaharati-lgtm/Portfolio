import type { HandleId, NodeData, WorkflowNode, WorkflowNodeType } from './types';

export interface NodeTypeMeta {
  label: string;
  summary: string;
  /** Output handles in display order. */
  outputs: HandleId[];
  /** Outputs that must be connected for the workflow to be valid. */
  requiredOutputs: HandleId[];
  acceptsInput: boolean;
  defaults: () => NodeData;
}

export const NODE_META: Record<WorkflowNodeType, NodeTypeMeta> = {
  start: {
    label: 'Start',
    summary: 'Where a request enters the workflow.',
    outputs: ['next'],
    requiredOutputs: ['next'],
    acceptsInput: false,
    defaults: () => ({ label: 'Request submitted' }),
  },
  task: {
    label: 'Task',
    summary: 'Work a role must complete before the request moves on.',
    outputs: ['next'],
    requiredOutputs: ['next'],
    acceptsInput: true,
    defaults: () => ({ label: 'New task', assigneeRole: '' }),
  },
  approval: {
    label: 'Approval',
    summary: 'A role approves, rejects or returns the request.',
    outputs: ['approve', 'reject', 'return'],
    requiredOutputs: ['approve', 'reject'],
    acceptsInput: true,
    defaults: () => ({ label: 'New approval', approverRole: '', slaHours: 24 }),
  },
  decision: {
    label: 'Decision',
    summary: 'Routes the request by evaluating a condition.',
    outputs: ['true', 'false'],
    requiredOutputs: ['true', 'false'],
    acceptsInput: true,
    defaults: () => ({
      label: 'New decision',
      condition: { field: 'amount', operator: '>', value: '50000' },
    }),
  },
  notification: {
    label: 'Notification',
    summary: 'Informs a role. Continues automatically.',
    outputs: ['next'],
    requiredOutputs: ['next'],
    acceptsInput: true,
    defaults: () => ({ label: 'Notify requester', recipientRole: 'Requester', message: '' }),
  },
  end: {
    label: 'End',
    summary: 'Finishes the workflow with an outcome.',
    outputs: [],
    requiredOutputs: [],
    acceptsInput: true,
    defaults: () => ({ label: 'Workflow complete', outcome: 'completed' }),
  },
};

export const HANDLE_LABELS: Record<HandleId, string> = {
  next: 'Next',
  approve: 'Approved',
  reject: 'Rejected',
  return: 'Returned',
  true: 'Yes',
  false: 'No',
};

export const FIELD_LABELS = {
  amount: 'Amount (₹)',
  days: 'Duration (days)',
  category: 'Category',
  priority: 'Priority',
} as const;

export const NUMERIC_FIELDS = new Set(['amount', 'days']);

export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function describeCondition(data: NodeData): string {
  const c = data.condition;
  if (!c) return 'No condition configured';
  const value =
    c.field === 'amount' && c.value.trim() !== '' && !Number.isNaN(Number(c.value))
      ? formatINR(Number(c.value))
      : c.value || '…';
  return `${FIELD_LABELS[c.field]} ${c.operator} ${value}`;
}

/** One-line summary of a step's configuration. */
export function nodeDetail(node: WorkflowNode): string | null {
  const d = node.data;
  switch (node.type) {
    case 'task':
      return d.assigneeRole ? `Assigned to ${d.assigneeRole}` : 'No assignee yet';
    case 'approval':
      return d.approverRole
        ? `Approver: ${d.approverRole}${d.slaHours ? ` · ${d.slaHours}h SLA` : ''}`
        : 'No approver role yet';
    case 'decision':
      return describeCondition(d);
    case 'notification':
      return d.recipientRole ? `Notifies ${d.recipientRole}` : 'No recipient yet';
    case 'end':
      return `Outcome: ${d.outcome ?? 'completed'}`;
    default:
      return null;
  }
}
