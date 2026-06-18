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
  WORKFLOW_SHOW_FINANCES_SAVE_THEN_RETRY,
  WORKFLOW_SHOW_FINANCES_SET_PAYOUT_FIRST,
  WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HEADING,
  WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HINT,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { showClosedSuccessHref } from "@/app/(admin)/admin/_lib/showRoutes";
import { dispatchWorkspaceInvalidate } from "@/lib/workspaceInvalidate";
import { AdminWorkspacePageLayout } from "@/app/(admin)/admin/_components/AdminWorkspacePageLayout";
import { vendorDetailHref } from "@/app/(admin)/admin/_lib/vendorRoutes";
import {
  SettlementFlatExpandedBody,
  SettlementItemizedExpandedBody,
  SettlementPercentExpandedBody,
} from "@/app/(admin)/admin/_components/SettlementExpandedDetail";
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
  workspaceMoneyTabular,
  workspaceMutedStrip,
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
import { ShowDetailBackLink } from "./_components/ShowDetailBackLink";
import { workspaceEntityPageHeader } from "@/app/(admin)/admin/_lib/workspaceEntityPageHeader";
import { ShowDetailHeroCard } from "./_components/ShowDetailHeroCard";
import { ShowDetailStatusCard } from "./_components/ShowDetailStatusCard";
import { WorkspaceSectionCard } from "@/app/(admin)/admin/_components/workspace/WorkspaceSectionCard";
import {
  SHOW_DETAIL_PAGE_GRID,
  SHOW_DETAIL_PAGE_STACK,
  SHOW_DETAIL_PRIMARY_COLUMN,
  SHOW_DETAIL_RAIL_COLUMN,
} from "./_lib/showDetailLayout";
import { formatCurrency } from "@/lib/format";
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
import { formatShowDisplayName } from "@/app/(admin)/admin/shows/_lib/showDisplayName";
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
          setShowName(formatShowDisplayName(show.name));
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
      dispatchWorkspaceInvalidate();
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
      dispatchWorkspaceInvalidate();
      setClosedAt(undefined);
      setReloadToken((v) => v + 1);
    } catch (err) {
      setCloseError(toInlineWriteError(err));
    } finally {
      setClosing(false);
    }
  }, [id, toInlineWriteError]);

  const platformLabel = formatShowPlatformLabel(platform);

  const payoutFigureClassName = [
    breakdownFlash === "payout"
      ? "rounded-md ring-2 ring-rose-400/90 ring-offset-2 ring-offset-[#fdf0e4] transition-[box-shadow] duration-300"
      : "",
    addSettlementOpen && fieldHints.payoutFigure && breakdownFlash !== "payout"
      ? "rounded-md ring-2 ring-amber-300/90 ring-offset-2 ring-offset-[#fdf0e4] transition-[box-shadow] duration-300"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const displayShowName = formatShowDisplayName(showName);

  const showDetailPageHeader = workspaceEntityPageHeader({
    leading: <ShowDetailBackLink />,
    title: loading ? (
      "Loading…"
    ) : error ? (
      "Unable to load show"
    ) : (
      <span className="sr-only">{displayShowName}</span>
    ),
  });

  if (loading) {
    return (
      <AdminWorkspacePageLayout
        containerTier="full"
        pageHeader={showDetailPageHeader}
      >
        <p className="text-sm text-admin-inkMuted">Loading show details…</p>
      </AdminWorkspacePageLayout>
    );
  }

  if (error) {
    return (
      <AdminWorkspacePageLayout
        containerTier="full"
        pageHeader={showDetailPageHeader}
      >
        <WorkspaceInlineError
          title="Could not load show detail."
          message={error}
          onRetry={handleRetry}
        />
      </AdminWorkspacePageLayout>
    );
  }

  return (
    <>
      <AdminWorkspacePageLayout
        containerTier="full"
        pageHeader={showDetailPageHeader}
      >
        <div className={SHOW_DETAIL_PAGE_STACK}>
          <ShowDetailHeroCard
            showName={displayShowName}
            status={isClosed ? "COMPLETED" : "ACTIVE"}
            showDate={showDate}
            platformLabel={platformLabel}
            payoutAfterFees={payoutAfterFees}
            displayProfit={displayProfit}
            totalOwed={totals.totalOwed}
            payoutFigureRef={payoutFigureRef}
            payoutFigureClassName={payoutFigureClassName}
            payoutSlot={
              isClosed ? undefined : (
                <div className="space-y-1">
                  <EditablePayout
                    payoutAfterFees={payoutAfterFees}
                    saving={savingPayout}
                    disabled={isClosed}
                    onSave={handleSavePayout}
                    displayVariant="moneyCard"
                    embedded
                  />
                  {savePayoutError ? (
                    <p className="text-xs text-amber-700" role="alert">
                      {savePayoutError}
                    </p>
                  ) : null}
                </div>
              )
            }
          />

          <div className={SHOW_DETAIL_PAGE_GRID}>
            <div className={SHOW_DETAIL_PRIMARY_COLUMN}>
              <WorkspaceSectionCard
                ref={breakdownSectionRef}
                className="scroll-mt-4"
                titleId="settlements-heading"
                title={WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HEADING}
                description={WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HINT}
                contentRef={settlementsAnchorRef}
                contentClassName={`scroll-mt-20 outline-none transition-[box-shadow] duration-300 ${
                  breakdownFlash === "settlements"
                    ? "rounded-md ring-2 ring-rose-400/90 ring-offset-2 ring-offset-white"
                    : ""
                }`}
              >
                {showPercentOverCapBanner ? (
                  <p
                    className="mt-2 rounded-md border border-amber-200/90 bg-amber-50/70 px-2.5 py-1.5 text-xs font-medium text-amber-950/90"
                    role="status"
                  >
                    Saved percent obligations total over 100% of payout — adjust
                    or remove a percent row before relying on new percent lines.
                  </p>
                ) : null}
                {showTotalOwedOverPayoutBanner ? (
                  <p
                    className="mt-2 rounded-md border border-amber-200/90 bg-amber-50/70 px-2.5 py-1.5 text-xs font-medium text-amber-950/90"
                    role="status"
                  >
                    Total owed from vendor obligations is above payout after
                    fees ({formatCurrency(payoutAfterFees)}). You can still
                    review history; new obligations can&apos;t increase total
                    owed until this is resolved.
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
                            Add the first obligation to allocate payout before
                            close-out.
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
                      const expanded = Boolean(expandedSettlementIds[row.id]);
                      const calcMethod = calculationMethodFromStructuredType(
                        row.type,
                      );
                      const typeLabel =
                        settlementMethodPrimaryLabel(calcMethod);
                      const summaryHint = settlementMethodHint({
                        calculationMethod: calcMethod,
                        percentOfPayout:
                          row.type === "PERCENT" ? row.percent : undefined,
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
                                href={vendorDetailHref(row.wholesalerId)}
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
                              onClick={() => toggleSettlementExpanded(row.id)}
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
                                isClosed || deletingSettlementId === row.id
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
                                    Add the first obligation to allocate payout
                                    before close-out.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => focusSettlementComposer()}
                                  className={`${workspaceActionInlineText} inline-flex items-center gap-1.5 whitespace-nowrap`}
                                >
                                  <PlusIcon className={workspaceActionIconSm} />
                                  Add obligation
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
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
                              row.type === "PERCENT" ? row.percent : undefined,
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
                                    href={vendorDetailHref(row.wholesalerId)}
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
                                      onClick={() => setDeleteConfirmId(row.id)}
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
                      <PlusIcon className={workspaceActionIconMd} aria-hidden />
                      <span>Add obligation</span>
                    </button>
                  </div>
                ) : null}
                {!isClosed && addSettlementOpen ? (
                  <div
                    ref={addSettlementPanelRef}
                    className={`mt-4 rounded-lg border bg-stone-50/40 px-3 py-3 sm:px-4 sm:py-3.5 ${
                      addSettlementSubmitBlockedReason && !creatingSettlement
                        ? "border-amber-200/90 ring-1 ring-amber-200/70"
                        : "border-gray-200/90"
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      Add vendor obligation
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      One primary save — fields below match the selected type.
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
                                {taken ? `${w.name} (already added)` : w.name}
                              </option>
                            );
                          })}
                        </WorkspaceNativeSelect>
                        {fieldHints.wholesaler && settlementComposerBlock ? (
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
                              v === "FIXED" || v === "QTY_UNIT" ? v : "PERCENT",
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
                          <option value="PERCENT">Percent of payout</option>
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
                            for this show ({formatCurrency(payoutAfterFees)}).
                            Percent lines add up; you can’t assign more than
                            100% across percent settlements.
                          </p>
                          {payoutAfterFees > 0 && totalPercentUsed > 0 ? (
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
                                {Math.max(0, 100 - totalPercentUsed).toFixed(1)}
                                % left for this percent line
                              </span>
                              {totalPercentUsed >= 100 - 1e-6 ? (
                                <span className="ml-1 font-medium text-amber-800">
                                  (100% used — use flat/itemized or remove a
                                  percent row.)
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
                            onChange={(e) => setNewRowPercent(e.target.value)}
                            className={`w-full max-w-[8rem] ${workspaceTextInputCompact} text-right tabular-nums ${
                              fieldHints.percent ||
                              (payoutAfterFees > 0 && !isPercentValueValid)
                                ? "ring-2 ring-amber-300/90 ring-offset-1"
                                : ""
                            }`}
                            placeholder="0"
                            aria-invalid={
                              payoutAfterFees > 0 && !isPercentValueValid
                            }
                          />
                          {payoutAfterFees <= 0 ? (
                            <p className="mt-1.5 text-xs text-amber-800/90">
                              {WORKFLOW_SHOW_FINANCES_SET_PAYOUT_FIRST}
                            </p>
                          ) : fieldHints.percent && settlementComposerBlock ? (
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
                          {fieldHints.flat && settlementComposerBlock ? (
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
                                                quantity: e.target.value,
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
                                      prev.filter((l) => l.id !== line.id),
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
                                <PlusIcon className={workspaceActionIconSm} />
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
                          {fieldHints.itemized && settlementComposerBlock ? (
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
                          {creatingSettlement ? "Saving…" : "Save obligation"}
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
              </WorkspaceSectionCard>

              <WorkspaceSectionCard
                titleId="payout-receipt-heading"
                title={
                  <>
                    Receipt{" "}
                    <span className="text-base font-normal text-admin-inkMuted sm:text-lg">
                      (optional)
                    </span>
                  </>
                }
              >
                <input
                  ref={receiptFileInputRef}
                  id="show-receipt-file"
                  type="file"
                  className="sr-only"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={handleReceiptFileChange}
                />
                <div className="mt-3 flex min-h-[1.5rem] flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-1">
                  {uploadingReceipt ? (
                    <span className="text-xs text-gray-500">Uploading…</span>
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
                              onClick={() => handleDownloadAttachment(att)}
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
                          onClick={() => receiptFileInputRef.current?.click()}
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
                          onClick={() => receiptFileInputRef.current?.click()}
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
                <p className="mt-2 text-xs leading-tight text-admin-inkMuted">
                  PDF or image · max{" "}
                  {Math.round(getMaxUploadBytes() / 1024 / 1024)} MB
                </p>
              </WorkspaceSectionCard>
            </div>

            <div className={SHOW_DETAIL_RAIL_COLUMN}>
              <ShowDetailStatusCard
                isClosed={isClosed}
                closing={closing}
                closeError={closeError}
                platformFee={platformFee}
                onCloseClick={handleCloseShowClick}
                onReopenClick={() => setReopenDialogOpen(true)}
              />
            </div>
          </div>
        </div>
      </AdminWorkspacePageLayout>

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
