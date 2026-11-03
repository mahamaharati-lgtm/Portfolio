import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { uid } from '../lib/id';
import type { WorkflowFile } from '../domain/schema';
import { BLANK_REQUEST, blankGraph, TEMPLATES } from '../domain/templates';
import { hasErrors, validateWorkflow } from '../domain/validation';
import type {
  SampleRequest,
  SimulationRun,
  ValidationIssue,
  Workflow,
  WorkflowEdge,
  WorkflowNode,
} from '../domain/types';

export const STORAGE_KEY = 'ws-data';
const MAX_RUNS_PER_WORKFLOW = 10;

export interface WorkflowContent {
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  sampleRequest: SampleRequest;
}

export type PublishResult =
  { ok: true; version: number } | { ok: false; issues: ValidationIssue[] };

interface WorkflowsState {
  workflows: Workflow[];
  runs: SimulationRun[];
  storageError: string | null;
  createWorkflow: (input: { name: string; templateKey?: string; category?: string }) => string;
  renameWorkflow: (id: string, name: string) => void;
  saveWorkflow: (id: string, content: WorkflowContent) => void;
  publishWorkflow: (id: string) => PublishResult;
  duplicateWorkflow: (id: string) => string | null;
  deleteWorkflow: (id: string) => void;
  importWorkflow: (data: WorkflowFile['workflow']) => string;
  recordRun: (run: SimulationRun) => void;
  resetDemoData: () => void;
  clearStorageError: () => void;
}

function contentEqual(a: Pick<Workflow, 'nodes' | 'edges'>, b: Pick<Workflow, 'nodes' | 'edges'>) {
  return JSON.stringify([a.nodes, a.edges]) === JSON.stringify([b.nodes, b.edges]);
}

export function seedWorkflows(now = new Date()): Workflow[] {
  return TEMPLATES.map((t, index) => {
    const created = new Date(now.getTime() - (index + 1) * 86_400_000 * 3).toISOString();
    const updated = new Date(now.getTime() - (index + 1) * 3_600_000 * 5).toISOString();
    const published = t.key === 'purchase' || t.key === 'leave';
    return {
      id: `wf-${t.key}`,
      name: t.name,
      description: t.description,
      category: t.category,
      status: published ? 'published' : 'draft',
      publishedVersion: t.key === 'purchase' ? 3 : published ? 1 : 0,
      publishedAt: published ? updated : undefined,
      createdAt: created,
      updatedAt: updated,
      sampleRequest: t.sampleRequest,
      ...t.graph(),
    } satisfies Workflow;
  });
}

// Hydration runs while the store is being created, so early errors are queued.
let pendingStorageError: string | null = null;
let reportStorageError: (message: string) => void = (message) => {
  pendingStorageError = message;
};

/** localStorage wrapper that never throws (private mode, quota, blocked storage). */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      reportStorageError(
        'Browser storage is unavailable. Changes will be lost when you close this tab.',
      );
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      reportStorageError(
        'Your latest changes could not be saved to browser storage (it may be full or blocked).',
      );
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

export const useWorkflows = create<WorkflowsState>()(
  persist(
    (set, get) => ({
      workflows: seedWorkflows(),
      runs: [],
      storageError: null,

      createWorkflow: ({ name, templateKey }) => {
        const template = TEMPLATES.find((t) => t.key === templateKey);
        const now = new Date().toISOString();
        const workflow: Workflow = {
          id: uid('wf'),
          name: name.trim(),
          description: template?.description ?? '',
          category: template?.category ?? 'General',
          status: 'draft',
          publishedVersion: 0,
          createdAt: now,
          updatedAt: now,
          sampleRequest: template?.sampleRequest ?? BLANK_REQUEST,
          ...(template ? template.graph() : blankGraph()),
        };
        set((s) => ({ workflows: [workflow, ...s.workflows] }));
        return workflow.id;
      },

      renameWorkflow: (id, name) =>
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === id ? { ...w, name: name.trim(), updatedAt: new Date().toISOString() } : w,
          ),
        })),

      saveWorkflow: (id, content) =>
        set((s) => ({
          workflows: s.workflows.map((w) => {
            if (w.id !== id) return w;
            const changed = !contentEqual(w, content);
            return {
              ...w,
              ...content,
              name: content.name.trim() || w.name,
              // Editing a published workflow creates a new draft revision.
              status: changed ? 'draft' : w.status,
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      publishWorkflow: (id) => {
        const workflow = get().workflows.find((w) => w.id === id);
        if (!workflow)
          return {
            ok: false,
            issues: [{ id: 'missing', severity: 'error', message: 'Workflow not found.' }],
          };
        const issues = validateWorkflow(workflow);
        if (hasErrors(issues)) return { ok: false, issues };
        const version = workflow.publishedVersion + 1;
        const now = new Date().toISOString();
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: 'published',
                  publishedVersion: version,
                  publishedAt: now,
                  updatedAt: now,
                }
              : w,
          ),
        }));
        return { ok: true, version };
      },

      duplicateWorkflow: (id) => {
        const source = get().workflows.find((w) => w.id === id);
        if (!source) return null;
        const now = new Date().toISOString();
        const copy: Workflow = {
          ...structuredClone(source),
          id: uid('wf'),
          name: `${source.name} (copy)`.slice(0, 80),
          status: 'draft',
          publishedVersion: 0,
          publishedAt: undefined,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ workflows: [copy, ...s.workflows] }));
        return copy.id;
      },

      deleteWorkflow: (id) =>
        set((s) => ({
          workflows: s.workflows.filter((w) => w.id !== id),
          runs: s.runs.filter((r) => r.workflowId !== id),
        })),

      importWorkflow: (data) => {
        const now = new Date().toISOString();
        const workflow: Workflow = {
          ...data,
          id: uid('wf'),
          status: 'draft',
          publishedVersion: 0,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ workflows: [workflow, ...s.workflows] }));
        return workflow.id;
      },

      recordRun: (run) =>
        set((s) => {
          const mine = [run, ...s.runs.filter((r) => r.workflowId === run.workflowId)].slice(
            0,
            MAX_RUNS_PER_WORKFLOW,
          );
          return { runs: [...mine, ...s.runs.filter((r) => r.workflowId !== run.workflowId)] };
        }),

      resetDemoData: () => set({ workflows: seedWorkflows(), runs: [], storageError: null }),
      clearStorageError: () => set({ storageError: null }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ workflows: s.workflows, runs: s.runs }),
      onRehydrateStorage: () => (_state, error) => {
        if (error)
          reportStorageError('Saved data was unreadable, so the sample workflows were restored.');
      },
      merge: (persisted, current) => {
        const p = persisted as Partial<WorkflowsState> | undefined;
        if (!p) return current;
        if (!Array.isArray(p.workflows) || !Array.isArray(p.runs)) {
          return {
            ...current,
            storageError: 'Saved data was unreadable, so the sample workflows were restored.',
          };
        }
        return { ...current, workflows: p.workflows, runs: p.runs };
      },
    },
  ),
);

if (pendingStorageError) useWorkflows.setState({ storageError: pendingStorageError });

reportStorageError = (message) => {
  if (useWorkflows.getState().storageError !== message)
    useWorkflows.setState({ storageError: message });
};
