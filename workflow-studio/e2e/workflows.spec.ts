import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import { openSidePanel } from './helpers';

test.describe('workflow management', () => {
  test('creates, edits, connects, validates, saves and publishes a workflow', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New workflow' }).click();
    const dialog = page.getByRole('dialog', { name: 'New workflow' });
    await dialog.getByRole('button', { name: 'Create workflow' }).click();
    await expect(dialog.getByText('Enter a workflow name.')).toBeVisible();
    await dialog.getByLabel('Workflow name').fill('Laptop request');
    await dialog.getByRole('button', { name: 'Create workflow' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Laptop request' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Issues/ })).toContainText('4 errors');

    // Add an approval via the palette and configure it from the keyboard-accessible form.
    await page.getByRole('button', { name: 'Add Approval' }).click();
    const props = page.getByRole('tabpanel');
    await props.getByLabel('Step name').fill('IT approval');
    await expect(props.getByText('Choose an approver role.')).toBeVisible();
    await props.getByLabel('Approver role').selectOption('IT Change Board');
    await props
      .getByLabel('When “Approved”, go to')
      .selectOption({ label: 'End: Workflow complete' });
    await props
      .getByLabel('When “Rejected”, go to')
      .selectOption({ label: 'End: Workflow complete' });

    // Connect Start -> approval from the List view.
    await page.getByRole('tab', { name: 'List' }).click();
    await page.getByRole('button', { name: 'Edit Request submitted' }).click();
    await page.getByLabel('Then go to').selectOption({ label: 'Approval: IT approval' });

    await openSidePanel(page, 'Issues');
    await expect(page.getByText('This workflow passes validation.')).toBeVisible();
    await expect(page.getByText('Unsaved changes')).toBeVisible();

    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Published “Laptop request” as version 1.')).toBeVisible();
    await expect(page.getByText('Published v1')).toBeVisible();
    await expect(page.getByText('All changes saved')).toBeVisible();

    // Survives a reload (browser persistence).
    await page.reload();
    await page.getByRole('tab', { name: 'List' }).click();
    await expect(page.getByRole('heading', { name: 'IT approval' })).toBeVisible();
    await expect(page.getByText('Published v1')).toBeVisible();
  });

  test('blocks publishing an invalid workflow and guides the fix', async ({ page }) => {
    await page.goto('/workflows/wf-change');
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText(/Can’t publish yet: 1 error needs fixing/)).toBeVisible();
    await expect(page.getByText('Choose an approver role for “Emergency approval”.')).toBeVisible();
    await page.getByRole('button', { name: 'Show step' }).click();
    await page.getByRole('tabpanel').getByLabel('Approver role').selectOption('Department Head');
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Published “IT change request” as version 1.')).toBeVisible();
  });

  test('renames, duplicates and deletes from the list', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Rename Leave approval' }).click();
    await page.getByLabel('Workflow name').fill('Leave approval (India)');
    await page.getByRole('button', { name: 'Save name' }).click();
    await expect(page.getByRole('heading', { name: 'Leave approval (India)' })).toBeVisible();

    await page.getByRole('button', { name: 'Duplicate Leave approval (India)' }).click();
    await expect(
      page.getByRole('heading', { name: 'Leave approval (India) (copy)' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Delete Leave approval (India) (copy)' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete workflow' }).click();
    await expect(page.getByRole('heading', { name: 'Leave approval (India) (copy)' })).toHaveCount(
      0,
    );
  });

  test('exports and imports JSON, and rejects invalid files', async ({ page }, testInfo) => {
    await page.goto('/');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export Purchase approval as JSON' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('purchase-approval.workflow.json');
    const file = testInfo.outputPath('export.json');
    await download.saveAs(file);
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(json).toMatchObject({
      format: 'workflow-studio',
      version: 1,
      workflow: { name: 'Purchase approval' },
    });

    json.workflow.name = 'Imported purchase approval';
    const edited = testInfo.outputPath('edited.json');
    fs.writeFileSync(edited, JSON.stringify(json));
    await page.getByTestId('import-input').setInputFiles(edited);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Imported purchase approval' }),
    ).toBeVisible();
    await expect(page.getByText('Draft', { exact: true })).toBeVisible();

    await page.goto('/');
    const bad = testInfo.outputPath('bad.json');
    fs.writeFileSync(bad, '{"format":"something-else"}');
    await page.getByTestId('import-input').setInputFiles(bad);
    const alert = page.getByRole('alertdialog', { name: 'This file can’t be imported' });
    await expect(alert).toBeVisible();
    await expect(alert.getByRole('listitem').first()).toContainText('format');
  });

  test('undo, redo, discard and the unsaved-changes guard', async ({ page }) => {
    await page.goto('/workflows/wf-leave');
    await page.getByRole('tab', { name: 'List' }).click();
    await page.getByRole('button', { name: 'Edit Manager approval' }).click();
    const name = page.getByRole('tabpanel').getByLabel('Step name');
    await name.fill('Team lead approval');
    await expect(page.getByRole('heading', { name: 'Team lead approval' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(name).toHaveValue('Manager approval');
    await page.getByRole('button', { name: 'Redo' }).click();
    await expect(name).toHaveValue('Team lead approval');

    await page.getByRole('link', { name: 'Back to all workflows' }).click();
    const guard = page.getByRole('alertdialog', { name: 'Leave without saving?' });
    await expect(guard).toBeVisible();
    await guard.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Leave approval' })).toBeVisible();

    await page.getByRole('button', { name: 'Discard unsaved changes' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Discard changes' }).click();
    await expect(page.getByText('All changes saved')).toBeVisible();
  });

  test('shows a not-found state for unknown workflows and routes', async ({ page }) => {
    await page.goto('/workflows/does-not-exist');
    await expect(page.getByRole('heading', { name: 'Not found' })).toBeVisible();
    await page.goto('/no/such/page');
    await expect(page.getByRole('heading', { name: 'Not found' })).toBeVisible();
  });
});

test.describe('simulation', () => {
  test('₹85,000 purchase request goes through manager, decision and finance', async ({ page }) => {
    await page.goto('/workflows/wf-purchase');
    await openSidePanel(page, 'Simulate');
    await expect(page.getByLabel('Amount (₹)')).toHaveValue('85000');
    await page.getByRole('button', { name: 'Start simulation' }).click();

    await expect(page.getByText('Waiting for Line Manager')).toBeVisible();
    await page.getByLabel('Comment').fill('Fits the quarterly budget');
    await page.getByRole('button', { name: 'Approve', exact: true }).click();

    await expect(page.getByText('Evaluated condition → Yes')).toBeVisible();
    await expect(
      page.getByText(/Amount \(₹\) > ₹50,000 \(Amount \(₹\) is ₹85,000\)/),
    ).toBeVisible();
    await expect(page.getByText('Waiting for Finance Approver')).toBeVisible();
    await page.getByRole('button', { name: 'Approve', exact: true }).click();

    await expect(page.getByText('Outcome: Approved', { exact: true })).toBeVisible();
    const history = page.getByRole('list').filter({ hasText: 'Submitted request' });
    await expect(history.getByRole('listitem')).toHaveCount(6);
    await expect(history).toContainText('Notified Procurement Officer');
    await expect(history).toContainText('Fits the quarterly budget');

    await page.getByRole('button', { name: 'New simulation' }).click();
    await expect(page.getByRole('heading', { name: 'Recent runs' })).toBeVisible();
  });

  test('a ₹20,000 request skips finance; return and reject paths work', async ({ page }) => {
    await page.goto('/workflows/wf-purchase');
    await openSidePanel(page, 'Simulate');
    await page.getByLabel('Amount (₹)').fill('20000');
    await page.getByRole('button', { name: 'Start simulation' }).click();
    await page.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect(page.getByText('Evaluated condition → No')).toBeVisible();
    await expect(page.getByText('Outcome: Approved', { exact: true })).toBeVisible();
    await expect(page.getByText('Waiting for Finance Approver')).toHaveCount(0);

    await page.getByRole('button', { name: 'New simulation' }).click();
    await page.getByRole('button', { name: 'Start simulation' }).click();
    await page.getByRole('button', { name: 'Return for changes' }).click();
    await expect(page.getByText('Waiting for Requester')).toBeVisible();
    await page.getByRole('button', { name: 'Mark task complete' }).click();
    await expect(page.getByText('Waiting for Line Manager')).toBeVisible();
    await page.getByRole('button', { name: 'Reject', exact: true }).click();
    await expect(page.getByText('Outcome: Rejected', { exact: true })).toBeVisible();
  });

  test('validates the request form and refuses to simulate invalid workflows', async ({ page }) => {
    await page.goto('/workflows/wf-purchase');
    await openSidePanel(page, 'Simulate');
    await page.getByLabel('Request title').fill('');
    await page.getByLabel('Amount (₹)').fill('-5');
    await page.getByRole('button', { name: 'Start simulation' }).click();
    await expect(page.getByText('Enter a request title.')).toBeVisible();
    await expect(page.getByText('Amount cannot be negative.')).toBeVisible();

    await page.goto('/workflows/wf-change');
    await openSidePanel(page, 'Simulate');
    await expect(page.getByText('Fix validation errors before simulating.')).toBeVisible();
  });
});
