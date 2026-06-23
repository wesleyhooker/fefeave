"use client";

import { PencilSquareIcon } from "@heroicons/react/24/outline";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  WORKFLOW_SHOW_DETAIL_ADJUST_PAYOUT_LABEL,
  WORKFLOW_SHOW_FINANCES_SAVE_THEN_RETRY,
  WORKFLOW_SHOW_FINANCES_SET_PAYOUT_FIRST,
  WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HEADING,
  WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HINT,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { showClosedSuccessHref } from "@/app/(admin)/admin/_lib/showRoutes";
import { dispatchWorkspaceInvalidate } from "@/lib/workspaceInvalidate";
import { AdminWorkspacePageLayout } from "@/app/(admin)/admin/_components/AdminWorkspacePageLayout";
import { ShowDetailBackLink } from "./_components/ShowDetailBackLink";
import { WorkspaceConfirmDialog } from "@/app/(admin)/admin/_components/WorkspaceConfirmDialog";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import { WorkspaceActionLabel } from "@/app/(admin)/admin/_components/WorkspaceActionLabel";
import {
  workspaceActionIconMd,
  workspaceActionPositiveCompleteMd,
  workspaceActionSecondaryMd,
  workspaceLabelEyebrow,
  workspaceMoneyTabular,
  workspaceActionCompleteMd,
  workspaceActionCompleteSm,
  workspaceTextInput,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { ShowDetailObligationsList } from "./_components/ShowDetailObligationsList";
import type { ShowDetailObligationsPanel } from "./_lib/showDetailObligationModel";
import {
  applyComposerDraft,
  buildSettlementPayloadFromDraft,
  hydrateComposerFromSettlement,
} from "./_lib/showDetailObligationComposer";
import { ShowDetailReceiptSection } from "./_components/ShowDetailReceiptSection";
import { workspaceEntityPageHeader } from "@/app/(admin)/admin/_lib/workspaceEntityPageHeader";
import { ShowDetailHeroCard } from "./_components/ShowDetailHeroCard";
import { ShowDetailSummaryCard } from "./_components/ShowDetailSummaryCard";
import { ShowDetailActionsCard } from "./_components/ShowDetailActionsCard";
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
  updateShowSettlement,
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
  const [closeError, setCloseError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const addSettlementPanelRef = useRef<HTMLDivElement>(null);
  const editSettlementPanelRef = useRef<HTMLDivElement>(null);
  const breakdownSectionRef = useRef<HTMLElement>(null);
  const payoutFigureRef = useRef<HTMLDivElement>(null);
  const settlementsAnchorRef = useRef<HTMLDivElement>(null);
  const receiptFileInputRef = useRef<HTMLInputElement>(null);
  /** Tracks which show we last loaded; initial `null` ensures first mount shows the loading state. */
  const lastLoadedShowIdRef = useRef<string | null>(null);
  const [obligationsPanel, setObligationsPanel] =
    useState<ShowDetailObligationsPanel>({ kind: "closed" });
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

  const resetComposerDraft = useCallback(() => {
    setNewRowWholesalerId("");
    setNewRowMode("PERCENT");
    setNewRowPercent("");
    setNewRowFixed("");
    setNewRowItemizedLines([]);
    setNewRowError(null);
  }, []);

  const closeObligationsPanel = useCallback(() => {
    setObligationsPanel({ kind: "closed" });
    resetComposerDraft();
  }, [resetComposerDraft]);

  const openAddObligationPanel = useCallback(() => {
    setObligationsPanel({ kind: "add" });
    resetComposerDraft();
  }, [resetComposerDraft]);

  const openEditObligationPanel = useCallback(
    (settlementId: string) => {
      const row = settlements.find((s) => s.id === settlementId);
      if (!row) return;
      applyComposerDraft(hydrateComposerFromSettlement(row), {
        setWholesalerId: setNewRowWholesalerId,
        setMode: setNewRowMode,
        setPercent: setNewRowPercent,
        setFixed: setNewRowFixed,
        setItemizedLines: setNewRowItemizedLines,
      });
      setNewRowError(null);
      setObligationsPanel({ kind: "edit", settlementId });
    },
    [settlements],
  );

  const editingSettlementId =
    obligationsPanel.kind === "edit" ? obligationsPanel.settlementId : null;

  const composerTotalPercentUsed = useMemo(() => {
    const base = sumPercentRatesFromSettlements(settlements);
    if (!editingSettlementId) return base;
    const editing = settlements.find((s) => s.id === editingSettlementId);
    if (editing?.type === "PERCENT") {
      return roundToCents(base - editing.percent);
    }
    return base;
  }, [settlements, editingSettlementId]);

  const composerExistingTotalOwed = useMemo(() => {
    if (!editingSettlementId) return totals.totalOwed;
    const editing = settlements.find((s) => s.id === editingSettlementId);
    if (!editing) return totals.totalOwed;
    return roundToCents(
      totals.totalOwed - amountOwedFor(payoutAfterFees, editing),
    );
  }, [totals.totalOwed, settlements, editingSettlementId, payoutAfterFees]);

  const composerTakenWholesalerIds = useMemo(() => {
    const ids = new Set(settlements.map((s) => s.wholesalerId));
    if (editingSettlementId) {
      const editing = settlements.find((s) => s.id === editingSettlementId);
      if (editing) ids.delete(editing.wholesalerId);
    }
    return ids;
  }, [settlements, editingSettlementId]);

  const takenWholesalerIds = composerTakenWholesalerIds;

  const isClosed = Boolean(closedAt);

  const settlementComposerBlock = useMemo(
    () =>
      evaluateSettlementComposerFull({
        isClosed,
        payoutAfterFees,
        settlementsExistingTotalOwed: composerExistingTotalOwed,
        totalPercentUsedOnShow: composerTotalPercentUsed,
        newRowWholesalerId,
        wholesalerAlreadyHasSettlement: settlements.some(
          (s) =>
            s.wholesalerId === newRowWholesalerId &&
            s.id !== editingSettlementId,
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
      composerExistingTotalOwed,
      composerTotalPercentUsed,
      newRowWholesalerId,
      settlements,
      editingSettlementId,
      newRowMode,
      newRowPercent,
      newRowFixed,
      newRowItemizedLines,
      newRowTotal,
      isPercentValueValid,
    ],
  );

  const obligationSubmitBlockedReason = settlementComposerBlock
    ? settlementComposerBlockMessage(settlementComposerBlock)
    : null;

  const obligationSubmitDisabled =
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

  useEffect(() => {
    if (obligationsPanel.kind !== "add" && obligationsPanel.kind !== "edit") {
      return;
    }
    const panelRef =
      obligationsPanel.kind === "add"
        ? addSettlementPanelRef
        : editSettlementPanelRef;
    const id = requestAnimationFrame(() => {
      const root = panelRef.current;
      root?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      root?.querySelector<HTMLSelectElement>("select")?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [obligationsPanel]);

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

  const handleClearPendingReceipt = useCallback(() => {
    setReceiptFile(null);
    setReceiptError(null);
    if (receiptFileInputRef.current) {
      receiptFileInputRef.current.value = "";
    }
  }, []);

  const handleChooseReceiptFile = useCallback(() => {
    receiptFileInputRef.current?.click();
  }, []);

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
        closeObligationsPanel();
        return true;
      } catch (err) {
        setCreateSettlementError(toInlineWriteError(err));
        setNewRowError(toInlineWriteError(err));
        return false;
      } finally {
        setCreatingSettlement(false);
      }
    },
    [id, closeObligationsPanel, toInlineWriteError],
  );

  const handleUpdateSettlement = useCallback(
    async (
      settlementId: string,
      payload: {
        wholesaler_id: string;
        method: "PERCENT_PAYOUT" | "MANUAL" | "ITEMIZED";
        rate_percent?: number;
        amount?: number;
        lines?: { itemName: string; quantity: number; unitPrice: number }[];
      },
    ): Promise<boolean> => {
      setCreatingSettlement(true);
      setCreateSettlementError(null);
      setNewRowError(null);
      try {
        await updateShowSettlement(id, settlementId, payload);
        setReloadToken((v) => v + 1);
        closeObligationsPanel();
        return true;
      } catch (err) {
        setCreateSettlementError(toInlineWriteError(err));
        setNewRowError(toInlineWriteError(err));
        return false;
      } finally {
        setCreatingSettlement(false);
      }
    },
    [id, closeObligationsPanel, toInlineWriteError],
  );

  const handleSaveObligation = useCallback(async () => {
    if (isClosed) return;
    if (obligationsPanel.kind !== "add" && obligationsPanel.kind !== "edit") {
      return;
    }
    setNewRowError(null);

    const built = buildSettlementPayloadFromDraft({
      wholesalerId: newRowWholesalerId,
      mode: newRowMode,
      percent: newRowPercent,
      fixed: newRowFixed,
      itemizedLines: newRowItemizedLines,
    });
    if (!built.ok) {
      setNewRowError(built.message);
      return;
    }

    if (obligationsPanel.kind === "edit") {
      await handleUpdateSettlement(
        obligationsPanel.settlementId,
        built.payload,
      );
      return;
    }

    await handleCreateSettlement(built.payload);
  }, [
    isClosed,
    obligationsPanel,
    newRowWholesalerId,
    newRowMode,
    newRowPercent,
    newRowFixed,
    newRowItemizedLines,
    handleUpdateSettlement,
    handleCreateSettlement,
  ]);

  const executeDeleteSettlement = useCallback(
    async (settlementId: string) => {
      setDeleteSettlementError(null);
      try {
        await deleteShowSettlement(id, settlementId);
        setReloadToken((v) => v + 1);
      } catch (err) {
        setDeleteSettlementError(toInlineWriteError(err));
      } finally {
        setDeleteConfirmId(null);
        closeObligationsPanel();
      }
    },
    [id, closeObligationsPanel, toInlineWriteError],
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
    obligationsPanel.kind !== "closed" &&
    fieldHints.payoutFigure &&
    breakdownFlash !== "payout"
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
                <ShowDetailObligationsList
                  settlements={settlements}
                  payoutAfterFees={payoutAfterFees}
                  isClosed={isClosed}
                  panel={obligationsPanel}
                  onOpenAdd={openAddObligationPanel}
                  onOpenEdit={openEditObligationPanel}
                  onClosePanel={closeObligationsPanel}
                  onDelete={setDeleteConfirmId}
                  amountOwedFor={amountOwedFor}
                  addPanelRef={addSettlementPanelRef}
                  editPanelRef={editSettlementPanelRef}
                  wholesalers={wholesalers}
                  takenWholesalerIds={takenWholesalerIds}
                  totalPercentUsed={composerTotalPercentUsed}
                  newRowWholesalerId={newRowWholesalerId}
                  onWholesalerChange={setNewRowWholesalerId}
                  newRowMode={newRowMode}
                  onModeChange={setNewRowMode}
                  newRowPercent={newRowPercent}
                  onPercentChange={setNewRowPercent}
                  newRowFixed={newRowFixed}
                  onFixedChange={setNewRowFixed}
                  newRowItemizedLines={newRowItemizedLines}
                  onItemizedLinesChange={setNewRowItemizedLines}
                  newRowTotal={newRowTotal}
                  isPercentValueValid={isPercentValueValid}
                  settlementComposerBlock={settlementComposerBlock}
                  fieldHints={fieldHints}
                  submitBlockedMessage={obligationSubmitBlockedReason}
                  saving={creatingSettlement}
                  submitDisabled={obligationSubmitDisabled}
                  onSave={() => void handleSaveObligation()}
                />
                {deleteSettlementError ||
                createSettlementError ||
                newRowError ? (
                  <p className="mt-3 text-sm text-red-600" role="alert">
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

              <ShowDetailReceiptSection
                isClosed={isClosed}
                uploadingReceipt={uploadingReceipt}
                receiptFile={receiptFile}
                receiptError={receiptError}
                showAttachments={showAttachments}
                fileInputRef={receiptFileInputRef}
                onFileChange={handleReceiptFileChange}
                onAttach={handleAttachReceipt}
                onChooseFile={handleChooseReceiptFile}
                onClearPendingFile={handleClearPendingReceipt}
                onViewAttachment={handleDownloadAttachment}
              />
            </div>

            <div className={SHOW_DETAIL_RAIL_COLUMN}>
              <ShowDetailSummaryCard
                payoutAfterFees={payoutAfterFees}
                displayProfit={displayProfit}
                totalOwed={totals.totalOwed}
              />
              <ShowDetailActionsCard
                isClosed={isClosed}
                closing={closing}
                closeError={closeError}
                onCloseClick={handleCloseShowClick}
                onReopenClick={() => setReopenDialogOpen(true)}
                adjustPayout={
                  isClosed ? undefined : (
                    <div className="space-y-2">
                      <EditablePayout
                        payoutAfterFees={payoutAfterFees}
                        saving={savingPayout}
                        disabled={isClosed}
                        onSave={handleSavePayout}
                        displayVariant="actionsRail"
                      />
                      {savePayoutError ? (
                        <p className="text-xs text-red-600" role="alert">
                          {savePayoutError}
                        </p>
                      ) : null}
                    </div>
                  )
                }
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
  displayVariant?: "default" | "moneyCard" | "actionsRail";
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

  if (displayVariant === "actionsRail") {
    if (editing) {
      return (
        <div className="rounded-lg border border-admin-border/80 bg-white/85 px-3 py-3">
          <p className="text-xs font-medium text-admin-inkMuted">
            Payout after fees
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
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
                className={`${workspaceTextInput} w-full min-w-[8rem] pl-7 tabular-nums disabled:opacity-50 sm:w-36`}
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
              {saving ? "Saving…" : "Apply"}
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
        </div>
      );
    }

    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setEditing(true)}
        className={`${workspaceActionSecondaryMd} w-full justify-center gap-2 shadow-none disabled:cursor-not-allowed disabled:opacity-50`}
        aria-label="Adjust payout after fees"
      >
        <PencilSquareIcon className={workspaceActionIconMd} aria-hidden />
        {WORKFLOW_SHOW_DETAIL_ADJUST_PAYOUT_LABEL}
      </button>
    );
  }

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
