import {
  classifyPaymentDrift,
  paymentDriftReconcileIdempotencyKey,
} from '../services/payment-drift';

describe('payment-drift', () => {
  const basePayment = {
    deleted_at: null as Date | null,
    amount: '100',
    payment_date: '2026-01-01',
    reference: 'A',
    notes: null as string | null,
  };

  test('paymentDriftReconcileIdempotencyKey is deterministic', () => {
    expect(paymentDriftReconcileIdempotencyKey('pay-1', 'WHOLESALER_PAYMENT_CORRECTED')).toBe(
      'backfill:payments:pay-1:WHOLESALER_PAYMENT_CORRECTED:reconcile'
    );
  });

  test('classifyPaymentDrift returns null when in sync', () => {
    expect(
      classifyPaymentDrift(basePayment, {
        source_id: 'p1',
        event_type: 'WHOLESALER_PAYMENT_RECORDED',
        amount: '100',
        effective_date: '2026-01-01',
        payload: {
          amount: 100,
          payment_date: '2026-01-01',
          reference: 'A',
          notes: null,
        },
      })
    ).toBeNull();
  });

  test('classifyPaymentDrift detects value drift', () => {
    expect(
      classifyPaymentDrift(
        { ...basePayment, amount: '90' },
        {
          source_id: 'p1',
          event_type: 'WHOLESALER_PAYMENT_RECORDED',
          amount: '100',
          effective_date: '2026-01-01',
          payload: { amount: 100, payment_date: '2026-01-01' },
        }
      )
    ).toBe('active_value_drift');
  });

  test('classifyPaymentDrift detects missing event', () => {
    expect(classifyPaymentDrift(basePayment, undefined)).toBe('active_missing_event');
  });

  test('classifyPaymentDrift detects deleted without void', () => {
    expect(
      classifyPaymentDrift(
        { ...basePayment, deleted_at: new Date('2026-02-01') },
        {
          source_id: 'p1',
          event_type: 'WHOLESALER_PAYMENT_RECORDED',
          amount: '100',
          effective_date: '2026-01-01',
          payload: {},
        }
      )
    ).toBe('deleted_not_voided');
  });

  test('classifyPaymentDrift returns null when deleted and voided', () => {
    expect(
      classifyPaymentDrift(
        { ...basePayment, deleted_at: new Date('2026-02-01') },
        {
          source_id: 'p1',
          event_type: 'WHOLESALER_PAYMENT_VOIDED',
          amount: '100',
          effective_date: '2026-01-01',
          payload: {},
        }
      )
    ).toBeNull();
  });

  test('classifyPaymentDrift flags active row with voided latest event', () => {
    expect(
      classifyPaymentDrift(basePayment, {
        source_id: 'p1',
        event_type: 'WHOLESALER_PAYMENT_VOIDED',
        amount: '100',
        effective_date: '2026-01-01',
        payload: {},
      })
    ).toBe('active_latest_voided');
  });
});
