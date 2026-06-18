"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { workspaceActionIconSm } from "@/app/(admin)/admin/_components/workspaceUi";
import {
  WORKFLOW_SHOWS_RAIL_MOTIVATION_LINE_1,
  WORKFLOW_SHOWS_RAIL_MOTIVATION_LINE_2,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  SHOWS_MOTIVATION_CARD_ART,
  SHOWS_MOTIVATION_CARD_ART_IMAGE,
  SHOWS_MOTIVATION_CARD_BODY,
  SHOWS_MOTIVATION_CARD_QUOTE,
  SHOWS_MOTIVATION_CARD_SHELL,
} from "../_lib/showsMotivationCardLayout";
import { SHOWS_INDEX_MOTIVATION_ILLUSTRATION_SRC } from "../_lib/showsIndexUi";

const MOTIVATION_ART_WIDTH = 560;
const MOTIVATION_ART_HEIGHT = 464;

export function ShowsMotivationCard() {
  return (
    <section
      className={SHOWS_MOTIVATION_CARD_SHELL}
      aria-label="Brand encouragement"
    >
      <div className={SHOWS_MOTIVATION_CARD_BODY}>
        <blockquote className={SHOWS_MOTIVATION_CARD_QUOTE}>
          <p>
            {WORKFLOW_SHOWS_RAIL_MOTIVATION_LINE_1}
            <br />
            {WORKFLOW_SHOWS_RAIL_MOTIVATION_LINE_2}
          </p>
          <HeartIcon
            className={`${workspaceActionIconSm} mt-2 text-admin-inkMuted/75`}
            aria-hidden
          />
        </blockquote>

        <div className={SHOWS_MOTIVATION_CARD_ART} aria-hidden>
          <Image
            src={SHOWS_INDEX_MOTIVATION_ILLUSTRATION_SRC}
            alt=""
            width={MOTIVATION_ART_WIDTH}
            height={MOTIVATION_ART_HEIGHT}
            sizes="(max-width: 640px) 100vw, 24rem"
            className={SHOWS_MOTIVATION_CARD_ART_IMAGE}
          />
        </div>
      </div>
    </section>
  );
}
