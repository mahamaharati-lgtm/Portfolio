import { ReactFlowProvider } from '@xyflow/react';
import {
  ArrowLeft,
  Download,
  LayoutList,
  Network,
  Pencil,
  Redo2,
  Rocket,
  RotateCcw,
  Save,
  Undo2,
} from 'lucide-react';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Link, useBlocker, useParams } from 'react-router';
import { IssuesPanel } from '../components/editor/IssuesPanel';
import { Palette } from '../components/editor/Palette';
import { PropertiesPanel } from '../components/editor/PropertiesPanel';
import { SimulationPanel } from '../components/editor/SimulationPanel';
import { StructuredEditor } from '../components/editor/StructuredEditor';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Tabs } from '../components/ui/Tabs';
import { tabPanelProps } from '../lib/tabs';
import { RenameDialog } from '../components/workflows/RenameDialog';
import { NODE_META } from '../domain/nodeMeta';
import { toWorkflowFile } from '../domain/exportFile';
import type { WorkflowNode, WorkflowNodeType } from '../domain/types';
import { validateWorkflow } from '../domain/validation';
import { canvasBridge } from '../lib/canvasBridge';
import { downloadText, slugify } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { useMediaQuery } from '../lib/useMediaQuery';
import { selectIsDirty, useEditor, type PanelTab } from '../store/editor';
import { toast } from '../store/toast';
import { useWorkflows } from '../store/workflows';
import { NotFoundPage } from './NotFoundPage';

const Canvas = lazy(() => import('../components/editor/Canvas'));

type View = 'canvas' | 'list';

function CanvasFallback() {
  return (
    <div
      role="status"
      className="grid h-full min-h-[420px] place-items-center bg-[var(--canvas-bg)] text-sm text-muted"
    >
      <span className="flex items-center gap-2">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-accent"
          aria-hidden="true"
        />
        Loading canvas…
      </span>
    </div>
  );
}

export default function EditorPage() {
  const { id = '' } = useParams();
  const workflow = useWorkflows((s) => s.workflows.find((w) => w.id === id));
  const { saveWorkflow, publishWorkflow } = useWorkflows.getState();
  const editor = useEditor();
  const dirty = useEditor(selectIsDirty);
  const isWide = useMediaQuery('(min-width: 1024px)');
  const isPhone = useMediaQuery('(max-width: 767px)');
  const [view, setView] = useState<View>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
      ? 'list'
      : 'canvas',
  );
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState<WorkflowNode | null>(null);
  const [reverting, setReverting] = useState(false);
  const canvasArea = useRef<HTMLDivElement>(null);
  const panelHeading = useRef<HTMLHeadingElement>(null);

  useDocumentTitle(workflow ? editor.draft.name || workflow.name : 'Workflow not found');

  // Load the workflow into the editor when the route changes.
  useEffect(() => {
    const wf = useWorkflows.getState().workflows.find((w) => w.id === id);
    if (wf) useEditor.getState().load(wf);
  }, [id]);

  const loaded = editor.workflowId === id;
  const draft = editor.draft;
  const issues = useMemo(() => validateWorkflow(draft), [draft]);
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const issuesByNode = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of issues) if (i.nodeId) map.set(i.nodeId, (map.get(i.nodeId) ?? 0) + 1);
    return map;
  }, [issues]);
  const selectedNode = draft.nodes.find((n) => n.id === editor.selectedNodeId) ?? null;

  const save = useCallback(() => {
    if (!workflow) return;
    const state = useEditor.getState();
    saveWorkflow(workflow.id, state.draft);
    state.markSaved();
    toast.success('Workflow saved in this browser.');
  }, [saveWorkflow, workflow]);

  const publish = useCallback(() => {
    if (!workflow) return;
    const state = useEditor.getState();
    if (selectIsDirty(state)) {
      saveWorkflow(workflow.id, state.draft);
      state.markSaved();
    }
    const result = publishWorkflow(workflow.id);
    if (result.ok) {
      toast.success(`Published “${state.draft.name}” as version ${result.version}.`);
    } else {
      const n = result.issues.filter((i) => i.severity === 'error').length;
      state.setPanel('issues');
      toast.error(
        `Can’t publish yet: ${n} ${n === 1 ? 'error needs' : 'errors need'} fixing. Changes were saved as a draft.`,
      );
    }
  }, [publishWorkflow, saveWorkflow, workflow]);

  const showPanel = useCallback((tab: PanelTab) => {
    useEditor.getState().setPanel(tab);
    requestAnimationFrame(() => {
      if (!window.matchMedia('(min-width: 1024px)').matches) {
        panelHeading.current?.scrollIntoView({ block: 'start' });
      }
      document.getElementById(`side-tab-${tab}`)?.focus();
    });
  }, []);

  const editNode = useCallback(
    (nodeId: string) => {
      useEditor.getState().select(nodeId);
      showPanel('properties');
    },
    [showPanel],
  );

  const showNode = useCallback(
    (nodeId: string) => {
      useEditor.getState().select(nodeId);
      if (view === 'canvas') canvasBridge.focusNode(nodeId);
      showPanel('properties');
    },
    [showPanel, view],
  );

  const addStep = (type: WorkflowNodeType) => {
    const position = view === 'canvas' ? canvasBridge.viewportCenter(canvasArea.current) : null;
    useEditor.getState().addNode(type, position ?? undefined);
    toast.announce(
      `${NODE_META[type].label} step added and selected. Edit its properties in the panel.`,
    );
    if (view === 'list' || !isWide) showPanel('properties');
  };

  const confirmDelete = (node: WorkflowNode) => setDeleting(node);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const target = e.target as HTMLElement;
      const inField = target.closest('input, textarea, select, [contenteditable="true"]');
      const key = e.key.toLowerCase();
      if (key === 's') {
        e.preventDefault();
        save();
      } else if (!inField && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) useEditor.getState().redo();
        else useEditor.getState().undo();
      } else if (!inField && key === 'y') {
        e.preventDefault();
        useEditor.getState().redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  // Warn before losing unsaved work.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );

  if (!workflow)
    return (
      <NotFoundPage message="This workflow doesn’t exist in this browser. It may have been deleted." />
    );
  if (!loaded) return <CanvasFallback />;

  const panelTabs: { id: PanelTab; label: ReactNode }[] = [
    { id: 'properties', label: 'Properties' },
    {
      id: 'issues',
      label: (
        <>
          Issues
          <span className={`badge !px-1.5 !py-0 ${errorCount ? 'badge-error' : 'badge-published'}`}>
            <span className="sr-only">(</span>
            {errorCount}
            <span className="sr-only"> errors)</span>
          </span>
        </>
      ),
    },
    { id: 'simulate', label: 'Simulate' },
  ];

  return (
    <div className="flex flex-1 flex-col">
      {/* Workflow toolbar */}
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
          <Link
            to="/"
            className="btn btn-ghost btn-sm btn-icon"
            aria-label="Back to all workflows"
            title="All workflows"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="m-0 truncate text-lg font-bold sm:text-xl">{draft.name}</h1>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-icon"
              onClick={() => setRenaming(true)}
              aria-label="Rename workflow"
              title="Rename"
            >
              <Pencil size={15} aria-hidden="true" />
            </button>
            <StatusBadge workflow={workflow} />
            <span className="text-sm text-muted" aria-live="polite">
              {dirty ? 'Unsaved changes' : 'All changes saved'}
            </span>
          </div>
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="toolbar"
            aria-label="Workflow actions"
          >
            <button
              type="button"
              className="btn btn-sm btn-icon"
              onClick={editor.undo}
              disabled={editor.past.length === 0}
              aria-label="Undo"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-icon"
              onClick={editor.redo}
              disabled={editor.future.length === 0}
              aria-label="Redo"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-icon"
              aria-label="Export as JSON"
              title="Export JSON"
              onClick={() => {
                downloadText(
                  `${slugify(draft.name)}.workflow.json`,
                  JSON.stringify(toWorkflowFile({ ...workflow, ...draft }), null, 2),
                );
                toast.success('Exported the current draft as JSON.');
              }}
            >
              <Download size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-icon"
              onClick={() => setReverting(true)}
              disabled={!dirty}
              aria-label="Discard unsaved changes"
              title="Discard unsaved changes"
            >
              <RotateCcw size={16} aria-hidden="true" />
            </button>
            <button type="button" className="btn btn-sm" onClick={save} disabled={!dirty}>
              <Save size={16} aria-hidden="true" /> Save
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={publish}>
              <Rocket size={16} aria-hidden="true" /> Publish
            </button>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 lg:h-[calc(100dvh-7.5rem)] lg:min-h-[560px] lg:grid-cols-[230px_minmax(0,1fr)_380px]">
        {isWide ? (
          <aside
            className="overflow-y-auto border-r border-line bg-surface"
            aria-label="Step palette"
          >
            <Palette hasStart={draft.nodes.some((n) => n.type === 'start')} onAdd={addStep} />
          </aside>
        ) : null}

        <section aria-labelledby="view-heading" className="flex min-w-0 flex-col">
          <h2 id="view-heading" className="sr-only">
            Workflow design
          </h2>
          <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-3">
            <Tabs
              label="Editor view"
              idPrefix="view"
              value={view}
              onChange={setView}
              className="!border-0"
              tabs={[
                {
                  id: 'canvas',
                  label: (
                    <>
                      <Network size={15} aria-hidden="true" /> Canvas
                    </>
                  ),
                },
                {
                  id: 'list',
                  label: (
                    <>
                      <LayoutList size={15} aria-hidden="true" /> List
                    </>
                  ),
                },
              ]}
            />
            {isPhone && view === 'canvas' ? (
              <p className="m-0 text-xs text-muted">
                Tip: List view is easier to edit on small screens.
              </p>
            ) : null}
          </div>
          {!isWide ? (
            <div className="border-b border-line bg-surface px-3 py-2">
              <Palette
                compact
                hasStart={draft.nodes.some((n) => n.type === 'start')}
                onAdd={addStep}
              />
            </div>
          ) : null}
          <div
            ref={canvasArea}
            {...tabPanelProps('view', view)}
            tabIndex={-1}
            className={`min-h-0 flex-1 ${view === 'canvas' ? 'h-[62vh] min-h-[420px] lg:h-auto' : 'overflow-y-auto bg-bg'}`}
          >
            {view === 'canvas' ? (
              <ReactFlowProvider>
                <Suspense fallback={<CanvasFallback />}>
                  <Canvas issuesByNode={issuesByNode} />
                </Suspense>
              </ReactFlowProvider>
            ) : (
              <StructuredEditor
                issuesByNode={issuesByNode}
                onEdit={editNode}
                onDelete={confirmDelete}
              />
            )}
          </div>
        </section>

        <aside
          className="flex min-h-0 flex-col border-t border-line bg-surface lg:border-t-0 lg:border-l"
          aria-labelledby="panel-heading"
        >
          <h2 id="panel-heading" ref={panelHeading} className="sr-only">
            Step details and tools
          </h2>
          <Tabs
            label="Side panel"
            idPrefix="side"
            value={editor.panel}
            onChange={editor.setPanel}
            tabs={panelTabs}
            className="px-3"
          />
          <div {...tabPanelProps('side', editor.panel)} className="min-h-0 flex-1 overflow-y-auto">
            {editor.panel === 'properties' ? (
              <PropertiesPanel node={selectedNode} issues={issues} onDelete={confirmDelete} />
            ) : editor.panel === 'issues' ? (
              <IssuesPanel issues={issues} onShowNode={showNode} />
            ) : (
              <SimulationPanel
                workflow={workflow}
                errorCount={errorCount}
                onShowIssues={() => showPanel('issues')}
              />
            )}
          </div>
        </aside>
      </div>

      <RenameDialog
        open={renaming}
        currentName={draft.name}
        onOpenChange={setRenaming}
        onRename={(name) => {
          editor.rename(name);
          setRenaming(false);
          toast.success(`Renamed to “${name}”. Save to keep the change.`);
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.data.label || 'Untitled'}”?`}
        description="The step and all of its connections will be removed. You can undo this."
        confirmLabel="Delete step"
        onConfirm={() => {
          if (deleting) {
            editor.deleteElements([deleting.id], []);
            toast.success(
              `Deleted “${deleting.data.label || 'Untitled'}”. Press Undo to restore it.`,
            );
          }
          setDeleting(null);
        }}
      />
      <ConfirmDialog
        open={reverting}
        onOpenChange={setReverting}
        title="Discard unsaved changes?"
        description="The workflow will return to its last saved version."
        confirmLabel="Discard changes"
        onConfirm={() => {
          editor.revert(workflow);
          setReverting(false);
          toast.success('Restored the last saved version.');
        }}
      />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(o) => !o && blocker.reset?.()}
        title="Leave without saving?"
        description="You have unsaved changes to this workflow. They will be lost if you leave."
        confirmLabel="Leave without saving"
        onConfirm={() => blocker.proceed?.()}
      />
    </div>
  );
}
