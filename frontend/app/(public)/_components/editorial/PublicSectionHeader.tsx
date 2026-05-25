import { Heading } from "@/system";
import {
  publicSectionHeaderClass,
  publicSectionHeadingClass,
} from "../shell/publicShell";
import { EditorialEyebrow } from "./EditorialEyebrow";

export type PublicSectionHeaderProps = {
  eyebrow: string;
  title: string;
  /** Must match parent `aria-labelledby` when provided */
  headingId: string;
};

export function PublicSectionHeader({
  eyebrow,
  title,
  headingId,
}: PublicSectionHeaderProps) {
  return (
    <div className={publicSectionHeaderClass}>
      <EditorialEyebrow centered>
        <span>{eyebrow}</span>
      </EditorialEyebrow>
      <div id={headingId}>
        <Heading level={2} className={publicSectionHeadingClass}>
          {title}
        </Heading>
      </div>
    </div>
  );
}
