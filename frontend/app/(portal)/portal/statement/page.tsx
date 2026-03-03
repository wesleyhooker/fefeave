"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";

interface PortalMeResponse {
  wholesaler?: {
    id: string;
    name: string;
  };
}

interface PortalStatementEntry {
  type: string;
  date: string;
  amount: string;
  show?: string;
  show_name?: string;
  show_id?: string;
  description?: string;
  running_balance?: string;
}

interface PortalErrorResponse {
  code?: string;
  message?: string;
}

function formatAmount2dp(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toFixed(2);
}

function resolveProvisioningMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("no wholesaler") ||
    normalized.includes("not provisioned") ||
    normalized.includes("linked")
  );
}

function parseFilenameFromDisposition(
  disposition: string | null,
): string | null {
  if (!disposition) return null;
  const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^\";]+)"?/i);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export default function PortalStatementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provisioningMessage, setProvisioningMessage] = useState<string | null>(
    null,
  );
  const [statement, setStatement] = useState<PortalStatementEntry[]>([]);
  const [wholesalerName, setWholesalerName] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  const hasRunningBalance = useMemo(
    () => statement.some((entry) => entry.running_balance !== undefined),
    [statement],
  );

  const loadStatement = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProvisioningMessage(null);

    try {
      const meRes = await fetch("/api/portal/me", {
        method: "GET",
        cache: "no-store",
      });

      if (meRes.status === 401) {
        router.replace("/login");
        return;
      }

      if (meRes.status === 403) {
        const body = (await meRes.json().catch(() => ({
          message: "Portal access is not provisioned yet.",
        }))) as PortalErrorResponse;
        const message =
          body.message ??
          "Portal access is not provisioned yet. Ask an admin to link your wholesaler account.";
        if (
          body.code === "WHOLESALER_NOT_LINKED" ||
          resolveProvisioningMessage(message)
        ) {
          setProvisioningMessage(message);
          setStatement([]);
          return;
        }
        setError(message);
        return;
      }

      if (!meRes.ok) {
        throw new Error(`Could not load profile (${meRes.status}).`);
      }

      const meData = (await meRes.json()) as PortalMeResponse;
      setWholesalerName(meData.wholesaler?.name ?? null);

      const statementRes = await fetch("/api/portal/statement", {
        method: "GET",
        cache: "no-store",
      });

      if (statementRes.status === 401) {
        router.replace("/login");
        return;
      }

      if (!statementRes.ok) {
        throw new Error(`Could not load statement (${statementRes.status}).`);
      }

      const entries = (await statementRes.json()) as PortalStatementEntry[];
      setStatement(Array.isArray(entries) ? entries : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadStatement();
  }, [loadStatement, retryTick]);

  async function handleDownloadCsv(): Promise<void> {
    setDownloadError(null);
    setDownloading(true);
    try {
      const response = await fetch("/api/portal/statement/export?format=csv", {
        method: "GET",
        cache: "no-store",
      });
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok) {
        throw new Error(`CSV download failed (${response.status}).`);
      }

      const blob = await response.blob();
      const filename =
        parseFilenameFromDisposition(
          response.headers.get("content-disposition"),
        ) ?? "portal-statement.csv";
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Failed to download CSV.",
      );
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-48 rounded bg-gray-200" />
          <div className="h-4 w-72 rounded bg-gray-200" />
          <div className="h-64 rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  if (provisioningMessage) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Not linked yet
        </h1>
        <p className="text-gray-700">{provisioningMessage}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Statement unavailable
        </h1>
        <p className="mb-4 text-sm text-red-700" role="alert">
          {error}
        </p>
        <button
          type="button"
          onClick={() => setRetryTick((v) => v + 1)}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statement</h1>
          <p className="text-sm text-gray-600">
            {wholesalerName
              ? `Showing activity for ${wholesalerName}.`
              : "Your statement activity."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleDownloadCsv()}
          disabled={downloading}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
        >
          {downloading ? "Downloading..." : "Download CSV"}
        </button>
      </div>

      {downloadError ? (
        <p className="mb-4 text-sm text-red-700" role="alert">
          {downloadError}
        </p>
      ) : null}

      {statement.length === 0 ? (
        <div className="rounded border border-dashed border-gray-300 p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            No statement entries
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Entries will appear here when owed items or payments are recorded.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Show
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Description
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Amount
                </th>
                {hasRunningBalance ? (
                  <th className="px-4 py-3 text-right font-medium text-gray-600">
                    Running Balance
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {statement.map((entry, idx) => (
                <tr
                  key={`${entry.date}-${entry.type}-${entry.show_id ?? "none"}-${idx}`}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {formatDate(entry.date)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {entry.type}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {entry.show ?? entry.show_name ?? entry.show_id ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {entry.description ??
                      (entry.type === "PAYMENT"
                        ? "Payment received"
                        : "Amount owed")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-900">
                    {formatAmount2dp(entry.amount)}
                  </td>
                  {hasRunningBalance ? (
                    <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700">
                      {entry.running_balance
                        ? formatAmount2dp(entry.running_balance)
                        : "-"}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
