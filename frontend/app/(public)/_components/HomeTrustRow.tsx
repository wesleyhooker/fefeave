import {
  homepageTrustItemClass,
  homepageTrustRowClass,
  homepageTrustSeparatorClass,
} from "./homepageShell";

const TRUST_ICON_CLASS = "h-6 w-6 text-fefe-trust-gold";

function HangerIcon() {
  return (
    <svg
      className={TRUST_ICON_CLASS}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
    >
      <path
        d="M32 29.5V25.75C32 23.7 33.55 22.62 35.08 21.58C37.02 20.27 38.75 19.09 38.75 16.25C38.75 12.52 35.73 9.5 32 9.5C28.27 9.5 25.25 12.52 25.25 16.25"
        stroke="currentColor"
        strokeWidth={3.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 29.5L13.6 44.35C11.1 46.37 12.53 50.4 15.74 50.4H48.26C51.47 50.4 52.9 46.37 50.4 44.35L32 29.5Z"
        stroke="currentColor"
        strokeWidth={3.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const VALUE_ITEMS = [
  {
    id: "curated",
    title: "Curated clothing drops",
    subtitle: "Handpicked finds every drop",
    icon: <HangerIcon />,
  },
  {
    id: "wholesale",
    title: "Wholesale-friendly lots",
    subtitle: "Sized for reseller value",
    icon: (
      <svg
        className={TRUST_ICON_CLASS}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 7.5l-1.652 10.632a1.125 1.125 0 01-1.091 1.003H6.493a1.125 1.125 0 01-1.091-1.003L3.75 7.5M4.5 7.5h15m-12 0v-.75A2.25 2.25 0 0110.5 4.5h3A2.25 2.25 0 0115.75 6.75V7.5"
        />
      </svg>
    ),
  },
  {
    id: "pricing",
    title: "Clear, transparent pricing",
    subtitle: "Honest prices, no surprises",
    icon: (
      <svg
        className={TRUST_ICON_CLASS}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
  },
] as const;

export type HomeTrustRowProps = {
  className?: string;
};

export function HomeTrustRow({ className = "" }: HomeTrustRowProps) {
  return (
    <ul className={`${homepageTrustRowClass} ${className}`.trim()}>
      {VALUE_ITEMS.flatMap((item, index) => {
        const isLast = index === VALUE_ITEMS.length - 1;
        const nodes = [
          <li
            key={item.id}
            className={`${homepageTrustItemClass}${isLast ? " md:ml-auto" : ""}`}
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-fefe-icon-well md:h-14 md:w-14"
              aria-hidden
            >
              {item.icon}
            </span>
            <div className="min-w-0">
              <p className="font-fefe text-sm font-semibold leading-snug text-fefe-charcoal">
                {item.title}
              </p>
              <p className="mt-0.5 font-fefe text-sm leading-snug text-fefe-charcoal/65">
                {item.subtitle}
              </p>
            </div>
          </li>,
        ];

        if (!isLast) {
          nodes.push(
            <li
              key={`sep-${item.id}`}
              role="presentation"
              aria-hidden
              className={homepageTrustSeparatorClass}
            >
              <span
                className="block h-px w-full shrink-0 border-t border-fefe-trust-gold/40 md:h-full md:min-h-[3.5rem] md:w-px md:border-t-0 md:border-l md:border-fefe-trust-gold/40"
                aria-hidden
              />
            </li>,
          );
        }

        return nodes;
      })}
    </ul>
  );
}
