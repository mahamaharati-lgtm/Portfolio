import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { CircleAlert, CircleDot, Check } from 'lucide-react';
import { memo } from 'react';
import { HANDLE_LABELS, NODE_META, nodeDetail } from '../../domain/nodeMeta';
import type { WorkflowNode } from '../../domain/types';
import { NodeIcon } from '../ui/NodeIcon';

export type SimMark = 'current' | 'visited' | null;
export type FlowNodeData = { node: WorkflowNode; issueCount: number; sim: SimMark };
export type FlowNode = Node<FlowNodeData, 'workflow'>;

function WorkflowNodeViewBase({ data }: NodeProps<FlowNode>) {
  const { node, issueCount, sim } = data;
  const meta = NODE_META[node.type];
  const detail = nodeDetail(node);
  const outputs = meta.outputs;

  return (
    <div
      className={`wf-node ${sim === 'current' ? 'wf-node--current' : ''} ${issueCount ? 'wf-node--issue' : ''}`}
      style={{ ['--node-color' as string]: `var(--node-${node.type})` }}
    >
      {meta.acceptsInput ? <Handle type="target" position={Position.Left} id="in" /> : null}
      <div className="flex items-start gap-2 p-2.5">
        <NodeIcon type={node.type} size={14} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[0.68rem] font-bold tracking-wide text-muted uppercase">
            {meta.label}
          </p>
          <p className="m-0 truncate text-[0.85rem] font-semibold" title={node.data.label}>
            {node.data.label || <em className="text-muted">Untitled</em>}
          </p>
          {detail ? <p className="m-0 mt-0.5 truncate text-muted">{detail}</p> : null}
          {issueCount || sim ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {issueCount ? (
                <span className="badge badge-error !px-1.5 !py-0 !text-[0.68rem]">
                  <CircleAlert size={11} aria-hidden="true" />
                  {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
                </span>
              ) : null}
              {sim === 'current' ? (
                <span
                  className="badge !px-1.5 !py-0 !text-[0.68rem]"
                  style={{ color: 'var(--focus)' }}
                >
                  <CircleDot size={11} aria-hidden="true" /> Current step
                </span>
              ) : null}
              {sim === 'visited' ? (
                <span className="badge badge-neutral !px-1.5 !py-0 !text-[0.68rem]">
                  <Check size={11} aria-hidden="true" /> Visited
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {outputs.length === 1 ? (
        <Handle type="source" position={Position.Right} id={outputs[0]} />
      ) : outputs.length > 1 ? (
        <div className="wf-node__outputs py-1">
          {outputs.map((h) => (
            <div key={h} className="wf-node__output">
              {HANDLE_LABELS[h]}
              <Handle type="source" position={Position.Right} id={h} style={{ right: -7 }} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export const WorkflowNodeView = memo(WorkflowNodeViewBase);
