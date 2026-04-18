"use client";

import {
  ArrowUpTrayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AdminPageContainer,
  AdminPageIntroSection,
} from "@/app/(admin)/admin/_components/AdminPageContainer";
import { AdminPageIntro } from "@/app/(admin)/admin/_components/AdminPageIntro";
import { ShowStatusPill } from "@/app/(admin)/admin/_components/ShowStatusPill";
import { WorkspaceActionLabel } from "@/app/(admin)/admin/_components/WorkspaceActionLabel";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import { WorkspaceConfirmDialog } from "@/app/(admin)/admin/_components/WorkspaceConfirmDialog";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  workspaceActionCompleteMd,
  workspaceActionCompleteSm,
  workspaceActionIconMd,
  workspaceActionIconSm,
  workspaceActionPositiveCompleteMd,
  workspaceActionSecondaryMd,
  workspaceCard,
  workspaceLabelEyebrow,
  workspaceMoneyClassForSigned,
  workspaceMoneyNegative,
  workspaceMoneyPositive,
  workspaceMoneyTabular,
  workspacePageContentWidthWide,
  workspaceSectionTitle,
  workspaceSectionToolbar,
  workspaceTextInput,
  workspaceTextInputCompact,
  workspaceTheadSticky,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { workspacePagePrimarySecondaryGrid } from "@/app/(admin)/admin/_lib/workspacePageRegions";
import {
  getShowCloseOutBlock,
  type CloseOutScrollTarget,
} from "@/app/(admin)/admin/shows/_lib/showCloseOutReadiness";
import { formatCurrency, formatCurrencyAbs, formatDate } from "@/lib/format";
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
  fetchShowFinancials,
  fetchShowSettlements,
  updateShowStatus,
  upsertShowFinancials,
  type SettlementLineDTO,
  type ShowSettlementDTO,
} from "@/src/lib/api/shows";

type StructuredSettlement =
  | {
      id: string;
      wholesalerId: string;
      type: "PERCENT";
      percent: number;
      wholesaler: string;
      amountPaid: number;
    }
  | {
      id: string;
      wholesalerId: string;
      type: "FIXED";
      fixedAmount: number;
      wholesaler: string;
      amountPaid: number;
    }
  | {
      id: string;
      wholesalerId: string;
      type: "ITEMIZED";
      fixedAmount: number;
      wholesaler: string;
      amountPaid: number;
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

function deriveStatusFromTotals(
  balanceRemaining: number,
  isClosed: boolean,
): string {
  if (!isClosed) return "Open";
  return balanceRemaining <= 0 ? "Paid" : "Unpaid";
}

function computeTotals(
  payoutAfterFees: number,
  settlements: StructuredSettlement[],
  closedAt?: string,
) {
  const totalOwed = settlements.reduce(
    (sum, row) => sum + amountOwedFor(payoutAfterFees, row),
    0,
  );
  const totalPaid = settlements.reduce((sum, row) => sum + row.amountPaid, 0);
  const balanceRemaining = roundToCents(totalOwed - totalPaid);
  const profitEstimate = roundToCents(payoutAfterFees - totalOwed);
  const status = deriveStatusFromTotals(balanceRemaining, Boolean(closedAt));
  return {
    totalOwed: roundToCents(totalOwed),
    totalPaid: roundToCents(totalPaid),
    balanceRemaining,
    profitEstimate,
    status,
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
      amountPaid: 0,
    };
  }

  if (row.calculation_method === "ITEMIZED") {
    return {
      id: row.id,
      wholesalerId: row.wholesaler_id,
      type: "ITEMIZED",
      fixedAmount: parsedAmount,
      wholesaler,
      amountPaid: 0,
      lines: row.lines,
    };
  }

  return {
    id: row.id,
    wholesalerId: row.wholesaler_id,
    type: "FIXED",
    fixedAmount: parsedAmount,
    wholesaler,
    amountPaid: 0,
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

/** Maps blocked-reason copy to composer fields for local ring/highlight (no backend change). */
function settlementComposerAttention(
  reason: string | null,
  mode: "PERCENT" | "FIXED" | "QTY_UNIT",
): {
  wholesaler: boolean;
  percent: boolean;
  flat: boolean;
  itemized: boolean;
} {
  if (!reason) {
    return {
      wholesaler: false,
      percent: false,
      flat: false,
      itemized: false,
    };
  }
  const r = reason.toLowerCase();
  return {
    wholesaler:
      r.includes("choose a wholesaler") ||
      r.includes("already has a settlement"),
    percent:
      mode === "PERCENT" &&
      (r.includes("percent") ||
        r.includes("allocated") ||
        r.includes("100%") ||
        (r.includes("payout") && r.includes("fees"))),
    flat:
      mode === "FIXED" && (r.includes("flat") || r.includes("greater than 0")),
    itemized:
      mode === "QTY_UNIT" &&
      (r.includes("line") ||
        r.includes("quantity") ||
        r.includes("unit price") ||
        r.includes("item")),
  };
}

function settlementSummaryHint(row: StructuredSettlement): string {
  if (row.type === "PERCENT") {
    return `${row.percent}% of payout`;
  }
  if (row.type === "FIXED") {
    return "Flat amount";
  }
  const n = row.lines?.length ?? 0;
  return n === 1 ? "1 item" : `${n} items`;
}

function formatPlatformLabel(
  platform: "WHATNOT" | "INSTAGRAM" | "OTHER" | "",
): string {
  if (!platform) return "";
  const labels: Record<string, string> = {
    WHATNOT: "Whatnot",
    INSTAGRAM: "Instagram",
    OTHER: "Other",
  };
  return labels[platform] ?? platform;
}

function ShowShowsBreadcrumb({ showName }: { showName: string }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm font-medium leading-snug">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-stone-600">
        <li>
          <Link
            href="/admin/shows"
            className="rounded-sm text-stone-800 underline decoration-stone-400/80 underline-offset-[3px] transition-colors hover:text-stone-950 hover:decoration-stone-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400"
          >
            Shows
          </Link>
        </li>
        <li className="select-none text-stone-300" aria-hidden>
          /
        </li>
        <li className="min-w-0 max-w-full text-stone-900" aria-current="page">
          <span className="block truncate font-semibold tracking-tight">
            {showName || "Show"}
          </span>
        </li>
      </ol>
    </nav>
  );
}

export function ShowDetailView({ id }: { id: string }) {
  const [showName, setShowName] = useState("");
  const [showDate, setShowDate] = useState("");
  const [platform, setPlatform] = useState<
    "WHATNOT" | "INSTAGRAM" | "OTHER" | ""
  >("");
  const [closedAt, setClosedAt] = useState<string | undefined>(undefined);
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
  /** Brief highlight on Show breakdown when Close is blocked (scroll target). */
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
    ])
      .then(([show, financials, settlementRows, balances, attachments]) => {
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

  const totals = useMemo(
    () => computeTotals(payoutAfterFees, settlements, closedAt),
    [payoutAfterFees, settlements, closedAt],
  );

  const closeOutBlock = useMemo(
    () =>
      getShowCloseOutBlock({
        payoutAfterFees,
        settlementsCount: settlements.length,
      }),
    [payoutAfterFees, settlements.length],
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

  const addSettlementSubmitBlockedReason = useMemo(() => {
    if (isClosed) return null;
    if (!newRowWholesalerId.trim()) {
      return "Choose a wholesaler.";
    }
    if (settlements.some((s) => s.wholesalerId === newRowWholesalerId)) {
      return "This wholesaler already has a settlement.";
    }
    if (newRowMode === "PERCENT") {
      if (payoutAfterFees <= 0) {
        return "Set payout after fees above — percentages use that amount.";
      }
      if (!isPercentValueValid) {
        return "Enter a percent from 0 to 100.";
      }
      if (newRowTotal == null) {
        return "Enter a valid percent.";
      }
      const rate = Number(newRowPercent);
      if (
        Number.isFinite(rate) &&
        rate >= 0 &&
        totalPercentUsed + rate > 100 + 1e-6
      ) {
        const usedStr = Number.isInteger(totalPercentUsed)
          ? String(totalPercentUsed)
          : totalPercentUsed.toFixed(1);
        return `Percent settlements can’t exceed 100% total (${usedStr}% already used).`;
      }
      return null;
    }
    if (newRowMode === "FIXED") {
      const amt = Number(newRowFixed);
      if (!Number.isFinite(amt) || amt <= 0) {
        return "Enter a flat amount greater than 0.";
      }
      return null;
    }
    if (newRowMode === "QTY_UNIT") {
      if (newRowItemizedLines.length === 0) {
        return "Add at least one line (item, qty, unit price).";
      }
      if (newRowTotal == null) {
        return "Each line needs a positive quantity and a valid unit price.";
      }
      return null;
    }
    return null;
  }, [
    isClosed,
    settlements,
    newRowWholesalerId,
    newRowMode,
    newRowPercent,
    newRowFixed,
    newRowItemizedLines,
    newRowTotal,
    payoutAfterFees,
    isPercentValueValid,
    totalPercentUsed,
  ]);

  const addSettlementPrimaryDisabled =
    creatingSettlement || addSettlementSubmitBlockedReason != null;

  const composerAttention = useMemo(
    () =>
      settlementComposerAttention(addSettlementSubmitBlockedReason, newRowMode),
    [addSettlementSubmitBlockedReason, newRowMode],
  );

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
      setClosedAt(new Date().toISOString());
      setReloadToken((v) => v + 1);
    } catch (err) {
      setCloseError(toInlineWriteError(err));
    } finally {
      setClosing(false);
    }
  }, [id, toInlineWriteError]);

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

  const platformLabel = formatPlatformLabel(platform);

  if (loading) {
    return (
      <>
        <AdminPageIntroSection variant="entity-detail">
          <AdminPageIntro variant="entity-detail" title="Loading…" />
        </AdminPageIntroSection>
        <AdminPageContainer
          contentWidthClassName={workspacePageContentWidthWide}
        >
          <p className="text-sm text-stone-600">Loading show details…</p>
        </AdminPageContainer>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AdminPageIntroSection variant="entity-detail">
          <AdminPageIntro
            variant="entity-detail"
            breadcrumb={<ShowShowsBreadcrumb showName="Show" />}
            title="Unable to load show"
          />
        </AdminPageIntroSection>
        <AdminPageContainer
          contentWidthClassName={workspacePageContentWidthWide}
        >
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
      <AdminPageIntroSection variant="entity-detail">
        <AdminPageIntro
          variant="entity-detail"
          breadcrumb={<ShowShowsBreadcrumb showName={showName || "Show"} />}
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

      <AdminPageContainer contentWidthClassName={workspacePageContentWidthWide}>
        <div className="flex min-w-0 flex-col gap-5 md:gap-6">
          <div className={workspacePagePrimarySecondaryGrid}>
            {/* Main column: unified money breakdown */}
            <div className="min-w-0">
              <section
                ref={breakdownSectionRef}
                className="min-w-0 scroll-mt-4"
                aria-labelledby="show-breakdown-heading"
              >
                <div
                  className={`min-w-0 overflow-hidden ${workspaceCard} ${
                    isClosed ? "bg-gray-50/50" : ""
                  }`}
                >
                  <div className="border-b border-gray-100/90 px-4 py-2.5 sm:px-5">
                    <h2
                      id="show-breakdown-heading"
                      className="text-[11px] font-semibold uppercase tracking-wider text-gray-500"
                    >
                      Show breakdown
                    </h2>
                    {isClosed ? (
                      <p className="mt-1 text-xs text-gray-500">
                        Locked — reopen the show below to edit payout or
                        settlements.
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-3 px-4 pb-4 pt-3 sm:px-5">
                    {/* Payout after fees — read-mostly figure */}
                    <div className="space-y-1">
                      <div
                        ref={payoutFigureRef}
                        tabIndex={-1}
                        className={`scroll-mt-20 rounded-lg outline-none transition-[box-shadow] duration-300 ${
                          breakdownFlash === "payout"
                            ? "ring-2 ring-rose-400/90 ring-offset-2 ring-offset-white"
                            : ""
                        }`}
                      >
                        <EditablePayout
                          payoutAfterFees={payoutAfterFees}
                          saving={savingPayout}
                          disabled={isClosed}
                          onSave={handleSavePayout}
                          displayVariant="moneyCard"
                        />
                      </div>
                      {savePayoutError ? (
                        <p className="text-sm text-amber-700" role="alert">
                          {savePayoutError}
                        </p>
                      ) : null}
                    </div>

                    <div
                      ref={settlementsAnchorRef}
                      tabIndex={-1}
                      className={`scroll-mt-20 border-t border-gray-100/90 pt-3 outline-none transition-[box-shadow] duration-300 ${
                        breakdownFlash === "settlements"
                          ? "rounded-lg ring-2 ring-rose-400/90 ring-offset-2 ring-offset-white"
                          : ""
                      }`}
                    >
                      <h3
                        id="settlements-heading"
                        className="text-base font-semibold leading-tight tracking-tight text-gray-950"
                      >
                        Settlements
                      </h3>
                      <div className="mt-2.5 overflow-x-auto rounded-md border border-gray-200/90">
                        <table className="min-w-full table-fixed border-collapse text-sm">
                          <colgroup>
                            <col className="w-10 sm:w-11" />
                            <col className="min-w-0" />
                            <col className="w-1 max-w-[4px] p-0" />
                            <col className="w-[6.75rem] sm:w-[7.25rem]" />
                            <col className="min-w-0 max-w-[11rem]" />
                            <col className="w-10 sm:w-11" />
                          </colgroup>
                          <thead className={workspaceTheadSticky}>
                            <tr className="border-b border-gray-200">
                              <th
                                scope="col"
                                className="w-10 px-2.5 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:w-11 sm:px-3"
                              >
                                <span className="sr-only">Expand</span>
                              </th>
                              <th
                                scope="col"
                                className="px-2.5 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-3"
                              >
                                Wholesaler
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
                                className="px-2 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-2.5"
                              >
                                Owed
                              </th>
                              <th
                                scope="col"
                                className="px-1.5 py-2 pl-0 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:pr-3"
                              >
                                Method
                              </th>
                              <th
                                scope="col"
                                className="px-2 py-2 pr-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500 sm:pr-3"
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
                                  className="px-2.5 py-3 text-left text-sm text-gray-600 sm:px-3"
                                >
                                  {isClosed
                                    ? "No settlements recorded."
                                    : "No settlements yet — add one below when you’re ready."}
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
                                const typeLabel =
                                  row.type === "PERCENT"
                                    ? "Percent"
                                    : row.type === "ITEMIZED"
                                      ? "Itemized"
                                      : "Flat";
                                return (
                                  <Fragment key={row.id}>
                                    <tr
                                      className={`border-b border-gray-100 transition-colors hover:bg-stone-50/90 ${expanded ? "bg-stone-50/50" : ""}`}
                                    >
                                      <td className="w-10 px-2.5 py-2 align-middle sm:w-11 sm:px-3">
                                        <button
                                          type="button"
                                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-200/80 hover:text-gray-900"
                                          aria-expanded={expanded}
                                          aria-controls={`settlement-detail-${row.id}`}
                                          aria-label={
                                            expanded
                                              ? "Collapse settlement details"
                                              : "Expand settlement details"
                                          }
                                          onClick={() =>
                                            toggleSettlementExpanded(row.id)
                                          }
                                        >
                                          {expanded ? (
                                            <ChevronDownIcon
                                              className="h-4 w-4"
                                              aria-hidden
                                            />
                                          ) : (
                                            <ChevronRightIcon
                                              className="h-4 w-4"
                                              aria-hidden
                                            />
                                          )}
                                        </button>
                                      </td>
                                      <td className="min-w-0 px-2.5 py-2 align-middle sm:px-3">
                                        <span className="block min-w-0 truncate font-medium leading-snug text-gray-900">
                                          {row.wholesaler}
                                        </span>
                                      </td>
                                      <td
                                        className="w-1 max-w-[4px] p-0"
                                        aria-hidden
                                      />
                                      <td className="whitespace-nowrap px-2 py-2 text-right align-middle tabular-nums text-sm font-semibold text-gray-900 sm:px-2.5">
                                        {formatCurrency(owed)}
                                      </td>
                                      <td className="min-w-0 px-1.5 py-2 pl-0 align-middle sm:pr-3">
                                        <div className="text-sm font-medium leading-snug text-gray-900">
                                          {typeLabel}
                                        </div>
                                        <div className="text-[11px] leading-snug text-gray-500">
                                          {settlementSummaryHint(row)}
                                        </div>
                                      </td>
                                      <td className="px-2 py-2 pr-2.5 text-right align-middle sm:pr-3">
                                        <div className="flex min-h-[2rem] items-center justify-end">
                                          <button
                                            type="button"
                                            disabled={
                                              isClosed ||
                                              deletingSettlementId === row.id
                                            }
                                            onClick={() =>
                                              setDeleteConfirmId(row.id)
                                            }
                                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-rose-700/90 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            aria-label="Remove settlement"
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
                                      <tr className="bg-stone-50/80">
                                        <td colSpan={6} className="p-0">
                                          <div
                                            id={`settlement-detail-${row.id}`}
                                            className="border-l border-stone-200/90 bg-stone-50/40 py-2 pl-3 pr-2.5 sm:pl-3.5"
                                            role="region"
                                            aria-label={`Details for ${row.wholesaler}`}
                                          >
                                            {row.type === "PERCENT" ? (
                                              <dl className="text-sm text-gray-700">
                                                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                                                  <dt className="font-medium text-gray-600">
                                                    Basis
                                                  </dt>
                                                  <dd className="min-w-0">
                                                    {row.percent}% of payout
                                                    after fees (
                                                    {formatCurrency(
                                                      payoutAfterFees,
                                                    )}
                                                    )
                                                  </dd>
                                                </div>
                                                <div className="mt-1 flex flex-wrap gap-x-2">
                                                  <dt className="font-medium text-gray-600">
                                                    Owed
                                                  </dt>
                                                  <dd className="font-semibold tabular-nums text-gray-900">
                                                    {formatCurrency(owed)}
                                                  </dd>
                                                </div>
                                              </dl>
                                            ) : null}
                                            {row.type === "FIXED" ? (
                                              <dl className="text-sm text-gray-700">
                                                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                                                  <dt className="font-medium text-gray-600">
                                                    Flat amount
                                                  </dt>
                                                  <dd className="font-semibold tabular-nums text-gray-900">
                                                    {formatCurrency(
                                                      row.fixedAmount,
                                                    )}
                                                  </dd>
                                                </div>
                                              </dl>
                                            ) : null}
                                            {row.type === "ITEMIZED" ? (
                                              <div className="space-y-1.5">
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                                                  Line items
                                                </p>
                                                {row.lines &&
                                                row.lines.length > 0 ? (
                                                  <ul className="divide-y divide-stone-200/70 rounded-sm bg-stone-50/60">
                                                    {row.lines.map((line) => (
                                                      <li
                                                        key={line.id}
                                                        className="flex items-baseline justify-between gap-2 px-1.5 py-0.5 text-sm leading-snug"
                                                      >
                                                        <span className="min-w-0 flex-1 text-left text-gray-800">
                                                          <span className="font-medium">
                                                            {line.item_name}
                                                          </span>
                                                          <span className="text-gray-500">
                                                            {" "}
                                                            × {
                                                              line.quantity
                                                            } @{" "}
                                                            {formatCurrency(
                                                              line.unit_price_cents /
                                                                100,
                                                            )}
                                                          </span>
                                                        </span>
                                                        <span className="shrink-0 text-right tabular-nums font-medium text-gray-900">
                                                          {formatCurrency(
                                                            line.line_total_cents /
                                                              100,
                                                          )}
                                                        </span>
                                                      </li>
                                                    ))}
                                                  </ul>
                                                ) : (
                                                  <p className="text-sm text-gray-600">
                                                    No line breakdown — total
                                                    owed{" "}
                                                    <span className="font-semibold tabular-nums text-gray-900">
                                                      {formatCurrency(owed)}
                                                    </span>
                                                    .
                                                  </p>
                                                )}
                                                <p className="mt-1 border-t border-stone-200/60 pt-1.5 text-[13px] text-gray-700">
                                                  <span className="font-medium text-gray-600">
                                                    Total owed
                                                  </span>{" "}
                                                  <span className="font-semibold tabular-nums text-gray-900">
                                                    {formatCurrency(owed)}
                                                  </span>
                                                </p>
                                              </div>
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
                      {!isClosed ? (
                        <div className="mt-7 flex justify-start border-t border-gray-100/80 pt-4">
                          <button
                            type="button"
                            onClick={() => focusSettlementComposer()}
                            className={`${workspaceActionSecondaryMd} !h-9 !w-9 shrink-0 !gap-0 !p-0 items-center justify-center rounded-lg`}
                            aria-label="Add settlement"
                            title="Add settlement"
                          >
                            <PlusIcon
                              className={workspaceActionIconMd}
                              aria-hidden
                            />
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
                            Add settlement
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
                                Wholesaler
                              </label>
                              <WorkspaceNativeSelect
                                id="new-settlement-wholesaler"
                                value={newRowWholesalerId}
                                onChange={(e) =>
                                  setNewRowWholesalerId(e.target.value)
                                }
                                className={`!h-9 w-full text-sm ${
                                  composerAttention.wholesaler
                                    ? "ring-2 ring-amber-300/90 ring-offset-1"
                                    : ""
                                }`}
                              >
                                <option value="">Select wholesaler</option>
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
                                  lines add up; you can’t assign more than 100%
                                  across percent settlements.
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
                                      {Math.max(
                                        0,
                                        100 - totalPercentUsed,
                                      ).toFixed(1)}
                                      % left for this percent line
                                    </span>
                                    {totalPercentUsed >= 100 - 1e-6 ? (
                                      <span className="ml-1 font-medium text-amber-800">
                                        (100% used — use flat/itemized or remove
                                        a percent row.)
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
                                    composerAttention.percent ||
                                    (payoutAfterFees > 0 &&
                                      !isPercentValueValid)
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
                                    Set payout after fees in Show breakdown
                                    first.
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
                                      composerAttention.flat
                                        ? "ring-2 ring-amber-300/90 ring-offset-1"
                                        : ""
                                    }`}
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                            ) : null}
                            {newRowMode === "QTY_UNIT" ? (
                              <div
                                className={`space-y-2 rounded-md border px-2 py-2 sm:px-3 ${
                                  composerAttention.itemized
                                    ? "border-amber-300/80 bg-amber-50/40"
                                    : "border-gray-200/80 bg-white/80"
                                }`}
                              >
                                <p className="text-xs font-medium text-gray-700">
                                  Line items
                                </p>
                                <div className="grid grid-cols-[minmax(0,1fr)_4rem_4.75rem_1.75rem] gap-x-1.5 border-b border-gray-100 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                                  <span>Item</span>
                                  <span className="text-right">Qty</span>
                                  <span className="text-right">$</span>
                                  <span className="sr-only">Remove line</span>
                                </div>
                                <div className="divide-y divide-gray-100">
                                  {newRowItemizedLines.map((line) => (
                                    <div
                                      key={line.id}
                                      className="grid grid-cols-[minmax(0,1fr)_4rem_4.75rem_1.75rem] items-center gap-x-1.5 py-1.5 first:pt-0"
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
                                        className={`min-w-0 ${workspaceTextInputCompact}`}
                                      />
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
                                        className={`${workspaceTextInputCompact} text-right tabular-nums`}
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
                                        className={`${workspaceTextInputCompact} text-right tabular-nums`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setNewRowItemizedLines((prev) =>
                                            prev.filter(
                                              (l) => l.id !== line.id,
                                            ),
                                          )
                                        }
                                        className="flex justify-end text-gray-500 hover:text-gray-800"
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
                                  : "Save settlement"}
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
                            {addSettlementPrimaryDisabled &&
                            !creatingSettlement &&
                            addSettlementSubmitBlockedReason ? (
                              <p
                                className="text-xs font-medium leading-snug text-amber-900/90"
                                role="status"
                              >
                                {addSettlementSubmitBlockedReason}
                              </p>
                            ) : null}
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
                              ? "Save payout in Show breakdown, then try again."
                              : createSettlementError) ??
                            (newRowError?.toLowerCase().includes("financials")
                              ? "Save payout in Show breakdown, then try again."
                              : newRowError)}
                        </p>
                      ) : null}
                    </div>

                    {/* Receipt — label + compact control (balances-style) */}
                    <div
                      className="border-t border-gray-100 pt-3"
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
                      <div className="flex min-h-[1.75rem] flex-wrap items-center gap-x-2 gap-y-1.5">
                        <span
                          id="payout-receipt-heading"
                          className="shrink-0 text-xs font-medium text-gray-500"
                        >
                          Receipt{" "}
                          <span className="font-normal text-gray-400">
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
                              className={`${workspaceActionSecondaryMd} !px-2 !py-0.5 text-xs disabled:opacity-60`}
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
                              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-60"
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
                                    className={`${workspaceActionSecondaryMd} shrink-0 !px-1.5 !py-0.5 text-[11px]`}
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
                                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
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
                                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
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
            <div className="min-w-0">
              <section
                className={`flex min-h-full min-w-0 flex-col overflow-hidden ${workspaceCard}`}
                aria-labelledby="review-profit-heading"
              >
                <div className={workspaceSectionToolbar}>
                  <h2
                    id="review-profit-heading"
                    className={workspaceSectionTitle}
                  >
                    Review
                  </h2>
                </div>
                <div className="flex flex-1 flex-col px-4 py-3.5 sm:px-5">
                  <div
                    className="flex flex-1 flex-col text-sm"
                    role="region"
                    aria-label="Payout and profit"
                  >
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                          Payout
                        </span>
                        <span
                          className={`shrink-0 text-right text-lg font-semibold ${workspaceMoneyTabular} ${workspaceMoneyPositive}`}
                          aria-label={`Payout after fees ${formatCurrency(payoutAfterFees)}`}
                        >
                          {formatCurrencyAbs(payoutAfterFees)}
                        </span>
                      </div>
                      {settlements.length === 0 ? (
                        <p className="text-xs text-gray-500">No settlements.</p>
                      ) : (
                        <ul className="space-y-1 border-t border-gray-100/90 pt-3">
                          {settlements.map((s) => {
                            const owed = amountOwedFor(payoutAfterFees, s);
                            return (
                              <li
                                key={s.id}
                                className="flex items-baseline justify-between gap-2"
                              >
                                <span className="min-w-0 truncate text-[13px] text-gray-800">
                                  {s.wholesaler}
                                </span>
                                <span
                                  className={`shrink-0 text-right text-[15px] font-medium ${workspaceMoneyTabular} ${workspaceMoneyNegative}`}
                                  aria-label={`Owed to ${s.wholesaler} ${formatCurrency(owed)}`}
                                >
                                  {formatCurrencyAbs(owed)}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <div className="mt-6 space-y-4 border-t border-gray-200/90 pt-5">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-semibold text-gray-900">
                          = Profit
                        </span>
                        <span
                          className={`shrink-0 text-right text-2xl font-bold tracking-tight ${workspaceMoneyTabular} ${workspaceMoneyClassForSigned(totals.profitEstimate)}`}
                          aria-label={`Profit ${formatCurrency(totals.profitEstimate)}`}
                        >
                          {formatCurrencyAbs(totals.profitEstimate)}
                        </span>
                      </div>

                      {totals.status === "Open" ? (
                        <button
                          type="button"
                          onClick={handleCloseShowClick}
                          disabled={closing}
                          className={`${workspaceActionCompleteMd} w-full disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {closing ? "Closing…" : "Close show"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReopenDialogOpen(true)}
                          disabled={closing}
                          className={`${workspaceActionSecondaryMd} w-full disabled:cursor-not-allowed disabled:opacity-50`}
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
        title="Delete this settlement?"
        description="This removes the wholesaler obligation for this show. You can add it again while the show is open."
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
        description="Payout and settlements will be locked until you reopen the show."
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
        description="You will be able to edit payout and settlements again."
        confirmLabel={
          closing
            ? "Reopening…"
            : "Reopen show (unlocks payout and settlements)"
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
}: {
  payoutAfterFees: number;
  saving: boolean;
  disabled?: boolean;
  onSave: (amount: number) => Promise<boolean>;
  displayVariant?: "default" | "moneyCard";
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
    return (
      <div
        className={`rounded-lg border border-stone-200/75 px-3 py-2 sm:px-3.5 sm:py-2.5 transition-all duration-200 ${
          editing
            ? "min-h-[7.75rem] bg-white shadow-sm"
            : "min-h-[7.75rem] bg-stone-50/50"
        } flex flex-col justify-center`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p
              className={`${workspaceLabelEyebrow} text-[10px] font-medium uppercase tracking-wide text-stone-500`}
            >
              Payout after fees
            </p>
            <div className="mt-0.5 min-h-[1.875rem]">
              {!editing ? (
                <p className="text-xl font-semibold tabular-nums tracking-tight text-stone-800 transition-opacity duration-200">
                  {formatCurrency(payoutAfterFees)}
                </p>
              ) : (
                <div className="relative max-w-[14rem]">
                  <span
                    className="pointer-events-none absolute left-0 top-1/2 z-[1] -translate-y-1/2 text-base text-stone-400"
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
                    className="w-full border-0 border-b border-stone-300 bg-transparent py-0.5 pl-5 pr-0.5 text-xl font-semibold tabular-nums tracking-tight text-stone-800 placeholder:text-stone-300 focus:border-stone-500 focus:outline-none focus:ring-0 disabled:opacity-50"
                    placeholder="0.00"
                    aria-label="Payout amount in dollars"
                  />
                </div>
              )}
            </div>
            {editing ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
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
            ) : null}
          </div>
          {!editing && !disabled ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-stone-200/70 bg-white/90 text-stone-500 transition-colors hover:border-stone-300 hover:bg-stone-100 hover:text-stone-800"
              aria-label="Edit payout after fees"
            >
              <PencilSquareIcon className="h-3 w-3" aria-hidden />
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
