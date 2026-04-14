"use client";

import type { ChangeEventHandler, ReactNode } from "react";
import { workspaceMutedStrip } from "./workspaceUi";

type WorkspaceFileUploadProps = {
  id: string;
  label: ReactNode;
  helperText: string;
  accept: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  error?: string | null;
  fileName?: string | null;
};

/**
 * Styled file input aligned with workspace form fields (tertiary / attachment rows).
 */
export function WorkspaceFileUpload({
  id,
  label,
  helperText,
  accept,
  onChange,
  error,
  fileName,
}: WorkspaceFileUploadProps) {
  const errorId = `${id}-error`;
  const nameId = `${id}-name`;
  const showName = Boolean(fileName) && !error?.startsWith("Payment saved");

  const describedBy = [error ? errorId : null, showName ? nameId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`rounded-lg border border-gray-200/80 px-3 py-3 sm:px-4 sm:py-3.5 ${workspaceMutedStrip}`}
    >
      <label htmlFor={id} className="block text-sm font-medium text-gray-600">
        {label}
      </label>
      <p className="mt-0.5 text-xs text-gray-500">{helperText}</p>
      <input
        id={id}
        type="file"
        accept={accept}
        onChange={onChange}
        className="mt-2.5 w-full cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-800 hover:file:bg-gray-200 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        aria-describedby={describedBy || undefined}
      />
      {error ? (
        <p
          id={errorId}
          role="alert"
          className={
            error.startsWith("Payment saved")
              ? "mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-900"
              : "mt-2 text-xs text-red-600"
          }
        >
          {error}
        </p>
      ) : null}
      {showName && fileName ? (
        <p id={nameId} className="mt-2 text-xs text-gray-600">
          {fileName}
        </p>
      ) : null}
    </div>
  );
}
