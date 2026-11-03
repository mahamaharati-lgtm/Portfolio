import { create } from 'zustand';
import { checkConnection, edgeId, type ConnectionCheck } from '../domain/connections';
import { NODE_META } from '../domain/nodeMeta';
import type {
  HandleId,
  NodeData,
  SampleRequest,
  SimulationState,
  Workflow,
  WorkflowNodeType,
} from '../domain/types';
import { uid } from '../lib/id';
import type { WorkflowContent } from './workflows';

const HISTORY_LIMIT = 100;
const COALESCE_MS = 800;

export type PanelTab = 'properties' | 'issues' | 'simulate';

interface EditorState {
  workflowId: string | null;
  draft: WorkflowContent;
  savedJson: string;
  past: WorkflowContent[];
  future: WorkflowContent[];
  lastCoalesce: { key: string; at: number } | null;
  selectedNodeId: string | null;
  panel: PanelTab;
  simulation: SimulationState | null;

  load: (workflow: Workflow) => void;
  markSaved: () => void;
  select: (nodeId: string | null) => void;
  setPanel: (tab: PanelTab) => void;
  setSimulation: (sim: SimulationState | null) => void;

  addNode: (type: WorkflowNodeType, position?: { x: number; y: number }) => string;
  deleteElements: (nodeIds: string[], edgeIds: string[]) => void;
  moveNode: (id: string, position: { x: number; y: number }, opts?: { live?: boolean }) => void;
  beginMove: (id: string) => void;
  updateNodeData: (id: string, patch: Partial<NodeData>) => void;
  connect: (source: string, handle: HandleId, target: string) => ConnectionCheck;
  setOutput: (source: string, handle: HandleId, target: string | null) => ConnectionCheck;
  rename: (name: string) => void;
  setSampleRequest: (request: SampleRequest) => void;
  undo: () => void;
  redo: () => void;
  revert: (workflow: Workflow) => void;
}

const emptyDraft: WorkflowContent = {
  name: '',
  nodes: [],
  edges: [],
  sampleRequest: { title: '', requester: '', amount: 0, days: 0, category: '', priority: '' },
};

export function contentOf(w: Workflow): WorkflowContent {
  return structuredClone({
    name: w.name,
    nodes: w.nodes,
    edges: w.edges,
    sampleRequest: w.sampleRequest,
  });
}

export const useEditor = create<EditorState>()((set, get) => {
  /** Applies a change and records the previous draft for undo. */
  const commit = (recipe: (draft: WorkflowContent) => WorkflowContent, coalesceKey?: string) => {
    const { draft, past, lastCoalesce } = get();
    const now = Date.now();
    const coalesce =
      coalesceKey !== undefined &&
      lastCoalesce?.key === coalesceKey &&
      now - lastCoalesce.at < COALESCE_MS;
    const next = recipe(draft);
    set({
      draft: next,
      past: coalesce ? past : [...past, draft].slice(-HISTORY_LIMIT),
      future: [],
      lastCoalesce: coalesceKey ? { key: coalesceKey, at: now } : null,
      // Any edit invalidates a running simulation.
      simulation: null,
    });
  };

  return {
    workflowId: null,
    draft: emptyDraft,
    savedJson: '',
    past: [],
    future: [],
    lastCoalesce: null,
    selectedNodeId: null,
    panel: 'issues',
    simulation: null,

    load: (workflow) => {
      const draft = contentOf(workflow);
      set({
        workflowId: workflow.id,
        draft,
        savedJson: JSON.stringify(draft),
        past: [],
        future: [],
        lastCoalesce: null,
        selectedNodeId: null,
        panel: 'issues',
        simulation: null,
      });
    },
    markSaved: () => set({ savedJson: JSON.stringify(get().draft) }),
    select: (selectedNodeId) =>
      set((s) => ({ selectedNodeId, panel: selectedNodeId ? 'properties' : s.panel })),
    setPanel: (panel) => set({ panel }),
    setSimulation: (simulation) => set({ simulation }),

    addNode: (type, position) => {
      const id = uid(type);
      commit((d) => {
        const last = d.nodes[d.nodes.length - 1];
        const pos = position ?? {
          x: (last?.position.x ?? 0) + 60,
          y: (last?.position.y ?? 0) + 80,
        };
        return {
          ...d,
          nodes: [...d.nodes, { id, type, position: pos, data: NODE_META[type].defaults() }],
        };
      });
      set({ selectedNodeId: id, panel: 'properties' });
      return id;
    },

    deleteElements: (nodeIds, edgeIds) => {
      if (nodeIds.length === 0 && edgeIds.length === 0) return;
      const nodeSet = new Set(nodeIds);
      const edgeSet = new Set(edgeIds);
      commit((d) => ({
        ...d,
        nodes: d.nodes.filter((n) => !nodeSet.has(n.id)),
        edges: d.edges.filter(
          (e) => !edgeSet.has(e.id) && !nodeSet.has(e.source) && !nodeSet.has(e.target),
        ),
      }));
      const selected = get().selectedNodeId;
      if (selected && nodeSet.has(selected)) set({ selectedNodeId: null, panel: 'issues' });
    },

    beginMove: (id) => {
      // Snapshot once at the start of a drag so the whole drag is one undo step.
      commit((d) => d, `move-${id}`);
    },

    moveNode: (id, position, opts) => {
      const apply = (d: WorkflowContent) => ({
        ...d,
        nodes: d.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
      });
      if (opts?.live) set((s) => ({ draft: apply(s.draft) }));
      else commit(apply, `move-${id}`);
    },

    updateNodeData: (id, patch) => {
      commit(
        (d) => ({
          ...d,
          nodes: d.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
        }),
        `data-${id}-${Object.keys(patch).join(',')}`,
      );
    },

    connect: (source, handle, target) => {
      const { draft } = get();
      const check = checkConnection(draft.nodes, draft.edges, source, handle, target);
      if (check.ok) {
        commit((d) => ({
          ...d,
          edges: [
            ...d.edges,
            { id: edgeId(source, handle, target), source, target, sourceHandle: handle },
          ],
        }));
      }
      return check;
    },

    setOutput: (source, handle, target) => {
      const { draft } = get();
      const remaining = draft.edges.filter(
        (e) => !(e.source === source && e.sourceHandle === handle),
      );
      if (target === null) {
        if (remaining.length !== draft.edges.length) commit((d) => ({ ...d, edges: remaining }));
        return { ok: true };
      }
      const check = checkConnection(draft.nodes, remaining, source, handle, target);
      if (check.ok) {
        commit((d) => ({
          ...d,
          edges: [
            ...remaining,
            { id: edgeId(source, handle, target), source, target, sourceHandle: handle },
          ],
        }));
      }
      return check;
    },

    rename: (name) => commit((d) => ({ ...d, name })),
    setSampleRequest: (sampleRequest) => commit((d) => ({ ...d, sampleRequest }), 'sample-request'),

    undo: () => {
      const { past, draft, future } = get();
      const previous = past[past.length - 1];
      if (!previous) return;
      set({
        draft: previous,
        past: past.slice(0, -1),
        future: [draft, ...future],
        lastCoalesce: null,
        simulation: null,
        selectedNodeId: previous.nodes.some((n) => n.id === get().selectedNodeId)
          ? get().selectedNodeId
          : null,
      });
    },
    redo: () => {
      const { past, draft, future } = get();
      const next = future[0];
      if (!next) return;
      set({
        draft: next,
        past: [...past, draft],
        future: future.slice(1),
        lastCoalesce: null,
        simulation: null,
        selectedNodeId: next.nodes.some((n) => n.id === get().selectedNodeId)
          ? get().selectedNodeId
          : null,
      });
    },
    revert: (workflow) => {
      const saved = contentOf(workflow);
      commit(() => saved);
      set({ savedJson: JSON.stringify(saved), selectedNodeId: null });
    },
  };
});

export const selectIsDirty = (s: EditorState) => JSON.stringify(s.draft) !== s.savedJson;
