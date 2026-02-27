"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createShow, upsertShowFinancials } from "@/src/lib/api/shows";

export default function AdminShowsNewPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [payoutAfterFees, setPayoutAfterFees] = useState("");
  const [platform, setPlatform] = useState<"WHATNOT" | "INSTAGRAM" | "OTHER">(
    "WHATNOT",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await createShow({
        show_date: date.trim(),
        platform,
        name: name.trim() || undefined,
      });

      const payout = payoutAfterFees.trim()
        ? Number(payoutAfterFees)
        : undefined;
      if (payout !== undefined && Number.isFinite(payout)) {
        await upsertShowFinancials(created.id, {
          payout_after_fees_amount: payout,
        });
      }

      router.push("/admin/shows");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/shows"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Shows
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Create Show</h1>

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
        className="max-w-xl space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
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
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="e.g. Spring Pop-Up 2025"
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
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="WHATNOT">WHATNOT</option>
            <option value="INSTAGRAM">INSTAGRAM</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>

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
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <div>
          <label
            htmlFor="payoutAfterFees"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Payout After Fees <span className="text-red-500">*</span>
          </label>
          <input
            id="payoutAfterFees"
            type="number"
            required
            min="0"
            step="0.01"
            value={payoutAfterFees}
            onChange={(e) => setPayoutAfterFees(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="0.00"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
          <Link
            href="/admin/shows"
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
