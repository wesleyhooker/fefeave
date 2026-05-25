import type { ReactNode } from "react";
import {
  ChatBubbleIcon,
  HangerIcon,
  VideoCameraIcon,
} from "../icons/PublicUiIcons";

export type LiveExperienceItem = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
};

export const LIVE_EXPERIENCE_ITEMS: readonly LiveExperienceItem[] = [
  {
    id: "walkthroughs",
    title: "Live walkthroughs",
    description:
      "Felicia shows each piece on camera so you can check fit, sizing, and condition before you buy.",
    icon: <VideoCameraIcon />,
  },
  {
    id: "curated",
    title: "Curated finds",
    description:
      "Every drop is handpicked. Lots stay small, so the pieces people want tend to go fast.",
    icon: <HangerIcon />,
  },
  {
    id: "chat",
    title: "Ask in real time",
    description:
      "Chat during the show to ask questions or get quick sizing and styling help from Felicia.",
    icon: <ChatBubbleIcon />,
  },
] as const;
