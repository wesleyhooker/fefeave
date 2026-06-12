import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  WORKFLOW_SHOW_CLOSED_ROW_SUCCESS_DETAIL,
  WORKFLOW_SHOW_CLOSED_ROW_SUCCESS_HEADLINE,
} from '../../_lib/adminWorkflowCopy.ts';

describe('show close success row copy', () => {
  it('communicates success, locked state, and weekly profit impact', () => {
    assert.match(
      WORKFLOW_SHOW_CLOSED_ROW_SUCCESS_HEADLINE,
      /closed successfully/i,
    );
    assert.match(
      WORKFLOW_SHOW_CLOSED_ROW_SUCCESS_DETAIL,
      /Completed — locked/i,
    );
    assert.match(
      WORKFLOW_SHOW_CLOSED_ROW_SUCCESS_DETAIL,
      /Profit counts toward this week's totals/i,
    );
  });

  it('renders a checkmark in the row success note', () => {
    const source = readFileSync(
      new URL('../_components/ShowCloseSuccessRowNote.tsx', import.meta.url),
      'utf8',
    );
    assert.ok(source.includes('CheckCircleIcon'));
    assert.ok(source.includes('WORKFLOW_SHOW_CLOSED_ROW_SUCCESS_HEADLINE'));
  });
});
