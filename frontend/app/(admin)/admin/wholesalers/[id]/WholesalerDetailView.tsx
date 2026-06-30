"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BALANCES_PAGE_BREADCRUMB } from "@/app/(admin)/admin/_lib/adminSidebarNav";
import { AdminWorkspacePageLayout } from "@/app/(admin)/admin/_components/AdminWorkspacePageLayout";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import { workspaceEntityPageHeader } from "@/app/(admin)/admin/_lib/workspaceEntityPageHeader";
import { VendorDetailBackLink } from "./_components/VendorDetailBackLink";
import { VendorDetailHero } from "./_components/VendorDetailHero";
import { VendorDetailRecordPaymentCard } from "./_components/VendorDetailRecordPaymentCard";
import { VendorDetailLedgerCard } from "./_components/VendorDetailLedgerCard";
import { VendorDetailAttachmentsCard } from "./_components/VendorDetailAttachmentsCard";
import {
  VENDOR_DETAIL_PAGE_GRID,
  VENDOR_DETAIL_PAGE_STACK,
  VENDOR_DETAIL_PRIMARY_COLUMN,
  VENDOR_DETAIL_RAIL_COLUMN,
} from "./_lib/vendorDetailLayout";
import {
  fetchVendorDetailAttachments,
  type VendorDetailAttachmentRow,
} from "./_lib/vendorDetailAttachments";
import type { VendorExpenseEditDraft } from "./WholesalerInlineExpenseSection";
import {
  fetchWholesalerBalances,
  fetchWholesalerStatement,
  mapBalanceRowToListView,
  mapStatementRowToDetailView,
  type WholesalerListRowView,
  type WholesalerStatementRowView,
} from "@/src/lib/api/wholesalers";
import { fetchPayments, type PaymentDTO } from "@/src/lib/api/payments";
import { dispatchVendorBalancesInvalidate } from "@/lib/vendorBalancesInvalidate";
import {
  VENDOR_LEDGER_EXPENSE_QUERY,
  VENDOR_LEDGER_PAYMENT_QUERY,
} from "@/app/(admin)/admin/_lib/vendorRoutes";

export function WholesalerDetailView({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const [wholesaler, setWholesaler] = useState<WholesalerListRowView | null>(
    null,
  );
  const [statement, setStatement] = useState<WholesalerStatementRowView[]>([]);
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [ledgerExportError, setLedgerExportError] = useState<string | null>(
    null,
  );
  const [statementExportError, setStatementExportError] = useState<
    string | null
  >(null);
  const [payments, setPayments] = useState<PaymentDTO[]>([]);
  const [attachments, setAttachments] = useState<VendorDetailAttachmentRow[]>(
    [],
  );
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [ledgerFocus, setLedgerFocus] = useState<
    | { kind: "PAYMENT"; id: string }
    | { kind: "VENDOR_EXPENSE"; id: string }
    | null
  >(null);

  const toggleExpanded = (entryId: string) => {
    setExpandedEntryIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    if (reloadToken === 0) {
      setLoading(true);
    }
    setError(null);

    Promise.all([
      fetchWholesalerBalances(),
      fetchWholesalerStatement(id),
      fetchPayments({ wholesalerId: id }),
    ])
      .then(([balances, statementRows, paymentRows]) => {
        if (cancelled) return;
        const found = balances
          .map(mapBalanceRowToListView)
          .find((row) => row.id === id);
        setWholesaler(found ?? null);
        setStatement(statementRows.map(mapStatementRowToDetailView));
        setPayments(paymentRows);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    setAttachmentsLoading(true);
    void fetchVendorDetailAttachments({
      vendorId: id,
      payments,
      statement,
    })
      .then((rows) => {
        if (!cancelled) setAttachments(rows);
      })
      .catch(() => {
        if (!cancelled) setAttachments([]);
      })
      .finally(() => {
        if (!cancelled) setAttachmentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, loading, payments, statement]);

  useEffect(() => {
    if (!ledgerFocus) return;
    if (ledgerFocus.kind === "PAYMENT") {
      const exists = payments.some((p) => p.id === ledgerFocus.id);
      if (!exists) setLedgerFocus(null);
      return;
    }
    const exists = statement.some(
      (r) =>
        r.entryId === ledgerFocus.id && r.ledgerEntryKind === "VENDOR_EXPENSE",
    );
    if (!exists) setLedgerFocus(null);
  }, [ledgerFocus, payments, statement]);

  useEffect(() => {
    if (loading) return;
    const paymentId = searchParams.get(VENDOR_LEDGER_PAYMENT_QUERY);
    if (paymentId && payments.some((p) => p.id === paymentId)) {
      setLedgerFocus({ kind: "PAYMENT", id: paymentId });
      return;
    }
    const expenseId = searchParams.get(VENDOR_LEDGER_EXPENSE_QUERY);
    if (
      expenseId &&
      statement.some(
        (r) =>
          r.entryId === expenseId && r.ledgerEntryKind === "VENDOR_EXPENSE",
      )
    ) {
      setLedgerFocus({ kind: "VENDOR_EXPENSE", id: expenseId });
    }
  }, [loading, searchParams, payments, statement]);

  useEffect(() => {
    if (!ledgerFocus) return;
    const anchorId =
      ledgerFocus.kind === "PAYMENT"
        ? "vendor-inline-payment"
        : "vendor-inline-expense";
    document.getElementById(anchorId)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [ledgerFocus]);

  const balance = wholesaler?.balanceOwed ?? 0;

  const editPaymentForForm =
    ledgerFocus?.kind === "PAYMENT"
      ? (payments.find((p) => p.id === ledgerFocus.id) ?? null)
      : null;

  const editExpenseForForm: VendorExpenseEditDraft | null =
    ledgerFocus?.kind === "VENDOR_EXPENSE"
      ? (() => {
          const row = statement.find((r) => r.entryId === ledgerFocus.id);
          if (!row || row.ledgerEntryKind !== "VENDOR_EXPENSE") return null;
          return {
            id: row.entryId,
            amount: row.amountOwed ?? 0,
            description: row.description?.trim() || row.showName || "",
            expense_date: row.date,
          };
        })()
      : null;

  function handleLedgerRowActivate(row: WholesalerStatementRowView) {
    if (row.type === "PAYMENT") {
      setLedgerFocus((prev) =>
        prev?.kind === "PAYMENT" && prev.id === row.entryId
          ? null
          : { kind: "PAYMENT", id: row.entryId },
      );
      return;
    }
    if (row.ledgerEntryKind === "VENDOR_EXPENSE") {
      setLedgerFocus((prev) =>
        prev?.kind === "VENDOR_EXPENSE" && prev.id === row.entryId
          ? null
          : { kind: "VENDOR_EXPENSE", id: row.entryId },
      );
    }
  }

  const vendorDetailPageHeader = workspaceEntityPageHeader({
    leading: <VendorDetailBackLink />,
    title: loading ? (
      "Loading…"
    ) : error ? (
      "Unable to load vendor"
    ) : wholesaler ? (
      <span className="sr-only">{wholesaler.name}</span>
    ) : (
      "Vendor not found"
    ),
  });

  const exportError = statementExportError ?? ledgerExportError;

  if (loading && reloadToken === 0) {
    return (
      <AdminWorkspacePageLayout
        containerTier="full"
        pageHeader={vendorDetailPageHeader}
      >
        <p className="text-sm text-admin-inkMuted">Loading vendor…</p>
      </AdminWorkspacePageLayout>
    );
  }

  if (error) {
    return (
      <AdminWorkspacePageLayout
        containerTier="full"
        pageHeader={vendorDetailPageHeader}
      >
        <WorkspaceInlineError
          title="Something went wrong"
          message={error}
          onRetry={() => setReloadToken((v) => v + 1)}
        />
      </AdminWorkspacePageLayout>
    );
  }

  if (!wholesaler) {
    return (
      <AdminWorkspacePageLayout
        containerTier="full"
        pageHeader={vendorDetailPageHeader}
      >
        <p className="text-sm text-admin-inkMuted">
          This vendor isn&apos;t in your vendor list, or the link may be
          outdated.{" "}
          <Link
            href={BALANCES_PAGE_BREADCRUMB.href}
            className="font-medium text-admin-actionPrimary hover:text-admin-actionPrimary/85"
          >
            Return to vendors
          </Link>
        </p>
      </AdminWorkspacePageLayout>
    );
  }

  return (
    <AdminWorkspacePageLayout
      containerTier="full"
      pageHeader={vendorDetailPageHeader}
    >
      <div className={VENDOR_DETAIL_PAGE_STACK}>
        <VendorDetailHero
          vendorName={wholesaler.name}
          balanceOwed={balance}
          totalOwed={wholesaler.totalOwed}
          totalPaid={wholesaler.totalPaid}
          lastPaymentDate={wholesaler.last_payment_date}
        />

        <div className={VENDOR_DETAIL_PAGE_GRID}>
          <div className={VENDOR_DETAIL_PRIMARY_COLUMN}>
            <VendorDetailRecordPaymentCard
              wholesalerId={id}
              currentBalance={balance}
              paymentEdit={editPaymentForForm}
              expenseEdit={editExpenseForForm}
              onCancelPaymentEdit={() =>
                setLedgerFocus((f) => (f?.kind === "PAYMENT" ? null : f))
              }
              onCancelExpenseEdit={() =>
                setLedgerFocus((f) => (f?.kind === "VENDOR_EXPENSE" ? null : f))
              }
              onRecorded={() => {
                setReloadToken((v) => v + 1);
                setLedgerFocus(null);
                dispatchVendorBalancesInvalidate();
              }}
            />
          </div>

          <div className={VENDOR_DETAIL_RAIL_COLUMN}>
            <VendorDetailLedgerCard
              vendorId={id}
              statement={statement}
              expandedEntryIds={expandedEntryIds}
              ledgerFocus={ledgerFocus}
              onToggleExpanded={toggleExpanded}
              onLedgerRowActivate={handleLedgerRowActivate}
              exportError={exportError}
              onStatementExportError={setStatementExportError}
              onLedgerExportError={setLedgerExportError}
            />

            <VendorDetailAttachmentsCard
              attachments={attachments}
              loading={attachmentsLoading}
            />
          </div>
        </div>
      </div>
    </AdminWorkspacePageLayout>
  );
}
