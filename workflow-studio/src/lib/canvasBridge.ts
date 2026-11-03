import type { ReactFlowInstance } from '@xyflow/react';

/** Lets toolbars and panels outside the canvas drive the viewport. */
let instance: ReactFlowInstance | null = null;

export const canvasBridge = {
  set(next: ReactFlowInstance | null) {
    instance = next;
  },
  get ready() {
    return instance !== null;
  },
  focusNode(id: string) {
    const node = instance?.getNode(id);
    if (!instance || !node) return;
    const w = node.measured?.width ?? 220;
    const h = node.measured?.height ?? 100;
    void instance.setCenter(node.position.x + w / 2, node.position.y + h / 2, {
      zoom: 1.1,
      duration: 250,
    });
  },
  /** Flow coordinates for the middle of the visible canvas, if the canvas is mounted. */
  viewportCenter(element: HTMLElement | null): { x: number; y: number } | null {
    if (!instance || !element) return null;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0) return null;
    const p = instance.screenToFlowPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    return {
      x: p.x - 110 + Math.round(Math.random() * 40),
      y: p.y - 40 + Math.round(Math.random() * 40),
    };
  },
};
