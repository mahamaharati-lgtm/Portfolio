import { Link } from 'react-router';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const SHORTCUTS: [string, string][] = [
  ['Tab / Shift+Tab', 'Move between steps, toolbar buttons and panels'],
  ['Enter or Space (on a step)', 'Select the step and edit it in Properties'],
  ['Arrow keys (step selected)', 'Move the step on the canvas'],
  ['Delete or Backspace', 'Delete the selected step or connection'],
  ['Ctrl/⌘ + Z', 'Undo'],
  ['Ctrl/⌘ + Shift + Z, or Ctrl + Y', 'Redo'],
  ['Ctrl/⌘ + S', 'Save the workflow'],
  ['Arrow keys (in a tab list)', 'Switch tabs'],
];

export function AboutPage() {
  useDocumentTitle('About');
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mt-0 text-3xl font-bold">About Workflow Studio</h1>
      <p className="text-lg text-muted">
        Workflow Studio is a portfolio project: a browser-based builder for approval workflows such
        as purchase, leave, expense, document and IT change requests.
      </p>

      <h2 className="mt-8 text-xl font-semibold">What you can do</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Create, rename, duplicate, delete, import and export workflows.</li>
        <li>
          Build a workflow on a canvas with Start, Task, Approval, Decision, Notification and End
          steps.
        </li>
        <li>Configure approver roles, decision conditions and notification recipients.</li>
        <li>Validate the workflow against business rules and publish it when it is valid.</li>
        <li>Simulate a request, acting as each approver, and review the full request history.</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Try the example</h2>
      <p>
        Open <Link to="/workflows/wf-purchase">Purchase approval</Link>, choose{' '}
        <strong>Simulate</strong>, and start the prefilled request for ₹85,000. The manager
        approves, the decision sends it to finance because it is above ₹50,000, and procurement is
        notified once finance approves.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Keyboard shortcuts</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Keyboard shortcuts</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-4">
                Keys
              </th>
              <th scope="col" className="py-2">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map(([keys, action]) => (
              <tr key={keys} className="border-b border-line">
                <td className="py-2 pr-4 font-mono text-xs">{keys}</td>
                <td className="py-2">{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">
        Connections can be made without dragging: select a step and use the{' '}
        <strong>Connections</strong> section in Properties. The <strong>List</strong> view presents
        the same workflow as an ordered list and is the default on phones.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Limitations</h2>
      <p>
        This is a front-end demonstration, not a production system. Data is stored in your browser’s
        local storage, so it is not shared between devices or people. There is no authentication,
        real notification delivery, or audit backend. Simulations run on your current draft entirely
        in the browser.
      </p>
    </div>
  );
}
