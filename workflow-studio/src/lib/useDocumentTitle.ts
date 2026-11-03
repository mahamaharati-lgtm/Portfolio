import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title
      ? `${title} · Workflow Studio`
      : 'Workflow Studio — Enterprise Approval Workflow Builder';
  }, [title]);
}
