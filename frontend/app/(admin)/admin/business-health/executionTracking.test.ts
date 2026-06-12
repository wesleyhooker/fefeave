import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeExecutionRemaining,
  deriveExecutionRowStatus,
  executionRowStatusLabel,
  toMoneyNum,
} from './executionTracking';

test('toMoneyNum parses amounts', () => {
  assert.equal(toMoneyNum('100.50'), 100.5);
  assert.equal(toMoneyNum(null), 0);
});

test('computeExecutionRemaining never goes negative', () => {
  assert.equal(computeExecutionRemaining(100, 40), 60);
  assert.equal(computeExecutionRemaining(50, 80), 0);
});

test('deriveExecutionRowStatus follows period plan rules', () => {
  assert.equal(deriveExecutionRowStatus(100, 0, 100), 'not_started');
  assert.equal(deriveExecutionRowStatus(100, 40, 60), 'partial');
  assert.equal(deriveExecutionRowStatus(100, 100, 0), 'complete');
  assert.equal(deriveExecutionRowStatus(0, 0, 0), 'no_target');
});

test('executionRowStatusLabel uses owner-specific partial wording', () => {
  assert.equal(
    executionRowStatusLabel('partial', 'owner_payout'),
    'Partially paid',
  );
  assert.equal(
    executionRowStatusLabel('partial', 'set_aside'),
    'Partially set aside',
  );
});
