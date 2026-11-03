import { beforeEach, describe, expect, it } from 'vitest';
import { useEditor } from '../editor';
import { STORAGE_KEY, useWorkflows } from '../workflows';

beforeEach(() => {
  localStorage.clear();
  useWorkflows.getState().resetDemoData();
});

describe('workflows store', () => {
  it('seeds five example workflows and persists changes to localStorage', () => {
    const s = useWorkflows.getState();
    expect(s.workflows).toHaveLength(5);
    const id = s.createWorkflow({ name: '  Vendor onboarding  ', templateKey: 'document' });
    const created = useWorkflows.getState().workflows.find((w) => w.id === id)!;
    expect(created).toMatchObject({
      name: 'Vendor onboarding',
      status: 'draft',
      publishedVersion: 0,
    });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).state.workflows).toHaveLength(6);
  });

  it('blocks publishing invalid workflows and versions valid ones', () => {
    const s = useWorkflows.getState();
    const bad = s.publishWorkflow('wf-change');
    expect(bad.ok).toBe(false);
    const good = s.publishWorkflow('wf-purchase');
    expect(good).toEqual({ ok: true, version: 4 });
  });

  it('turns a published workflow back into a draft when its graph changes', () => {
    const s = useWorkflows.getState();
    const wf = s.workflows.find((w) => w.id === 'wf-leave')!;
    s.saveWorkflow(wf.id, {
      name: wf.name,
      nodes: wf.nodes.slice(1),
      edges: wf.edges,
      sampleRequest: wf.sampleRequest,
    });
    expect(useWorkflows.getState().workflows.find((w) => w.id === 'wf-leave')).toMatchObject({
      status: 'draft',
      publishedVersion: 1,
    });
  });

  it('duplicates and deletes workflows', () => {
    const s = useWorkflows.getState();
    const copyId = s.duplicateWorkflow('wf-purchase')!;
    expect(useWorkflows.getState().workflows.find((w) => w.id === copyId)!.name).toBe(
      'Purchase approval (copy)',
    );
    s.deleteWorkflow(copyId);
    expect(useWorkflows.getState().workflows.some((w) => w.id === copyId)).toBe(false);
  });
});

describe('editor store', () => {
  const load = () =>
    useEditor.getState().load(useWorkflows.getState().workflows.find((w) => w.id === 'wf-leave')!);

  it('supports undo and redo of node edits', () => {
    load();
    const e = useEditor.getState();
    const id = e.addNode('task');
    expect(useEditor.getState().draft.nodes.some((n) => n.id === id)).toBe(true);
    e.undo();
    expect(useEditor.getState().draft.nodes.some((n) => n.id === id)).toBe(false);
    e.redo();
    expect(useEditor.getState().draft.nodes.some((n) => n.id === id)).toBe(true);
  });

  it('coalesces rapid typing into one undo step', () => {
    load();
    const e = useEditor.getState();
    e.updateNodeData('manager', { label: 'M' });
    e.updateNodeData('manager', { label: 'Ma' });
    e.updateNodeData('manager', { label: 'Man' });
    expect(useEditor.getState().past).toHaveLength(1);
    e.undo();
    expect(useEditor.getState().draft.nodes.find((n) => n.id === 'manager')!.data.label).toBe(
      'Manager approval',
    );
  });

  it('deletes a node together with its connections', () => {
    load();
    useEditor.getState().deleteElements(['long'], []);
    const { draft } = useEditor.getState();
    expect(draft.edges.some((e) => e.source === 'long' || e.target === 'long')).toBe(false);
  });

  it('rewires outputs through setOutput and rejects invalid targets', () => {
    load();
    const e = useEditor.getState();
    expect(e.setOutput('long', 'true', 'start').ok).toBe(false);
    expect(e.setOutput('long', 'true', 'notify').ok).toBe(true);
    expect(
      useEditor
        .getState()
        .draft.edges.find((x) => x.source === 'long' && x.sourceHandle === 'true')!.target,
    ).toBe('notify');
    expect(e.setOutput('long', 'true', null).ok).toBe(true);
    expect(
      useEditor
        .getState()
        .draft.edges.some((x) => x.source === 'long' && x.sourceHandle === 'true'),
    ).toBe(false);
  });

  it('tracks dirty state against the saved version', async () => {
    load();
    const { selectIsDirty } = await import('../editor');
    expect(selectIsDirty(useEditor.getState())).toBe(false);
    useEditor.getState().rename('Leave approval v2');
    expect(selectIsDirty(useEditor.getState())).toBe(true);
    useEditor.getState().markSaved();
    expect(selectIsDirty(useEditor.getState())).toBe(false);
  });
});
