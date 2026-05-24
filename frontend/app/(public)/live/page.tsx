import type { Metadata } from "next";
import { LivePageContent } from "../_components/live/LivePageContent";

export const metadata: Metadata = {
  title: "Watch live | Fefe Ave",
  description:
    "Watch Felicia's live resale drops on Whatnot and TikTok. Follow either platform to join future live sales.",
};

export default function LivePage() {
  return <LivePageContent />;
}
