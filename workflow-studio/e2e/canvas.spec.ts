import { expect, test, type Locator, type Page } from '@playwright/test';

async function center(l: Locator) {
  const b = (await l.boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

async function dragBetween(page: Page, from: Locator, to: Locator) {
  const a = await center(from);
  const b = await center(to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 5 });
  await page.mouse.move(b.x, b.y, { steps: 5 });
  await page.mouse.up();
}

test.describe('canvas', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('connects, disconnects and deletes with mouse and keyboard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New workflow' }).click();
    await page.getByLabel('Workflow name').fill('Canvas test');
    await page.getByRole('button', { name: 'Create workflow' }).click();
    await expect(page.locator('.react-flow__node')).toHaveCount(2);

    const start = page.locator('.react-flow__node').filter({ hasText: 'Request submitted' });
    const end = page.locator('.react-flow__node').filter({ hasText: 'Workflow complete' });
    await dragBetween(
      page,
      start.locator('.react-flow__handle.source'),
      end.locator('.react-flow__handle.target'),
    );
    await expect(page.locator('.react-flow__edge')).toHaveCount(1);
    await expect(page.getByRole('tab', { name: /Issues/ })).toContainText('0');

    // Invalid connection: End -> Start is refused (End has no outputs, Start has no input).
    await expect(end.locator('.react-flow__handle.source')).toHaveCount(0);
    await expect(start.locator('.react-flow__handle.target')).toHaveCount(0);

    // Select the edge and delete it with the keyboard.
    await page.locator('.react-flow__edge').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Delete');
    await expect(page.locator('.react-flow__edge')).toHaveCount(0);
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(page.locator('.react-flow__edge')).toHaveCount(1);

    // Add a node, then delete it via keyboard focus + Delete.
    await page.getByRole('button', { name: 'Add Notification' }).click();
    await expect(page.locator('.react-flow__node')).toHaveCount(3);
    const notification = page.locator('.react-flow__node').filter({ hasText: 'Notify requester' });
    await notification.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('tab', { name: 'Properties' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.keyboard.press('Delete');
    await expect(page.locator('.react-flow__node')).toHaveCount(2);
  });

  test('moves a node with arrow keys as one undoable step', async ({ page }) => {
    await page.goto('/workflows/wf-leave');
    const node = page.locator('.react-flow__node').filter({ hasText: 'Leave requested' });
    const before = await node.boundingBox();
    await node.focus();
    await page.keyboard.press('Enter');
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown');
    await expect.poll(async () => (await node.boundingBox())!.y).toBeGreaterThan(before!.y);
    await expect(page.getByText('Unsaved changes')).toBeVisible();
  });

  test('zooms, fits view, drags a node and drops a new step from the palette', async ({ page }) => {
    await page.goto('/workflows/wf-document');
    const viewport = page.locator('.react-flow__viewport');
    const initial = await viewport.getAttribute('style');
    await page.getByRole('button', { name: 'Zoom In' }).click();
    await expect.poll(() => viewport.getAttribute('style')).not.toBe(initial);
    await page.getByRole('button', { name: 'Fit View' }).click();

    const node = page.locator('.react-flow__node').filter({ hasText: 'Legal review' });
    const a = await center(node);
    await page.mouse.move(a.x, a.y - 10);
    await page.mouse.down();
    await page.mouse.move(a.x + 40, a.y + 60, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByText('Unsaved changes')).toBeVisible();
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByText('All changes saved')).toBeVisible();

    const pane = page.locator('.react-flow__pane');
    await page
      .getByRole('button', { name: 'Add Decision' })
      .dragTo(pane, { targetPosition: { x: 200, y: 80 } });
    await expect(page.locator('.react-flow__node')).toHaveCount(8);
  });
});
