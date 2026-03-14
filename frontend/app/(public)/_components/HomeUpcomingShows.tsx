import Link from "next/link";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Container,
  Heading,
} from "@/system";
import { SECONDARY_LINK_CLASSES } from "./homeCtaClasses";

const PLACEHOLDER_SHOWS = [
  {
    id: "1",
    title: "Curated closet drop",
    when: "Today at 7 PM",
    description:
      "Live clothing & shoes. Wholesale-friendly lots and single finds.",
  },
  {
    id: "2",
    title: "Weekend vintage & modern",
    when: "Saturday 2 PM",
    description: "Mix of vintage and contemporary pieces. Great for resellers.",
  },
] as const;

export function HomeUpcomingShows() {
  return (
    <section id="live-shows" className="bg-fefe-cream py-fefe-6 md:py-fefe-7">
      <Container>
        <Heading level={2} className="mb-fefe-5">
          Track your sales. Know every payout.
        </Heading>
        <p className="font-fefe text-fefe-charcoal/90 mb-fefe-5 max-w-2xl">
          Join live shows to discover great deals and get paid clearly. See
          what&apos;s coming up next.
        </p>
        <ul className="grid gap-fefe-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLACEHOLDER_SHOWS.map((show) => (
            <li key={show.id} className="flex">
              <Card className="flex h-full flex-col transition-shadow duration-200 hover:shadow-lg">
                <CardHeader>
                  <CardTitle as="h3">{show.title}</CardTitle>
                </CardHeader>
                <CardBody className="flex-1 min-h-0">
                  <p className="font-fefe text-sm text-fefe-charcoal/80">
                    {show.when}
                  </p>
                  <p className="mt-fefe-1">{show.description}</p>
                </CardBody>
                <CardFooter>
                  <Link href="/shop" className={SECONDARY_LINK_CLASSES}>
                    View schedule
                  </Link>
                </CardFooter>
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
