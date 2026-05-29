"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { WorkspaceActionLabel } from "@/app/(admin)/admin/_components/WorkspaceActionLabel";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import {
  workspaceActionIconMd,
  workspaceActionPositiveCompleteMd,
  workspaceActionSecondaryMd,
  workspaceCard,
  workspaceDateInput,
  workspaceFormLabel,
  workspaceLabelEyebrow,
  workspaceSectionTitle,
  workspaceSectionToolbar,
  workspaceTextInput,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  WORKFLOW_LOG_SHOW_FORM_DRAWER_NOTE,
  WORKFLOW_LOG_SHOW_PLATFORM_FEE_HINT,
  WORKFLOW_LOG_SHOW_TRIGGER_LABEL,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  createShow,
  fetchShows,
  type ShowDTO,
  upsertShowFinancials,
} from "@/src/lib/api/shows";

/** Default show name: YYYY-MM-DD, or YYYY-MM-DD #2, #3 if same date exists. */
function defaultShowNameForDate(
  dateStr: string,
  existingShowsOnDate: { name: string }[],
): string {
  if (!dateStr || dateStr.length < 10) return dateStr || "";
  const base = dateStr;
  const prefix = base + " #";
  const withSuffix = existingShowsOnDate.filter(
    (s) => s.name === base || s.name.startsWith(prefix),
  );
  const maxSuffix = withSuffix.reduce((max, s) => {
    if (s.name === base) return Math.max(max, 1);
    const num = parseInt(s.name.slice(prefix.length), 10);
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0);
  if (maxSuffix === 0) return base;
  return `${base} #${maxSuffix + 1}`;
}

const PLATFORM_OPTIONS: {
  value: "WHATNOT" | "INSTAGRAM" | "OTHER";
  label: string;
}[] = [
  { value: "WHATNOT", label: "Whatnot" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "OTHER", label: "Other" },
];

export type ShowCreateFormProps = {
  onSuccess?: (show: ShowDTO) => void;
  onCancel?: () => void;
  variant?: "page" | "drawer";
};

/**
 * Create-show fields and submission — route shell lives in `page.tsx`,
 * or open from the Shows list drawer with callbacks.
 */
export function ShowCreateForm({
  onSuccess,
  onCancel,
  variant = "page",
}: ShowCreateFormProps = {}) {
  const router = useRouter();
  const dense = variant === "drawer";

  const innerCardClass = dense
    ? "min-w-0 overflow-hidden rounded-none border-0 bg-transparent shadow-none"
    : `min-w-0 overflow-hidden ${workspaceCard}`;

  const sectionToolbarClass = workspaceSectionToolbar;

  const identityFieldsClass = "space-y-4 px-4 py-4 sm:px-5";

  const financialBlockClass = "px-4 py-4 sm:px-5";

  /** Page: eyebrow + field stack; drawer: payout is a peer field after Core identity (no subsection chrome). */
  const payoutIntroMargin = dense ? "mt-0" : "mt-3";
  const defaultDate = () => new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(defaultDate);
  const [existingShows, setExistingShows] = useState<
    { show_date: string; name: string }[]
  >([]);
  const [name, setName] = useState(date);
  const nameManuallyEdited = useRef(false);
  const [payoutAfterFees, setPayoutAfterFees] = useState("");
  const [platformFee, setPlatformFee] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [platform, setPlatform] = useState<"WHATNOT" | "INSTAGRAM" | "OTHER">(
    "WHATNOT",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchShows()
      .then((rows) => {
        if (!cancelled)
          setExistingShows(
            rows.map((r) => ({ show_date: r.show_date, name: r.name })),
          );
      })
      .catch(() => {
        if (!cancelled) setExistingShows([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const showsOnSelectedDate = existingShows.filter((s) => s.show_date === date);
  const suggestedName = defaultShowNameForDate(date, showsOnSelectedDate);

  useEffect(() => {
    if (!nameManuallyEdited.current) {
      setName(suggestedName);
    }
  }, [suggestedName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payoutNum =
      payoutAfterFees.trim() === ""
        ? NaN
        : Number(payoutAfterFees.replace(/,/g, ""));
    if (
      payoutAfterFees.trim() === "" ||
      !Number.isFinite(payoutNum) ||
      payoutNum < 0
    ) {
      setError("Enter a valid payout amount (0 or more).");
      return;
    }

    let platformFeeNum: number | undefined;
    if (platformFee.trim() !== "") {
      const parsed = Number(platformFee.replace(/,/g, ""));
      if (!Number.isFinite(parsed) || parsed < 0) {
        setError("Enter a valid platform fee (0 or more), or leave it blank.");
        return;
      }
      platformFeeNum = parsed;
    }

    const startedIso = startedAt.trim()
      ? new Date(startedAt).toISOString()
      : undefined;
    const endedIso = endedAt.trim()
      ? new Date(endedAt).toISOString()
      : undefined;
    if (
      startedIso != null &&
      endedIso != null &&
      new Date(endedIso).getTime() <= new Date(startedIso).getTime()
    ) {
      setError("Show end time must be after the start time.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createShow({
        show_date: date.trim(),
        platform,
        name: name.trim() || undefined,
        started_at: startedIso,
        ended_at: endedIso,
      });

      await upsertShowFinancials(created.id, {
        payout_after_fees_amount: payoutNum,
        platform_fee_amount: platformFeeNum,
      });

      if (onSuccess != null) {
        onSuccess(created);
      } else {
        router.push(`/admin/shows/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const dateField = (
    <div>
      <label htmlFor="create-show-date" className={workspaceFormLabel}>
        Show date <span className="text-red-500">*</span>
      </label>
      <input
        id="create-show-date"
        type="date"
        required
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className={`${workspaceDateInput} mt-1.5 w-full min-w-0`}
      />
    </div>
  );

  const platformField = (
    <div>
      <label htmlFor="create-show-platform" className={workspaceFormLabel}>
        Platform <span className="text-red-500">*</span>
      </label>
      <div className="mt-1.5">
        <WorkspaceNativeSelect
          id="create-show-platform"
          required
          value={platform}
          onChange={(e) =>
            setPlatform(e.target.value as "WHATNOT" | "INSTAGRAM" | "OTHER")
          }
          className="w-full min-w-0"
          aria-label="Platform"
        >
          {PLATFORM_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </WorkspaceNativeSelect>
      </div>
    </div>
  );

  const nameField = (
    <div>
      <label htmlFor="create-show-name" className={workspaceFormLabel}>
        Show name <span className="text-red-500">*</span>
      </label>
      <input
        id="create-show-name"
        type="text"
        required
        value={name}
        onChange={(e) => {
          nameManuallyEdited.current = true;
          setName(e.target.value);
        }}
        className={`${workspaceTextInput} mt-1.5 w-full min-w-0 ${
          dense ? "bg-stone-50/80 border-stone-200/85" : ""
        }`}
        placeholder="e.g. 2026-03-10"
        autoComplete="off"
      />
    </div>
  );

  const payoutField = (
    <div className={payoutIntroMargin}>
      <label htmlFor="create-show-payout" className={workspaceFormLabel}>
        Payout after fees ($) <span className="text-red-500">*</span>
      </label>
      <div
        className={`relative mt-1.5 ${dense ? "max-w-full sm:max-w-[10rem]" : "max-w-[10rem]"}`}
      >
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
          aria-hidden
        >
          $
        </span>
        <input
          id="create-show-payout"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          required
          value={payoutAfterFees}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, "");
            const parts = v.split(".");
            if (parts.length > 2) return;
            if (parts[1]?.length > 2) return;
            setPayoutAfterFees(v);
          }}
          className={`${workspaceTextInput} w-full pl-7 tabular-nums`}
          placeholder="0.00"
          aria-label="Payout after fees in dollars"
        />
      </div>
    </div>
  );

  const timingFields = (
    <div>
      <p className={workspaceLabelEyebrow}>Show timing (optional)</p>
      <div className="mt-1.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label htmlFor="create-show-started-at" className="block min-w-0">
          <span className={workspaceFormLabel}>Started</span>
          <input
            id="create-show-started-at"
            type="datetime-local"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className={`${workspaceDateInput} mt-1.5 w-full min-w-0`}
            aria-label="Show start time"
          />
        </label>
        <label htmlFor="create-show-ended-at" className="block min-w-0">
          <span className={workspaceFormLabel}>Ended</span>
          <input
            id="create-show-ended-at"
            type="datetime-local"
            value={endedAt}
            onChange={(e) => setEndedAt(e.target.value)}
            className={`${workspaceDateInput} mt-1.5 w-full min-w-0`}
            aria-label="Show end time"
          />
        </label>
      </div>
      <p className="mt-1.5 text-xs text-gray-500">
        Used later for duration insights. Leave blank if unknown.
      </p>
    </div>
  );

  const platformFeeField = (
    <div className="mt-4">
      <label htmlFor="create-show-platform-fee" className={workspaceFormLabel}>
        Platform fee ($) (optional)
      </label>
      <div className="relative mt-1.5 max-w-[10rem]">
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
          aria-hidden
        >
          $
        </span>
        <input
          id="create-show-platform-fee"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={platformFee}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, "");
            const parts = v.split(".");
            if (parts.length > 2) return;
            if (parts[1]?.length > 2) return;
            setPlatformFee(v);
          }}
          className={`${workspaceTextInput} w-full pl-7 tabular-nums`}
          placeholder="0.00"
          aria-label="Platform fee in dollars"
        />
      </div>
      <p className="mt-1.5 max-w-md text-xs leading-snug text-gray-500">
        {WORKFLOW_LOG_SHOW_PLATFORM_FEE_HINT}
      </p>
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={`min-w-0 max-w-xl ${dense ? "space-y-3" : "space-y-6"}`}
    >
      {error != null ? (
        <WorkspaceInlineError
          title={
            error.includes("Enter a valid payout")
              ? "Check payout amount"
              : "Could not create show"
          }
          message={error}
        />
      ) : null}

      <div
        className={
          dense
            ? "overflow-hidden rounded-lg border border-gray-200/90 bg-white shadow-workspace-surface-sm"
            : "contents"
        }
      >
        {/* A. Core show identity (drawer: no in-form section title — shell title suffices) */}
        <div className={innerCardClass}>
          {!dense ? (
            <div className={sectionToolbarClass}>
              <h2 className={workspaceSectionTitle}>Core show identity</h2>
            </div>
          ) : null}
          {dense ? (
            <div className="px-4 pb-4 pt-4 sm:px-3.5 sm:pb-3 sm:pt-3.5">
              <p className="mb-4 text-sm font-medium leading-relaxed text-stone-600 sm:mb-3 sm:text-xs sm:leading-snug">
                {WORKFLOW_LOG_SHOW_FORM_DRAWER_NOTE}
              </p>
              <div className="space-y-3 sm:space-y-2">
                {dateField}
                {platformField}
              </div>
              <div className="mt-5 sm:mt-4">{payoutField}</div>
              <div className="mt-6">{nameField}</div>
            </div>
          ) : (
            <div className={identityFieldsClass}>
              {dateField}
              {nameField}
              {platformField}
              {timingFields}
            </div>
          )}
        </div>

        {/* B. Financial setup — page only (drawer: payout lives in identity stack above) */}
        {!dense ? (
          <div className={innerCardClass}>
            <div className={sectionToolbarClass}>
              <h2 className={workspaceSectionTitle}>Financial setup</h2>
            </div>
            <div className={financialBlockClass}>
              <p className={workspaceLabelEyebrow}>Starting payout</p>
              {payoutField}
              {platformFeeField}
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={
          dense
            ? "flex flex-col gap-3 border-t border-stone-200/80 pt-4 sm:flex-row sm:flex-wrap sm:gap-2 sm:pt-3"
            : "flex flex-wrap gap-3 pt-1"
        }
      >
        <button
          type="submit"
          disabled={submitting}
          className={`${workspaceActionPositiveCompleteMd} disabled:opacity-60`}
        >
          <WorkspaceActionLabel
            icon={<PlusIcon className={workspaceActionIconMd} />}
          >
            {submitting
              ? dense
                ? "Logging…"
                : "Creating…"
              : dense
                ? WORKFLOW_LOG_SHOW_TRIGGER_LABEL
                : "Create show"}
          </WorkspaceActionLabel>
        </button>
        {onCancel != null ? (
          <button
            type="button"
            onClick={onCancel}
            className={workspaceActionSecondaryMd}
          >
            Cancel
          </button>
        ) : (
          <Link href="/admin/shows" className={workspaceActionSecondaryMd}>
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
