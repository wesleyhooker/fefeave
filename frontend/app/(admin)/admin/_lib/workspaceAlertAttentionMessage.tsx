import { Fragment, type ReactNode } from "react";
import { WORKSPACE_ALERT_BAND_ATTENTION_VALUE } from "./workspaceDesignTokens";

/** Matches {@link formatCurrency} output — e.g. `$1,234.56`. */
const OUTSTANDING_VALUE_PATTERN = /\$[\d,]+(?:\.\d{2})?/g;

export type WorkspaceAlertAttentionSegment = {
  kind: "text" | "value";
  text: string;
};

/** Split attention-band copy into neutral text vs outstanding monetary values. */
export function splitWorkspaceAlertAttentionSegments(
  message: string,
): WorkspaceAlertAttentionSegment[] {
  const segments: WorkspaceAlertAttentionSegment[] = [];
  let lastIndex = 0;

  for (const match of message.matchAll(OUTSTANDING_VALUE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ kind: "text", text: message.slice(lastIndex, index) });
    }
    segments.push({ kind: "value", text: match[0] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < message.length) {
    segments.push({ kind: "text", text: message.slice(lastIndex) });
  }

  return segments;
}

/** Render attention-band message — amber on owed amounts, neutral elsewhere. */
export function WorkspaceAlertAttentionMessage({
  message,
}: {
  message: string;
}): ReactNode {
  return splitWorkspaceAlertAttentionSegments(message).map((segment, index) => {
    if (segment.kind === "value") {
      return (
        <span key={index} className={WORKSPACE_ALERT_BAND_ATTENTION_VALUE}>
          {segment.text}
        </span>
      );
    }
    return <Fragment key={index}>{segment.text}</Fragment>;
  });
}
