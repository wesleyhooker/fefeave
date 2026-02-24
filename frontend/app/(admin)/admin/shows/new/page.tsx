"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminShowsNewPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [payoutAfterFees, setPayoutAfterFees] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      date: date.trim(),
      payoutAfterFees: payoutAfterFees ? Number(payoutAfterFees) : undefined,
    };
    console.log("Mock submit:", payload);
    router.push("/admin/shows");
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
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Submit
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
