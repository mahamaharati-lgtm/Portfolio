import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkflows } from '../../store/workflows';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { ThemeSwitcher } from '../../theme/ThemeSwitcher';
import { WorkflowsPage } from '../WorkflowsPage';

beforeEach(() => {
  localStorage.clear();
  useWorkflows.getState().resetDemoData();
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

function renderPage() {
  const router = createMemoryRouter([
    { path: '/', element: <WorkflowsPage /> },
    { path: '/workflows/:id', element: <p>Editor</p> },
  ]);
  return render(
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>,
  );
}

describe('WorkflowsPage', () => {
  it('lists the example workflows with status and validation', () => {
    renderPage();
    const list = screen.getByRole('list', { name: 'Workflows' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByRole('heading', { name: 'Purchase approval' })).toBeInTheDocument();
    expect(screen.getByText('Published v3')).toBeInTheDocument();
    expect(screen.getByText('1 issue to fix')).toBeInTheDocument();
  });

  it('filters by search text and status, with an empty state', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Search workflows'), 'leave');
    expect(
      within(screen.getByRole('list', { name: 'Workflows' })).getAllByRole('listitem'),
    ).toHaveLength(1);
    await user.clear(screen.getByLabelText('Search workflows'));
    await user.click(screen.getByLabelText(/^Published/));
    expect(
      within(screen.getByRole('list', { name: 'Workflows' })).getAllByRole('listitem'),
    ).toHaveLength(2);
    await user.type(screen.getByLabelText('Search workflows'), 'zzz');
    expect(screen.getByRole('heading', { name: 'No matching workflows' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(
      within(screen.getByRole('list', { name: 'Workflows' })).getAllByRole('listitem'),
    ).toHaveLength(5);
  });

  it('shows an empty state when every workflow is deleted', async () => {
    useWorkflows.setState({ workflows: [] });
    renderPage();
    expect(screen.getByRole('heading', { name: 'No workflows yet' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Restore examples/ }));
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('confirms before deleting', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Delete Leave approval' }));
    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByText(/cannot be undone/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Delete workflow' }));
    expect(screen.queryByRole('heading', { name: 'Leave approval' })).not.toBeInTheDocument();
  });
});

describe('ThemeSwitcher', () => {
  it('exposes a labelled radio group and persists the choice', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    );
    expect(screen.getByRole('group', { name: 'Colour theme' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(localStorage.getItem('ws-theme')).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
