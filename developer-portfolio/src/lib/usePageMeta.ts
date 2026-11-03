import { useEffect } from 'react';
import type { PageMeta } from '../content/meta';

export function usePageMeta({ title, description }: PageMeta) {
  useEffect(() => {
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [title, description]);
}
