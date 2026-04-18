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
  createShow,
  fetchShows,
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

/**
 * Create-show fields and submission — route shell lives in `page.tsx`.
 */
export function ShowCreateForm() {
  const router = useRouter();
  const defaultDate = () => new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(defaultDate);
  const [existingShows, setExistingShows] = useState<
    { show_date: string; name: string }[]
  >([]);
  const [name, setName] = useState(date);
  const nameManuallyEdited = useRef(false);
  const [payoutAfterFees, setPayoutAfterFees] = useState("");
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
    setSubmitting(true);
    try {
      const created = await createShow({
        show_date: date.trim(),
        platform,
        name: name.trim() || undefined,
      });

      await upsertShowFinancials(created.id, {
        payout_after_fees_amount: payoutNum,
      });

      router.push(`/admin/shows/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="min-w-0 max-w-xl space-y-6">
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

      {/* A. Core show identity */}
      <div className={`min-w-0 overflow-hidden ${workspaceCard}`}>
        <div className={workspaceSectionToolbar}>
          <h2 className={workspaceSectionTitle}>Core show identity</h2>
        </div>
        <div className="space-y-4 px-4 py-4 sm:px-5">
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
              className={`${workspaceTextInput} mt-1.5 w-full min-w-0`}
              placeholder="e.g. 2026-03-10"
              autoComplete="off"
            />
          </div>
          <div>
            <label
              htmlFor="create-show-platform"
              className={workspaceFormLabel}
            >
              Platform <span className="text-red-500">*</span>
            </label>
            <div className="mt-1.5">
              <WorkspaceNativeSelect
                id="create-show-platform"
                required
                value={platform}
                onChange={(e) =>
                  setPlatform(
                    e.target.value as "WHATNOT" | "INSTAGRAM" | "OTHER",
                  )
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
        </div>
      </div>

      {/* B. Financial setup */}
      <div className={`min-w-0 overflow-hidden ${workspaceCard}`}>
        <div className={workspaceSectionToolbar}>
          <h2 className={workspaceSectionTitle}>Financial setup</h2>
        </div>
        <div className="px-4 py-4 sm:px-5">
          <p className={workspaceLabelEyebrow}>Starting payout</p>
          <div className="mt-3">
            <label htmlFor="create-show-payout" className={workspaceFormLabel}>
              Payout after fees ($) <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5 max-w-[10rem]">
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
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className={`${workspaceActionPositiveCompleteMd} disabled:opacity-60`}
        >
          <WorkspaceActionLabel
            icon={<PlusIcon className={workspaceActionIconMd} />}
          >
            {submitting ? "Creating…" : "Create show"}
          </WorkspaceActionLabel>
        </button>
        <Link href="/admin/shows" className={workspaceActionSecondaryMd}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
