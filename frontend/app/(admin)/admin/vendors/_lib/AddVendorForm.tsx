"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  workspaceActionIconMd,
  workspaceActionPrimaryMd,
  workspaceActionSecondaryMd,
  workspaceFormLabel,
  workspaceTextInput,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  WORKFLOW_NEW_VENDOR_FORM_SUBMIT_LABEL,
  WORKFLOW_NEW_VENDOR_NAME_LABEL,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { createAccount, type AccountDTO } from "@/src/lib/api/accounts";
import {
  extractVendorPhoneDigits,
  formatVendorPhoneNumber,
  isValidVendorContactEmail,
} from "./vendorAccountFormUtils";

function RequiredMark() {
  return (
    <>
      <span className="text-rose-600" aria-hidden="true">
        {" "}
        *
      </span>
      <span className="sr-only"> (required)</span>
    </>
  );
}

export type AddVendorFormProps = {
  onCreated: (account: AccountDTO) => void;
  onCancel: () => void;
};

export function AddVendorForm({ onCreated, onCancel }: AddVendorFormProps) {
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
    trimmedEmail.length > 0 && !isValidVendorContactEmail(trimmedEmail)
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
      const created = await createAccount({
        displayName: displayName.trim(),
        type: "WHOLESALER",
        contactName: contactName.trim() ? contactName.trim() : undefined,
        contactEmail: trimmedEmail ? trimmedEmail : undefined,
        contactPhone: contactPhoneDigits || undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      });
      onCreated(created);
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
          title="Could not create vendor"
          message="Check the form values and retry."
        >
          <p className="mt-1 text-xs text-rose-900">{error}</p>
        </WorkspaceInlineError>
      ) : null}

      <div>
        <label htmlFor="vendor-name" className={workspaceFormLabel}>
          {WORKFLOW_NEW_VENDOR_NAME_LABEL}
          <RequiredMark />
        </label>
        <input
          id="vendor-name"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={`${workspaceTextInput} mt-1.5 w-full`}
          placeholder="Vendor name"
        />
      </div>

      <div>
        <label htmlFor="vendor-contact-name" className={workspaceFormLabel}>
          Contact person (optional)
        </label>
        <input
          id="vendor-contact-name"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          className={`${workspaceTextInput} mt-1.5 w-full`}
          placeholder="Contact person"
        />
      </div>

      <div>
        <label htmlFor="vendor-contact-email" className={workspaceFormLabel}>
          Email (optional)
        </label>
        <input
          id="vendor-contact-email"
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
        <label htmlFor="vendor-contact-phone" className={workspaceFormLabel}>
          Phone (optional)
        </label>
        <input
          id="vendor-contact-phone"
          inputMode="tel"
          value={formatVendorPhoneNumber(contactPhoneDigits)}
          onChange={(e) =>
            setContactPhoneDigits(extractVendorPhoneDigits(e.target.value))
          }
          className={`${workspaceTextInput} mt-1.5 w-full`}
          placeholder="(555) 555-5555"
        />
      </div>

      <div>
        <label htmlFor="vendor-notes" className={workspaceFormLabel}>
          Notes (optional)
        </label>
        <textarea
          id="vendor-notes"
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
          {submitting ? "Creating…" : WORKFLOW_NEW_VENDOR_FORM_SUBMIT_LABEL}
        </button>
      </div>
    </form>
  );
}
