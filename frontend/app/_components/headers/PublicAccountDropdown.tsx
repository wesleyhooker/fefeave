"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { publicHeaderControlBase } from "./publicHeaderControls";

export type PublicAccountDropdownProps = {
  isLoggedIn: boolean;
  isStaff: boolean;
  email: string | null;
};

const accountControlClasses = `${publicHeaderControlBase} group inline-flex items-center hover:text-fefe-charcoal`;

function formatHeaderAccountLabel(email: string | null): string {
  const trimmed = email?.trim();
  if (!trimmed) return "Account";
  const at = trimmed.indexOf("@");
  if (at > 0) return trimmed.slice(0, at);
  return trimmed;
}

function formatAccountInitial(email: string | null): string {
  const label = formatHeaderAccountLabel(email);
  const ch = label.charAt(0);
  return ch ? ch.toUpperCase() : "?";
}

function AccountAvatar({ email }: { email: string | null }) {
  const initial = formatAccountInitial(email);

  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-fefe-warm-sand/70 bg-fefe-warm-sand font-fefe-heading text-sm font-semibold leading-none text-fefe-gold"
      aria-hidden
    >
      {initial}
    </span>
  );
}

function AccountChevron() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0 text-fefe-charcoal/70 transition-transform duration-200 ease-out group-hover:translate-y-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

export function PublicAccountDropdown({
  isLoggedIn,
  isStaff,
  email,
}: PublicAccountDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const accountLabel = formatHeaderAccountLabel(email);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!isLoggedIn) {
    return (
      <Link href="/login" className={accountControlClasses}>
        Log in
      </Link>
    );
  }

  if (!isStaff) {
    return (
      <Link
        href="/api/auth/logout"
        className={`max-w-[12rem] gap-2 ${accountControlClasses}`}
      >
        <AccountAvatar email={email} />
        <span className="truncate">{accountLabel}</span>
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`max-w-[12rem] gap-2 ${accountControlClasses}`}
        aria-expanded={open}
        aria-haspopup="true"
        id="public-account-menu-button"
      >
        <AccountAvatar email={email} />
        <span className="truncate">{accountLabel}</span>
        <AccountChevron />
      </button>
      {open && (
        <div
          className="absolute right-0 z-50 mt-1 w-48 origin-top-right rounded-fefe-card border border-fefe-stone bg-white py-1 shadow-fefe-card"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="public-account-menu-button"
        >
          <Link
            href="/admin"
            className="block px-fefe-3 py-2 font-fefe text-sm text-fefe-charcoal hover:bg-fefe-cream"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Workspace
          </Link>
          <div className="border-t border-fefe-stone/60">
            <Link
              href="/api/auth/logout"
              className="block px-fefe-3 py-2 font-fefe text-sm text-fefe-charcoal hover:bg-fefe-cream"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Logout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
