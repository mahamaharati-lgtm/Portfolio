import {
  Bell,
  CircleCheckBig,
  ClipboardCheck,
  GitFork,
  ListTodo,
  Play,
  type LucideIcon,
} from 'lucide-react';
import type { WorkflowNodeType } from '../../domain/types';

const NODE_ICONS: Record<WorkflowNodeType, LucideIcon> = {
  start: Play,
  task: ListTodo,
  approval: ClipboardCheck,
  decision: GitFork,
  notification: Bell,
  end: CircleCheckBig,
};

export function NodeIcon({ type, size = 16 }: { type: WorkflowNodeType; size?: number }) {
  const Icon = NODE_ICONS[type];
  return (
    <span
      className="node-type-dot"
      style={{ background: `var(--node-${type})` }}
      aria-hidden="true"
    >
      <Icon size={size} strokeWidth={2.25} style={{ color: 'var(--surface)' }} />
    </span>
  );
}
