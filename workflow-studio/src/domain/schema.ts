import { z } from 'zod';
import { CONDITION_FIELDS, END_OUTCOMES, HANDLES, NODE_TYPES, OPERATORS, ROLES } from './types';

const role = z.union([z.enum(ROLES), z.literal('')]);

const nodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(NODE_TYPES),
  position: z.object({ x: z.number().finite(), y: z.number().finite() }),
  data: z.object({
    label: z.string().max(80),
    description: z.string().max(500).optional(),
    assigneeRole: role.optional(),
    approverRole: role.optional(),
    slaHours: z.number().int().min(0).max(720).optional(),
    condition: z
      .object({
        field: z.enum(CONDITION_FIELDS),
        operator: z.enum(OPERATORS),
        value: z.string().max(80),
      })
      .optional(),
    recipientRole: role.optional(),
    message: z.string().max(500).optional(),
    outcome: z.enum(END_OUTCOMES).optional(),
  }),
});

const edgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.enum(HANDLES),
});

const requestSchema = z.object({
  title: z.string().max(120),
  requester: z.string().max(80),
  amount: z.number().finite().min(0),
  days: z.number().finite().min(0),
  category: z.string().max(80),
  priority: z.string().max(40),
});

export const workflowFileSchema = z.object({
  format: z.literal('workflow-studio'),
  version: z.literal(1),
  workflow: z.object({
    name: z.string().trim().min(1, 'Workflow name is required').max(80),
    description: z.string().max(500).default(''),
    category: z.string().max(60).default('General'),
    nodes: z.array(nodeSchema).max(200),
    edges: z.array(edgeSchema).max(400),
    sampleRequest: requestSchema,
  }),
});

export type WorkflowFile = z.infer<typeof workflowFileSchema>;

export type ParseResult =
  { ok: true; data: WorkflowFile['workflow'] } | { ok: false; errors: string[] };

export function parseWorkflowFile(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, errors: ['The file is not valid JSON.'] };
  }
  const result = workflowFileSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.slice(0, 8).map((issue) => {
        const path = issue.path.join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
      }),
    };
  }
  const { nodes, edges } = result.data.workflow;
  const ids = new Set<string>();
  for (const n of nodes) {
    if (ids.has(n.id)) return { ok: false, errors: [`Duplicate step id “${n.id}”.`] };
    ids.add(n.id);
  }
  const edgeIds = new Set<string>();
  for (const e of edges) {
    if (edgeIds.has(e.id)) return { ok: false, errors: [`Duplicate connection id “${e.id}”.`] };
    edgeIds.add(e.id);
  }
  return { ok: true, data: result.data.workflow };
}
