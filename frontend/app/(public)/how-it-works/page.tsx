import Link from "next/link";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Container,
  Heading,
  Prose,
} from "@/system";
import { SECONDARY_LINK_CLASSES } from "../_components/homeCtaClasses";

const STEPS = [
  {
    id: "join",
    title: "Join live shows",
    description:
      "Tune in when Felicia goes live on Whatnot. See pieces in real time, ask questions, and claim what you love before it hits a static listing.",
  },
  {
    id: "discover",
    title: "Discover great deals",
    description:
      "Curated racks, themed drops, and wholesale-friendly lots. Great prices on clothes and shoes without the guesswork.",
  },
  {
    id: "claim",
    title: "Claim and checkout",
    description:
      "Reserve items during the show and complete checkout on Whatnot. Clear pricing and a smooth process every time.",
  },
  {
    id: "paid",
    title: "Get paid clearly",
    description:
      "Straightforward payouts and clear communication. Built for resellers who want to know where every dollar goes.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <main className="bg-fefe-cream py-fefe-6 md:py-fefe-7">
      <Container>
        <Heading level={1} className="mb-fefe-3">
          How it works
        </Heading>
        <Prose className="mb-fefe-6 max-w-2xl">
          <p>
            Fefe Ave runs on live sales—Felicia brings you boutique bargains in
            real time. Here’s how it works from tuning in to getting your finds.
          </p>
        </Prose>
        <ul className="grid gap-fefe-4 sm:grid-cols-2">
          {STEPS.map((step) => (
            <li key={step.id} className="flex">
              <Card className="flex h-full flex-col transition-shadow duration-200 hover:shadow-lg">
                <CardHeader>
                  <CardTitle as="h2">{step.title}</CardTitle>
                </CardHeader>
                <CardBody className="flex-1 min-h-0">
                  <p>{step.description}</p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
        <div className="mt-fefe-6">
          <Link href="/live" className={SECONDARY_LINK_CLASSES}>
            View upcoming shows
          </Link>
        </div>
      </Container>
    </main>
  );
}
