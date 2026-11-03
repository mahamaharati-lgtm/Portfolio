import { edgeId } from './connections';
import { NODE_META } from './nodeMeta';
import type {
  HandleId,
  NodeData,
  SampleRequest,
  Workflow,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeType,
} from './types';

type NodeSpec = [id: string, type: WorkflowNodeType, x: number, y: number, data: Partial<NodeData>];
type EdgeSpec = [source: string, handle: HandleId, target: string];

function build(nodes: NodeSpec[], edges: EdgeSpec[]): Pick<Workflow, 'nodes' | 'edges'> {
  return {
    nodes: nodes.map(([id, type, x, y, data]): WorkflowNode => ({
      id,
      type,
      position: { x, y },
      data: { ...NODE_META[type].defaults(), ...data },
    })),
    edges: edges.map(([source, sourceHandle, target]): WorkflowEdge => ({
      id: edgeId(source, sourceHandle, target),
      source,
      target,
      sourceHandle,
    })),
  };
}

export interface WorkflowTemplate {
  key: string;
  name: string;
  description: string;
  category: string;
  sampleRequest: SampleRequest;
  graph: () => Pick<Workflow, 'nodes' | 'edges'>;
}

export const TEMPLATES: WorkflowTemplate[] = [
  {
    key: 'purchase',
    name: 'Purchase approval',
    description:
      'Line manager reviews every purchase. Requests above ₹50,000 also need finance approval before procurement is notified.',
    category: 'Procurement',
    sampleRequest: {
      title: 'Ergonomic chairs for the design team',
      requester: 'Ananya Rao',
      amount: 85000,
      days: 0,
      category: 'Office equipment',
      priority: 'Normal',
    },
    graph: () =>
      build(
        [
          ['start', 'start', 0, 160, { label: 'Purchase request submitted' }],
          [
            'manager',
            'approval',
            260,
            160,
            { label: 'Manager review', approverRole: 'Line Manager', slaHours: 24 },
          ],
          [
            'revise',
            'task',
            260,
            400,
            {
              label: 'Revise request',
              assigneeRole: 'Requester',
              description: 'Update quotes or justification and resubmit.',
            },
          ],
          [
            'amount',
            'decision',
            540,
            160,
            {
              label: 'Amount above ₹50,000?',
              condition: { field: 'amount', operator: '>', value: '50000' },
            },
          ],
          [
            'finance',
            'approval',
            820,
            20,
            { label: 'Finance approval', approverRole: 'Finance Approver', slaHours: 48 },
          ],
          [
            'notify-proc',
            'notification',
            1100,
            160,
            {
              label: 'Notify procurement',
              recipientRole: 'Procurement Officer',
              message: 'Raise a purchase order for the approved request.',
            },
          ],
          ['approved', 'end', 1380, 160, { label: 'Purchase approved', outcome: 'approved' }],
          [
            'notify-reject',
            'notification',
            820,
            400,
            {
              label: 'Notify requester',
              recipientRole: 'Requester',
              message: 'Your purchase request was not approved.',
            },
          ],
          ['rejected', 'end', 1100, 400, { label: 'Request rejected', outcome: 'rejected' }],
        ],
        [
          ['start', 'next', 'manager'],
          ['manager', 'approve', 'amount'],
          ['manager', 'reject', 'notify-reject'],
          ['manager', 'return', 'revise'],
          ['revise', 'next', 'manager'],
          ['amount', 'true', 'finance'],
          ['amount', 'false', 'notify-proc'],
          ['finance', 'approve', 'notify-proc'],
          ['finance', 'reject', 'notify-reject'],
          ['finance', 'return', 'revise'],
          ['notify-proc', 'next', 'approved'],
          ['notify-reject', 'next', 'rejected'],
        ],
      ),
  },
  {
    key: 'leave',
    name: 'Leave approval',
    description: 'Manager approves leave. Requests longer than five days also go to HR.',
    category: 'People',
    sampleRequest: {
      title: 'Annual leave for a family function',
      requester: 'Karthik Menon',
      amount: 0,
      days: 7,
      category: 'Annual leave',
      priority: 'Normal',
    },
    graph: () =>
      build(
        [
          ['start', 'start', 0, 140, { label: 'Leave requested' }],
          [
            'manager',
            'approval',
            260,
            140,
            { label: 'Manager approval', approverRole: 'Line Manager', slaHours: 24 },
          ],
          [
            'long',
            'decision',
            540,
            140,
            {
              label: 'Longer than 5 days?',
              condition: { field: 'days', operator: '>', value: '5' },
            },
          ],
          [
            'hr',
            'approval',
            820,
            20,
            { label: 'HR review', approverRole: 'HR Partner', slaHours: 48 },
          ],
          [
            'notify',
            'notification',
            1100,
            140,
            {
              label: 'Notify employee',
              recipientRole: 'Requester',
              message: 'Your leave is approved.',
            },
          ],
          ['approved', 'end', 1380, 140, { label: 'Leave approved', outcome: 'approved' }],
          [
            'notify-reject',
            'notification',
            820,
            340,
            { label: 'Notify employee of decision', recipientRole: 'Requester' },
          ],
          ['rejected', 'end', 1100, 340, { label: 'Leave rejected', outcome: 'rejected' }],
        ],
        [
          ['start', 'next', 'manager'],
          ['manager', 'approve', 'long'],
          ['manager', 'reject', 'notify-reject'],
          ['long', 'true', 'hr'],
          ['long', 'false', 'notify'],
          ['hr', 'approve', 'notify'],
          ['hr', 'reject', 'notify-reject'],
          ['notify', 'next', 'approved'],
          ['notify-reject', 'next', 'rejected'],
        ],
      ),
  },
  {
    key: 'expense',
    name: 'Expense reimbursement',
    description:
      'Employees attach receipts, managers approve, and claims of ₹10,000 or more get a finance audit before payout.',
    category: 'Finance',
    sampleRequest: {
      title: 'Client visit travel to Mysuru',
      requester: 'Divya Shetty',
      amount: 6400,
      days: 2,
      category: 'Travel',
      priority: 'Normal',
    },
    graph: () =>
      build(
        [
          ['start', 'start', 0, 140, { label: 'Claim submitted' }],
          ['receipts', 'task', 240, 140, { label: 'Attach receipts', assigneeRole: 'Requester' }],
          [
            'manager',
            'approval',
            480,
            140,
            { label: 'Manager approval', approverRole: 'Line Manager' },
          ],
          [
            'audit-needed',
            'decision',
            740,
            140,
            {
              label: '₹10,000 or more?',
              condition: { field: 'amount', operator: '>=', value: '10000' },
            },
          ],
          [
            'audit',
            'approval',
            1000,
            20,
            { label: 'Finance audit', approverRole: 'Finance Approver' },
          ],
          [
            'payout',
            'task',
            1260,
            140,
            { label: 'Process payout', assigneeRole: 'Finance Approver' },
          ],
          ['paid', 'end', 1500, 140, { label: 'Reimbursed', outcome: 'approved' }],
          ['rejected', 'end', 1000, 340, { label: 'Claim rejected', outcome: 'rejected' }],
        ],
        [
          ['start', 'next', 'receipts'],
          ['receipts', 'next', 'manager'],
          ['manager', 'approve', 'audit-needed'],
          ['manager', 'reject', 'rejected'],
          ['manager', 'return', 'receipts'],
          ['audit-needed', 'true', 'audit'],
          ['audit-needed', 'false', 'payout'],
          ['audit', 'approve', 'payout'],
          ['audit', 'reject', 'rejected'],
          ['audit', 'return', 'receipts'],
          ['payout', 'next', 'paid'],
        ],
      ),
  },
  {
    key: 'document',
    name: 'Document approval',
    description: 'Legal reviews a contract, then the department head signs off.',
    category: 'Legal',
    sampleRequest: {
      title: 'Vendor NDA for a logistics partner',
      requester: 'Rohit Iyer',
      amount: 0,
      days: 0,
      category: 'Contract',
      priority: 'Normal',
    },
    graph: () =>
      build(
        [
          ['start', 'start', 0, 140, { label: 'Document uploaded' }],
          [
            'legal',
            'approval',
            260,
            140,
            { label: 'Legal review', approverRole: 'Legal Reviewer', slaHours: 72 },
          ],
          ['revise', 'task', 260, 360, { label: 'Revise document', assigneeRole: 'Requester' }],
          [
            'head',
            'approval',
            540,
            140,
            { label: 'Department head sign-off', approverRole: 'Department Head' },
          ],
          [
            'notify',
            'notification',
            820,
            140,
            {
              label: 'Notify stakeholders',
              recipientRole: 'Requester',
              message: 'The document is approved and ready to sign.',
            },
          ],
          ['approved', 'end', 1100, 140, { label: 'Document approved', outcome: 'approved' }],
          ['rejected', 'end', 820, 360, { label: 'Document rejected', outcome: 'rejected' }],
        ],
        [
          ['start', 'next', 'legal'],
          ['legal', 'approve', 'head'],
          ['legal', 'reject', 'rejected'],
          ['legal', 'return', 'revise'],
          ['revise', 'next', 'legal'],
          ['head', 'approve', 'notify'],
          ['head', 'reject', 'rejected'],
          ['notify', 'next', 'approved'],
        ],
      ),
  },
  {
    key: 'change',
    name: 'IT change request',
    description:
      'Emergency changes go to the department head; normal changes go to the change board. This draft still needs an approver role.',
    category: 'IT',
    sampleRequest: {
      title: 'Upgrade the payroll database',
      requester: 'Meera Kulkarni',
      amount: 0,
      days: 1,
      category: 'Infrastructure',
      priority: 'Normal',
    },
    graph: () =>
      build(
        [
          ['start', 'start', 0, 140, { label: 'Change requested' }],
          [
            'emergency',
            'decision',
            260,
            140,
            {
              label: 'Emergency change?',
              condition: { field: 'priority', operator: '==', value: 'Emergency' },
            },
          ],
          ['ecab', 'approval', 540, 20, { label: 'Emergency approval', approverRole: '' }],
          [
            'cab',
            'approval',
            540,
            260,
            { label: 'Change board review', approverRole: 'IT Change Board' },
          ],
          [
            'implement',
            'task',
            820,
            140,
            { label: 'Implement change', assigneeRole: 'IT Change Board' },
          ],
          ['done', 'end', 1080, 140, { label: 'Change completed', outcome: 'completed' }],
          ['rejected', 'end', 820, 380, { label: 'Change rejected', outcome: 'rejected' }],
        ],
        [
          ['start', 'next', 'emergency'],
          ['emergency', 'true', 'ecab'],
          ['emergency', 'false', 'cab'],
          ['ecab', 'approve', 'implement'],
          ['ecab', 'reject', 'rejected'],
          ['cab', 'approve', 'implement'],
          ['cab', 'reject', 'rejected'],
          ['implement', 'next', 'done'],
        ],
      ),
  },
];

export const BLANK_REQUEST: SampleRequest = {
  title: 'Sample request',
  requester: 'Sample Employee',
  amount: 0,
  days: 0,
  category: 'General',
  priority: 'Normal',
};

export function blankGraph(): Pick<Workflow, 'nodes' | 'edges'> {
  return build(
    [
      ['start', 'start', 0, 120, {}],
      ['end', 'end', 360, 120, {}],
    ],
    [],
  );
}
