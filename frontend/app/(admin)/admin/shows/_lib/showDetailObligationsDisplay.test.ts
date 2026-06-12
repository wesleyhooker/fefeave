import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HEADING,
  WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HINT,
} from '../../_lib/adminWorkflowCopy.ts';

describe('show detail vendor obligations copy', () => {
  it('uses vendor obligations wording without payment status labels', () => {
    assert.equal(
      WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HEADING,
      'Vendor obligations',
    );
    assert.match(
      WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HINT,
      /Vendor payments are recorded from Vendor Detail/i,
    );
    assert.doesNotMatch(WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HINT, /\bPaid\b/i);
  });

  it('does not render Paid on obligation rows in ShowDetailView', () => {
    const source = readFileSync(
      new URL('../[id]/ShowDetailView.tsx', import.meta.url),
      'utf8',
    );
    assert.ok(source.includes('WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HEADING'));
    assert.ok(source.includes('WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HINT'));
    assert.doesNotMatch(source, />\s*Paid\s*</);
    assert.doesNotMatch(source, /amountPaid/);
  });
});
