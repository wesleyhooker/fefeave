import Link from "next/link";
import { ProfileDropdown } from "./ProfileDropdown";

export type WorkspaceHeaderProps = {
  /** Label for the workspace context (e.g. "Workspace"). Shown next to logo. */
  title?: string;
  email: string | null;
  roles: string[];
  envLabel: string;
  isProduction: boolean;
};

export function WorkspaceHeader({
  title = "Workspace",
  email,
  roles,
  envLabel,
  isProduction,
}: WorkspaceHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="shrink-0 text-lg font-semibold text-gray-900 hover:text-gray-700"
          >
            Fefe Ave
          </Link>
          <span className="text-sm font-medium text-gray-500">{title}</span>
        </div>
        <ProfileDropdown
          email={email}
          roles={roles}
          envLabel={envLabel}
          isProduction={isProduction}
        />
      </div>
    </header>
  );
}
