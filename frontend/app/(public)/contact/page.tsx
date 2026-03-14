import Link from "next/link";
import { Container, Heading, Prose } from "@/system";
import {
  PRIMARY_LINK_CLASSES,
  SECONDARY_LINK_CLASSES,
} from "../_components/homeCtaClasses";

export default function ContactPage() {
  return (
    <main className="bg-fefe-cream py-fefe-6 md:py-fefe-7">
      <Container variant="narrow">
        <Heading level={1} className="mb-fefe-3">
          Contact
        </Heading>
        <Prose className="mb-fefe-6">
          <p>
            Have a question about a piece, an order, or partnering with Fefe
            Ave? Reach out and we&apos;ll get back to you as soon as we can.
          </p>
        </Prose>

        <div className="mb-fefe-6 space-y-fefe-2 font-fefe text-fefe-charcoal">
          <p>
            <span className="text-fefe-charcoal/70">Email:</span>{" "}
            <a
              href="mailto:fefeave@outlook.com"
              className="text-fefe-charcoal hover:text-fefe-gold underline transition-colors"
            >
              fefeave@outlook.com
            </a>
          </p>
          <p>
            <span className="text-fefe-charcoal/70">Social:</span>{" "}
            <a
              href="https://instagram.com/fefe_ave"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fefe-charcoal hover:text-fefe-gold underline transition-colors"
            >
              @fefe_ave on Instagram
            </a>
            ,{" "}
            <a
              href="https://www.whatnot.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fefe-charcoal hover:text-fefe-gold underline transition-colors"
            >
              Fefe Ave on Whatnot
            </a>
          </p>
        </div>

        <div className="flex flex-wrap gap-fefe-2">
          <Link
            href="https://www.whatnot.com"
            target="_blank"
            rel="noopener noreferrer"
            className={PRIMARY_LINK_CLASSES}
          >
            Follow on Whatnot
          </Link>
          <Link
            href="https://instagram.com/fefe_ave"
            target="_blank"
            rel="noopener noreferrer"
            className={SECONDARY_LINK_CLASSES}
          >
            Follow on Instagram
          </Link>
        </div>

        <div className="mt-fefe-7 border-t border-fefe-stone pt-fefe-6">
          <Heading level={2} className="mb-fefe-3 text-xl">
            Send a message
          </Heading>
          <p className="font-fefe text-fefe-charcoal/90 mb-fefe-4 text-sm">
            Inquiry form coming soon. For now, email us at{" "}
            <a
              href="mailto:fefeave@outlook.com"
              className="text-fefe-charcoal hover:text-fefe-gold underline"
            >
              fefeave@outlook.com
            </a>
            .
          </p>
        </div>
      </Container>
    </main>
  );
}
