import { describe, expect, it } from 'vitest';
import { blankGraph, TEMPLATES } from '../templates';
import { hasErrors, validateWorkflow } from '../validation';
import type { Workflow } from '../types';

const template = (key: string) => {
  const t = TEMPLATES.find((x) => x.key === key)!;
  return { name: t.name, ...t.graph() };
};
const messages = (wf: Pick<Workflow, 'name' | 'nodes' | 'edges'>) =>
  validateWorkflow(wf).map((i) => i.message);

describe('validateWorkflow', () => {
  it.each(['purchase', 'leave', 'expense', 'document'])('accepts the %s template', (key) => {
    expect(hasErrors(validateWorkflow(template(key)))).toBe(false);
  });

  it('reports the missing approver role in the IT change request draft', () => {
    const issues = validateWorkflow(template('change'));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ severity: 'error', nodeId: 'ecab' });
    expect(issues[0]!.message).toMatch(/approver role/);
  });

  it('requires exactly one start node', () => {
    const wf = template('purchase');
    const noStart = {
      ...wf,
      nodes: wf.nodes.filter((n) => n.type !== 'start'),
      edges: wf.edges.filter((e) => e.source !== 'start'),
    };
    expect(messages(noStart)).toContain('Add exactly one Start step.');

    const twoStarts = { ...wf, nodes: [...wf.nodes, { ...wf.nodes[0]!, id: 'start-2' }] };
    expect(messages(twoStarts).some((m) => m.startsWith('Only one Start step'))).toBe(true);
  });

  it('requires a reachable end node', () => {
    const wf = template('purchase');
    const noEnds = {
      ...wf,
      nodes: wf.nodes.filter((n) => n.type !== 'end'),
      edges: wf.edges.filter((e) => !['approved', 'rejected'].includes(e.target)),
    };
    expect(messages(noEnds)).toContain('Add at least one End step.');
  });

  it('flags empty workflows and blank graphs', () => {
    expect(messages({ name: 'x', nodes: [], edges: [] })[0]).toMatch(/empty/);
    const blank = { name: 'Blank', ...blankGraph() };
    expect(messages(blank)).toContain('“Request submitted” is missing its connection.');
    expect(messages(blank)).toContain('“Workflow complete” cannot be reached from the Start step.');
  });

  it('reports unreachable nodes', () => {
    const wf = template('leave');
    wf.nodes.push({
      id: 'orphan',
      type: 'task',
      position: { x: 0, y: 0 },
      data: { label: 'Orphan task', assigneeRole: 'HR Partner' },
    });
    expect(messages(wf)).toContain('“Orphan task” cannot be reached from the Start step.');
  });

  it('requires both decision branches and a valid numeric condition', () => {
    const wf = template('purchase');
    wf.edges = wf.edges.filter((e) => !(e.source === 'amount' && e.sourceHandle === 'false'));
    const decision = wf.nodes.find((n) => n.id === 'amount')!;
    decision.data.condition = { field: 'amount', operator: '>', value: 'fifty' };
    const m = messages(wf);
    expect(m).toContain('“Amount above ₹50,000?” is missing its “No” connection.');
    expect(m.some((x) => x.includes('not a number'))).toBe(true);
  });

  it('rejects ordering operators on text fields', () => {
    const wf = template('change');
    wf.nodes.find((n) => n.id === 'emergency')!.data.condition = {
      field: 'priority',
      operator: '>',
      value: 'High',
    };
    expect(messages(wf).some((m) => m.includes('can only use “==” or “!=”'))).toBe(true);
  });

  it('requires approve and reject branches on approvals', () => {
    const wf = template('document');
    wf.edges = wf.edges.filter((e) => !(e.source === 'head' && e.sourceHandle === 'reject'));
    expect(messages(wf)).toContain(
      '“Department head sign-off” is missing its “Rejected” connection.',
    );
  });

  it('rejects invalid connections', () => {
    const wf = template('leave');
    wf.edges.push({ id: 'bad-1', source: 'manager', target: 'manager', sourceHandle: 'return' });
    wf.edges.push({ id: 'bad-2', source: 'notify', target: 'start', sourceHandle: 'next' });
    wf.edges.push({ id: 'bad-3', source: 'long', target: 'ghost', sourceHandle: 'true' });
    const m = messages(wf);
    expect(m).toContain('“Manager approval” connects to itself.');
    expect(m).toContain('The Start step cannot have incoming connections.');
    expect(m).toContain('A connection points to a step that no longer exists.');
  });

  it('allows loops only through a Returned branch', () => {
    const ok = template('purchase'); // manager -> return -> revise -> manager
    expect(hasErrors(validateWorkflow(ok))).toBe(false);

    const wf = template('expense');
    // payout -> receipts would create a forward loop
    wf.edges = wf.edges.filter((e) => e.source !== 'payout');
    wf.edges.push({ id: 'loop', source: 'payout', target: 'receipts', sourceHandle: 'next' });
    expect(messages(wf).some((m) => m.startsWith('Steps form a loop'))).toBe(true);
  });

  it('warns when both decision branches lead to the same step', () => {
    const wf = template('leave');
    wf.edges = wf.edges.map((e) =>
      e.source === 'long' && e.sourceHandle === 'true' ? { ...e, target: 'notify' } : e,
    );
    const issues = validateWorkflow(wf);
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('same step'))).toBe(
      true,
    );
  });
});
