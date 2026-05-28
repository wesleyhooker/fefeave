"use client";

import {
  BanknotesIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ScaleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminWorkspacePageIntro,
  AdminWorkspacePageLayout,
} from "@/app/(admin)/admin/_components/AdminWorkspacePageLayout";
import { WorkspaceEmptyState } from "@/app/(admin)/admin/_components/WorkspaceEmptyState";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import { WorkspacePageWithRightPanel } from "@/app/(admin)/admin/_components/WorkspacePageWithRightPanel";
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";
import { WorkspaceSidePanelTrigger } from "@/app/(admin)/admin/_components/WorkspaceSidePanelTrigger";
import { FinancialsCrossLinks } from "@/app/(admin)/admin/_components/FinancialsCrossLinks";
import {
  workspaceActionIconMd,
  workspaceActionPrimaryMd,
  workspaceActionSecondaryMd,
  workspaceActionUtilitySm,
  workspaceCard,
  workspaceFormLabel,
  workspaceInsetFlatList,
  workspacePanel,
  workspaceSectionToolbar,
  workspaceSectionTitle,
  workspaceTableCellMeta,
  workspaceTextInput,
  workspaceToolbarSearchInput,
  workspaceMoneyClassForLiability,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  WORKFLOW_EMPTY_ACCOUNTS_OWNER_HINT,
  WORKFLOW_EMPTY_ACCOUNTS_OWNER_TITLE,
  WORKFLOW_EMPTY_ACCOUNTS_WHOLESALER_HINT,
  WORKFLOW_EMPTY_ACCOUNTS_WHOLESALER_TITLE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  type AccountDTO,
  type AccountStatus,
  createAccount,
  listAccounts,
} from "@/src/lib/api/accounts";
import { formatCurrency, formatDate } from "@/lib/format";

function toNum(value?: string): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function extractPhoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

function formatPhoneNumber(value: string): string {
  const digits = extractPhoneDigits(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

type AddAccountFormProps = {
  onCreated: () => void;
  onCancel: () => void;
};

function AddAccountForm({ onCreated, onCancel }: AddAccountFormProps) {
  const [displayName, setDisplayName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhoneDigits, setContactPhoneDigits] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);

  const trimmedEmail = contactEmail.trim();
  const emailError =
    trimmedEmail.length > 0 && !isValidEmail(trimmedEmail)
      ? "Enter a valid email address."
      : null;
  const showEmailError = emailTouched && emailError != null;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setEmailTouched(true);
    if (emailError) return;
    setError(null);
    setSubmitting(true);
    try {
      await createAccount({
        displayName: displayName.trim(),
        type: "WHOLESALER",
        contactName: contactName.trim() ? contactName.trim() : undefined,
        contactEmail: trimmedEmail ? trimmedEmail : undefined,
        contactPhone: contactPhoneDigits || undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <WorkspaceInlineError
          title="Could not create account"
          message="Check the form values and retry."
        >
          <p className="mt-1 text-xs text-rose-900">{error}</p>
        </WorkspaceInlineError>
      ) : null}

      <div>
        <label htmlFor="account-name" className={workspaceFormLabel}>
          Account name
        </label>
        <input
          id="account-name"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={`${workspaceTextInput} mt-1.5 w-full`}
          placeholder="Wholesaler name"
        />
      </div>

      <div>
        <label htmlFor="account-contact-name" className={workspaceFormLabel}>
          Contact person (optional)
        </label>
        <input
          id="account-contact-name"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          className={`${workspaceTextInput} mt-1.5 w-full`}
          placeholder="Contact person"
        />
      </div>

      <div>
        <label htmlFor="account-contact-email" className={workspaceFormLabel}>
          Email (optional)
        </label>
        <input
          id="account-contact-email"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          aria-invalid={showEmailError}
          className={`${workspaceTextInput} mt-1.5 w-full ${
            showEmailError
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-300"
              : ""
          }`}
          placeholder="name@company.com"
        />
        {showEmailError ? (
          <p className="mt-1.5 text-xs font-medium text-rose-700">
            {emailError}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="account-contact-phone" className={workspaceFormLabel}>
          Phone (optional)
        </label>
        <input
          id="account-contact-phone"
          inputMode="tel"
          value={formatPhoneNumber(contactPhoneDigits)}
          onChange={(e) =>
            setContactPhoneDigits(extractPhoneDigits(e.target.value))
          }
          className={`${workspaceTextInput} mt-1.5 w-full`}
          placeholder="(555) 555-5555"
        />
      </div>

      <div>
        <label htmlFor="account-notes" className={workspaceFormLabel}>
          Notes
        </label>
        <textarea
          id="account-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={`${workspaceTextInput} mt-1.5 min-h-24 h-auto w-full resize-y py-2.5 align-top`}
          placeholder="Optional notes"
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-stone-200/80 pt-4 sm:flex-row sm:justify-end sm:gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={workspaceActionSecondaryMd}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || emailError != null}
          className={`${workspaceActionPrimaryMd} disabled:opacity-60`}
        >
          <PlusIcon className={workspaceActionIconMd} />
          {submitting ? "Creating…" : "Create account"}
        </button>
      </div>
    </form>
  );
}

export default function AccountsPage() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<AccountDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AccountStatus>(
    "ALL",
  );
  const [panelMode, setPanelMode] = useState<"add" | "ownerInfo" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listAccounts();
      setAccounts(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setPanelMode("add");
    }
  }, [searchParams]);

  const ownerAccount = useMemo(
    () => accounts?.find((a) => a.type === "OWNER") ?? null,
    [accounts],
  );

  const wholesalerAccounts = useMemo(() => {
    const rows = accounts?.filter((a) => a.type === "WHOLESALER") ?? [];
    const q = search.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (statusFilter !== "ALL" && row.status !== statusFilter) return false;
        if (!q) return true;
        return (
          row.displayName.toLowerCase().includes(q) ||
          (row.linkedUserEmail ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [accounts, search, statusFilter]);

  const isAddOpen = panelMode === "add";
  const isOwnerInfoOpen = panelMode === "ownerInfo";

  const linkedUserLabel = useCallback((linkedUserEmail?: string): string => {
    // TODO: replace with protected user lookup/dropdown for explicit user linking.
    return linkedUserEmail ? "Felicia" : "Not connected";
  }, []);

  return (
    <WorkspacePageWithRightPanel
      open={panelMode != null}
      onClose={() => setPanelMode(null)}
      title={
        isOwnerInfoOpen ? "Owner payout account" : "Add wholesaler account"
      }
      panelSubtitle={
        isOwnerInfoOpen
          ? "This account is system-owned and represents the internal payout ledger party."
          : "Create a wholesaler balance account used for payouts, wholesaler balances, and payments."
      }
      panel={
        isOwnerInfoOpen ? (
          <div className="space-y-4">
            <div className={`${workspacePanel} p-4`}>
              <div className="flex items-start gap-2.5">
                <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-stone-500" />
                <div className="min-w-0 space-y-3 text-sm leading-relaxed text-stone-700">
                  <p>
                    The owner payout account is system-managed. It represents
                    Felicia in the internal ledger for weekly self-pay — not a
                    wholesaler balance.
                  </p>
                  <p className="text-xs text-stone-600">
                    Payout and void history is on{" "}
                    <span className="font-medium text-stone-800">
                      Balances → Owner activity
                    </span>
                    .
                  </p>
                  {ownerAccount ? (
                    <dl className="space-y-2 rounded-md border border-stone-200/80 bg-stone-50/50 px-3 py-2.5 text-xs text-stone-700">
                      <div className="flex flex-wrap gap-x-2">
                        <dt className={workspaceTableCellMeta}>Display name</dt>
                        <dd className="font-medium text-stone-900">
                          {ownerAccount.displayName}
                        </dd>
                      </div>
                      <div className="flex flex-wrap gap-x-2">
                        <dt className={workspaceTableCellMeta}>Linked user</dt>
                        <dd className="font-medium text-stone-800">
                          {linkedUserLabel(ownerAccount.linkedUserEmail)}
                        </dd>
                      </div>
                      <div className="flex flex-wrap gap-x-2">
                        <dt className={workspaceTableCellMeta}>Status</dt>
                        <dd
                          className={
                            ownerAccount.status === "ACTIVE"
                              ? "font-medium text-emerald-700"
                              : "font-medium text-stone-500"
                          }
                        >
                          {ownerAccount.status === "ACTIVE"
                            ? "Active"
                            : "Archived"}
                        </dd>
                      </div>
                    </dl>
                  ) : null}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPanelMode(null)}
              className={workspaceActionSecondaryMd}
            >
              Close
            </button>
          </div>
        ) : (
          <AddAccountForm
            onCreated={() => {
              setPanelMode(null);
              void load();
            }}
            onCancel={() => setPanelMode(null)}
          />
        )
      }
    >
      <AdminWorkspacePageLayout
        intro={
          <AdminWorkspacePageIntro
            title="Accounts"
            subtitle="The setup layer for Financials — the wholesalers and owner account behind your balances, payments, and owner activity."
            action={
              <WorkspaceSidePanelTrigger
                label="Add wholesaler account"
                open={isAddOpen}
                onClick={() => setPanelMode("add")}
              />
            }
          />
        }
      >
        <div className="space-y-5 md:space-y-6">
          <FinancialsCrossLinks
            links={[
              {
                href: "/admin/balances",
                label: "Balances",
                icon: (
                  <ScaleIcon className={workspaceActionIconMd} aria-hidden />
                ),
              },
              {
                href: "/admin/payments",
                label: "Payments",
                icon: (
                  <BanknotesIcon
                    className={workspaceActionIconMd}
                    aria-hidden
                  />
                ),
              },
            ]}
          />

          {loading ? (
            <p
              className={`${workspaceCard} px-4 py-8 text-center text-sm text-gray-500`}
            >
              Loading accounts…
            </p>
          ) : null}
          {error ? (
            <WorkspaceInlineError
              title="Could not load accounts"
              message="Check your connection and retry."
              onRetry={() => void load()}
            >
              <p className="mt-1 text-xs text-amber-900">{error}</p>
            </WorkspaceInlineError>
          ) : null}

          {!loading && !error ? (
            <>
              <section className={`${workspaceCard} overflow-hidden`}>
                <div className={workspaceSectionToolbar}>
                  <h2 className={workspaceSectionTitle}>Owner account</h2>
                  <button
                    type="button"
                    className={workspaceActionUtilitySm}
                    onClick={() => setPanelMode("ownerInfo")}
                  >
                    <Cog6ToothIcon className={workspaceActionIconMd} />
                    Manage
                  </button>
                </div>
                <div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                  <p className="mb-3 text-xs leading-relaxed text-stone-500">
                    Feeds weekly self-pay and voids on Owner activity.
                  </p>
                  {ownerAccount ? (
                    <Link
                      href="/admin/balances/owner"
                      aria-label={`Owner payout activity for ${ownerAccount.displayName}`}
                      className={`${workspacePanel} group/workspace-row flex items-stretch gap-3 p-4 text-left no-underline outline-none transition-[background-color,box-shadow,border-color] duration-200 ease-out hover:border-stone-300/90 hover:bg-stone-50/90 hover:shadow-[inset_3px_0_0_0_rgba(244,63,94,0.2)] focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:p-5`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                        <UserCircleIcon className="h-6 w-6" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-stone-900">
                          {ownerAccount.displayName}
                        </p>
                        <dl className="mt-2 space-y-1.5 text-sm text-stone-600">
                          <div className="flex flex-wrap gap-x-2">
                            <dt className={workspaceTableCellMeta}>
                              Linked user
                            </dt>
                            <dd>
                              {linkedUserLabel(ownerAccount.linkedUserEmail)}
                            </dd>
                          </div>
                          <div className="flex flex-wrap gap-x-2">
                            <dt className={workspaceTableCellMeta}>Status</dt>
                            <dd
                              className={
                                ownerAccount.status === "ACTIVE"
                                  ? "font-medium text-emerald-700"
                                  : "font-medium text-stone-500"
                              }
                            >
                              {ownerAccount.status === "ACTIVE"
                                ? "Active"
                                : "Archived"}
                            </dd>
                          </div>
                          <div className="flex flex-wrap gap-x-2">
                            <dt className={workspaceTableCellMeta}>
                              Total self-pay
                            </dt>
                            <dd className="font-medium text-stone-800">
                              {formatCurrency(toNum(ownerAccount.selfPayTotal))}
                            </dd>
                          </div>
                          <div className="flex flex-wrap gap-x-2">
                            <dt className={workspaceTableCellMeta}>
                              Last self-pay
                            </dt>
                            <dd className="font-medium text-stone-800">
                              {ownerAccount.lastSelfPayAt
                                ? formatDate(ownerAccount.lastSelfPayAt)
                                : "—"}
                            </dd>
                          </div>
                        </dl>
                      </div>
                      <div className="flex shrink-0 items-center self-center pl-1">
                        <WorkspaceRowChevron className="text-stone-400 transition-colors group-hover/workspace-row:text-stone-600" />
                      </div>
                    </Link>
                  ) : (
                    <WorkspaceEmptyState variant="dashedCompact" as="div">
                      <span className="block font-medium text-gray-600">
                        {WORKFLOW_EMPTY_ACCOUNTS_OWNER_TITLE}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {WORKFLOW_EMPTY_ACCOUNTS_OWNER_HINT}
                      </span>
                    </WorkspaceEmptyState>
                  )}
                </div>
              </section>

              <section className={`${workspaceCard} overflow-hidden`}>
                <div className={workspaceSectionToolbar}>
                  <h2 className={workspaceSectionTitle}>Wholesaler accounts</h2>
                </div>
                <div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                  <p className="mb-3 text-xs leading-relaxed text-stone-500">
                    Each wholesaler account feeds its balance and the payments
                    you record against it.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <label className="relative block w-full sm:max-w-sm">
                      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`${workspaceToolbarSearchInput} w-full pl-9`}
                        placeholder="Search accounts..."
                      />
                    </label>
                    <div className="sm:w-44">
                      <WorkspaceNativeSelect
                        aria-label="Filter account status"
                        value={statusFilter}
                        onChange={(e) =>
                          setStatusFilter(
                            e.target.value as "ALL" | AccountStatus,
                          )
                        }
                      >
                        <option value="ALL">All status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="ARCHIVED">Archived</option>
                      </WorkspaceNativeSelect>
                    </div>
                  </div>

                  <div
                    className={`mt-3 rounded-lg border border-gray-200 bg-white ${workspaceInsetFlatList}`}
                  >
                    {wholesalerAccounts.length === 0 ? (
                      <WorkspaceEmptyState
                        variant="plain"
                        as="div"
                        className="px-4 py-8"
                      >
                        <span className="block font-medium text-gray-600">
                          {WORKFLOW_EMPTY_ACCOUNTS_WHOLESALER_TITLE}
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          {WORKFLOW_EMPTY_ACCOUNTS_WHOLESALER_HINT}
                        </span>
                      </WorkspaceEmptyState>
                    ) : (
                      wholesalerAccounts.map((account) => {
                        const href = account.wholesalerId
                          ? `/admin/wholesalers/${account.wholesalerId}`
                          : "/admin/balances/accounts";
                        const rowInner = (
                          <>
                            <div className="min-w-0 flex-1 sm:pr-3">
                              <p className="text-sm font-semibold text-stone-900 sm:text-base">
                                {account.displayName}
                              </p>
                              <p className="mt-1 text-xs text-stone-500">
                                Wholesaler ·{" "}
                                {account.status === "ACTIVE"
                                  ? "Active"
                                  : "Archived"}
                              </p>
                            </div>
                            <div className="grid min-w-0 grid-cols-1 gap-2 text-sm min-[420px]:grid-cols-2 sm:grid-cols-3 sm:gap-5">
                              <div>
                                <p className={workspaceTableCellMeta}>
                                  Balance owed
                                </p>
                                <p
                                  className={`font-semibold tabular-nums ${workspaceMoneyClassForLiability(toNum(account.balanceOwed))}`}
                                >
                                  {formatCurrency(toNum(account.balanceOwed))}
                                </p>
                              </div>
                              <div>
                                <p className={workspaceTableCellMeta}>
                                  Last payment
                                </p>
                                <p className="font-medium text-stone-800">
                                  {account.lastPaymentDate
                                    ? formatDate(account.lastPaymentDate)
                                    : "—"}
                                </p>
                              </div>
                              <div>
                                <p className={workspaceTableCellMeta}>
                                  Linked user
                                </p>
                                <p className="truncate font-medium text-stone-800">
                                  {linkedUserLabel(account.linkedUserEmail)}
                                </p>
                              </div>
                            </div>
                          </>
                        );
                        return account.wholesalerId ? (
                          <Link
                            key={account.id}
                            href={href}
                            className="flex min-w-0 flex-col gap-3 px-4 py-4 transition-colors hover:bg-stone-50 sm:flex-row sm:items-center sm:py-3.5"
                          >
                            {rowInner}
                          </Link>
                        ) : (
                          <div
                            key={account.id}
                            className="flex min-w-0 flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:py-3.5"
                          >
                            {rowInner}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </section>

              <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-stone-600">
                Accounts are the setup layer for Financials. Wholesaler accounts
                feed Balances and Payments; the owner account feeds Owner
                activity.
              </div>
            </>
          ) : null}
        </div>
      </AdminWorkspacePageLayout>
    </WorkspacePageWithRightPanel>
  );
}
