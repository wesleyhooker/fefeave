import Link from "next/link";
import { Container, Heading, Prose } from "@/system";
import { PublicPageMain } from "../_components/shell/PublicPageMain";
import {
  PRIMARY_LINK_CLASSES,
  SECONDARY_LINK_CLASSES,
} from "../_components/shell/publicCtaClasses";
import { publicInlineLinkClass } from "../_components/shell/publicShell";

export default function ContactPage() {
  return (
    <PublicPageMain>
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
              className={publicInlineLinkClass}
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
              className={publicInlineLinkClass}
            >
              @fefe_ave on Instagram
            </a>
            ,{" "}
            <a
              href="https://www.whatnot.com"
              target="_blank"
              rel="noopener noreferrer"
              className={publicInlineLinkClass}
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
          <p className="mb-fefe-4 font-fefe text-sm text-fefe-charcoal">
            Inquiry form coming soon. For now, email us at{" "}
            <a
              href="mailto:fefeave@outlook.com"
              className={publicInlineLinkClass}
            >
              fefeave@outlook.com
            </a>
            .
          </p>
        </div>
      </Container>
    </PublicPageMain>
  );
}
