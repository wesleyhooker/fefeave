"use client";

import type { ReactNode } from "react";
import { workspaceActionSecondarySm } from "./workspaceUi";

type WorkspaceInlineErrorProps = {
  title: string;
  /** Shown under the title when provided. */
  message?: ReactNode;
  children?: ReactNode;
  onRetry?: () => void;
  retryDisabled?: boolean;
  retryLabel?: string;
  className?: string;
};

/**
 * Amber inline alert for workspace load/refresh failures (lists, dashboard modules).
 */
export function WorkspaceInlineError({
  title,
  message,
  children,
  onRetry,
  retryDisabled = false,
  retryLabel = "Retry",
  className = "",
}: WorkspaceInlineErrorProps) {
  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 ${className}`}
      role="alert"
    >
      <p className="font-medium">{title}</p>
      {message != null ? <p className="mt-1">{message}</p> : null}
      {children}
      {onRetry != null ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={retryDisabled}
          className={`${workspaceActionSecondarySm} mt-3 disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
