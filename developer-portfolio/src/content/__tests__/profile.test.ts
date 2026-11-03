import { describe, expect, it } from 'vitest';
import { durationLabel, education, experience, formatRange, profile } from '../profile';

describe('profile content', () => {
  it('lists employment in reverse chronological order with the exact verified dates', () => {
    expect(experience.map((r) => [r.title, r.company, formatRange(r)])).toEqual([
      ['Associate Software Engineer (Frontend)', 'Pivot Path', 'Jul 2026 – Present'],
      ['Associate Software Engineer (Frontend)', 'Neviton', 'Jan 2026 – Jun 2026'],
      ['Frontend Developer Intern', 'Neviton', 'Jul 2025 – Dec 2025'],
    ]);
  });

  it('computes inclusive durations and leaves current roles open', () => {
    expect(durationLabel(experience[2]!)).toBe('6 months');
    expect(durationLabel(experience[1]!)).toBe('6 months');
    expect(durationLabel(experience[0]!)).toBeNull();
  });

  it('keeps verified contact details and no unverified links', () => {
    expect(profile.email).toBe('harshithcshenoy@gmail.com');
    expect(profile.linkedin).toBeNull();
    expect(JSON.stringify(profile)).not.toContain('9342036381');
    expect(education).toMatchObject({ year: '2025', score: '82%' });
  });
});
