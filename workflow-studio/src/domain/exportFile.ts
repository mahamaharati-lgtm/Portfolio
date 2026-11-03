import type { WorkflowFile } from './schema';
import type { Workflow } from './types';

export function toWorkflowFile(workflow: Workflow): WorkflowFile {
  return {
    format: 'workflow-studio',
    version: 1,
    workflow: {
      name: workflow.name,
      description: workflow.description,
      category: workflow.category,
      nodes: workflow.nodes,
      edges: workflow.edges,
      sampleRequest: workflow.sampleRequest,
    },
  };
}
