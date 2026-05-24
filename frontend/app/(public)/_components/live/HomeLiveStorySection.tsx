import {
  homepageLiveStoryBlockClass,
  homepageTrustBandClass,
} from "../homepageShell";
import { HomeLiveExperienceSection } from "./HomeLiveExperienceSection";
import { HomeWhereToFindLiveSection } from "./HomeWhereToFindLiveSection";

/**
 * Single warm editorial surface: where to find us live + what happens during a live.
 */
export function HomeLiveStorySection() {
  return (
    <div className={`${homepageTrustBandClass} ${homepageLiveStoryBlockClass}`}>
      <HomeWhereToFindLiveSection />
      <HomeLiveExperienceSection />
    </div>
  );
}
