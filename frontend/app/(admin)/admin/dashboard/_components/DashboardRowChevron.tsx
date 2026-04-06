/** Trails the row link; shifts right on hover to suggest forward navigation. */
export function DashboardRowChevron() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0 translate-x-0 text-gray-400 transition-all duration-200 ease-out group-hover:translate-x-1 group-hover:text-emerald-600"
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
