export interface PageMeta {
  title: string;
  description: string;
}

/** Used by pages at runtime and by the pre-render script at build time. */
export const PAGE_META = {
  '/': {
    title: 'Harshith C Shenoy — Frontend Software Engineer',
    description:
      'Harshith C Shenoy is a frontend software engineer in Bengaluru building accessible, responsive React and TypeScript interfaces.',
  },
  '/projects/workflow-studio': {
    title: 'Workflow Studio case study — Harshith C Shenoy',
    description:
      'How I designed and built Workflow Studio, an accessible React and TypeScript builder for approval workflows with validation, publishing and simulation.',
  },
  '/404': {
    title: 'Page not found — Harshith C Shenoy',
    description: 'The page you were looking for does not exist.',
  },
} satisfies Record<string, PageMeta>;
