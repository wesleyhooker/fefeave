import type { ReactNode } from "react";
import {
  publicFeatureDividerClass,
  publicFeatureItemClass,
  publicFeatureRowClass,
  publicFeatureSeparatorClass,
} from "../shell/publicShell";
import { LiveExperienceFeature } from "./LiveExperienceFeature";

export type PublicFeatureColumnItem = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
};

export type PublicFeatureColumnRowProps = {
  items: readonly PublicFeatureColumnItem[];
  className?: string;
};

export function PublicFeatureColumnRow({
  items,
  className = "",
}: PublicFeatureColumnRowProps) {
  return (
    <ul className={`${publicFeatureRowClass} ${className}`.trim()}>
      {items.flatMap((item, index) => {
        const isLast = index === items.length - 1;
        const nodes = [
          <li
            key={item.id}
            className={`${publicFeatureItemClass}${isLast ? " md:ml-auto" : ""}`}
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
              className={publicFeatureSeparatorClass}
            >
              <span className={publicFeatureDividerClass} aria-hidden />
            </li>,
          );
        }

        return nodes;
      })}
    </ul>
  );
}
