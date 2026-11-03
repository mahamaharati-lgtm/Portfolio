import { ArrowRight, ArrowUpRight, Check, Copy, Download, FileText, Mail } from 'lucide-react';
import { Github } from '../components/GithubIcon';
import { useState } from 'react';
import { Link } from 'react-router';
import { SectionHeading } from '../components/SectionHeading';
import { ThemeImage } from '../components/ThemeImage';
import {
  durationLabel,
  education,
  experience,
  formatRange,
  profile,
  skillGroups,
} from '../content/profile';
import { PAGE_META } from '../content/meta';
import { workflowStudio } from '../content/workflowStudio';
import { usePageMeta } from '../lib/usePageMeta';

function CopyEmail() {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  return (
    <>
      <button
        type="button"
        className="btn"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(profile.email);
            setStatus('copied');
          } catch {
            setStatus('failed');
          }
          window.setTimeout(() => setStatus('idle'), 4000);
        }}
      >
        {status === 'copied' ? (
          <Check size={17} aria-hidden="true" />
        ) : (
          <Copy size={17} aria-hidden="true" />
        )}
        {status === 'copied' ? 'Email copied' : 'Copy email'}
      </button>
      <span role="status" className="sr-only">
        {status === 'copied'
          ? 'Email address copied to clipboard.'
          : status === 'failed'
            ? 'Copying failed. The address is ' + profile.email
            : ''}
      </span>
    </>
  );
}

function Hero() {
  const current = experience[0]!;
  return (
    <section
      aria-labelledby="hero-title"
      className="container-page pt-14 pb-20 sm:pt-20 lg:pt-24 lg:pb-28"
    >
      <div className="grid items-end gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <p className="eyebrow m-0">
            {profile.role} · {profile.location.split(',')[0]}
          </p>
          <h1
            id="hero-title"
            className="mt-4 mb-6 text-[clamp(2.75rem,8vw,5.75rem)] leading-[0.98] font-semibold tracking-[-0.045em]"
          >
            Harshith C <br />
            Shenoy
            <span className="text-accent" aria-hidden="true">
              .
            </span>
          </h1>
          <p className="m-0 max-w-xl text-xl leading-relaxed text-muted sm:text-[1.35rem]">
            I build React and TypeScript interfaces that are{' '}
            <span className="text-fg">responsive</span>, <span className="text-fg">accessible</span>{' '}
            and <span className="text-fg">easy to use</span>, translating designs into components
            with care for detail.
          </p>
          <p className="mt-4 mb-0 font-mono text-sm text-muted">
            {profile.positioning.join('  /  ')}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#work" className="btn btn-primary">
              View my work <ArrowRight size={17} aria-hidden="true" />
            </a>
            <a href={profile.resumePdf} className="btn" download>
              <Download size={17} aria-hidden="true" /> Download résumé{' '}
              <span className="sr-only">(PDF)</span>
            </a>
            <a href={profile.github} className="btn" rel="me">
              <Github size={17} aria-hidden="true" /> GitHub
            </a>
            <a href="#contact" className="btn">
              <Mail size={17} aria-hidden="true" /> Contact
            </a>
          </div>
        </div>

        <aside aria-label="At a glance" className="card overflow-hidden">
          <dl className="m-0 grid grid-cols-1 divide-y divide-line">
            <div className="p-5">
              <dt className="eyebrow">Currently</dt>
              <dd className="m-0 mt-1.5 font-medium">
                {current.title}
                <span className="block text-muted">
                  {current.company} · since {formatRange(current).split(' – ')[0]}
                </span>
              </dd>
            </div>
            <div className="p-5">
              <dt className="eyebrow">Featured project</dt>
              <dd className="m-0 mt-3">
                <Link to="/projects/workflow-studio" className="group block no-underline">
                  <ThemeImage
                    name="ws-editor"
                    alt="Workflow Studio editor with a purchase approval workflow on the canvas"
                    width={1600}
                    height={1000}
                    sizes="(min-width: 1024px) 30vw, 100vw"
                    priority
                  />
                  <span className="mt-3 flex items-center justify-between gap-3 font-medium">
                    <span>
                      {workflowStudio.name}{' '}
                      <span className="font-normal text-muted">— case study</span>
                    </span>
                    <ArrowUpRight
                      size={18}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>
                </Link>
              </dd>
            </div>
            <div className="p-5">
              <dt className="eyebrow">Focus</dt>
              <dd className="m-0 mt-1.5 text-muted">
                React · TypeScript · UI engineering · Accessibility
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}

function FeaturedProject() {
  const highlights = [
    {
      title: 'Problem',
      body: 'Approval processes such as purchases, leave and expenses follow rules, like “finance must approve anything over ₹50,000”. When those rules live in email threads, requests stall and nobody can see why a request went where it did.',
    },
    {
      title: 'My role',
      body: 'Sole designer and frontend engineer: product scope, interaction design, component architecture, the validation and simulation engine, accessibility, automated tests and documentation.',
    },
  ];
  const interactions = [
    'Drag steps onto a canvas and connect named outputs: Approved, Rejected, Returned, Yes and No',
    'Live validation against business rules, with “Show step” to jump to each problem',
    'Publishing is blocked until the workflow is valid, and versions are tracked',
    'Step-by-step simulation of an ₹85,000 purchase request with a full request history',
    'Undo/redo, JSON import/export and save/restore in the browser',
  ];
  const ux = [
    'A structured List view replaces the canvas on phones instead of shrinking it',
    'One draft is shared by the canvas, list and property panel, so every path follows the same rules',
    'Errors are phrased as fixes (“Choose an approver role for …”) and shown on the step itself',
  ];
  const a11y = [
    'Keyboard alternatives for dragging: arrow keys move steps, and connection selects replace edge dragging',
    'Status, severity and branch meaning use text and icons, never colour alone',
    `axe-core in Playwright: ${workflowStudio.testing.axeViolations} WCAG 2.1 A/AA violations across key screens in light and dark`,
  ];

  return (
    <section aria-labelledby="work" className="border-t border-line py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading
          id="work"
          index="01 — Selected work"
          title="Featured project"
          intro="One substantial project, built end to end and documented in depth."
        />

        <article
          aria-labelledby="ws-title"
          className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-14"
        >
          <div className="lg:order-2">
            <p className="eyebrow m-0">React · TypeScript · XYFlow</p>
            <h3 id="ws-title" className="mt-2 mb-3 text-3xl font-semibold">
              {workflowStudio.name}
            </h3>
            <p className="mt-0 mb-6 text-lg text-muted">
              An {workflowStudio.tagline.toLowerCase()} for designing, validating, publishing and
              simulating approval processes.
            </p>
            {highlights.map((h) => (
              <div key={h.title} className="mb-5">
                <h4 className="m-0 text-sm font-semibold tracking-wide uppercase">{h.title}</h4>
                <p className="mt-1 mb-0 text-muted">{h.body}</p>
              </div>
            ))}
            <h4 className="m-0 text-sm font-semibold tracking-wide uppercase">Stack</h4>
            <ul
              className="m-0 mt-2 mb-7 flex list-none flex-wrap gap-2 p-0"
              aria-label="Technology stack"
            >
              {workflowStudio.stack.map((s) => (
                <li key={s} className="chip">
                  {s}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link to="/projects/workflow-studio" className="btn btn-accent">
                Read the case study <ArrowRight size={17} aria-hidden="true" />
              </Link>
              {workflowStudio.live ? (
                <a href={workflowStudio.live} className="btn">
                  Live demo <ArrowUpRight size={17} aria-hidden="true" />
                </a>
              ) : null}
              <a href={workflowStudio.repo} className="btn">
                <Github size={17} aria-hidden="true" /> Source code
              </a>
            </div>
          </div>

          <div className="lg:order-1">
            <figure className="m-0">
              <ThemeImage
                name="ws-simulation"
                alt="Workflow Studio simulating an ₹85,000 purchase request: the manager has approved, the amount decision chose Yes, and the request is waiting for finance approval"
                width={1600}
                height={1000}
              />
              <figcaption className="mt-3 text-sm text-muted">
                Simulating the ₹85,000 request: the decision routes it to finance because it exceeds
                ₹50,000.
              </figcaption>
            </figure>
            <div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <figure className="m-0">
                <ThemeImage
                  name="ws-validation"
                  alt="Validation panel listing a missing approver role, with the affected step highlighted on the canvas"
                  width={1600}
                  height={1000}
                  sizes="(min-width: 1024px) 40vw, 66vw"
                />
                <figcaption className="mt-2 text-sm text-muted">
                  Validation blocks publishing and points to the fix.
                </figcaption>
              </figure>
              <figure className="m-0">
                <ThemeImage
                  name="ws-mobile"
                  alt="Structured list editor on a phone-sized screen"
                  width={780}
                  height={1688}
                  widths={[780, 390]}
                  sizes="(min-width: 640px) 20vw, 50vw"
                />
                <figcaption className="mt-2 text-sm text-muted">List editor on mobile.</figcaption>
              </figure>
            </div>
          </div>
        </article>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { title: 'Key interactions', items: interactions },
            { title: 'UX decisions', items: ux },
            { title: 'Accessibility', items: a11y },
          ].map((col) => (
            <section key={col.title} aria-labelledby={`ws-${col.title}`} className="card p-6">
              <h4 id={`ws-${col.title}`} className="m-0 mb-3 text-lg font-semibold">
                {col.title}
              </h4>
              <ul className="m-0 space-y-2.5 p-0 pl-5 text-[0.98rem] text-muted marker:text-accent">
                {col.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section aria-labelledby="about" className="border-t border-line py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading
          id="about"
          index="02 — About"
          title="Frontend engineering with a UI/UX focus"
        />
        <div className="grid gap-8 md:grid-cols-[10rem_1fr] md:gap-8">
          <div aria-hidden="true" />
          <div className="grid max-w-3xl gap-5 text-lg text-muted">
            <p className="m-0">
              I’m a frontend software engineer based in Bengaluru. I started as a Frontend Developer
              Intern at Neviton in July 2025, became an Associate Software Engineer there in January
              2026, and joined Pivot Path as an Associate Software Engineer (Frontend) in July 2026.
            </p>
            <p className="m-0">
              Most of my work is in <strong className="font-semibold text-fg">React</strong> and{' '}
              <strong className="font-semibold text-fg">TypeScript</strong>, styled with Material UI
              or Tailwind CSS and connected to REST APIs. I like breaking a design into small,
              predictable components, keeping state where it belongs, and checking layouts on real
              screen sizes rather than only on a wide monitor.
            </p>
            <p className="m-0">
              I care about interfaces that work for everyone. That means semantic HTML first,
              visible focus, keyboard paths for every pointer interaction, and errors that tell
              people what to do next. My{' '}
              <Link to="/projects/workflow-studio" className="link">
                Workflow Studio case study
              </Link>{' '}
              shows how I applied this to a complex, canvas-based editor.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Experience() {
  return (
    <section aria-labelledby="experience" className="border-t border-line py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading id="experience" index="03 — Experience" title="Experience" />
        <ol className="m-0 list-none p-0">
          {experience.map((role) => {
            const duration = durationLabel(role);
            return (
              <li
                key={`${role.company}-${role.start}`}
                className="grid gap-2 border-t border-line py-7 first:border-t-0 first:pt-0 md:grid-cols-[10rem_1fr] md:gap-8"
              >
                <p className="m-0 font-mono text-sm text-muted">
                  <time dateTime={role.start}>{formatRange(role).split(' – ')[0]}</time> –{' '}
                  {role.end ? (
                    <time dateTime={role.end}>{formatRange(role).split(' – ')[1]}</time>
                  ) : (
                    'Present'
                  )}
                  {duration ? <span className="block">{duration}</span> : null}
                </p>
                <div>
                  <h3 className="m-0 text-xl font-semibold">{role.title}</h3>
                  <p className="mt-1 mb-0 text-lg text-muted">
                    {role.company}
                    {role.end === null ? (
                      <span className="ml-2 inline-flex items-center gap-1.5 align-middle text-sm font-medium text-fg">
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 rounded-full bg-[var(--success)]"
                        />
                        Current role
                      </span>
                    ) : null}
                  </p>
                  {role.highlights.length ? (
                    <ul className="mt-3 mb-0 space-y-1.5 pl-5 text-muted marker:text-accent">
                      {role.highlights.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-12 grid gap-2 border-t border-line pt-7 md:grid-cols-[10rem_1fr] md:gap-8">
          <h3 className="eyebrow m-0 pt-1">Education</h3>
          <div>
            <p className="m-0 text-xl font-semibold">{education.degree}</p>
            <p className="mt-1 mb-0 text-lg text-muted">
              {education.institution} · {education.year} · {education.score}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Skills() {
  return (
    <section aria-labelledby="skills" className="border-t border-line py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading
          id="skills"
          index="04 — Skills"
          title="Skills"
          intro="Grouped by how I use them, not rated by percentages."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          {skillGroups.map((g) => (
            <section key={g.title} aria-labelledby={`skills-${g.title}`} className="card p-6">
              <h3 id={`skills-${g.title}`} className="m-0 text-lg font-semibold">
                {g.title}
              </h3>
              <p className="mt-1 mb-4 text-[0.95rem] text-muted">{g.description}</p>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {g.items.map((s) => (
                  <li key={s} className="chip">
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section aria-labelledby="contact" className="border-t border-line py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading
          id="contact"
          index="05 — Contact"
          title="Let’s talk"
          intro="I’m happy to hear about frontend and React roles, or to talk through any of my work."
        />
        <div className="grid gap-8 md:grid-cols-[10rem_1fr] md:gap-8">
          <div aria-hidden="true" />
          <div>
            <a
              href={`mailto:${profile.email}`}
              className="link inline-block text-[clamp(1.35rem,4.5vw,2.6rem)] font-semibold tracking-tight break-all"
            >
              {profile.email}
            </a>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`mailto:${profile.email}`} className="btn btn-primary">
                <Mail size={17} aria-hidden="true" /> Send an email
              </a>
              <CopyEmail />
              <a href={profile.github} className="btn" rel="me">
                <Github size={17} aria-hidden="true" /> GitHub
              </a>
              {profile.linkedin ? (
                <a href={profile.linkedin} className="btn" rel="me">
                  LinkedIn
                </a>
              ) : null}
            </div>
            <div className="mt-10 border-t border-line pt-6">
              <h3 className="m-0 text-lg font-semibold">Résumé</h3>
              <p className="mt-1 mb-4 text-muted">
                Single-column and ATS-friendly, with the same details as this site.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={profile.resumePdf} className="btn" download>
                  <Download size={17} aria-hidden="true" /> PDF
                  <span className="sr-only">résumé download</span>
                </a>
                <a href={profile.resumeDocx} className="btn" download>
                  <FileText size={17} aria-hidden="true" /> Word (DOCX)
                  <span className="sr-only">résumé download</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  usePageMeta(PAGE_META['/']);
  return (
    <>
      <Hero />
      <FeaturedProject />
      <About />
      <Experience />
      <Skills />
      <Contact />
    </>
  );
}
