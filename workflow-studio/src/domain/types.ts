export const NODE_TYPES = ['start', 'task', 'approval', 'decision', 'notification', 'end'] as const;
export type WorkflowNodeType = (typeof NODE_TYPES)[number];

/** Named output ports. Nodes with a single exit use `next`. */
export const HANDLES = ['next', 'approve', 'reject', 'return', 'true', 'false'] as const;
export type HandleId = (typeof HANDLES)[number];

export const ROLES = [
  'Requester',
  'Line Manager',
  'Department Head',
  'Finance Approver',
  'HR Partner',
  'Procurement Officer',
  'IT Change Board',
  'Legal Reviewer',
] as const;
export type Role = (typeof ROLES)[number];

export const CONDITION_FIELDS = ['amount', 'days', 'category', 'priority'] as const;
export type ConditionField = (typeof CONDITION_FIELDS)[number];

export const OPERATORS = ['>', '>=', '<', '<=', '==', '!='] as const;
export type Operator = (typeof OPERATORS)[number];

export const END_OUTCOMES = ['approved', 'rejected', 'completed', 'cancelled'] as const;
export type EndOutcome = (typeof END_OUTCOMES)[number];

export interface Condition {
  field: ConditionField;
  operator: Operator;
  value: string;
}

export interface NodeData {
  label: string;
  description?: string;
  /** Task nodes: who performs the work. */
  assigneeRole?: Role | '';
  /** Approval nodes: who approves. */
  approverRole?: Role | '';
  /** Approval nodes: optional SLA in hours, shown to the approver. */
  slaHours?: number;
  /** Decision nodes. */
  condition?: Condition;
  /** Notification nodes. */
  recipientRole?: Role | '';
  message?: string;
  /** End nodes. */
  outcome?: EndOutcome;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: NodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: HandleId;
}

export type WorkflowStatus = 'draft' | 'published';

export interface SampleRequest {
  title: string;
  requester: string;
  amount: number;
  days: number;
  category: string;
  priority: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  status: WorkflowStatus;
  /** Incremented every time the workflow is published. 0 = never published. */
  publishedVersion: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  sampleRequest: SampleRequest;
}

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  id: string;
  severity: IssueSeverity;
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export type SimulationAction = 'approve' | 'reject' | 'return' | 'complete';

export interface HistoryEntry {
  id: string;
  at: string;
  nodeId: string;
  nodeLabel: string;
  nodeType: WorkflowNodeType;
  actor: string;
  action: string;
  detail?: string;
}

export type SimulationStatus = 'awaiting-action' | 'completed' | 'error';

export interface SimulationState {
  workflowId: string;
  startedAt: string;
  request: SampleRequest;
  currentNodeId: string | null;
  status: SimulationStatus;
  outcome?: EndOutcome;
  error?: string;
  history: HistoryEntry[];
}

export interface SimulationRun {
  id: string;
  workflowId: string;
  startedAt: string;
  finishedAt: string;
  outcome: EndOutcome | 'error';
  request: SampleRequest;
  history: HistoryEntry[];
}
