"use client";

import type { FormHTMLAttributes, ReactNode } from "react";

type LogoutFormProps = {
  className?: string;
  buttonClassName?: string;
  children: ReactNode;
  role?: string;
  onSubmit?: FormHTMLAttributes<HTMLFormElement>["onSubmit"];
};

/** POST sign-out — never use Next.js Link (prefetch would hit GET /api/auth/logout). */
export function LogoutForm({
  className,
  buttonClassName,
  children,
  role,
  onSubmit,
}: LogoutFormProps) {
  return (
    <form
      action="/api/auth/logout"
      method="POST"
      className={className}
      onSubmit={onSubmit}
    >
      <button
        type="submit"
        className={buttonClassName ?? className}
        role={role}
      >
        {children}
      </button>
    </form>
  );
}
