/** Facts about Workflow Studio, taken from the implementation and its test runs. */
export const workflowStudio = {
  name: 'Workflow Studio',
  tagline: 'Enterprise approval workflow builder',
  repo: 'https://github.com/mahamaharati-lgtm/portfolio/tree/main/workflow-studio',
  /** Set VITE_WORKFLOW_STUDIO_URL at build time once the app is deployed. */
  live: (import.meta.env.VITE_WORKFLOW_STUDIO_URL as string | undefined) || null,
  stack: [
    'React 19',
    'TypeScript',
    'Vite',
    'Tailwind CSS',
    'React Router',
    'XYFlow',
    'Zustand',
    'React Hook Form',
    'Zod',
    'Radix UI',
    'Vitest',
    'Playwright',
    'axe-core',
  ],
  testing: {
    unitFiles: 6,
    unitTests: 44,
    e2eTests: 29,
    axeViolations: 0,
    widths: [320, 375, 768, 1024, 1440, 1920],
  },
  /** Measured scores only — never estimates. */
  lighthouse: null as
    | null
    | {
        page: string;
        performance: number;
        accessibility: number;
        bestPractices: number;
        seo: number;
      }[],
  lighthouseNote: '',
};
