"use client";

import {
  ArrowUpTrayIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  WORKFLOW_SHOW_CLOSEOUT_SUMMARY_HEADING,
  WORKFLOW_SHOW_FINANCES_SAVE_THEN_RETRY,
  WORKFLOW_SHOW_FINANCES_SET_PAYOUT_FIRST,
  WORKFLOW_SHOW_LOCKED_BANNER,
  WORKFLOW_SHOW_PLATFORM_FEE_REPORTING_EYEBROW,
  WORKFLOW_SHOW_PLATFORM_FEE_REPORTING_NOTE,
  WORKFLOW_SHOW_SUMMARY_PAYOUT_LABEL,
  WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HEADING,
  WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HINT,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { showClosedSuccessHref } from "@/app/(admin)/admin/_lib/showRoutes";
import {
  AdminPageContainer,
  AdminPageIntroSection,
} from "@/app/(admin)/admin/_components/AdminPageContainer";
import { AdminEntityBreadcrumb } from "@/app/(admin)/admin/_components/AdminEntityBreadcrumb";
import { vendorDetailHref } from "@/app/(admin)/admin/_lib/vendorRoutes";
import { AdminPageIntro } from "@/app/(admin)/admin/_components/AdminPageIntro";
import {
  SettlementFlatExpandedBody,
  SettlementItemizedExpandedBody,
  SettlementPercentExpandedBody,
} from "@/app/(admin)/admin/_components/SettlementExpandedDetail";
import { ShowStatusPill } from "@/app/(admin)/admin/_components/ShowStatusPill";
import { WorkspaceActionLabel } from "@/app/(admin)/admin/_components/WorkspaceActionLabel";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import { WorkspaceConfirmDialog } from "@/app/(admin)/admin/_components/WorkspaceConfirmDialog";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  workspaceActionCompleteSm,
  workspaceActionInlineText,
  workspaceActionIconMd,
  workspaceActionIconSm,
  workspaceActionPositiveCompleteMd,
  workspaceActionSecondaryMd,
  workspaceLabelEyebrow,
  workspaceMoneyClassForSigned,
  workspaceMoneyNegative,
  workspaceMoneyPositive,
  workspaceMoneyTabular,
  workspaceMutedStrip,
  workspaceSectionTitle,
  workspaceSectionToolbar,
  workspaceShowDetailOperatingShell,
  workspaceShowDetailOutcomeShell,
  workspaceActionCompleteMd,
  workspaceTextInput,
  workspaceTextInputCompact,
  workspaceTheadSticky,
  workspaceShowSettlementRowDisclosure,
  workspaceTableRowInteractive,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  WorkspaceLedgerDisclosureIcon,
  workspaceTableBodyCellPadding,
  workspaceTableHeaderCellPadding,
} from "@/app/(admin)/admin/_components/WorkspaceTableRow";
import {
  calculationMethodFromStructuredType,
  mapShowSettlementLinesToLedgerLineItems,
  settlementMethodHint,
  settlementMethodPrimaryLabel,
} from "@/app/(admin)/admin/_lib/settlementUi";
import { workspacePageShowDetailGrid } from "@/app/(admin)/admin/_lib/workspacePageRegions";
import { formatCurrency, formatCurrencyAbs, formatDate } from "@/lib/format";
import {
  evaluateSettlementComposerFull,
  settlementComposerBlockMessage,
  settlementComposerFieldHints,
  SHOW_SETTLEMENT_TOTAL_EPS,
} from "@/app/(admin)/admin/shows/_lib/showSettlementComposer";
import {
  getShowCloseOutBlock,
  type CloseOutScrollTarget,
} from "@/app/(admin)/admin/shows/_lib/showCloseOutReadiness";
import {
  formatShowPlatformLabel,
  type ShowPlatform,
} from "@/app/(admin)/admin/shows/_lib/showPlatformOptions";
import {
  fetchShowAttachments,
  getAttachmentDownloadUrl,
  getMaxUploadBytes,
  isAllowedContentType,
  linkAttachmentToShow,
  uploadFile,
  type ShowAttachmentItem,
} from "@/src/lib/api/attachments";
import {
  fetchWholesalerBalances,
  type BackendWholesalerBalanceRow,
} from "@/src/lib/api/wholesalers";
import {
  createShowSettlement,
  deleteShowSettlement,
  fetchShow,
  fetchShowFinancialProfit,
  fetchShowFinancials,
  fetchShowSettlements,
  updateShowStatus,
  upsertShowFinancials,
  type SettlementLineDTO,
  type ShowFinancialProfitDTO,
  type ShowSettlementDTO,
} from "@/src/lib/api/shows";

type StructuredSettlement =
  | {
      id: string;
      wholesalerId: string;
      type: "PERCENT";
      percent: number;
      wholesaler: string;
    }
  | {
      id: string;
      wholesalerId: string;
      type: "FIXED";
      fixedAmount: number;
      wholesaler: string;
    }
  | {
      id: string;
      wholesalerId: string;
      type: "ITEMIZED";
      fixedAmount: number;
      wholesaler: string;
      lines?: SettlementLineDTO[];
    };

function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function amountOwedFor(
  payoutAfterFees: number,
  settlement: StructuredSettlement,
): number {
  if (settlement.type === "PERCENT") {
    return roundToCents((payoutAfterFees * settlement.percent) / 100);
  }
  return roundToCents(settlement.fixedAmount);
}

function computeTotals(
  payoutAfterFees: number,
  settlements: StructuredSettlement[],
) {
  const totalOwed = settlements.reduce(
    (sum, row) => sum + amountOwedFor(payoutAfterFees, row),
    0,
  );
  const profitEstimate = roundToCents(payoutAfterFees - totalOwed);
  return {
    totalOwed: roundToCents(totalOwed),
    profitEstimate,
  };
}

function mapSettlementRow(
  row: ShowSettlementDTO,
  nameByWholesalerId: Record<string, string>,
): StructuredSettlement {
  const amount = Number(row.amount);
  const parsedAmount = Number.isFinite(amount) ? amount : 0;
  const wholesaler = nameByWholesalerId[row.wholesaler_id] ?? "Unknown";

  if (row.calculation_method === "PERCENT_PAYOUT") {
    const rateBps = row.rate_bps ?? 0;
    return {
      id: row.id,
      wholesalerId: row.wholesaler_id,
      type: "PERCENT",
      percent: rateBps / 100,
      wholesaler,
    };
  }

  if (row.calculation_method === "ITEMIZED") {
    return {
      id: row.id,
      wholesalerId: row.wholesaler_id,
      type: "ITEMIZED",
      fixedAmount: parsedAmount,
      wholesaler,
      lines: row.lines,
    };
  }

  return {
    id: row.id,
    wholesalerId: row.wholesaler_id,
    type: "FIXED",
    fixedAmount: parsedAmount,
    wholesaler,
  };
}

function sumPercentRatesFromSettlements(
  settlements: StructuredSettlement[],
): number {
  return settlements
    .filter(
      (s): s is StructuredSettlement & { type: "PERCENT" } =>
        s.type === "PERCENT",
    )
    .reduce((sum, s) => sum + s.percent, 0);
}

function showDetailBreadcrumb(showName: string) {
  return (
    <AdminEntityBreadcrumb
      segments={[
        { href: "/admin/shows", label: "Shows" },
        { label: showName || "Show", current: true },
      ]}
    />
  );
}

export function ShowDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [showName, setShowName] = useState("");
  const [showDate, setShowDate] = useState("");
  const [platform, setPlatform] = useState<ShowPlatform | "">("");
  const [closedAt, setClosedAt] = useState<string | undefined>(undefined);
  const [eventProfit, setEventProfit] = useState<ShowFinancialProfitDTO | null>(
    null,
  );
  const [payoutAfterFees, setPayoutAfterFees] = useState(0);
  /** Informational only (capture foundation); null when not recorded. */
  const [platformFee, setPlatformFee] = useState<number | null>(null);
  const [settlements, setSettlements] = useState<StructuredSettlement[]>([]);
  const [wholesalers, setWholesalers] = useState<BackendWholesalerBalanceRow[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [savePayoutError, setSavePayoutError] = useState<string | null>(null);
  const [savingPayout, setSavingPayout] = useState(false);
  const [createSettlementError, setCreateSettlementError] = useState<
    string | null
  >(null);
  const [creatingSettlement, setCreatingSettlement] = useState(false);
  const [deleteSettlementError, setDeleteSettlementError] = useState<
    string | null
  >(null);
  const [deletingSettlementId, setDeletingSettlementId] = useState<
    string | null
  >(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const addSettlementPanelRef = useRef<HTMLDivElement>(null);
  const breakdownSectionRef = useRef<HTMLElement>(null);
  const payoutFigureRef = useRef<HTMLDivElement>(null);
  const settlementsAnchorRef = useRef<HTMLDivElement>(null);
  const receiptFileInputRef = useRef<HTMLInputElement>(null);
  /** Tracks which show we last loaded; initial `null` ensures first mount shows the loading state. */
  const lastLoadedShowIdRef = useRef<string | null>(null);
  const [addSettlementOpen, setAddSettlementOpen] = useState(false);
  const [newRowWholesalerId, setNewRowWholesalerId] = useState("");
  const [newRowMode, setNewRowMode] = useState<
    "PERCENT" | "FIXED" | "QTY_UNIT"
  >("PERCENT");
  const [newRowPercent, setNewRowPercent] = useState("");
  const [newRowFixed, setNewRowFixed] = useState("");
  const [newRowItemizedLines, setNewRowItemizedLines] = useState<
    Array<{
      id: string;
      itemName: string;
      quantity: string;
      unitPriceDollars: string;
    }>
  >([]);
  const [newRowError, setNewRowError] = useState<string | null>(null);
  const [showAttachments, setShowAttachments] = useState<ShowAttachmentItem[]>(
    [],
  );
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [expandedSettlementIds, setExpandedSettlementIds] = useState<
    Record<string, boolean>
  >({});
  /** Brief highlight on payout/settlements block when Close is blocked (scroll target). */
  const [breakdownFlash, setBreakdownFlash] = useState<
    "payout" | "settlements" | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    if (lastLoadedShowIdRef.current !== id) {
      lastLoadedShowIdRef.current = id;
      setLoading(true);
    }
    setError(null);

    Promise.all([
      fetchShow(id),
      fetchShowFinancials(id),
      fetchShowSettlements(id),
      fetchWholesalerBalances(),
      fetchShowAttachments(id),
      fetchShowFinancialProfit(id),
    ])
      .then(
        ([
          show,
          financials,
          settlementRows,
          balances,
          attachments,
          profitRow,
        ]) => {
          if (cancelled) return;
          const nameByWholesalerId = balances.reduce<Record<string, string>>(
            (acc, row) => {
              acc[row.wholesaler_id] = row.name;
              return acc;
            },
            {},
          );
          setShowName(show.name);
          setShowDate(show.show_date);
          setPlatform(show.platform ?? "");
          const payout = Number(financials?.payout_after_fees_amount ?? "0");
          setPayoutAfterFees(Number.isFinite(payout) ? payout : 0);
          const fee =
            financials?.platform_fee_amount != null
              ? Number(financials.platform_fee_amount)
              : null;
          setPlatformFee(fee != null && Number.isFinite(fee) ? fee : null);
          setClosedAt(
            show.status === "COMPLETED" ? (show.updated_at ?? "") : undefined,
          );
          setSettlements(
            settlementRows.map((row) =>
              mapSettlementRow(row, nameByWholesalerId),
            ),
          );
          setWholesalers(balances);
          setShowAttachments(attachments);
          setEventProfit(profitRow);
        },
      )
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

  const totals = useMemo(
    () => computeTotals(payoutAfterFees, settlements),
    [payoutAfterFees, settlements],
  );

  const displayProfit = useMemo(() => {
    if (closedAt && eventProfit?.profit != null) {
      const profit = Number(eventProfit.profit);
      return Number.isFinite(profit) ? profit : totals.profitEstimate;
    }
    return totals.profitEstimate;
  }, [closedAt, eventProfit, totals.profitEstimate]);

  const closeOutBlock = useMemo(
    () =>
      getShowCloseOutBlock({
        payoutAfterFees,
      }),
    [payoutAfterFees],
  );

  const isPercentValueValid =
    newRowMode !== "PERCENT" ||
    (newRowPercent.trim() !== "" &&
      Number.isFinite(Number(newRowPercent)) &&
      Number(newRowPercent) >= 0 &&
      Number(newRowPercent) <= 100);

  const newRowTotal = useMemo(() => {
    if (newRowMode === "PERCENT") {
      const rate = Number(newRowPercent);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) return null;
      return roundToCents((payoutAfterFees * rate) / 100);
    }
    if (newRowMode === "FIXED") {
      const amt = Number(newRowFixed);
      return Number.isFinite(amt) && amt > 0 ? roundToCents(amt) : null;
    }
    if (newRowMode === "QTY_UNIT") {
      let total = 0;
      for (const line of newRowItemizedLines) {
        const qty = Number(line.quantity);
        const unit = Number(line.unitPriceDollars);
        if (
          !Number.isFinite(qty) ||
          qty <= 0 ||
          !Number.isFinite(unit) ||
          unit < 0
        )
          return null;
        total += qty * unit;
      }
      return newRowItemizedLines.length > 0 ? roundToCents(total) : null;
    }
    return null;
  }, [
    newRowMode,
    newRowPercent,
    newRowFixed,
    newRowItemizedLines,
    payoutAfterFees,
  ]);

  /** Sum of percent rates on existing percent settlements (0–100). */
  const totalPercentUsed = useMemo(
    () => sumPercentRatesFromSettlements(settlements),
    [settlements],
  );

  const isClosed = Boolean(closedAt);

  const settlementComposerBlock = useMemo(
    () =>
      evaluateSettlementComposerFull({
        isClosed,
        payoutAfterFees,
        settlementsExistingTotalOwed: totals.totalOwed,
        totalPercentUsedOnShow: totalPercentUsed,
        newRowWholesalerId,
        wholesalerAlreadyHasSettlement: settlements.some(
          (s) => s.wholesalerId === newRowWholesalerId,
        ),
        newRowMode,
        newRowPercent,
        newRowFixed,
        newRowItemizedLines,
        newRowTotal,
        isPercentValueValid,
      }),
    [
      isClosed,
      payoutAfterFees,
      totals.totalOwed,
      totalPercentUsed,
      newRowWholesalerId,
      settlements,
      newRowMode,
      newRowPercent,
      newRowFixed,
      newRowItemizedLines,
      newRowTotal,
      isPercentValueValid,
    ],
  );

  const addSettlementSubmitBlockedReason = settlementComposerBlock
    ? settlementComposerBlockMessage(settlementComposerBlock)
    : null;

  const addSettlementPrimaryDisabled =
    creatingSettlement || settlementComposerBlock != null;

  const fieldHints = useMemo(
    () => settlementComposerFieldHints(settlementComposerBlock, newRowMode),
    [settlementComposerBlock, newRowMode],
  );

  const showPercentOverCapBanner = totalPercentUsed > 100 + 1e-6;
  const showTotalOwedOverPayoutBanner =
    Number.isFinite(payoutAfterFees) &&
    totals.totalOwed > Math.max(0, payoutAfterFees) + SHOW_SETTLEMENT_TOTAL_EPS;

  const handleRetry = useCallback(() => {
    setReloadToken((v) => v + 1);
  }, []);

  const focusSettlementComposer = useCallback(() => {
    setAddSettlementOpen(true);
  }, []);

  const scrollToCloseOutHint = useCallback(
    (target: CloseOutScrollTarget | null) => {
      if (target === "payout") {
        payoutFigureRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        payoutFigureRef.current?.focus();
        return;
      }
      if (target === "settlements") {
        settlementsAnchorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        settlementsAnchorRef.current?.focus();
      }
    },
    [],
  );

  useEffect(() => {
    if (!breakdownFlash) return;
    const t = window.setTimeout(() => setBreakdownFlash(null), 4000);
    return () => window.clearTimeout(t);
  }, [breakdownFlash]);

  const handleCloseShowClick = useCallback(() => {
    if (closeOutBlock.reason && closeOutBlock.scrollTarget) {
      setBreakdownFlash(closeOutBlock.scrollTarget);
      scrollToCloseOutHint(closeOutBlock.scrollTarget);
      return;
    }
    setCloseDialogOpen(true);
  }, [closeOutBlock, scrollToCloseOutHint]);

  const toggleSettlementExpanded = useCallback((settlementId: string) => {
    setExpandedSettlementIds((prev) => ({
      ...prev,
      [settlementId]: !prev[settlementId],
    }));
  }, []);

  useEffect(() => {
    if (!addSettlementOpen) return;
    const id = requestAnimationFrame(() => {
      const root = addSettlementPanelRef.current;
      root?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      root?.querySelector<HTMLSelectElement>("select")?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [addSettlementOpen]);

  const handleAttachReceipt = useCallback(async () => {
    if (!receiptFile) return;
    setReceiptError(null);
    setUploadingReceipt(true);
    try {
      const attachmentId = await uploadFile(receiptFile);
      await linkAttachmentToShow(id, attachmentId);
      setReceiptFile(null);
      setReloadToken((v) => v + 1);
    } catch (err) {
      setReceiptError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploadingReceipt(false);
    }
  }, [id, receiptFile]);

  const handleReceiptFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setReceiptError(null);
      const file = e.target.files?.[0];
      if (!file) {
        setReceiptFile(null);
        return;
      }
      if (!isAllowedContentType(file.type)) {
        setReceiptError("Use PDF or image (PNG/JPEG).");
        setReceiptFile(null);
        e.target.value = "";
        return;
      }
      if (file.size > getMaxUploadBytes()) {
        setReceiptError(
          `File must be under ${Math.round(getMaxUploadBytes() / 1024 / 1024)} MB.`,
        );
        setReceiptFile(null);
        e.target.value = "";
        return;
      }
      setReceiptFile(file);
    },
    [],
  );

  const handleDownloadAttachment = useCallback(
    async (att: ShowAttachmentItem) => {
      try {
        const { downloadUrl } = await getAttachmentDownloadUrl(att.id);
        window.open(downloadUrl, "_blank", "noopener,noreferrer");
      } catch {
        // ignore
      }
    },
    [],
  );

  const toInlineWriteError = useCallback((err: unknown): string => {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("(401 ") || message.includes("(403 ")) {
      return "You are not authorized to perform this action.";
    }
    return message;
  }, []);

  const handleSavePayout = useCallback(
    async (nextPayoutAfterFees: number): Promise<boolean> => {
      setSavingPayout(true);
      setSavePayoutError(null);
      try {
        await upsertShowFinancials(id, {
          payout_after_fees_amount: nextPayoutAfterFees,
        });
        setReloadToken((v) => v + 1);
        return true;
      } catch (err) {
        setSavePayoutError(toInlineWriteError(err));
        return false;
      } finally {
        setSavingPayout(false);
      }
    },
    [id, toInlineWriteError],
  );

  const handleCreateSettlement = useCallback(
    async (payload: {
      wholesaler_id: string;
      method: "PERCENT_PAYOUT" | "MANUAL" | "ITEMIZED";
      rate_percent?: number;
      amount?: number;
      lines?: { itemName: string; quantity: number; unitPrice: number }[];
    }): Promise<boolean> => {
      setCreatingSettlement(true);
      setCreateSettlementError(null);
      setNewRowError(null);
      try {
        await createShowSettlement(id, payload);
        setReloadToken((v) => v + 1);
        setAddSettlementOpen(false);
        setNewRowWholesalerId("");
        setNewRowPercent("");
        setNewRowFixed("");
        setNewRowItemizedLines([]);
        return true;
      } catch (err) {
        setCreateSettlementError(toInlineWriteError(err));
        setNewRowError(toInlineWriteError(err));
        return false;
      } finally {
        setCreatingSettlement(false);
      }
    },
    [id, toInlineWriteError],
  );

  const handleAddRow = useCallback(async () => {
    if (isClosed) return;
    setNewRowError(null);
    if (!newRowWholesalerId) {
      setNewRowError("Select a wholesaler.");
      return;
    }
    if (settlements.some((s) => s.wholesalerId === newRowWholesalerId)) {
      setNewRowError("This wholesaler already has a settlement.");
      return;
    }
    if (newRowMode === "PERCENT") {
      const rate = Number(newRowPercent);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        setNewRowError("Percent must be between 0 and 100.");
        return;
      }
      const allocated = sumPercentRatesFromSettlements(settlements);
      if (allocated + rate > 100 + 1e-6) {
        setNewRowError("Percent shares can’t exceed 100% of payout.");
        return;
      }
      await handleCreateSettlement({
        wholesaler_id: newRowWholesalerId,
        method: "PERCENT_PAYOUT",
        rate_percent: rate,
      });
      return;
    }
    if (newRowMode === "QTY_UNIT") {
      if (newRowItemizedLines.length === 0) {
        setNewRowError(
          "Add at least one line (item name, quantity, unit price).",
        );
        return;
      }
      const lines: { itemName: string; quantity: number; unitPrice: number }[] =
        [];
      for (const line of newRowItemizedLines) {
        const name = line.itemName.trim();
        const qty = Number(line.quantity);
        const unitDollars = Number(line.unitPriceDollars);
        if (!name) {
          setNewRowError("Every line needs an item name.");
          return;
        }
        if (!Number.isFinite(qty) || qty <= 0) {
          setNewRowError("Quantity must be a positive number for every line.");
          return;
        }
        if (!Number.isFinite(unitDollars) || unitDollars < 0) {
          setNewRowError("Unit price ($) must be 0 or more for every line.");
          return;
        }
        lines.push({
          itemName: name,
          quantity: qty,
          unitPrice: Math.round(unitDollars * 100),
        });
      }
      const ok = await handleCreateSettlement({
        wholesaler_id: newRowWholesalerId,
        method: "ITEMIZED",
        lines,
      });
      if (ok) setNewRowItemizedLines([]);
      return;
    }
    const amount = Number(newRowFixed);
    if (!Number.isFinite(amount) || amount <= 0) {
      setNewRowError("Amount must be greater than 0.");
      return;
    }
    await handleCreateSettlement({
      wholesaler_id: newRowWholesalerId,
      method: "MANUAL",
      amount,
    });
  }, [
    isClosed,
    settlements,
    payoutAfterFees,
    newRowWholesalerId,
    newRowMode,
    newRowPercent,
    newRowFixed,
    newRowItemizedLines,
    handleCreateSettlement,
  ]);

  const executeDeleteSettlement = useCallback(
    async (settlementId: string) => {
      setDeletingSettlementId(settlementId);
      setDeleteSettlementError(null);
      try {
        await deleteShowSettlement(id, settlementId);
        setReloadToken((v) => v + 1);
      } catch (err) {
        setDeleteSettlementError(toInlineWriteError(err));
      } finally {
        setDeletingSettlementId(null);
        setDeleteConfirmId(null);
      }
    },
    [id, toInlineWriteError],
  );

  const handleCloseShow = useCallback(async () => {
    setClosing(true);
    setCloseError(null);
    try {
      await updateShowStatus(id, "COMPLETED");
      setCloseDialogOpen(false);
      router.push(showClosedSuccessHref(id));
    } catch (err) {
      setCloseError(toInlineWriteError(err));
    } finally {
      setClosing(false);
    }
  }, [id, router, toInlineWriteError]);

  const handleReopenShow = useCallback(async () => {
    setClosing(true);
    setCloseError(null);
    try {
      await updateShowStatus(id, "ACTIVE");
      setClosedAt(undefined);
      setReloadToken((v) => v + 1);
    } catch (err) {
      setCloseError(toInlineWriteError(err));
    } finally {
      setClosing(false);
    }
  }, [id, toInlineWriteError]);

  const platformLabel = formatShowPlatformLabel(platform);

  if (loading) {
    return (
      <>
        <AdminPageIntroSection variant="entity-detail" containerTier="full">
          <AdminPageIntro variant="entity-detail" title="Loading…" />
        </AdminPageIntroSection>
        <AdminPageContainer containerTier="full">
          <p className="text-sm text-stone-600">Loading show details…</p>
        </AdminPageContainer>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AdminPageIntroSection variant="entity-detail" containerTier="full">
          <AdminPageIntro
            variant="entity-detail"
            breadcrumb={showDetailBreadcrumb("Show")}
            title="Unable to load show"
          />
        </AdminPageIntroSection>
        <AdminPageContainer containerTier="full">
          <WorkspaceInlineError
            title="Could not load show detail."
            message={error}
            onRetry={handleRetry}
          />
        </AdminPageContainer>
      </>
    );
  }

  return (
    <>
      <AdminPageIntroSection variant="entity-detail" containerTier="full">
        <AdminPageIntro
          variant="entity-detail"
          breadcrumb={showDetailBreadcrumb(showName || "Show")}
          title={
            <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <ShowStatusPill status={isClosed ? "COMPLETED" : "ACTIVE"} />
              <span className="min-w-0">{showName || "Show"}</span>
            </span>
          }
          subtitle={
            <p className="text-[13px] leading-relaxed text-stone-500">
              {showDate ? formatDate(showDate) : "—"}
              {platformLabel ? ` · ${platformLabel}` : null}
            </p>
          }
        />
      </AdminPageIntroSection>

      <AdminPageContainer containerTier="full">
        <div className="flex min-w-0 flex-col gap-5 md:gap-6">
          <div className={workspacePageShowDetailGrid}>
            {/* Main column: unified show finances (payout + settlements) */}
            <div className="min-w-0">
              <section
                ref={breakdownSectionRef}
                className="min-w-0 scroll-mt-4"
                aria-labelledby="show-finances-heading"
              >
                <div
                  className={`min-w-0 overflow-hidden ${workspaceShowDetailOperatingShell} ${
                    isClosed ? "bg-gray-50/50" : ""
                  }`}
                >
                  <h2 id="show-finances-heading" className="sr-only">
                    Payout and vendor obligations
                  </h2>
                  {isClosed ? (
                    <div className="border-b border-stone-200/80 bg-stone-50/50 px-4 py-2 sm:px-5">
                      <p className="text-xs text-gray-600">
                        {WORKFLOW_SHOW_LOCKED_BANNER}
                      </p>
                    </div>
                  ) : null}

                  <div className="px-4 pb-5 pt-4 sm:px-5 sm:pb-6">
                    <div className="space-y-3">
                      <div className="rounded-lg border border-stone-200/85 bg-gradient-to-b from-stone-50/50 via-white/90 to-stone-50/30 p-3.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.65)] sm:p-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                            Payout <span className="sr-only">after fees</span>
                          </p>
                          <div
                            ref={payoutFigureRef}
                            tabIndex={-1}
                            className={`scroll-mt-20 -mx-0.5 rounded-md outline-none transition-[box-shadow] duration-300 ${
                              breakdownFlash === "payout"
                                ? "ring-2 ring-rose-400/90 ring-offset-2 ring-offset-white"
                                : ""
                            } ${
                              addSettlementOpen &&
                              fieldHints.payoutFigure &&
                              breakdownFlash !== "payout"
                                ? "ring-2 ring-amber-300/90 ring-offset-2 ring-offset-white"
                                : ""
                            }`}
                          >
                            <EditablePayout
                              payoutAfterFees={payoutAfterFees}
                              saving={savingPayout}
                              disabled={isClosed}
                              onSave={handleSavePayout}
                              displayVariant="moneyCard"
                              embedded
                            />
                          </div>
                          {savePayoutError ? (
                            <p className="text-sm text-amber-700" role="alert">
                              {savePayoutError}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div
                        ref={settlementsAnchorRef}
                        tabIndex={-1}
                        className={`scroll-mt-20 rounded-lg border border-stone-200/75 bg-white/[0.98] p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] outline-none transition-[box-shadow] duration-300 sm:p-3.5 ${
                          breakdownFlash === "settlements"
                            ? "ring-2 ring-rose-400/90 ring-offset-2 ring-offset-white"
                            : ""
                        }`}
                      >
                        <h3
                          id="settlements-heading"
                          className={workspaceLabelEyebrow}
                        >
                          {WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HEADING}
                        </h3>
                        <p className="mt-1 text-xs leading-snug text-gray-500">
                          {WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HINT}
                        </p>
                        {showPercentOverCapBanner ? (
                          <p
                            className="mt-2 rounded-md border border-amber-200/90 bg-amber-50/70 px-2.5 py-1.5 text-xs font-medium text-amber-950/90"
                            role="status"
                          >
                            Saved percent obligations total over 100% of payout
                            — adjust or remove a percent row before relying on
                            new percent lines.
                          </p>
                        ) : null}
                        {showTotalOwedOverPayoutBanner ? (
                          <p
                            className="mt-2 rounded-md border border-amber-200/90 bg-amber-50/70 px-2.5 py-1.5 text-xs font-medium text-amber-950/90"
                            role="status"
                          >
                            Total owed from vendor obligations is above payout
                            after fees ({formatCurrency(payoutAfterFees)}). You
                            can still review history; new obligations can&apos;t
                            increase total owed until this is resolved.
                          </p>
                        ) : null}
                        <div className="mt-3 space-y-3 md:hidden">
                          {settlements.length === 0 ? (
                            isClosed ? (
                              <div
                                className={`rounded-lg border border-gray-200/80 px-4 py-4 text-sm text-gray-600 ${workspaceMutedStrip}`}
                              >
                                No vendor obligations recorded.
                              </div>
                            ) : (
                              <div
                                className={`space-y-3 rounded-lg border border-gray-200/80 px-4 py-4 ${workspaceMutedStrip}`}
                              >
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-gray-800">
                                    No vendor obligations yet
                                  </p>
                                  <p className="text-sm leading-relaxed text-gray-600">
                                    Add the first obligation to allocate payout
                                    before close-out.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => focusSettlementComposer()}
                                  className={`${workspaceActionSecondaryMd} w-full justify-center gap-2`}
                                >
                                  <PlusIcon
                                    className={workspaceActionIconMd}
                                    aria-hidden
                                  />
                                  Add obligation
                                </button>
                              </div>
                            )
                          ) : (
                            settlements.map((row) => {
                              const owed = amountOwedFor(payoutAfterFees, row);
                              const expanded = Boolean(
                                expandedSettlementIds[row.id],
                              );
                              const calcMethod =
                                calculationMethodFromStructuredType(row.type);
                              const typeLabel =
                                settlementMethodPrimaryLabel(calcMethod);
                              const summaryHint = settlementMethodHint({
                                calculationMethod: calcMethod,
                                percentOfPayout:
                                  row.type === "PERCENT"
                                    ? row.percent
                                    : undefined,
                                lineCount:
                                  row.type === "ITEMIZED"
                                    ? row.lines?.length
                                    : undefined,
                              });
                              return (
                                <div
                                  key={row.id}
                                  className="rounded-lg border border-gray-200/90 bg-white p-4 shadow-sm"
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                    <div className="min-w-0 flex-1">
                                      <Link
                                        href={vendorDetailHref(
                                          row.wholesalerId,
                                        )}
                                        className="text-base font-semibold leading-snug text-gray-900 underline-offset-2 decoration-gray-300 hover:text-gray-800 hover:underline"
                                      >
                                        {row.wholesaler}
                                      </Link>
                                      <p className="mt-1 text-sm font-medium text-gray-800">
                                        {typeLabel}
                                      </p>
                                      {summaryHint ? (
                                        <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                                          {summaryHint}
                                        </p>
                                      ) : null}
                                    </div>
                                    <div className="shrink-0 text-right">
                                      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                                        Owed
                                      </p>
                                      <p
                                        className={`text-lg font-semibold tabular-nums text-gray-900 ${workspaceMoneyTabular}`}
                                      >
                                        {formatCurrency(owed)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                    <button
                                      type="button"
                                      className={`${workspaceActionSecondaryMd} w-full justify-center sm:w-auto`}
                                      aria-expanded={expanded}
                                      aria-controls={`settlement-detail-mobile-${row.id}`}
                                      onClick={() =>
                                        toggleSettlementExpanded(row.id)
                                      }
                                    >
                                      <span className="inline-flex items-center gap-2">
                                        <WorkspaceLedgerDisclosureIcon
                                          expanded={expanded}
                                        />
                                        {expanded ? "Hide details" : "Details"}
                                      </span>
                                    </button>
                                    <button
                                      type="button"
                                      disabled={
                                        isClosed ||
                                        deletingSettlementId === row.id
                                      }
                                      onClick={() => setDeleteConfirmId(row.id)}
                                      className={`${workspaceActionSecondaryMd} w-full justify-center border-rose-200/90 text-rose-800 hover:bg-rose-50/80 sm:w-auto`}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                  {expanded ? (
                                    <div
                                      id={`settlement-detail-mobile-${row.id}`}
                                      className="mt-4 border-t border-gray-100 pt-4"
                                      role="region"
                                      aria-label={`Details for ${row.wholesaler}`}
                                    >
                                      {row.type === "PERCENT" ? (
                                        <SettlementPercentExpandedBody
                                          percentBasisLabel={`${row.percent}% of payout after fees (${formatCurrency(payoutAfterFees)})`}
                                          amountOwed={owed}
                                        />
                                      ) : null}
                                      {row.type === "FIXED" ? (
                                        <SettlementFlatExpandedBody
                                          flatAmount={row.fixedAmount}
                                          amountOwed={owed}
                                        />
                                      ) : null}
                                      {row.type === "ITEMIZED" ? (
                                        <SettlementItemizedExpandedBody
                                          lines={mapShowSettlementLinesToLedgerLineItems(
                                            row.lines ?? [],
                                          )}
                                          amountOwed={owed}
                                          emptyFallbackAmountOwed={owed}
                                        />
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })
                          )}
                        </div>
                        <div className="mt-3 hidden overflow-x-auto rounded-md border border-gray-200/75 bg-white/80 md:block">
                          <table className="min-w-full table-fixed border-collapse text-sm">
                            <colgroup>
                              <col className="w-9 sm:w-10" />
                              <col className="min-w-0" />
                              <col className="w-1 max-w-[4px] p-0" />
                              <col className="w-[6.5rem] sm:w-[7rem]" />
                              <col className="min-w-0 max-w-[10.5rem]" />
                              <col className="w-9 sm:w-10" />
                            </colgroup>
                            <thead className={workspaceTheadSticky}>
                              <tr className="border-b border-gray-200">
                                <th
                                  scope="col"
                                  className={`w-9 ${workspaceTableHeaderCellPadding} !py-2 text-left sm:w-10`}
                                >
                                  <span className="sr-only">Expand</span>
                                </th>
                                <th
                                  scope="col"
                                  className={`${workspaceTableHeaderCellPadding} !py-2 text-left`}
                                >
                                  Vendor
                                </th>
                                <th
                                  scope="col"
                                  className="w-1 max-w-[4px] p-0"
                                  aria-hidden
                                >
                                  <span className="sr-only"> </span>
                                </th>
                                <th
                                  scope="col"
                                  className={`${workspaceTableHeaderCellPadding} !py-2 text-right`}
                                >
                                  Amount owed
                                </th>
                                <th
                                  scope="col"
                                  className={`${workspaceTableHeaderCellPadding} !py-2 pl-0 text-left sm:pr-3`}
                                >
                                  Type
                                </th>
                                <th
                                  scope="col"
                                  className={`${workspaceTableHeaderCellPadding} !py-2 text-right sm:pr-3`}
                                >
                                  <span className="sr-only">Remove</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {settlements.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={6}
                                    className={`${workspaceTableBodyCellPadding} py-6 text-left text-sm text-gray-600`}
                                  >
                                    {isClosed ? (
                                      <div
                                        className={`rounded-md border border-gray-200/80 px-3 py-2.5 text-sm ${workspaceMutedStrip}`}
                                      >
                                        No vendor obligations recorded.
                                      </div>
                                    ) : (
                                      <div
                                        className={`flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-200/80 px-3 py-2.5 ${workspaceMutedStrip}`}
                                      >
                                        <div className="space-y-0.5">
                                          <p className="text-sm font-medium text-gray-700">
                                            No vendor obligations yet
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            Add the first obligation to allocate
                                            payout before close-out.
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            focusSettlementComposer()
                                          }
                                          className={`${workspaceActionInlineText} inline-flex items-center gap-1.5 whitespace-nowrap`}
                                        >
                                          <PlusIcon
                                            className={workspaceActionIconSm}
                                          />
                                          Add obligation
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ) : (
                                settlements.map((row) => {
                                  const owed = amountOwedFor(
                                    payoutAfterFees,
                                    row,
                                  );
                                  const expanded = Boolean(
                                    expandedSettlementIds[row.id],
                                  );
                                  const calcMethod =
                                    calculationMethodFromStructuredType(
                                      row.type,
                                    );
                                  const typeLabel =
                                    settlementMethodPrimaryLabel(calcMethod);
                                  const summaryHint = settlementMethodHint({
                                    calculationMethod: calcMethod,
                                    percentOfPayout:
                                      row.type === "PERCENT"
                                        ? row.percent
                                        : undefined,
                                    lineCount:
                                      row.type === "ITEMIZED"
                                        ? row.lines?.length
                                        : undefined,
                                  });
                                  return (
                                    <Fragment key={row.id}>
                                      <tr
                                        className={`${workspaceShowSettlementRowDisclosure} ${expanded ? "bg-gray-50/80" : ""}`}
                                      >
                                        <td
                                          className={`w-9 ${workspaceTableBodyCellPadding} !py-1.5 align-middle sm:w-10`}
                                        >
                                          <button
                                            type="button"
                                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-200/80 hover:text-gray-900 sm:h-8 sm:w-8"
                                            aria-expanded={expanded}
                                            aria-controls={`settlement-detail-${row.id}`}
                                            aria-label={
                                              expanded
                                                ? "Collapse obligation details"
                                                : "Expand obligation details"
                                            }
                                            onClick={() =>
                                              toggleSettlementExpanded(row.id)
                                            }
                                          >
                                            <WorkspaceLedgerDisclosureIcon
                                              expanded={expanded}
                                            />
                                          </button>
                                        </td>
                                        <td
                                          className={`min-w-0 ${workspaceTableBodyCellPadding} !py-1.5 align-middle`}
                                        >
                                          <Link
                                            href={vendorDetailHref(
                                              row.wholesalerId,
                                            )}
                                            className="block min-w-0 truncate text-sm font-semibold leading-snug text-gray-900 underline-offset-2 decoration-gray-300 transition-colors hover:text-gray-800 hover:underline"
                                          >
                                            {row.wholesaler}
                                          </Link>
                                        </td>
                                        <td
                                          className="w-1 max-w-[4px] p-0"
                                          aria-hidden
                                        />
                                        <td
                                          className={`whitespace-nowrap ${workspaceTableBodyCellPadding} !py-1.5 text-right align-middle text-sm font-semibold text-gray-900 ${workspaceMoneyTabular}`}
                                        >
                                          {formatCurrency(owed)}
                                        </td>
                                        <td
                                          className={`min-w-0 ${workspaceTableBodyCellPadding} !py-1.5 pl-0 align-middle sm:pr-3`}
                                        >
                                          <div className="text-sm font-medium leading-snug text-gray-900">
                                            {typeLabel}
                                          </div>
                                          <div className="text-[11px] leading-snug text-gray-500">
                                            {summaryHint}
                                          </div>
                                        </td>
                                        <td
                                          className={`${workspaceTableBodyCellPadding} !py-1.5 text-right align-middle sm:pr-3`}
                                        >
                                          <div className="flex min-h-[1.75rem] items-center justify-end sm:min-h-[2rem]">
                                            <button
                                              type="button"
                                              disabled={
                                                isClosed ||
                                                deletingSettlementId === row.id
                                              }
                                              onClick={() =>
                                                setDeleteConfirmId(row.id)
                                              }
                                              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-rose-700/90 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:w-8"
                                              aria-label="Remove obligation"
                                            >
                                              <TrashIcon
                                                className={`${workspaceActionIconMd} shrink-0`}
                                                aria-hidden
                                              />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                      {expanded ? (
                                        <tr className="bg-gray-50/90">
                                          <td colSpan={6} className="p-0">
                                            <div
                                              id={`settlement-detail-${row.id}`}
                                              className="px-2 py-2 sm:px-3"
                                              role="region"
                                              aria-label={`Details for ${row.wholesaler}`}
                                            >
                                              {row.type === "PERCENT" ? (
                                                <SettlementPercentExpandedBody
                                                  percentBasisLabel={`${row.percent}% of payout after fees (${formatCurrency(payoutAfterFees)})`}
                                                  amountOwed={owed}
                                                />
                                              ) : null}
                                              {row.type === "FIXED" ? (
                                                <SettlementFlatExpandedBody
                                                  flatAmount={row.fixedAmount}
                                                  amountOwed={owed}
                                                />
                                              ) : null}
                                              {row.type === "ITEMIZED" ? (
                                                <SettlementItemizedExpandedBody
                                                  lines={mapShowSettlementLinesToLedgerLineItems(
                                                    row.lines ?? [],
                                                  )}
                                                  amountOwed={owed}
                                                  emptyFallbackAmountOwed={owed}
                                                />
                                              ) : null}
                                            </div>
                                          </td>
                                        </tr>
                                      ) : null}
                                    </Fragment>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                        {!isClosed && settlements.length > 0 ? (
                          <div className="mt-3 flex border-t border-gray-100/90 pt-3 sm:mt-px sm:justify-end sm:pt-1.5">
                            <button
                              type="button"
                              onClick={() => focusSettlementComposer()}
                              className={`${workspaceActionSecondaryMd} w-full justify-center gap-2 sm:w-auto`}
                              aria-label="Add vendor obligation"
                            >
                              <PlusIcon
                                className={workspaceActionIconMd}
                                aria-hidden
                              />
                              <span>Add obligation</span>
                            </button>
                          </div>
                        ) : null}
                        {!isClosed && addSettlementOpen ? (
                          <div
                            ref={addSettlementPanelRef}
                            className={`mt-4 rounded-lg border bg-stone-50/40 px-3 py-3 sm:px-4 sm:py-3.5 ${
                              addSettlementSubmitBlockedReason &&
                              !creatingSettlement
                                ? "border-amber-200/90 ring-1 ring-amber-200/70"
                                : "border-gray-200/90"
                            }`}
                          >
                            <p className="text-sm font-semibold text-gray-900">
                              Add vendor obligation
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              One primary save — fields below match the selected
                              type.
                            </p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:gap-4">
                              <div>
                                <label
                                  htmlFor="new-settlement-wholesaler"
                                  className="mb-1 block text-xs font-medium text-gray-600"
                                >
                                  Vendor
                                </label>
                                <WorkspaceNativeSelect
                                  id="new-settlement-wholesaler"
                                  value={newRowWholesalerId}
                                  onChange={(e) =>
                                    setNewRowWholesalerId(e.target.value)
                                  }
                                  className={`!h-9 w-full text-sm ${
                                    fieldHints.wholesaler
                                      ? "ring-2 ring-amber-300/90 ring-offset-1"
                                      : ""
                                  }`}
                                >
                                  <option value="">Select vendor</option>
                                  {wholesalers.map((w) => {
                                    const taken = settlements.some(
                                      (s) => s.wholesalerId === w.wholesaler_id,
                                    );
                                    return (
                                      <option
                                        key={w.wholesaler_id}
                                        value={w.wholesaler_id}
                                        disabled={taken}
                                      >
                                        {taken
                                          ? `${w.name} (already added)`
                                          : w.name}
                                      </option>
                                    );
                                  })}
                                </WorkspaceNativeSelect>
                                {fieldHints.wholesaler &&
                                settlementComposerBlock ? (
                                  <p
                                    className="mt-1.5 text-xs font-medium text-amber-900/90"
                                    role="status"
                                  >
                                    {settlementComposerBlockMessage(
                                      settlementComposerBlock,
                                    )}
                                  </p>
                                ) : null}
                              </div>
                              <div>
                                <label
                                  htmlFor="new-settlement-type"
                                  className="mb-1 block text-xs font-medium text-gray-600"
                                >
                                  Type
                                </label>
                                <WorkspaceNativeSelect
                                  id="new-settlement-type"
                                  value={newRowMode}
                                  onChange={(e) => {
                                    const v = e.target.value as
                                      | "PERCENT"
                                      | "FIXED"
                                      | "QTY_UNIT";
                                    setNewRowMode(
                                      v === "FIXED" || v === "QTY_UNIT"
                                        ? v
                                        : "PERCENT",
                                    );
                                    if (
                                      v === "QTY_UNIT" &&
                                      newRowItemizedLines.length === 0
                                    ) {
                                      setNewRowItemizedLines([
                                        {
                                          id: crypto.randomUUID(),
                                          itemName: "",
                                          quantity: "",
                                          unitPriceDollars: "",
                                        },
                                      ]);
                                    }
                                  }}
                                  className="!h-9 w-full text-sm"
                                >
                                  <option value="PERCENT">
                                    Percent of payout
                                  </option>
                                  <option value="FIXED">Flat amount</option>
                                  <option value="QTY_UNIT">
                                    Itemized (qty × price)
                                  </option>
                                </WorkspaceNativeSelect>
                              </div>
                            </div>

                            <div className="mt-3 space-y-3 border-t border-gray-200/80 pt-3">
                              {settlementComposerBlock?.kind ===
                              "historically_over_payout" ? (
                                <p
                                  className="rounded-md border border-amber-200/70 bg-amber-50/50 px-2.5 py-1.5 text-xs font-medium text-amber-950/90"
                                  role="status"
                                >
                                  {settlementComposerBlockMessage(
                                    settlementComposerBlock,
                                  )}
                                </p>
                              ) : null}
                              {newRowMode === "PERCENT" ? (
                                <div className="space-y-2">
                                  <p className="text-xs leading-relaxed text-gray-600">
                                    <span className="font-medium text-gray-800">
                                      Percent basis:
                                    </span>{" "}
                                    the full{" "}
                                    <span className="font-medium">
                                      payout after fees
                                    </span>{" "}
                                    for this show (
                                    {formatCurrency(payoutAfterFees)}). Percent
                                    lines add up; you can’t assign more than
                                    100% across percent settlements.
                                  </p>
                                  {payoutAfterFees > 0 &&
                                  totalPercentUsed > 0 ? (
                                    <p className="text-xs text-gray-600">
                                      Already allocated in other rows:{" "}
                                      <span className="font-medium tabular-nums text-gray-800">
                                        {Number.isInteger(totalPercentUsed)
                                          ? totalPercentUsed
                                          : totalPercentUsed.toFixed(1)}
                                        %
                                      </span>
                                      {" · "}
                                      <span className="tabular-nums">
                                        up to{" "}
                                        {Math.max(
                                          0,
                                          100 - totalPercentUsed,
                                        ).toFixed(1)}
                                        % left for this percent line
                                      </span>
                                      {totalPercentUsed >= 100 - 1e-6 ? (
                                        <span className="ml-1 font-medium text-amber-800">
                                          (100% used — use flat/itemized or
                                          remove a percent row.)
                                        </span>
                                      ) : null}
                                    </p>
                                  ) : null}
                                  <label
                                    htmlFor="new-settlement-pct"
                                    className="mb-1 block text-xs font-medium text-gray-600"
                                  >
                                    Percent (0–100)
                                  </label>
                                  <input
                                    id="new-settlement-pct"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    max={100}
                                    value={newRowPercent}
                                    onChange={(e) =>
                                      setNewRowPercent(e.target.value)
                                    }
                                    className={`w-full max-w-[8rem] ${workspaceTextInputCompact} text-right tabular-nums ${
                                      fieldHints.percent ||
                                      (payoutAfterFees > 0 &&
                                        !isPercentValueValid)
                                        ? "ring-2 ring-amber-300/90 ring-offset-1"
                                        : ""
                                    }`}
                                    placeholder="0"
                                    aria-invalid={
                                      payoutAfterFees > 0 &&
                                      !isPercentValueValid
                                    }
                                  />
                                  {payoutAfterFees <= 0 ? (
                                    <p className="mt-1.5 text-xs text-amber-800/90">
                                      {WORKFLOW_SHOW_FINANCES_SET_PAYOUT_FIRST}
                                    </p>
                                  ) : fieldHints.percent &&
                                    settlementComposerBlock ? (
                                    <p
                                      className="mt-1.5 text-xs font-medium text-amber-900/90"
                                      role="status"
                                    >
                                      {settlementComposerBlockMessage(
                                        settlementComposerBlock,
                                      )}
                                    </p>
                                  ) : newRowTotal != null ? (
                                    <p className="mt-1.5 text-xs text-gray-600">
                                      {newRowPercent || "0"}% ×{" "}
                                      {formatCurrency(payoutAfterFees)} →{" "}
                                      <span className="font-medium text-gray-900">
                                        {formatCurrency(newRowTotal)} owed
                                      </span>
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}
                              {newRowMode === "FIXED" ? (
                                <div>
                                  <label
                                    htmlFor="new-settlement-flat"
                                    className="mb-1 block text-xs font-medium text-gray-700"
                                  >
                                    Dollar amount owed
                                  </label>
                                  <div className="relative max-w-[11rem]">
                                    <span
                                      className="pointer-events-none absolute left-2.5 top-1/2 z-[1] -translate-y-1/2 text-sm text-gray-500"
                                      aria-hidden
                                    >
                                      $
                                    </span>
                                    <input
                                      id="new-settlement-flat"
                                      type="text"
                                      inputMode="decimal"
                                      value={newRowFixed}
                                      onChange={(e) => {
                                        const v = e.target.value.replace(
                                          /[^0-9.]/g,
                                          "",
                                        );
                                        const parts = v.split(".");
                                        if (parts.length > 2) return;
                                        if (parts[1]?.length > 2) return;
                                        setNewRowFixed(v);
                                      }}
                                      className={`${workspaceTextInputCompact} w-full border border-gray-200 bg-white pl-7 text-right tabular-nums shadow-sm ${
                                        fieldHints.flat
                                          ? "ring-2 ring-amber-300/90 ring-offset-1"
                                          : ""
                                      }`}
                                      placeholder="0.00"
                                    />
                                  </div>
                                  {fieldHints.flat &&
                                  settlementComposerBlock ? (
                                    <p
                                      className="mt-1.5 text-xs font-medium text-amber-900/90"
                                      role="status"
                                    >
                                      {settlementComposerBlockMessage(
                                        settlementComposerBlock,
                                      )}
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}
                              {newRowMode === "QTY_UNIT" ? (
                                <div
                                  className={`space-y-2 rounded-md border px-2 py-2 sm:px-3 ${
                                    fieldHints.itemized
                                      ? "border-amber-300/80 bg-amber-50/40"
                                      : "border-gray-200/80 bg-white/80"
                                  }`}
                                >
                                  <p className="text-xs font-medium text-gray-700">
                                    Line items
                                  </p>
                                  <div className="hidden border-b border-gray-100 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:grid sm:grid-cols-[minmax(0,1fr)_4rem_4.75rem_1.75rem] sm:gap-x-1.5">
                                    <span>Item</span>
                                    <span className="text-right">Qty</span>
                                    <span className="text-right">$</span>
                                    <span className="sr-only">Remove line</span>
                                  </div>
                                  <div className="divide-y divide-gray-100">
                                    {newRowItemizedLines.map((line) => (
                                      <div
                                        key={line.id}
                                        className="flex flex-col gap-3 py-3 first:pt-0 sm:grid sm:grid-cols-[minmax(0,1fr)_4rem_4.75rem_1.75rem] sm:items-center sm:gap-x-1.5 sm:py-1.5"
                                      >
                                        <input
                                          type="text"
                                          value={line.itemName}
                                          onChange={(e) =>
                                            setNewRowItemizedLines((prev) =>
                                              prev.map((l) =>
                                                l.id === line.id
                                                  ? {
                                                      ...l,
                                                      itemName: e.target.value,
                                                    }
                                                  : l,
                                              ),
                                            )
                                          }
                                          placeholder="Item name"
                                          className={`min-w-0 w-full sm:w-auto ${workspaceTextInputCompact}`}
                                        />
                                        <div className="grid grid-cols-2 gap-2 sm:contents">
                                          <input
                                            type="number"
                                            step="1"
                                            min={1}
                                            value={line.quantity}
                                            onChange={(e) =>
                                              setNewRowItemizedLines((prev) =>
                                                prev.map((l) =>
                                                  l.id === line.id
                                                    ? {
                                                        ...l,
                                                        quantity:
                                                          e.target.value,
                                                      }
                                                    : l,
                                                ),
                                              )
                                            }
                                            placeholder="Qty"
                                            className={`${workspaceTextInputCompact} w-full text-right tabular-nums sm:w-auto`}
                                          />
                                          <input
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            value={line.unitPriceDollars}
                                            onChange={(e) =>
                                              setNewRowItemizedLines((prev) =>
                                                prev.map((l) =>
                                                  l.id === line.id
                                                    ? {
                                                        ...l,
                                                        unitPriceDollars:
                                                          e.target.value,
                                                      }
                                                    : l,
                                                ),
                                              )
                                            }
                                            placeholder="Price"
                                            className={`${workspaceTextInputCompact} w-full text-right tabular-nums sm:w-auto`}
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setNewRowItemizedLines((prev) =>
                                              prev.filter(
                                                (l) => l.id !== line.id,
                                              ),
                                            )
                                          }
                                          className="flex min-h-10 items-center justify-end text-gray-500 hover:text-gray-800 sm:min-h-0 sm:justify-end"
                                          aria-label="Remove item"
                                        >
                                          <TrashIcon
                                            className={workspaceActionIconSm}
                                          />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setNewRowItemizedLines((prev) => [
                                        ...prev,
                                        {
                                          id: crypto.randomUUID(),
                                          itemName: "",
                                          quantity: "",
                                          unitPriceDollars: "",
                                        },
                                      ])
                                    }
                                    className={`${workspaceActionSecondaryMd} !gap-1 !px-2 !py-1 text-xs`}
                                  >
                                    <WorkspaceActionLabel
                                      icon={
                                        <PlusIcon
                                          className={workspaceActionIconSm}
                                        />
                                      }
                                    >
                                      Add item
                                    </WorkspaceActionLabel>
                                  </button>
                                  <p className="text-xs font-medium text-gray-800">
                                    Line total:{" "}
                                    <span className="tabular-nums">
                                      {newRowTotal != null
                                        ? formatCurrency(newRowTotal)
                                        : "—"}
                                    </span>
                                  </p>
                                  {fieldHints.itemized &&
                                  settlementComposerBlock ? (
                                    <p
                                      className="text-xs font-medium text-amber-900/90"
                                      role="status"
                                    >
                                      {settlementComposerBlockMessage(
                                        settlementComposerBlock,
                                      )}
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>

                            <div className="mt-4 flex flex-col gap-2 border-t border-gray-200/80 pt-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={addSettlementPrimaryDisabled}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    void handleAddRow();
                                  }}
                                  className={`${workspaceActionCompleteSm} disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                  {creatingSettlement
                                    ? "Saving…"
                                    : "Save obligation"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddSettlementOpen(false);
                                    setNewRowWholesalerId("");
                                    setNewRowPercent("");
                                    setNewRowFixed("");
                                    setNewRowItemizedLines([]);
                                    setNewRowError(null);
                                  }}
                                  className={workspaceActionSecondaryMd}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : null}
                        {deleteSettlementError ||
                        createSettlementError ||
                        newRowError ? (
                          <p
                            className="mt-3 rounded-md border border-amber-200/80 bg-amber-50/50 px-3 py-2 text-sm text-amber-800"
                            role="alert"
                          >
                            {deleteSettlementError ??
                              (createSettlementError
                                ?.toLowerCase()
                                .includes("financials")
                                ? WORKFLOW_SHOW_FINANCES_SAVE_THEN_RETRY
                                : createSettlementError) ??
                              (newRowError?.toLowerCase().includes("financials")
                                ? WORKFLOW_SHOW_FINANCES_SAVE_THEN_RETRY
                                : newRowError)}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Receipt — secondary, outside payout/settlements cluster */}
                    <div
                      className="mt-8 border-t border-dashed border-gray-200/90 pt-5"
                      aria-labelledby="payout-receipt-heading"
                    >
                      <input
                        ref={receiptFileInputRef}
                        id="show-receipt-file"
                        type="file"
                        className="sr-only"
                        accept=".pdf,image/png,image/jpeg,image/jpg"
                        onChange={handleReceiptFileChange}
                      />
                      <div className="flex min-h-[1.5rem] flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-1">
                        <span
                          id="payout-receipt-heading"
                          className="shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400 sm:text-[11px]"
                        >
                          Receipt{" "}
                          <span className="font-normal normal-case tracking-normal text-gray-400">
                            (optional)
                          </span>
                        </span>
                        {uploadingReceipt ? (
                          <span className="text-xs text-gray-500">
                            Uploading…
                          </span>
                        ) : receiptFile ? (
                          <>
                            <span className="min-w-0 max-w-[min(100%,14rem)] truncate text-xs text-gray-800">
                              {receiptFile.name}
                            </span>
                            <button
                              type="button"
                              onClick={handleAttachReceipt}
                              disabled={uploadingReceipt}
                              className="min-h-10 rounded-md px-3 py-2 text-sm font-medium text-gray-600 underline decoration-gray-300 underline-offset-2 transition-colors hover:text-gray-900 disabled:opacity-60 sm:min-h-0 sm:px-2 sm:py-0.5 sm:text-[11px]"
                            >
                              Attach
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReceiptFile(null);
                                if (receiptFileInputRef.current) {
                                  receiptFileInputRef.current.value = "";
                                }
                                receiptFileInputRef.current?.click();
                              }}
                              disabled={uploadingReceipt}
                              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-60 sm:h-7 sm:w-7"
                              aria-label="Choose a different file"
                            >
                              <ArrowUpTrayIcon
                                className={workspaceActionIconSm}
                                aria-hidden
                              />
                            </button>
                          </>
                        ) : showAttachments.length > 0 ? (
                          <>
                            <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                              {showAttachments.map((att) => (
                                <span
                                  key={att.id}
                                  className="inline-flex max-w-full items-center gap-1"
                                >
                                  <span className="max-w-[9rem] truncate text-xs text-gray-800">
                                    {att.filename}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDownloadAttachment(att)
                                    }
                                    className="min-h-9 shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 underline decoration-gray-300 underline-offset-2 transition-colors hover:text-gray-900 sm:min-h-0 sm:px-1.5 sm:py-0.5 sm:text-[11px]"
                                  >
                                    View
                                  </button>
                                </span>
                              ))}
                            </span>
                            {!isClosed ? (
                              <button
                                type="button"
                                onClick={() =>
                                  receiptFileInputRef.current?.click()
                                }
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 sm:h-7 sm:w-7"
                                aria-label="Replace receipt"
                              >
                                <ArrowUpTrayIcon
                                  className={workspaceActionIconSm}
                                  aria-hidden
                                />
                              </button>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-gray-500">None</span>
                            {!isClosed ? (
                              <button
                                type="button"
                                onClick={() =>
                                  receiptFileInputRef.current?.click()
                                }
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 sm:h-7 sm:w-7"
                                aria-label="Add receipt"
                              >
                                <ArrowUpTrayIcon
                                  className={workspaceActionIconSm}
                                  aria-hidden
                                />
                              </button>
                            ) : null}
                          </>
                        )}
                        {receiptError ? (
                          <span className="text-xs text-rose-700">
                            {receiptError}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[10px] leading-tight text-gray-400">
                        PDF or image · max{" "}
                        {Math.round(getMaxUploadBytes() / 1024 / 1024)} MB
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Supporting column: review → close out (one finalization surface) */}
            <div className="min-w-0 lg:flex lg:min-h-full lg:flex-col">
              <section
                id="show-close-out"
                className={`flex min-h-full min-w-0 flex-col overflow-hidden scroll-mt-24 ${workspaceShowDetailOutcomeShell}`}
                aria-labelledby="review-profit-heading"
              >
                <div
                  className={`${workspaceSectionToolbar.replace(/\bpy-3\b/, "py-4")} border-stone-200/80 bg-gradient-to-r from-white via-rose-50/[0.08] to-amber-50/[0.06]`}
                >
                  <h2
                    id="review-profit-heading"
                    className={`min-w-0 ${workspaceSectionTitle}`}
                  >
                    {WORKFLOW_SHOW_CLOSEOUT_SUMMARY_HEADING}
                  </h2>
                </div>
                <div className="flex flex-1 flex-col px-5 py-5 sm:px-6 sm:py-6">
                  <div
                    className="flex flex-1 flex-col text-sm"
                    role="region"
                    aria-label="Payout and profit"
                  >
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className={workspaceLabelEyebrow}>
                          {WORKFLOW_SHOW_SUMMARY_PAYOUT_LABEL}
                        </span>
                        <span
                          className={`shrink-0 text-right text-lg font-semibold ${workspaceMoneyTabular} ${workspaceMoneyPositive}`}
                          aria-label={`Payout after fees ${formatCurrency(payoutAfterFees)}`}
                        >
                          {formatCurrencyAbs(payoutAfterFees)}
                        </span>
                      </div>
                      {settlements.length === 0 ? (
                        <p className="py-2 text-sm leading-relaxed text-gray-500 sm:py-1.5 sm:text-xs">
                          No vendor obligations.
                        </p>
                      ) : (
                        <ul className="space-y-1 border-t border-gray-100/90 pt-3">
                          {settlements.map((s) => {
                            const owed = amountOwedFor(payoutAfterFees, s);
                            return (
                              <li
                                key={s.id}
                                className="flex items-baseline justify-between gap-2"
                              >
                                <Link
                                  href={vendorDetailHref(s.wholesalerId)}
                                  className="min-w-0 truncate text-[13px] font-medium text-gray-800 underline-offset-2 decoration-gray-300 transition-colors hover:text-gray-950 hover:underline"
                                >
                                  {s.wholesaler}
                                </Link>
                                <span
                                  className={`shrink-0 text-right text-[15px] font-medium ${workspaceMoneyTabular} ${workspaceMoneyNegative}`}
                                  aria-label={`Amount owed to ${s.wholesaler} ${formatCurrency(owed)}`}
                                >
                                  {formatCurrencyAbs(owed)}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <div className="mt-4 border-t border-stone-200/70 pt-3.5">
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                          Est. profit
                        </span>
                        <span
                          className={`text-left text-[1.5rem] font-bold leading-none tracking-tight sm:text-[1.85rem] ${workspaceMoneyTabular} ${workspaceMoneyClassForSigned(displayProfit)}`}
                          aria-label={`Profit ${formatCurrency(displayProfit)}`}
                        >
                          {formatCurrencyAbs(displayProfit)}
                        </span>
                      </div>

                      {platformFee != null ? (
                        <div
                          className="mt-4 rounded-md border border-dashed border-stone-200/90 bg-stone-50/50 px-3 py-2.5"
                          role="note"
                          aria-label="Platform fee recorded for future reporting"
                        >
                          <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                            {WORKFLOW_SHOW_PLATFORM_FEE_REPORTING_EYEBROW}
                          </p>
                          <p className="mt-1.5 text-xs leading-snug text-stone-600">
                            <span className="font-medium text-stone-700">
                              Platform fee{" "}
                              <span
                                className={`tabular-nums ${workspaceMoneyTabular}`}
                              >
                                {formatCurrency(platformFee)}
                              </span>
                            </span>
                            . {WORKFLOW_SHOW_PLATFORM_FEE_REPORTING_NOTE}
                          </p>
                        </div>
                      ) : null}

                      {!isClosed ? (
                        <button
                          type="button"
                          onClick={handleCloseShowClick}
                          disabled={closing}
                          className={`${workspaceActionCompleteMd} mt-5 w-full shadow-none disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {closing ? "Closing…" : "Close show"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReopenDialogOpen(true)}
                          disabled={closing}
                          className={`${workspaceActionSecondaryMd} mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          Reopen show
                        </button>
                      )}
                      {closeError ? (
                        <p className="text-sm text-amber-800" role="alert">
                          {closeError}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </AdminPageContainer>

      <WorkspaceConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
        onConfirm={async () => {
          if (deleteConfirmId) await executeDeleteSettlement(deleteConfirmId);
        }}
        title="Delete this vendor obligation?"
        description="This removes the vendor obligation for this show. You can add it again while the show is open."
        confirmLabel="Delete"
        tone="danger"
        icon="!"
      />
      <WorkspaceConfirmDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        onConfirm={async () => {
          await handleCloseShow();
        }}
        title="Close this show?"
        description="Payout and vendor obligations will be locked until you reopen the show."
        confirmLabel={closing ? "Closing…" : "Close show"}
        tone="rose"
        icon="✓"
      />
      <WorkspaceConfirmDialog
        open={reopenDialogOpen}
        onOpenChange={setReopenDialogOpen}
        onConfirm={async () => {
          await handleReopenShow();
        }}
        title="Reopen this show?"
        description="Editing will be enabled."
        confirmLabel={
          closing
            ? "Reopening…"
            : "Reopen show (unlocks payout and vendor obligations)"
        }
        tone="stone"
        icon="↺"
      />
    </>
  );
}

function EditablePayout({
  payoutAfterFees,
  saving,
  disabled,
  onSave,
  displayVariant = "default",
  embedded = false,
}: {
  payoutAfterFees: number;
  saving: boolean;
  disabled?: boolean;
  onSave: (amount: number) => Promise<boolean>;
  displayVariant?: "default" | "moneyCard";
  /** Inside grouped breakdown — lighter chrome, compact edit. */
  embedded?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(payoutAfterFees));

  useEffect(() => {
    setInput(String(payoutAfterFees));
  }, [payoutAfterFees]);

  const parsed = Number(input.replace(/,/g, ""));
  const canSave = Number.isFinite(parsed) && parsed >= 0;

  const onInputChange = (v: string) => {
    const cleaned = v.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setInput(cleaned);
  };

  if (displayVariant === "moneyCard") {
    const shell = embedded
      ? `rounded-md transition-all duration-200 ${
          editing
            ? "bg-white/95 py-2 pl-2 pr-2 ring-1 ring-stone-300/60 sm:pr-2.5"
            : "bg-transparent py-1"
        }`
      : `rounded-lg border border-stone-200/75 px-3 py-2 sm:px-3.5 sm:py-2.5 transition-all duration-200 ${
          editing
            ? "min-h-[7.75rem] bg-white shadow-sm"
            : "min-h-[7.75rem] bg-stone-50/50"
        } flex flex-col justify-center`;

    return (
      <div className={shell}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {!embedded ? (
              <p className={workspaceLabelEyebrow}>Payout after fees</p>
            ) : null}
            <div className="mt-0.5 min-h-[1.625rem]">
              {!editing ? (
                <p
                  className={`font-semibold tabular-nums tracking-tight text-stone-800 transition-opacity duration-200 ${
                    embedded ? "text-lg" : "text-xl"
                  }`}
                >
                  {formatCurrency(payoutAfterFees)}
                </p>
              ) : (
                <div className="relative max-w-[14rem]">
                  <span
                    className="pointer-events-none absolute left-0 top-1/2 z-[1] -translate-y-1/2 text-sm text-stone-400"
                    aria-hidden
                  >
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={input}
                    onChange={(e) => onInputChange(e.target.value)}
                    disabled={disabled}
                    className={`w-full border-0 border-b border-stone-300 bg-transparent py-0.5 pl-5 pr-0.5 font-semibold tabular-nums tracking-tight text-stone-800 placeholder:text-stone-300 focus:border-stone-500 focus:outline-none focus:ring-0 disabled:opacity-50 ${
                      embedded ? "text-lg" : "text-xl"
                    }`}
                    placeholder="0.00"
                    aria-label="Payout amount in dollars"
                  />
                </div>
              )}
            </div>
            {editing ? (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={async () => {
                    if (!canSave || saving || disabled) return;
                    const ok = await onSave(roundToCents(Number(parsed)));
                    if (ok) setEditing(false);
                  }}
                  disabled={disabled || !canSave || saving}
                  className={`${workspaceActionCompleteSm} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {saving ? "Saving…" : "Apply"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInput(String(payoutAfterFees));
                    setEditing(false);
                  }}
                  className={`${workspaceActionSecondaryMd} !py-1.5 text-xs`}
                >
                  Cancel
                </button>
              </div>
            ) : null}
          </div>
          {!editing && !disabled ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-gray-200/90 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
              aria-label="Adjust payout after fees"
            >
              <PencilSquareIcon className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Adjust</span>
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!editing) {
    return (
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={workspaceLabelEyebrow}>Payout after fees</p>
          <p className="text-lg font-semibold tabular-nums text-gray-900">
            {formatCurrency(payoutAfterFees)}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setEditing(true)}
          className={`${workspaceActionSecondaryMd} shrink-0 disabled:cursor-not-allowed disabled:opacity-50`}
          aria-label="Edit payout after fees"
        >
          <WorkspaceActionLabel
            icon={
              <PencilSquareIcon className={workspaceActionIconMd} aria-hidden />
            }
          >
            Edit
          </WorkspaceActionLabel>
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <div className="relative min-w-0">
        <span
          className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-sm text-gray-500"
          aria-hidden
        >
          $
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          disabled={disabled}
          className={`${workspaceTextInput} w-36 pl-7 tabular-nums disabled:opacity-50`}
          placeholder="0.00"
          aria-label="Payout amount in dollars"
        />
      </div>
      <button
        type="button"
        onClick={async () => {
          if (!canSave || saving || disabled) return;
          const ok = await onSave(roundToCents(Number(parsed)));
          if (ok) setEditing(false);
        }}
        disabled={disabled || !canSave || saving}
        className={`${workspaceActionPositiveCompleteMd} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {saving ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => {
          setInput(String(payoutAfterFees));
          setEditing(false);
        }}
        className={workspaceActionSecondaryMd}
      >
        Cancel
      </button>
    </div>
  );
}
