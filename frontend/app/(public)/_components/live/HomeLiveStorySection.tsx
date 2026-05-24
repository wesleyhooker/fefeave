import {
  homepageLiveStoryBlockClass,
  homepageLiveStorySurfaceClass,
} from "../homepageShell";
import { HomeLiveExperienceSection } from "./HomeLiveExperienceSection";
import { HomeWhereToFindLiveSection } from "./HomeWhereToFindLiveSection";

/**
 * Live story on the homepage cream canvas: platforms + experience (no sand band).
 */
export function HomeLiveStorySection() {
  return (
    <div
      className={`${homepageLiveStorySurfaceClass} ${homepageLiveStoryBlockClass}`}
    >
      <HomeWhereToFindLiveSection />
      <HomeLiveExperienceSection />
    </div>
  );
}
