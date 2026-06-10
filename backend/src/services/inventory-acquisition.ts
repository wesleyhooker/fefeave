/**
 * Unified inventory acquisition — single write path for paid-now and owe-vendor flows.
 */
import type { PoolClient } from 'pg';
import {
  DEFAULT_INVENTORY_PAYMENT_STATUS,
  type InventoryPaymentStatus,
} from '../constants/inventory-acquisition';
import { NotFoundError } from '../utils/errors';
import {
  emitInventoryPurchaseRecorded,
  emitSettlementCreated,
  vendorExpenseEffectiveDate,
} from './financial-event-emission';

export type InventoryAcquisitionRow = {
  id: string;
  purchase_date: string;
  amount: string;
  notes: string | null;
  supplier: string | null;
  category: string | null;
  purchase_type: string | null;
  payment_status: InventoryPaymentStatus;
  wholesaler_id: string | null;
  vendor_obligation_id: string | null;
  created_at: Date;
};

export type CreateInventoryAcquisitionInput = {
  purchase_date: string;
  amount: number;
  notes?: string | null;
  supplier?: string | null;
  category?: string | null;
  purchase_type?: string | null;
  payment_status?: InventoryPaymentStatus;
  wholesaler_id?: string | null;
  created_by: string;
  actor_user_id: string | null;
};

function buildAcquisitionObligationDescription(input: {
  category: string | null;
  purchase_type: string | null;
  notes: string | null;
  supplier: string | null;
}): string {
  const parts = ['Inventory purchase'];
  if (input.supplier?.trim()) parts.push(input.supplier.trim());
  if (input.category) parts.push(input.category);
  if (input.purchase_type) parts.push(input.purchase_type);
  if (input.notes?.trim()) parts.push(input.notes.trim());
  return parts.join(' · ');
}

async function resolveWholesalerAccountId(
  client: PoolClient,
  wholesalerId: string
): Promise<string> {
  const wholesalerCheck = await client.query(
    `SELECT id FROM wholesalers WHERE id = $1 AND deleted_at IS NULL`,
    [wholesalerId]
  );
  if (wholesalerCheck.rows.length === 0) {
    throw new NotFoundError('Wholesaler', wholesalerId);
  }

  const accountResult = await client.query(
    `SELECT id
     FROM accounts
     WHERE type = 'WHOLESALER'
       AND legacy_wholesaler_id = $1
       AND deleted_at IS NULL
     LIMIT 1`,
    [wholesalerId]
  );
  if (accountResult.rows.length === 0) {
    throw new NotFoundError('Account', `mapped from wholesaler ${wholesalerId}`);
  }
  return (accountResult.rows[0] as { id: string }).id;
}

/**
 * Record inventory acquisition in one transaction.
 * PAID_NOW: inventory row + INVENTORY_PURCHASE_RECORDED (OUTFLOW).
 * OWE_VENDOR: inventory row + vendor obligation + events (inventory NEUTRAL, settlement NEUTRAL).
 */
export async function createInventoryAcquisition(
  client: PoolClient,
  input: CreateInventoryAcquisitionInput
): Promise<InventoryAcquisitionRow> {
  const paymentStatus = input.payment_status ?? DEFAULT_INVENTORY_PAYMENT_STATUS;
  const wholesalerId = paymentStatus === 'OWE_VENDOR' ? (input.wholesaler_id ?? null) : null;

  const insertResult = await client.query(
    `INSERT INTO inventory_purchases (
       purchase_date, amount, notes, supplier, category, purchase_type,
       payment_status, wholesaler_id
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, purchase_date, amount, notes, supplier, category, purchase_type,
               payment_status, wholesaler_id, vendor_obligation_id, created_at`,
    [
      input.purchase_date,
      input.amount,
      input.notes ?? null,
      input.supplier ?? null,
      input.category ?? null,
      input.purchase_type ?? null,
      paymentStatus,
      wholesalerId,
    ]
  );

  let row = insertResult.rows[0] as InventoryAcquisitionRow;

  if (paymentStatus === 'OWE_VENDOR' && wholesalerId) {
    const accountId = await resolveWholesalerAccountId(client, wholesalerId);
    const description = buildAcquisitionObligationDescription({
      category: input.category ?? null,
      purchase_type: input.purchase_type ?? null,
      notes: input.notes ?? null,
      supplier: input.supplier ?? null,
    });

    const obligationResult = await client.query(
      `INSERT INTO owed_line_items (
         show_id, wholesaler_id, account_id, amount, currency, description, due_date, status,
         created_by, created_via, obligation_kind, calculation_method
       )
       VALUES (NULL, $1, $2, $3, 'USD', $4, $5, 'PENDING', $6, 'API', 'VENDOR_EXPENSE', NULL)
       RETURNING id, show_id, wholesaler_id, account_id, amount, currency, description, due_date,
                 obligation_kind, created_at, updated_at`,
      [wholesalerId, accountId, input.amount, description, input.purchase_date, input.created_by]
    );

    const obligation = obligationResult.rows[0] as {
      id: string;
      show_id: string | null;
      wholesaler_id: string;
      account_id: string;
      amount: string;
      description: string;
      obligation_kind: string;
      due_date: Date | null;
      created_at: Date;
    };

    const linkResult = await client.query(
      `UPDATE inventory_purchases
          SET vendor_obligation_id = $2
        WHERE id = $1
        RETURNING id, purchase_date, amount, notes, supplier, category, purchase_type,
                  payment_status, wholesaler_id, vendor_obligation_id, created_at`,
      [row.id, obligation.id]
    );
    row = linkResult.rows[0] as InventoryAcquisitionRow;

    const effectiveDate = vendorExpenseEffectiveDate(obligation.due_date, obligation.created_at);
    await emitSettlementCreated(
      client,
      {
        id: obligation.id,
        show_id: obligation.show_id,
        wholesaler_id: obligation.wholesaler_id,
        account_id: obligation.account_id,
        amount: obligation.amount,
        description: obligation.description,
        obligation_kind: obligation.obligation_kind,
        due_date: obligation.due_date,
      },
      effectiveDate,
      input.actor_user_id,
      { inventory_purchase_id: row.id, acquisition_payment_status: paymentStatus }
    );
  }

  await emitInventoryPurchaseRecorded(client, row, input.actor_user_id);
  return row;
}
