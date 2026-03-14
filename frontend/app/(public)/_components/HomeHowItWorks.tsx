import Link from "next/link";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Container,
  Heading,
} from "@/system";
import { SECONDARY_LINK_CLASSES } from "./homeCtaClasses";

const STEPS = [
  {
    id: "join",
    icon: (
      <svg
        className="h-8 w-8 text-fefe-gold"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
    ),
    title: "Join live shows",
    description:
      "Tune in when Felicia goes live. See pieces in real time, ask questions, and claim what you love before it hits a static listing.",
  },
  {
    id: "discover",
    icon: (
      <svg
        className="h-8 w-8 text-fefe-gold"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318a2.25 2.25 0 001.068 1.897l8.932 4.458a2.25 2.25 0 002.136 0l8.932-4.458A2.25 2.25 0 0021 9.568V5.25a2.25 2.25 0 00-2.25-2.25H9.568z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 6h.008v.008H6V6z"
        />
      </svg>
    ),
    title: "Discover great deals",
    description:
      "Curated racks, themed drops, and wholesale-friendly lots. Great prices on clothes and shoes without the guesswork.",
  },
  {
    id: "paid",
    icon: (
      <svg
        className="h-8 w-8 text-fefe-gold"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
        />
      </svg>
    ),
    title: "Get paid clearly",
    description:
      "Straightforward payouts and clear communication. Built for resellers who want to know where every dollar goes.",
  },
] as const;

export function HomeHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-fefe-warm-sand/50 py-fefe-6 md:py-fefe-7"
    >
      <Container>
        <Heading level={2} className="mb-fefe-5">
          How it works
        </Heading>
        <p className="font-fefe text-fefe-charcoal/90 mb-fefe-5 max-w-2xl">
          From tuning in live to getting paid—simple, clear, and built for
          resellers.
        </p>
        <ul className="grid gap-fefe-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.id} className="flex">
              <Card className="flex h-full flex-col transition-shadow duration-200 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-fefe-2">{step.icon}</div>
                  <CardTitle as="h3">{step.title}</CardTitle>
                </CardHeader>
                <CardBody className="flex-1 min-h-0">
                  <p>{step.description}</p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
        <div className="mt-fefe-5 flex justify-center">
          <Link href="/shop" className={SECONDARY_LINK_CLASSES}>
            View full schedule
          </Link>
        </div>
      </Container>
    </section>
  );
}
