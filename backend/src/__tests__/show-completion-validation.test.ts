import { ValidationError } from '../utils/errors';
import {
  assertShowCanComplete,
  CLOSE_REQUIRES_PAYOUT_MESSAGE,
} from '../services/show-completion-validation';

describe('show-completion-validation', () => {
  it('rejects close when show has no financials row', async () => {
    const client = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };
    await expect(assertShowCanComplete(client as never, 'show-id')).rejects.toThrow(
      ValidationError
    );
    await expect(assertShowCanComplete(client as never, 'show-id')).rejects.toThrow(
      CLOSE_REQUIRES_PAYOUT_MESSAGE
    );
  });

  it('rejects close when payout is zero or negative', async () => {
    const client = {
      query: jest.fn().mockResolvedValue({
        rows: [{ payout_after_fees_amount: '0' }],
      }),
    };
    await expect(assertShowCanComplete(client as never, 'show-id')).rejects.toThrow(
      CLOSE_REQUIRES_PAYOUT_MESSAGE
    );
  });

  it('allows close when payout is positive', async () => {
    const client = {
      query: jest.fn().mockResolvedValue({
        rows: [{ payout_after_fees_amount: '1500.00' }],
      }),
    };
    await expect(assertShowCanComplete(client as never, 'show-id')).resolves.toBeUndefined();
  });
});
