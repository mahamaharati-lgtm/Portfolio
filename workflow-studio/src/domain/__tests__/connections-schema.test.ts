import { describe, expect, it } from 'vitest';
import { checkConnection } from '../connections';
import { toWorkflowFile } from '../exportFile';
import { parseWorkflowFile } from '../schema';
import { seedWorkflows } from '../../store/workflows';
import { TEMPLATES } from '../templates';

const { nodes, edges } = TEMPLATES[0]!.graph();

describe('checkConnection', () => {
  it('allows a free output to connect to a step that accepts input', () => {
    const withoutReturn = edges.filter(
      (e) => !(e.source === 'manager' && e.sourceHandle === 'return'),
    );
    expect(checkConnection(nodes, withoutReturn, 'manager', 'return', 'start').ok).toBe(false);
    expect(checkConnection(nodes, withoutReturn, 'manager', 'return', 'revise')).toEqual({
      ok: true,
    });
  });
  it('rejects self, duplicate outputs, unknown outputs and connections into Start', () => {
    expect(checkConnection(nodes, [], 'manager', 'approve', 'manager').ok).toBe(false);
    expect(checkConnection(nodes, edges, 'manager', 'approve', 'finance').ok).toBe(false);
    expect(checkConnection(nodes, [], 'start', 'approve', 'manager').ok).toBe(false);
    expect(checkConnection(nodes, [], 'revise', 'next', 'start').ok).toBe(false);
    expect(checkConnection(nodes, [], 'approved', 'next', 'start').ok).toBe(false);
  });
});

describe('JSON import/export', () => {
  it('round-trips an exported workflow', () => {
    const wf = seedWorkflows()[0]!;
    const result = parseWorkflowFile(JSON.stringify(toWorkflowFile(wf)));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe(wf.name);
      expect(result.data.nodes).toEqual(wf.nodes);
      expect(result.data.edges).toEqual(wf.edges);
    }
  });
  it('rejects invalid JSON and invalid structures with readable errors', () => {
    expect(parseWorkflowFile('{nope')).toEqual({
      ok: false,
      errors: ['The file is not valid JSON.'],
    });
    const bad = parseWorkflowFile(
      JSON.stringify({
        format: 'workflow-studio',
        version: 1,
        workflow: { name: '', nodes: [{ id: 'a', type: 'robot' }], edges: [] },
      }),
    );
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.join(' ')).toMatch(/workflow\.name|workflow\.nodes/);
  });
  it('rejects duplicate ids', () => {
    const file = toWorkflowFile(seedWorkflows()[0]!);
    file.workflow.nodes.push({ ...file.workflow.nodes[0]! });
    const r = parseWorkflowFile(JSON.stringify(file));
    expect(r).toEqual({ ok: false, errors: ['Duplicate step id “start”.'] });
  });
});
