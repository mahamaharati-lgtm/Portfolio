import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Github } from '../components/GithubIcon';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ThemeImage } from '../components/ThemeImage';
import { PAGE_META } from '../content/meta';
import { workflowStudio as ws } from '../content/workflowStudio';
import { usePageMeta } from '../lib/usePageMeta';

const SECTIONS = [
  ['overview', 'Product overview'],
  ['problem', 'Real-world problem'],
  ['users', 'Target users'],
  ['needs', 'User needs and assumptions'],
  ['ia', 'Information architecture'],
  ['journeys', 'User journeys'],
  ['examples', 'Workflow examples'],
  ['exploration', 'Design exploration'],
  ['components', 'Component architecture'],
  ['interactions', 'Interaction decisions'],
  ['responsive', 'Responsive design'],
  ['accessibility', 'Accessibility decisions'],
  ['implementation', 'Technical implementation'],
  ['testing', 'Validation and testing'],
  ['screenshots', 'Screenshots'],
  ['limitations', 'Known limitations'],
  ['future', 'Future improvements'],
] as const;

type SectionId = (typeof SECTIONS)[number][0];

function Section({ id, children }: { id: SectionId; children: ReactNode }) {
  const index = SECTIONS.findIndex(([s]) => s === id);
  const title = SECTIONS[index]![1];
  return (
    <section
      aria-labelledby={id}
      className="prose-case scroll-mt-24 border-t border-line py-12 first:border-t-0 first:pt-0"
    >
      <p className="eyebrow m-0 mb-2" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </p>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

function Figure({
  name,
  alt,
  caption,
  mobile = false,
}: {
  name: string;
  alt: string;
  caption: string;
  mobile?: boolean;
}) {
  return (
    <figure className={`my-6 ${mobile ? 'max-w-xs' : ''}`}>
      {mobile ? (
        <ThemeImage
          name={name}
          alt={alt}
          width={780}
          height={1688}
          widths={[780, 390]}
          sizes="320px"
        />
      ) : (
        <ThemeImage
          name={name}
          alt={alt}
          width={1600}
          height={1000}
          sizes="(min-width: 1024px) 50rem, 100vw"
        />
      )}
      <figcaption className="mt-2 text-sm text-muted">{caption}</figcaption>
    </figure>
  );
}

function Table({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) {
  return (
    <div
      className="relative my-6 overflow-x-auto rounded-xl border border-line"
      role="region"
      aria-label={caption}
      tabIndex={0}
    >
      <table className="w-full min-w-[34rem] border-collapse text-left text-[0.95rem]">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-2">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line align-top">
              {r.map((c, j) =>
                j === 0 ? (
                  <th key={j} scope="row" className="px-4 py-2.5 font-medium">
                    {c}
                  </th>
                ) : (
                  <td key={j} className="px-4 py-2.5 text-muted">
                    {c}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CaseStudyPage() {
  usePageMeta(PAGE_META['/projects/workflow-studio']);
  const t = ws.testing;

  return (
    <article aria-labelledby="cs-title">
      <header className="border-b border-line">
        <div className="container-page pt-10 pb-12 sm:pt-14 sm:pb-16">
          <Link
            to="/"
            className="link inline-flex items-center gap-1.5 text-sm font-medium no-underline"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Back to home
          </Link>
          <p className="eyebrow mt-8 mb-0">Case study</p>
          <h1
            id="cs-title"
            className="mt-3 mb-4 max-w-4xl text-[clamp(2.4rem,6vw,4.25rem)] leading-[1.02] font-semibold tracking-[-0.04em]"
          >
            Workflow Studio: an accessible builder for approval workflows
          </h1>
          <p className="m-0 max-w-3xl text-xl text-muted">
            Designing, validating, publishing and simulating processes like purchase, leave and
            expense approvals in the browser, with every drag interaction available from the
            keyboard.
          </p>
          <dl className="mt-8 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-4 text-sm md:grid-cols-4 [&_dd]:[overflow-wrap:anywhere] [&>div]:min-w-0">
            {[
              ['Role', 'Design and frontend engineering'],
              ['Type', 'Personal portfolio project'],
              ['Platform', 'Web: desktop, tablet and phone'],
              ['Stack', 'React, TypeScript, XYFlow'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="eyebrow">{k}</dt>
                <dd className="m-0 mt-1 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            {ws.live ? (
              <a href={ws.live} className="btn btn-accent">
                Open the live demo <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            ) : null}
            <a href={ws.repo} className="btn">
              <Github size={17} aria-hidden="true" /> Source code on GitHub
            </a>
          </div>
        </div>
        <div className="container-page pb-12">
          <ThemeImage
            name="ws-editor"
            alt="Workflow Studio editor: step palette on the left, purchase approval workflow on the canvas, and the decision step’s properties on the right"
            width={1600}
            height={1000}
            sizes="(min-width: 1184px) 70rem, 100vw"
            priority
          />
        </div>
      </header>

      <div className="container-page grid grid-cols-1 gap-10 py-14 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
        <nav
          aria-label="Case study sections"
          className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto"
        >
          <details className="card p-4 lg:hidden">
            <summary className="cursor-pointer font-semibold">Contents</summary>
            <ol className="mt-3 mb-0 space-y-1.5 pl-6 text-[0.95rem]">
              {SECTIONS.map(([id, title]) => (
                <li key={id}>
                  <a href={`#${id}`} className="link">
                    {title}
                  </a>
                </li>
              ))}
            </ol>
          </details>
          <div className="hidden lg:block">
            <p className="eyebrow m-0 mb-3">Contents</p>
            <ol className="m-0 list-none space-y-1 border-l border-line p-0 text-[0.92rem]">
              {SECTIONS.map(([id, title], i) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="-ml-px block border-l-2 border-transparent py-1 pl-3 text-muted no-underline hover:border-accent hover:text-fg"
                  >
                    <span className="font-mono text-xs" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>{' '}
                    {title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <div className="min-w-0">
          <Section id="overview">
            <p>
              Workflow Studio is a single-page web app for building approval workflows. A workflow
              is a graph of steps (<strong>Start</strong>, <strong>Task</strong>,{' '}
              <strong>Approval</strong>, <strong>Decision</strong>, <strong>Notification</strong>{' '}
              and <strong>End</strong>) connected by named outcomes such as <em>Approved</em>,{' '}
              <em>Rejected</em>, <em>Returned</em>, <em>Yes</em> and <em>No</em>.
            </p>
            <p>
              People can lay out a workflow on a canvas or edit it as a structured list, configure
              roles and conditions, check it against business rules, publish it as a numbered
              version, and simulate a request through it while acting as each approver. Each
              simulated request keeps a complete history of who did what.
            </p>
            <p>
              It runs entirely in the browser and stores data in <code>localStorage</code>. It is a
              frontend demonstration, not a production multi-user system.
            </p>
          </Section>

          <Section id="problem">
            <p>
              Most organisations run approval processes with rules that are easy to state and hard
              to follow consistently: every purchase goes to the requester’s manager; anything above
              ₹50,000 also needs finance; procurement is told once it is approved. When those rules
              live in people’s heads or in email chains, requests take the wrong route, approvals
              are skipped, and nobody can explain afterwards why a request ended up where it did.
            </p>
            <p>
              A visual workflow builder makes the rules explicit and reviewable. It is only useful,
              though, if it stops people from publishing a broken process: a decision with only one
              branch, an approval nobody is assigned to, or a step that can never be reached.
            </p>
          </Section>

          <Section id="users">
            <p>
              I designed for two roles. These are my working assumptions, not findings from user
              research; no interviews or usability studies were run for this project.
            </p>
            <ul>
              <li>
                <strong>Process owners</strong> (operations, HR, finance or IT administrators) who
                define and maintain workflows. They understand the business rules but are not
                developers.
              </li>
              <li>
                <strong>Reviewers</strong> (managers or auditors) who need to check what a process
                does before it goes live, often on a laptop or phone, sometimes using only a
                keyboard or a screen reader.
              </li>
            </ul>
          </Section>

          <Section id="needs">
            <Table
              caption="User needs and how Workflow Studio responds"
              head={['Assumed need', 'Response in the product']}
              rows={[
                [
                  'See the whole process at a glance',
                  'Canvas with named, labelled branches, a minimap, zoom and fit-to-view',
                ],
                [
                  'Not publish something broken',
                  'Live validation; Publish is refused while any error remains',
                ],
                [
                  'Understand what a rule will do',
                  'Plain-language condition preview and a step-by-step simulator',
                ],
                [
                  'Recover from mistakes',
                  'Undo/redo, discard changes, confirmation before deleting, unsaved-changes warning',
                ],
                [
                  'Work without a mouse or on a phone',
                  'Keyboard paths for every action; List view on small screens',
                ],
                [
                  'Move definitions between environments',
                  'JSON export and a validated JSON import',
                ],
              ]}
            />
            <p>
              Main assumptions: a workflow has one entry point; branching is driven by a few request
              fields (amount, duration, category, priority); and each step has one owning role
              rather than named individuals.
            </p>
          </Section>

          <Section id="ia">
            <p>The app has three routes, with the editor split into clear regions:</p>
            <ul>
              <li>
                <strong>Workflows</strong> (<code>/</code>): search, status filter (All, Drafts,
                Published), cards with status, step count, last update and validation summary, plus
                create and import.
              </li>
              <li>
                <strong>Editor</strong> (<code>/workflows/:id</code>): a toolbar (name, status, save
                state, undo, redo, export, discard, save, publish), a <em>step palette</em>, the{' '}
                <em>design area</em> with Canvas and List tabs, and a <em>side panel</em> with
                Properties, Issues and Simulate tabs.
              </li>
              <li>
                <strong>About</strong> (<code>/about</code>): what the demo does, keyboard shortcuts
                and limitations.
              </li>
            </ul>
            <p>
              The side panel is the one place for details about the current selection, the
              workflow’s health, and its behaviour. This keeps the canvas uncluttered and gives each
              region one job.
            </p>
          </Section>

          <Section id="journeys">
            <h3>Build and publish a workflow</h3>
            <ol>
              <li>Create a workflow from a blank canvas or a template.</li>
              <li>Add steps from the palette by clicking, or by dragging them onto the canvas.</li>
              <li>
                Connect outputs by dragging between handles, or by choosing targets in the
                Connections section.
              </li>
              <li>
                Fix each item in the Issues tab; “Show step” selects and centres the step that needs
                attention.
              </li>
              <li>
                Publish. The workflow becomes “Published v1”, and later edits create a new draft.
              </li>
            </ol>
            <h3>Check a workflow before it goes live</h3>
            <ol>
              <li>Open Simulate. The form is pre-filled with the workflow’s sample request.</li>
              <li>
                Act as each assignee or approver; decisions and notifications run automatically.
              </li>
              <li>
                Read the request history to confirm every route, then review earlier runs under
                Recent runs.
              </li>
            </ol>
          </Section>

          <Section id="examples">
            <p>
              The app ships with five fictional example workflows: purchase, leave, expense,
              document and IT change.
            </p>
            <h3>Purchase approval: the ₹85,000 request</h3>
            <ol>
              <li>Ananya Rao submits a request for ergonomic chairs worth ₹85,000.</li>
              <li>
                <strong>Manager review</strong> (Line Manager) approves. They could also reject it,
                or return it to <em>Revise request</em>.
              </li>
              <li>
                The decision <strong>Amount above ₹50,000?</strong> evaluates{' '}
                <code>amount &gt; 50000</code>. The history records “Amount (₹) &gt; ₹50,000 (Amount
                (₹) is ₹85,000)” and follows <em>Yes</em>.
              </li>
              <li>
                <strong>Finance approval</strong> (Finance Approver) approves.
              </li>
              <li>
                <strong>Notify procurement</strong> runs automatically, and the workflow ends as{' '}
                <em>Approved</em>.
              </li>
            </ol>
            <p>
              With ₹20,000 the decision follows <em>No</em> and finance is skipped. A rejection at
              either approval notifies the requester and ends as <em>Rejected</em>.
            </p>
            <Figure
              name="ws-simulation"
              alt="Simulation waiting for finance approval with the request history listing submission, manager approval and the decision result"
              caption="Mid-simulation: the request has reached Finance approval, highlighted on the canvas."
            />
            <h3>IT change request: a deliberately incomplete draft</h3>
            <p>
              One template ships with a missing approver role, so the validation experience can be
              seen straight away. Publishing it is refused until a role is chosen.
            </p>
          </Section>

          <Section id="exploration">
            <p>
              These are the main alternatives I weighed while building, and why I chose as I did.
            </p>
            <Table
              caption="Design alternatives considered"
              head={['Question', 'Options', 'Decision']}
              rows={[
                [
                  'How are branches shown?',
                  'Generic edges with editable labels, or named output ports',
                  'Named ports per step type, so an approval always has Approved / Rejected / Returned and labels are never ambiguous',
                ],
                [
                  'Where do details go?',
                  'Modal dialogs, inline node editing, or a side panel',
                  'Tabbed side panel: no focus switching while editing, and it doubles as the validation and simulation surface',
                ],
                [
                  'How does mobile work?',
                  'Shrink the canvas, or provide a different editor',
                  'A List view of the same graph, ordered from Start, which is the default below 768px',
                ],
                [
                  'Autosave or explicit save?',
                  'Autosave every change, or save on demand',
                  'Explicit Save with a visible “Unsaved changes” state, so a half-edited published workflow is never silently changed',
                ],
                [
                  'Can invalid workflows be simulated?',
                  'Allow it with warnings, or block it',
                  'Block it, so simulation results always match what could be published',
                ],
                [
                  'Loops?',
                  'Forbid all cycles, or allow some',
                  'Only through an approval’s Returned branch, which models “send back for changes” without infinite loops',
                ],
              ]}
            />
            <p>
              Visually, I kept the palette neutral and gave each step type a distinct colour bar{' '}
              <em>and</em> icon and text label. Edge colours (green Approved, red Rejected, dashed
              amber Returned) always come with a text label.
            </p>
          </Section>

          <Section id="components">
            <p>The code is split into a framework-free domain layer and a thin React layer:</p>
            <ul>
              <li>
                <code>domain/</code>: types, per-step metadata (outputs, defaults), connection
                rules, validation, the simulation engine, the Zod import schema and templates. All
                pure functions, all unit-tested.
              </li>
              <li>
                <code>store/</code>: <strong>Zustand</strong> stores. <code>workflows</code>{' '}
                persists workflows and runs through a <code>localStorage</code> wrapper that never
                throws (private mode, full storage). <code>editor</code> holds the draft, undo/redo
                history, selection and the running simulation.
              </li>
              <li>
                <code>components/editor/</code>: <code>Canvas</code> (XYFlow), the custom step node,{' '}
                <code>Palette</code>, <code>PropertiesPanel</code>, <code>IssuesPanel</code>,{' '}
                <code>SimulationPanel</code> and <code>StructuredEditor</code> (the List view).
              </li>
              <li>
                <code>components/ui/</code>: accessible primitives: <code>Dialog</code> (Radix),{' '}
                <code>Tabs</code>, <code>Toaster</code> with live regions, and{' '}
                <code>ConfirmDialog</code>.
              </li>
            </ul>
            <p>
              The canvas, the list and the property panel never change the graph themselves. They
              call the same store actions, which apply the same connection rules. That is what lets
              the keyboard path and the drag path stay identical in behaviour.
            </p>
          </Section>

          <Section id="interactions">
            <ul>
              <li>
                <strong>Connections are checked as they are made.</strong> While dragging, invalid
                targets are rejected (self-connections, into Start, or an output that is already
                used), and the reason is shown in a toast.
              </li>
              <li>
                <strong>Undo groups intent, not keystrokes.</strong> Rapid typing into one field, or
                one node drag, becomes a single undo step (changes are merged within 800 ms per
                field).
              </li>
              <li>
                <strong>Errors carry the fix.</strong> Messages read “Choose an approver role for
                ‘Emergency approval’”, appear in the Issues list and on the step itself, and “Show
                step” jumps to it.
              </li>
              <li>
                <strong>Publishing saves first.</strong> If validation fails, changes are kept as a
                draft and the Issues tab opens.
              </li>
              <li>
                <strong>Leaving is guarded.</strong> React Router’s <code>useBlocker</code> and{' '}
                <code>beforeunload</code> protect unsaved work.
              </li>
              <li>
                <strong>Decisions explain themselves.</strong> The property panel previews “Requests
                where Amount (₹) &gt; ₹50,000 follow Yes; all others follow No.” Text fields only
                allow <code>==</code> and <code>!=</code>.
              </li>
            </ul>
          </Section>

          <Section id="responsive">
            <ul>
              <li>
                <strong>1024px and wider:</strong> three columns (palette, design area, 380px side
                panel), each scrolling independently.
              </li>
              <li>
                <strong>768–1023px:</strong> the palette becomes a horizontal row above the canvas,
                and the side panel moves below.
              </li>
              <li>
                <strong>Below 768px:</strong> the List view is the default, with Edit and Delete
                buttons on every step. The canvas stays available as a tab.
              </li>
              <li>
                The minimap only appears at 1280px and wider, so it never covers the workflow on
                smaller screens.
              </li>
            </ul>
            <p>
              Automated tests check for horizontal scrolling at {t.widths.join(', ')}px, plus a
              640px viewport with the root font size at 200%.
            </p>
            <Figure
              name="ws-mobile"
              alt="Workflow Studio on a phone showing the purchase approval as an ordered list of steps"
              caption="The List editor on a 390px-wide screen."
              mobile
            />
          </Section>

          <Section id="accessibility">
            <p>The target was WCAG 2.1 AA. What I implemented:</p>
            <ul>
              <li>
                Skip link, landmarks, one <code>h1</code> per page, and focus moved to the new
                heading after client-side navigation.
              </li>
              <li>
                <strong>Keyboard alternatives for dragging:</strong> Tab to a step, Enter to select
                it, arrow keys to move it, Delete to remove it. Connections are chosen from labelled
                selects (“When ‘Approved’, go to…”), and the List view edits everything without the
                canvas.
              </li>
              <li>
                WAI-ARIA tabs with arrow, Home and End keys, for both the view switcher and the side
                panel.
              </li>
              <li>
                Dialogs trap focus, start on the first field, close with Escape, and return focus to
                whatever opened them.
              </li>
              <li>
                Fields have labels, hints and inline errors linked through{' '}
                <code>aria-describedby</code> and <code>aria-invalid</code>.
              </li>
              <li>
                Saves, new connections and each simulation step are announced through polite live
                regions.
              </li>
              <li>
                Status, severity, outcomes and branch meanings use text and icons, never colour
                alone.
              </li>
              <li>
                3px focus rings and contrast-checked tokens in both themes, and transitions disabled
                under <code>prefers-reduced-motion</code>.
              </li>
            </ul>
            <h3>Issues found and fixed during testing</h3>
            <ul>
              <li>
                axe reported <code>label-content-name-mismatch</code> on the “Open editor” links.
                Their accessible names now begin with the visible text.
              </li>
              <li>
                A visually hidden label inside the scrolling mobile palette escaped its container
                and caused horizontal scrolling at 320px. Buttons now create their own positioning
                context.
              </li>
              <li>
                Dialogs opened from ordinary buttons didn’t return focus on close, so I added
                explicit focus restoration.
              </li>
              <li>
                The status filter’s accessible names were lowercase because capitalisation was
                CSS-only. The labels are now real text.
              </li>
            </ul>
            <p>
              <strong>Honest limits:</strong> automated checks can’t prove conformance. I tested
              keyboard use directly and in Playwright, but I haven’t yet tested with NVDA, JAWS or
              VoiceOver. Dragging an edge on the canvas is pointer-only by nature; the Connections
              selects and the List view are its equivalents.
            </p>
          </Section>

          <Section id="implementation">
            <ul>
              <li>
                <strong>Stack:</strong> {ws.stack.join(', ')}, all on current stable releases.
                TypeScript runs in strict mode with <code>noUncheckedIndexedAccess</code>.
              </li>
              <li>
                <strong>Validation</strong> is one pure function. It covers start and end rules,
                broken or duplicate connections, required outputs per step type, required roles,
                condition types, reachability from Start (a forward search), the ability to reach an
                End (a reverse search from End steps), and cycle detection that ignores Returned
                branches.
              </li>
              <li>
                <strong>Simulation</strong> is a small state machine: <code>startSimulation</code>{' '}
                runs automatic steps until a person must act; <code>act</code> records the action
                and continues. A 200-step guard stops runaway loops.
              </li>
              <li>
                <strong>Theming:</strong> semantic CSS custom properties redefined under{' '}
                <code>[data-theme=&quot;dark&quot;]</code>, mapped into Tailwind and XYFlow
                variables. An inline head script applies the saved or system theme before first
                paint, and <code>matchMedia</code> keeps System in sync live.
              </li>
              <li>
                <strong>Performance:</strong> the editor route, the canvas, the form dialogs and the
                Zod validator all load on demand, so the workflow list loads about 129 kB of gzipped
                JavaScript.
              </li>
              <li>
                <strong>Import safety:</strong> files over 1 MB are refused, and JSON is checked
                with Zod (types, limits, duplicate ids) before anything is stored.
              </li>
            </ul>
          </Section>

          <Section id="testing">
            <Table
              caption="Automated test coverage"
              head={['Layer', 'Tooling', 'What is covered']}
              rows={[
                [
                  'Unit',
                  'Vitest',
                  `Validation rules, the simulation engine (including the ₹85,000 route), connection rules, JSON round-trip, stores, undo/redo, theme resolution`,
                ],
                [
                  'Component',
                  'React Testing Library',
                  'Workflow list filters, empty states, delete confirmation, theme switcher semantics',
                ],
                [
                  'End-to-end',
                  'Playwright',
                  'Create, connect, publish, reload; blocked publishing; rename, duplicate, delete; export and import; undo, redo and guards; canvas mouse and keyboard; simulations',
                ],
                [
                  'Accessibility',
                  'axe-core + Playwright',
                  'List, dialogs, about, canvas, properties with errors, List view, simulation in progress and complete, all in light and dark',
                ],
                [
                  'Responsive',
                  'Playwright',
                  `No horizontal scrolling at ${t.widths.join(', ')}px; 200% text; List view on phones`,
                ],
              ]}
            />
            <p>
              Latest local run: <strong>{t.unitTests} unit and component tests</strong> in{' '}
              {t.unitFiles} files, and <strong>{t.e2eTests} Playwright tests</strong>, all passing,
              with <strong>{t.axeViolations} axe violations</strong> (WCAG 2.0/2.1 A and AA rules).
              GitHub Actions runs lint, type-check, unit tests, build and end-to-end tests on every
              push.
            </p>
            {ws.lighthouse ? (
              <>
                <h3>Lighthouse (local production build)</h3>
                <Table
                  caption="Lighthouse scores"
                  head={['Page', 'Performance', 'Accessibility', 'Best practices', 'SEO']}
                  rows={ws.lighthouse.map((r) => [
                    r.page,
                    r.performance,
                    r.accessibility,
                    r.bestPractices,
                    r.seo,
                  ])}
                />
                <p>{ws.lighthouseNote}</p>
              </>
            ) : null}
          </Section>

          <Section id="screenshots">
            <p>
              These are real screenshots captured from the production build by a Playwright script
              in the repository. They follow your colour theme.
            </p>
            <Figure
              name="ws-list"
              alt="Workflow list with five workflows showing published and draft badges, step counts and validation summaries"
              caption="Workflow list with status filter, validation summary and per-workflow actions."
            />
            <Figure
              name="ws-editor"
              alt="Editor with the purchase approval workflow and the decision step selected"
              caption="Editing the decision: condition fields, plain-language preview and Connections selects."
            />
            <Figure
              name="ws-validation"
              alt="IT change request with one error: choose an approver role for Emergency approval"
              caption="Validation: the problem step is highlighted and the Issues tab explains the fix."
            />
          </Section>

          <Section id="limitations">
            <ul>
              <li>
                Storage is per browser (<code>localStorage</code>). There is no backend, sign-in,
                sharing or real-time collaboration.
              </li>
              <li>
                Notifications and tasks are simulated; nothing is sent to real people or systems.
              </li>
              <li>
                Branching is exclusive (one path at a time). Parallel approvals (“all of” or “any
                of”) are not modelled.
              </li>
              <li>
                Roles are a fixed list, and conditions use four request fields with one comparison
                each.
              </li>
              <li>
                There is no automatic layout. Step positions are manual, and dense workflows can
                need tidying.
              </li>
              <li>Screen-reader testing with real assistive technology has not been done yet.</li>
            </ul>
          </Section>

          <Section id="future">
            <ul>
              <li>
                An API and database for shared workflows, with authentication and role-based
                permissions.
              </li>
              <li>Parallel branches and join steps; compound conditions (AND/OR).</li>
              <li>Automatic layout (for example ELK) and alignment guides.</li>
              <li>A version history with visual diff and rollback between published versions.</li>
              <li>SLA tracking and escalation paths in simulation.</li>
              <li>
                Moderated usability sessions and NVDA/VoiceOver testing to validate the assumptions
                above.
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={ws.repo} className="btn btn-primary">
                <Github size={17} aria-hidden="true" /> Read the source
              </a>
              <Link to="/" className="btn">
                <ArrowLeft size={17} aria-hidden="true" /> Back to home
              </Link>
            </div>
          </Section>
        </div>
      </div>
    </article>
  );
}
