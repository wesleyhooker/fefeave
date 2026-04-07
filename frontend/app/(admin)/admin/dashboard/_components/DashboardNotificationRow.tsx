import { DashboardClickableRow } from "./DashboardClickableRow";
import { DashboardRowChevron } from "./DashboardRowChevron";

export function DashboardNotificationRow({
  href,
  iconClassName,
  title,
  valueLabel,
  valueClassName = "text-stone-600",
}: {
  href: string;
  iconClassName: string;
  title: string;
  valueLabel: string;
  valueClassName?: string;
}) {
  return (
    <DashboardClickableRow href={href} aria-label={title}>
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${iconClassName}`}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate text-xs font-normal text-stone-700">
        {title}
      </span>
      <span
        className={`shrink-0 whitespace-nowrap text-xs font-medium tabular-nums ${valueClassName}`}
      >
        {valueLabel}
      </span>
      <DashboardRowChevron />
    </DashboardClickableRow>
  );
}
