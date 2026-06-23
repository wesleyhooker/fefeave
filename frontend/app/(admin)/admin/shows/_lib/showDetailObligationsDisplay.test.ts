import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  WORKFLOW_SHOW_VENDOR_OBLIGATIONS_EMPTY_HINT,
  WORKFLOW_SHOW_VENDOR_OBLIGATIONS_EMPTY_TITLE,
  WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HEADING,
  WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HINT,
} from '../../_lib/adminWorkflowCopy.ts';

describe('show detail vendor obligations copy', () => {
  it('uses vendor obligations wording without payment status labels', () => {
    assert.equal(
      WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HEADING,
      'Vendor Obligations',
    );
    assert.match(WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HINT, /this show’s payout/i);
    assert.match(WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HINT, /Purchases/i);
    assert.match(
      WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HINT,
      /Vendor payments are recorded from Vendor Detail/i,
    );
    assert.doesNotMatch(WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HINT, /\bPaid\b/i);
  });

  it('empty state copy treats zero obligations as valid', () => {
    assert.equal(
      WORKFLOW_SHOW_VENDOR_OBLIGATIONS_EMPTY_TITLE,
      'No vendor obligations for this show.',
    );
    assert.match(
      WORKFLOW_SHOW_VENDOR_OBLIGATIONS_EMPTY_HINT,
      /this show’s payout/i,
    );
    assert.match(WORKFLOW_SHOW_VENDOR_OBLIGATIONS_EMPTY_HINT, /Purchases/i);
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
