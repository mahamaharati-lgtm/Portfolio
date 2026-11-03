import { describe, expect, it } from 'vitest';
import { act, availableActions, evaluateCondition, startSimulation } from '../simulation';
import { TEMPLATES } from '../templates';
import type { SampleRequest } from '../types';

const clock = () => '2026-11-03T10:00:00.000Z';
const purchase = () => {
  const t = TEMPLATES.find((x) => x.key === 'purchase')!;
  return { graph: { id: 'wf-purchase', ...t.graph() }, request: t.sampleRequest };
};

describe('evaluateCondition', () => {
  const req: SampleRequest = {
    title: 't',
    requester: 'r',
    amount: 85000,
    days: 7,
    category: 'Travel',
    priority: 'Emergency',
  };
  it('compares numbers', () => {
    expect(evaluateCondition({ field: 'amount', operator: '>', value: '50000' }, req)).toBe(true);
    expect(evaluateCondition({ field: 'amount', operator: '<=', value: '50000' }, req)).toBe(false);
    expect(evaluateCondition({ field: 'days', operator: '==', value: '7' }, req)).toBe(true);
    expect(evaluateCondition({ field: 'days', operator: '!=', value: '7' }, req)).toBe(false);
  });
  it('compares text case-insensitively', () => {
    expect(evaluateCondition({ field: 'priority', operator: '==', value: 'emergency' }, req)).toBe(
      true,
    );
    expect(evaluateCondition({ field: 'category', operator: '!=', value: 'travel' }, req)).toBe(
      false,
    );
  });
});

describe('purchase approval simulation (₹85,000)', () => {
  it('routes through finance and finishes approved', () => {
    const { graph, request } = purchase();
    let s = startSimulation(graph, request, clock);
    expect(s.status).toBe('awaiting-action');
    expect(s.currentNodeId).toBe('manager');
    expect(availableActions(graph, s)).toEqual(['approve', 'reject', 'return']);

    s = act(graph, s, 'approve', 'Within team budget', clock);
    expect(s.currentNodeId).toBe('finance');
    const decision = s.history.find((h) => h.nodeId === 'amount')!;
    expect(decision.action).toBe('Evaluated condition → Yes');
    expect(decision.detail).toContain('₹85,000');

    s = act(graph, s, 'approve', '', clock);
    expect(s.status).toBe('completed');
    expect(s.outcome).toBe('approved');
    expect(s.history.map((h) => h.action)).toEqual([
      'Submitted request',
      'Approved',
      'Evaluated condition → Yes',
      'Approved',
      'Notified Procurement Officer',
      'Workflow finished: approved',
    ]);
    expect(s.history[1]).toMatchObject({ actor: 'Line Manager', detail: 'Within team budget' });
  });

  it('skips finance for requests of ₹50,000 or less', () => {
    const { graph, request } = purchase();
    let s = startSimulation(graph, { ...request, amount: 50000 }, clock);
    s = act(graph, s, 'approve', '', clock);
    expect(s.status).toBe('completed');
    expect(s.history.some((h) => h.nodeId === 'finance')).toBe(false);
    expect(s.history.find((h) => h.nodeId === 'amount')!.action).toBe('Evaluated condition → No');
  });

  it('supports return for changes and rejection', () => {
    const { graph, request } = purchase();
    let s = startSimulation(graph, request, clock);
    s = act(graph, s, 'return', 'Add a second quote', clock);
    expect(s.currentNodeId).toBe('revise');
    expect(availableActions(graph, s)).toEqual(['complete']);
    s = act(graph, s, 'complete', '', clock);
    expect(s.currentNodeId).toBe('manager');
    s = act(graph, s, 'reject', 'Not in budget', clock);
    expect(s.status).toBe('completed');
    expect(s.outcome).toBe('rejected');
    expect(s.history.filter((h) => h.nodeId === 'manager')).toHaveLength(2);
  });

  it('refuses unavailable actions and reports broken graphs', () => {
    const { graph, request } = purchase();
    const s = startSimulation(graph, request, clock);
    expect(act(graph, s, 'complete', '', clock).status).toBe('error');

    const broken = { ...graph, edges: graph.edges.filter((e) => !(e.source === 'start')) };
    const b = startSimulation(broken, request, clock);
    expect(b.status).toBe('error');
    expect(b.error).toMatch(/no “Next” connection/);
  });

  it('hides the return action when no Returned branch exists', () => {
    const t = TEMPLATES.find((x) => x.key === 'leave')!;
    const graph = { id: 'wf-leave', ...t.graph() };
    const s = startSimulation(graph, t.sampleRequest, clock);
    expect(availableActions(graph, s)).toEqual(['approve', 'reject']);
  });
});
