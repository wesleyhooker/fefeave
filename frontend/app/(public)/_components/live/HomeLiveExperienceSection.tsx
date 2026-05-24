import { Heading } from "@/system";
import { EditorialEyebrow } from "../editorial/EditorialEyebrow";
import {
  HomepageContainer,
  homepageLiveStorySubsectionClass,
  homepageSectionHeaderClass,
  homepageSectionHeadingClass,
  homepageTrustItemClass,
  homepageTrustRowClass,
  homepageTrustSeparatorClass,
} from "../homepageShell";
import { LiveExperienceFeature } from "./LiveExperienceFeature";

const LIVE_ACCENT_ICON_CLASS = "h-6 w-6 text-fefe-gold";

function VideoCameraIcon() {
  return (
    <svg
      className={LIVE_ACCENT_ICON_CLASS}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
      />
    </svg>
  );
}

function HangerIcon() {
  return (
    <svg
      className={LIVE_ACCENT_ICON_CLASS}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
    >
      <path
        d="M32 29.5V25.75C32 23.7 33.55 22.62 35.08 21.58C37.02 20.27 38.75 19.09 38.75 16.25C38.75 12.52 35.73 9.5 32 9.5C28.27 9.5 25.25 12.52 25.25 16.25"
        stroke="currentColor"
        strokeWidth={3.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 29.5L13.6 44.35C11.1 46.37 12.53 50.4 15.74 50.4H48.26C51.47 50.4 52.9 46.37 50.4 44.35L32 29.5Z"
        stroke="currentColor"
        strokeWidth={3.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg
      className={LIVE_ACCENT_ICON_CLASS}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
      />
    </svg>
  );
}

const EXPERIENCE_ITEMS = [
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

export function HomeLiveExperienceSection() {
  return (
    <section
      className={homepageLiveStorySubsectionClass}
      aria-labelledby="live-experience-heading"
    >
      <HomepageContainer>
        <div className={homepageSectionHeaderClass}>
          <EditorialEyebrow centered>
            <span>What happens during a live?</span>
          </EditorialEyebrow>

          <div id="live-experience-heading">
            <Heading level={2} className={homepageSectionHeadingClass}>
              Real time. Real pieces. Real you.
            </Heading>
          </div>
        </div>

        <ul className={`${homepageTrustRowClass} mt-fefe-5 md:mt-fefe-6`}>
          {EXPERIENCE_ITEMS.flatMap((item, index) => {
            const isLast = index === EXPERIENCE_ITEMS.length - 1;
            const nodes = [
              <li
                key={item.id}
                className={`${homepageTrustItemClass}${isLast ? " md:ml-auto" : ""}`}
              >
                <LiveExperienceFeature
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                />
              </li>,
            ];

            if (!isLast) {
              nodes.push(
                <li
                  key={`sep-${item.id}`}
                  role="presentation"
                  aria-hidden
                  className={homepageTrustSeparatorClass}
                >
                  <span
                    className="block h-px w-full shrink-0 border-t border-fefe-gold/45 md:h-full md:min-h-[3.5rem] md:w-px md:border-t-0 md:border-l md:border-fefe-gold/45"
                    aria-hidden
                  />
                </li>,
              );
            }

            return nodes;
          })}
        </ul>
      </HomepageContainer>
    </section>
  );
}
