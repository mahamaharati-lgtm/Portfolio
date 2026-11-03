import { Plus } from 'lucide-react';
import { NODE_META } from '../../domain/nodeMeta';
import { NODE_TYPES, type WorkflowNodeType } from '../../domain/types';
import { NodeIcon } from '../ui/NodeIcon';
import { DRAG_MIME } from './dragMime';

interface PaletteProps {
  hasStart: boolean;
  onAdd: (type: WorkflowNodeType) => void;
  compact?: boolean;
}

export function Palette({ hasStart, onAdd, compact }: PaletteProps) {
  return (
    <section aria-labelledby="palette-heading" className={compact ? '' : 'p-3'}>
      <h2 id="palette-heading" className={compact ? 'sr-only' : 'm-0 mb-1 text-sm font-semibold'}>
        Add a step
      </h2>
      {!compact ? (
        <p className="mt-0 mb-3 text-xs text-muted">Click to add, or drag onto the canvas.</p>
      ) : null}
      <ul
        className={`m-0 list-none p-0 ${compact ? 'flex gap-2 overflow-x-auto pb-1' : 'grid gap-1.5'}`}
      >
        {NODE_TYPES.map((type) => {
          const meta = NODE_META[type];
          const disabled = type === 'start' && hasStart;
          return (
            <li key={type} className={compact ? 'shrink-0' : ''}>
              <button
                type="button"
                className={`btn w-full !justify-start text-left ${compact ? 'btn-sm' : '!min-h-[3rem] !whitespace-normal'}`}
                draggable={!disabled}
                aria-disabled={disabled}
                aria-describedby={disabled ? 'start-exists-hint' : undefined}
                onDragStart={(e) => {
                  if (disabled) return e.preventDefault();
                  e.dataTransfer.setData(DRAG_MIME, type);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onClick={() => !disabled && onAdd(type)}
                title={disabled ? 'A workflow can only have one Start step' : meta.summary}
              >
                <NodeIcon type={type} size={14} />
                <span className="flex-1">
                  <span className="sr-only">Add </span>
                  {meta.label}
                  {!compact ? (
                    <span className="block text-xs font-normal text-muted">{meta.summary}</span>
                  ) : null}
                </span>
                {!compact ? <Plus size={14} aria-hidden="true" className="text-muted" /> : null}
              </button>
            </li>
          );
        })}
      </ul>
      {hasStart ? (
        <p id="start-exists-hint" className="sr-only">
          This workflow already has a Start step. Only one is allowed.
        </p>
      ) : null}
    </section>
  );
}
