import { withBase } from '../lib/url';

/**
 * Single source of truth for personal and professional facts shown on the site.
 * Only verified information belongs here — do not add achievements, metrics or
 * links that have not been confirmed.
 */

export interface Role {
  title: string;
  company: string;
  start: string; // YYYY-MM
  end: string | null; // null = present
  /** Verified responsibilities or results. Leave empty rather than guessing. */
  highlights: string[];
}

export const profile = {
  name: 'Harshith C Shenoy',
  role: 'Frontend Software Engineer',
  positioning: ['Frontend Software Engineer', 'React Developer', 'UI/UX Engineering'],
  location: 'Bengaluru, Karnataka',
  email: 'harshithcshenoy@gmail.com',
  github: 'https://github.com/mahamaharati-lgtm',
  /** Add only once verified. */
  linkedin: null as string | null,
  resumePdf: withBase('resume/Harshith-C-Shenoy-Resume.pdf'),
  resumeDocx: withBase('resume/Harshith-C-Shenoy-Resume.docx'),
} as const;

export const experience: Role[] = [
  {
    title: 'Associate Software Engineer (Frontend)',
    company: 'Pivot Path',
    start: '2026-07',
    end: null,
    highlights: [],
  },
  {
    title: 'Associate Software Engineer (Frontend)',
    company: 'Neviton',
    start: '2026-01',
    end: '2026-06',
    highlights: [],
  },
  {
    title: 'Frontend Developer Intern',
    company: 'Neviton',
    start: '2025-07',
    end: '2025-12',
    highlights: [],
  },
];

export const education = {
  degree: 'Bachelor of Engineering, Information Science and Engineering',
  institution: 'Visvesvaraya Technological University',
  year: '2025',
  score: '82%',
};

export const skillGroups: { title: string; description: string; items: string[] }[] = [
  {
    title: 'Languages',
    description: 'Day-to-day frontend languages, plus the foundations from my degree.',
    items: ['JavaScript (ES6+)', 'TypeScript', 'HTML5', 'CSS3', 'Python', 'C', 'SQL'],
  },
  {
    title: 'Frameworks & UI libraries',
    description: 'Building component-driven interfaces.',
    items: ['React.js', 'Material UI', 'Tailwind CSS'],
  },
  {
    title: 'UI engineering',
    description: 'Turning designs into interfaces that work for everyone, on every screen.',
    items: ['Responsive design', 'UI/UX implementation', 'Accessibility', 'REST API integration'],
  },
  {
    title: 'Tools & workflow',
    description: 'How I ship and collaborate.',
    items: ['Git', 'GitHub', 'Chrome DevTools', 'VS Code', 'Agile / Scrum'],
  },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[(m ?? 1) - 1]} ${y}`;
}

export function formatRange(role: Pick<Role, 'start' | 'end'>): string {
  return `${formatMonth(role.start)} – ${role.end ? formatMonth(role.end) : 'Present'}`;
}

/** Inclusive month count, e.g. Jul–Dec = 6 months. Present roles are not given a duration. */
export function durationLabel(role: Pick<Role, 'start' | 'end'>): string | null {
  if (!role.end) return null;
  const [sy, sm] = role.start.split('-').map(Number);
  const [ey, em] = role.end.split('-').map(Number);
  const months = (ey! - sy!) * 12 + (em! - sm!) + 1;
  return `${months} ${months === 1 ? 'month' : 'months'}`;
}
