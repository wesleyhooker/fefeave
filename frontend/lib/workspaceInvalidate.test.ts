import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  WORKSPACE_INVALIDATE_EVENT,
  dispatchWorkspaceInvalidate,
} from './workspaceInvalidate.ts';

describe('workspaceInvalidate', () => {
  it('exports the workspace invalidate event name', () => {
    assert.equal(WORKSPACE_INVALIDATE_EVENT, 'fefeave:workspace-invalidate');
  });

  it('dispatchWorkspaceInvalidate is a no-op without window', () => {
    assert.doesNotThrow(() => dispatchWorkspaceInvalidate());
  });
});
