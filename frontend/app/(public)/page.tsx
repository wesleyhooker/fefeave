import { PublicSectionAbout } from "./_components/PublicSectionAbout";
import { PublicSectionContact } from "./_components/PublicSectionContact";
import { PublicSectionHero } from "./_components/PublicSectionHero";
import { PublicSectionLiveSales } from "./_components/PublicSectionLiveSales";

export default function HomePage() {
  return (
    <>
      <PublicSectionHero />
      <PublicSectionAbout />
      <PublicSectionLiveSales />
      <PublicSectionContact />
    </>
  );
}
