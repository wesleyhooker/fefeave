/**
 * Fired after workspace domain mutations (payments, show close, purchases, etc.).
 * Listeners refetch attention signals and notification unread state without polling.
 */
export const WORKSPACE_INVALIDATE_EVENT = 'fefeave:workspace-invalidate';

export function dispatchWorkspaceInvalidate(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(WORKSPACE_INVALIDATE_EVENT));
}
