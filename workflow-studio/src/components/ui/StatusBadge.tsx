import { CircleDashed, CircleCheck } from 'lucide-react';
import type { Workflow } from '../../domain/types';

export function StatusBadge({
  workflow,
}: {
  workflow: Pick<Workflow, 'status' | 'publishedVersion'>;
}) {
  if (workflow.status === 'published') {
    return (
      <span className="badge badge-published">
        <CircleCheck size={13} aria-hidden="true" />
        Published v{workflow.publishedVersion}
      </span>
    );
  }
  return (
    <span className="badge badge-draft">
      <CircleDashed size={13} aria-hidden="true" />
      Draft{workflow.publishedVersion > 0 ? ` (v${workflow.publishedVersion} live)` : ''}
    </span>
  );
}
