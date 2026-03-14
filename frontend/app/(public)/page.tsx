import { HomeFooter } from "./_components/HomeFooter";
import { HomeHeroSection } from "./_components/HomeHeroSection";
import { HomeHowItWorks } from "./_components/HomeHowItWorks";
import { HomeMeetFelicia } from "./_components/HomeMeetFelicia";
import { HomeTrustBar } from "./_components/HomeTrustBar";
import { HomeUpcomingShows } from "./_components/HomeUpcomingShows";

export default function HomePage() {
  return (
    <>
      <HomeHeroSection />
      <HomeTrustBar />
      <HomeUpcomingShows />
      <HomeHowItWorks />
      <HomeMeetFelicia />
      <HomeFooter />
    </>
  );
}
