import { publicLivePlatformsBandClass } from "../shell/publicShell";
import { HomeLiveExperienceSection } from "./HomeLiveExperienceSection";
import { HomeWhereToFindLiveSection } from "./HomeWhereToFindLiveSection";

/**
 * Homepage live story: sand-muted platform band, then cream experience row.
 */
export function HomeLiveStorySection() {
  return (
    <div>
      <div
        className={`${publicLivePlatformsBandClass} pt-fefe-6 pb-fefe-5 md:pt-fefe-7 md:pb-fefe-6`}
      >
        <HomeWhereToFindLiveSection />
      </div>
      <HomeLiveExperienceSection />
    </div>
  );
}
