import { Heading } from "@/system";
import {
  getLivePlatformLinks,
  hasLivePlatformLinks,
} from "@/lib/public/publicLinks";
import { EditorialEyebrow } from "../editorial/EditorialEyebrow";
import {
  HOME_WHERE_TO_FIND_LIVE_ID,
  HomepageContainer,
  homepageSectionHeaderClass,
  homepageSectionHeadingClass,
} from "../homepageShell";
import { LivePlatformShowcaseCard } from "./LivePlatformShowcaseCard";

export function HomeWhereToFindLiveSection() {
  const platforms = getLivePlatformLinks();

  return (
    <section
      id={HOME_WHERE_TO_FIND_LIVE_ID}
      aria-labelledby="where-to-find-live-heading"
    >
      <HomepageContainer>
        <div className={homepageSectionHeaderClass}>
          <EditorialEyebrow centered>
            <span>Where to find us live</span>
          </EditorialEyebrow>

          <div id="where-to-find-live-heading">
            <Heading level={2} className={homepageSectionHeadingClass}>
              Two ways to shop with Felicia.
            </Heading>
          </div>
        </div>

        {hasLivePlatformLinks() ? (
          <ul className="mt-fefe-5 grid gap-fefe-4 sm:grid-cols-2 md:mt-fefe-6">
            {platforms.map((platform) => (
              <li key={platform.id} className="flex min-h-0">
                <LivePlatformShowcaseCard platform={platform} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-fefe-5 font-fefe text-base text-fefe-charcoal/90 md:mt-fefe-6">
            Live platform links coming soon.
          </p>
        )}
      </HomepageContainer>
    </section>
  );
}
