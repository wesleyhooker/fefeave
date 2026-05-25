import {
  HomepageContainer,
  publicLiveExperienceBandClass,
  publicLiveStorySubsectionClass,
} from "../shell/publicShell";
import { PublicSectionHeader } from "../editorial/PublicSectionHeader";
import { LIVE_EXPERIENCE_ITEMS } from "./liveExperienceContent";
import { PublicFeatureColumnRow } from "./PublicFeatureColumnRow";

export function HomeLiveExperienceSection() {
  return (
    <section
      className={`${publicLiveExperienceBandClass} ${publicLiveStorySubsectionClass} pb-fefe-6 md:pb-fefe-7`}
      aria-labelledby="live-experience-heading"
    >
      <HomepageContainer>
        <PublicSectionHeader
          eyebrow="What happens during a live?"
          title="Real time. Real pieces. Real you."
          headingId="live-experience-heading"
        />

        <PublicFeatureColumnRow
          items={LIVE_EXPERIENCE_ITEMS}
          className="mt-fefe-5 md:mt-fefe-6"
        />
      </HomepageContainer>
    </section>
  );
}
