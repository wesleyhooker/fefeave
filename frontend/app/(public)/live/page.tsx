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
import {
  PRIMARY_LINK_CLASSES,
  SECONDARY_LINK_CLASSES,
} from "../_components/homeCtaClasses";

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
  {
    id: "3",
    title: "Reseller spotlight",
    when: "Next Tuesday 6 PM",
    description: "Themed racks and bundles. Perfect for restocking.",
  },
] as const;

export default function LivePage() {
  return (
    <main className="bg-fefe-cream py-fefe-6 md:py-fefe-7">
      <Container>
        <Heading level={1} className="mb-fefe-3">
          Upcoming Live Shows
        </Heading>
        <p className="font-fefe text-fefe-charcoal/90 mb-fefe-5 max-w-2xl">
          Join Felicia on Whatnot for live clothing drops and curated finds. See
          pieces in real time, ask questions, and claim what you love.
        </p>
        <ul className="grid gap-fefe-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLACEHOLDER_SHOWS.map((show) => (
            <li key={show.id} className="flex">
              <Card className="flex h-full flex-col transition-shadow duration-200 hover:shadow-lg">
                <CardHeader>
                  <CardTitle as="h2">{show.title}</CardTitle>
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
        <div className="mt-fefe-6 flex flex-wrap gap-fefe-2">
          <Link
            href="https://www.whatnot.com"
            target="_blank"
            rel="noopener noreferrer"
            className={PRIMARY_LINK_CLASSES}
          >
            Follow on Whatnot
          </Link>
          <Link href="/shop" className={SECONDARY_LINK_CLASSES}>
            View full schedule
          </Link>
        </div>
      </Container>
    </main>
  );
}
