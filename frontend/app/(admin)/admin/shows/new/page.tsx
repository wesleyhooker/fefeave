"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import {
  createShow,
  fetchShows,
  upsertShowFinancials,
} from "@/src/lib/api/shows";
import {
  workspaceActionCompleteMd,
  workspaceActionSecondaryMd,
} from "@/app/(admin)/admin/_components/workspaceUi";

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

export default function AdminShowsNewPage() {
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
    <div>
      <nav className="mb-2 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href="/admin/shows" className="hover:text-gray-700">
          Shows
        </Link>
        <span className="mx-1.5">/</span>
        <span aria-current="page">Create</span>
      </nav>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Create Show</h1>

      {error && (
        <div
          className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          <p className="font-medium">Could not create show.</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-workspace-surface"
      >
        <div>
          <label
            htmlFor="date"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Show Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => {
              nameManuallyEdited.current = true;
              setName(e.target.value);
            }}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="e.g. 2026-03-10"
          />
        </div>

        <div>
          <label
            htmlFor="platform"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Platform <span className="text-red-500">*</span>
          </label>
          <select
            id="platform"
            value={platform}
            onChange={(e) =>
              setPlatform(e.target.value as "WHATNOT" | "INSTAGRAM" | "OTHER")
            }
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="WHATNOT">WHATNOT</option>
            <option value="INSTAGRAM">INSTAGRAM</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="payoutAfterFees"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Payout after fees ($) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
              aria-hidden
            >
              $
            </span>
            <input
              id="payoutAfterFees"
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
              className="w-full max-w-[8rem] rounded-md border border-gray-200 py-2 pl-7 pr-3 text-sm tabular-nums shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="0.00"
              aria-label="Payout after fees in dollars"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className={`${workspaceActionCompleteMd} disabled:opacity-60`}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
          <Link href="/admin/shows" className={workspaceActionSecondaryMd}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
