"use client";

import Link from "next/link";
import { useState } from "react";

function formatRoles(roles: string[]): string {
  if (roles.length === 0) return "none";
  return roles.join(", ");
}

export type AdminHeaderUserProps = {
  email: string | null;
  roles: string[];
  envLabel: string;
  isProduction: boolean;
};

export function AdminHeaderUser({
  email,
  roles,
  envLabel,
  isProduction,
}: AdminHeaderUserProps) {
  const [showDetails, setShowDetails] = useState(false);
  const displayName = email?.trim() || "Signed in";

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="hidden items-center gap-2 sm:flex">
        <span className="text-sm font-medium text-gray-700">{displayName}</span>
        {!isProduction && (
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-expanded={showDetails}
          >
            {showDetails ? "Hide details" : "Details"}
          </button>
        )}
      </div>
      {!isProduction && showDetails && (
        <div
          className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600"
          role="status"
        >
          roles: {formatRoles(roles)} | {envLabel}
        </div>
      )}
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
        ← Back to site
      </Link>
      <Link
        href="/api/auth/logout"
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Logout
      </Link>
    </div>
  );
}
