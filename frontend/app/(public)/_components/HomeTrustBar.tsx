import { Container } from "@/system";

const TRUST_ITEMS = [
  {
    icon: (
      <svg
        className="h-6 w-6 text-fefe-gold"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.648 8.057 8.25 8.25 0 0115.362 5.214z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M18.75 12a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
        />
      </svg>
    ),
    text: "200+ live sales",
  },
  {
    icon: (
      <svg
        className="h-6 w-6 text-fefe-gold"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
        />
      </svg>
    ),
    text: "1,500+ items sold",
  },
  {
    icon: (
      <svg
        className="h-6 w-6 text-fefe-gold"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    ),
    text: "Trusted by resellers",
  },
] as const;

export function HomeTrustBar() {
  return (
    <section
      className="bg-fefe-warm-sand py-fefe-5"
      aria-label="Trust and stats"
    >
      <Container>
        <ul className="flex flex-wrap items-center justify-center gap-fefe-5 sm:gap-fefe-6">
          {TRUST_ITEMS.map(({ icon, text }) => (
            <li
              key={text}
              className="flex items-center gap-fefe-2 font-fefe text-fefe-charcoal"
            >
              {icon}
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
