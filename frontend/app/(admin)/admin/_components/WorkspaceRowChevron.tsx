/**
 * Trailing affordance for navigational admin table/card rows (Shows, Balances, dashboard).
 * Pair with a parent `group/workspace-row` (`WorkspaceTableNavRow`) or `group/card` for hover motion.
 */
export function WorkspaceRowChevron({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 ${className}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}
