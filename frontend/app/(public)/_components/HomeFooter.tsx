import Link from "next/link";
import { Container } from "@/system";
import { SECONDARY_LINK_CLASSES } from "./homeCtaClasses";

export function HomeFooter() {
  return (
    <footer className="border-t border-fefe-stone bg-fefe-warm-sand py-fefe-6">
      <Container>
        <div className="flex flex-col items-center gap-fefe-4 sm:flex-row sm:justify-center sm:gap-fefe-5">
          <Link
            href="https://www.whatnot.com"
            target="_blank"
            rel="noopener noreferrer"
            className={SECONDARY_LINK_CLASSES}
          >
            Follow on Whatnot
          </Link>
          <Link href="/live" className={SECONDARY_LINK_CLASSES}>
            View upcoming shows
          </Link>
        </div>
        <p className="mt-fefe-5 text-center font-fefe text-sm text-fefe-charcoal/70">
          © {new Date().getFullYear()} Fefe Ave. Live sales, fabulous finds.
        </p>
      </Container>
    </footer>
  );
}
