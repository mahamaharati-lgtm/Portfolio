import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type IsValidConnection,
  type NodeChange,
  type ReactFlowInstance,
} from '@xyflow/react';
import { useCallback, useId, useMemo, useRef, useState, type DragEvent } from 'react';
import { checkConnection } from '../../domain/connections';
import { HANDLE_LABELS, NODE_META } from '../../domain/nodeMeta';
import { NODE_TYPES, type HandleId, type WorkflowNodeType } from '../../domain/types';
import { canvasBridge } from '../../lib/canvasBridge';
import { useEditor } from '../../store/editor';
import { toast } from '../../store/toast';
import { useTheme } from '../../theme/useTheme';
import { WorkflowNodeView, type FlowNode, type SimMark } from './WorkflowNodeView';

import { DRAG_MIME } from './dragMime';

const nodeTypes = { workflow: WorkflowNodeView };

const EDGE_COLORS: Partial<Record<HandleId, string>> = {
  approve: 'var(--success)',
  reject: 'var(--danger)',
  return: 'var(--warning)',
};

interface CanvasProps {
  issuesByNode: Map<string, number>;
}

export default function Canvas({ issuesByNode }: CanvasProps) {
  const { resolved } = useTheme();
  const instructionsId = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const flowRef = useRef<ReactFlowInstance<FlowNode, Edge> | null>(null);
  const draft = useEditor((s) => s.draft);
  const selectedNodeId = useEditor((s) => s.selectedNodeId);
  const simulation = useEditor((s) => s.simulation);
  const { select, moveNode, beginMove, connect, deleteElements, addNode } = useEditor.getState();
  const [measured, setMeasured] = useState<Record<string, { width: number; height: number }>>({});
  const [selectedEdges, setSelectedEdges] = useState<Set<string>>(new Set());

  const visited = useMemo(
    () => new Set(simulation?.history.map((h) => h.nodeId) ?? []),
    [simulation],
  );
  const labelOf = useMemo(
    () => new Map(draft.nodes.map((n) => [n.id, n.data.label || 'Untitled step'])),
    [draft.nodes],
  );

  const nodes: FlowNode[] = useMemo(
    () =>
      draft.nodes.map((n) => {
        const sim: SimMark =
          simulation?.currentNodeId === n.id ? 'current' : visited.has(n.id) ? 'visited' : null;
        const issues = issuesByNode.get(n.id) ?? 0;
        return {
          id: n.id,
          type: 'workflow',
          position: n.position,
          data: { node: n, issueCount: issues, sim },
          selected: n.id === selectedNodeId,
          measured: measured[n.id],
          deletable: true,
          ariaLabel: `${NODE_META[n.type].label} step: ${n.data.label || 'Untitled'}${issues ? `, ${issues} issues` : ''}${sim === 'current' ? ', current simulation step' : ''}`,
        };
      }),
    [draft.nodes, issuesByNode, measured, selectedNodeId, simulation, visited],
  );

  const edges: Edge[] = useMemo(
    () =>
      draft.edges.map((e) => {
        const color = EDGE_COLORS[e.sourceHandle] ?? 'var(--edge)';
        const label = e.sourceHandle === 'next' ? undefined : HANDLE_LABELS[e.sourceHandle];
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: 'in',
          type: 'smoothstep',
          label,
          labelBgPadding: [6, 3] as [number, number],
          labelBgBorderRadius: 4,
          selected: selectedEdges.has(e.id),
          style: {
            stroke: color,
            strokeDasharray: e.sourceHandle === 'return' ? '6 4' : undefined,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
          ariaLabel: `Connection from ${labelOf.get(e.source)}${label ? ` (${label})` : ''} to ${labelOf.get(e.target)}`,
        };
      }),
    [draft.edges, labelOf, selectedEdges],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      let nextSelected: string | null | undefined;
      const dims: Record<string, { width: number; height: number }> = {};
      for (const c of changes) {
        if (c.type === 'dimensions' && c.dimensions) dims[c.id] = c.dimensions;
        else if (c.type === 'position' && c.position)
          moveNode(c.id, c.position, { live: c.dragging === true });
        else if (c.type === 'select') {
          if (c.selected) nextSelected = c.id;
          else if (nextSelected === undefined && c.id === useEditor.getState().selectedNodeId)
            nextSelected = null;
        }
      }
      if (Object.keys(dims).length) setMeasured((m) => ({ ...m, ...dims }));
      if (nextSelected !== undefined) select(nextSelected);
    },
    [moveNode, select],
  );

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setSelectedEdges((prev) => {
      const next = new Set(prev);
      for (const c of changes) {
        if (c.type === 'select') {
          if (c.selected) next.add(c.id);
          else next.delete(c.id);
        }
      }
      return next;
    });
  }, []);

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target || !c.sourceHandle) return;
      const result = connect(c.source, c.sourceHandle as HandleId, c.target);
      if (!result.ok) toast.error(result.reason);
      else toast.announce(`Connected ${labelOf.get(c.source)} to ${labelOf.get(c.target)}.`);
    },
    [connect, labelOf],
  );

  const isValidConnection: IsValidConnection = useCallback((c) => {
    const { draft: d } = useEditor.getState();
    if (!c.source || !c.target || !c.sourceHandle) return false;
    return checkConnection(d.nodes, d.edges, c.source, c.sourceHandle as HandleId, c.target).ok;
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      const type = event.dataTransfer.getData(DRAG_MIME) as WorkflowNodeType;
      if (!NODE_TYPES.includes(type)) return;
      event.preventDefault();
      const rf = flowRef.current;
      const position = rf
        ? rf.screenToFlowPosition({ x: event.clientX - 110, y: event.clientY - 30 })
        : undefined;
      addNode(type, position);
      toast.announce(`${NODE_META[type].label} step added.`);
    },
    [addNode],
  );

  return (
    <div ref={wrapper} className="relative h-full min-h-[420px] w-full" data-testid="canvas">
      <p id={instructionsId} className="sr-only">
        Workflow canvas. Press Tab to move between steps, Enter to select a step, and arrow keys to
        move the selected step. Press Delete to remove the selected step or connection. To connect
        steps with the keyboard, use the Connections section of the step properties, or switch to
        List view.
      </p>
      <ReactFlow<FlowNode, Edge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onNodeDragStart={(_, node) => beginMove(node.id)}
        onDelete={({ nodes: n, edges: e }) => {
          deleteElements(
            n.map((x) => x.id),
            e.map((x) => x.id),
          );
          setSelectedEdges(new Set());
          toast.announce(
            `Deleted ${n.length ? `${n.length} step${n.length > 1 ? 's' : ''}` : ''}${n.length && e.length ? ' and ' : ''}${e.length ? `${e.length} connection${e.length > 1 ? 's' : ''}` : ''}.`,
          );
        }}
        onPaneClick={() => select(null)}
        onInit={(instance) => {
          flowRef.current = instance;
          canvasBridge.set(instance as unknown as ReactFlowInstance);
        }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes(DRAG_MIME)) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }
        }}
        onDrop={onDrop}
        deleteKeyCode={['Delete', 'Backspace']}
        colorMode={resolved}
        fitView
        fitViewOptions={{ padding: 0.06, maxZoom: 1.1 }}
        minZoom={0.25}
        maxZoom={2}
        snapToGrid
        snapGrid={[10, 10]}
        aria-describedby={instructionsId}
        aria-label="Workflow canvas"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          ariaLabel="Workflow overview map"
          nodeColor={(n) => `var(--node-${(n as FlowNode).data.node.type})`}
          className="!hidden xl:!block"
        />
      </ReactFlow>
    </div>
  );
}
