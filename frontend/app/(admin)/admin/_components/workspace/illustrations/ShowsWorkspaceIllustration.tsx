import type { SVGProps } from "react";
import { WorkspaceIllustrationSvg } from "./WorkspaceIllustrationSvg";
import {
  ILLU_ACCENT,
  ILLU_FILL,
  ILLU_FILL_LIGHT,
  ILLU_FILL_MID,
  ILLU_STROKE,
  sparklePoints,
} from "./illustrationStyles";

/** Shows — calendar, ticket, clock, sparkles. */
export function ShowsWorkspaceIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <WorkspaceIllustrationSvg {...props}>
      {/* Ground shadow */}
      <ellipse
        cx="44"
        cy="66"
        rx="26"
        ry="2.5"
        fill={ILLU_FILL_MID}
        opacity={0.55}
      />

      {/* Desk calendar */}
      <g transform="translate(26 12)">
        {/* Binding rings */}
        {[10, 18, 26, 34].map((x) => (
          <circle
            key={x}
            cx={x}
            cy={4}
            r={2.2}
            fill={ILLU_FILL_LIGHT}
            {...ILLU_STROKE}
          />
        ))}
        {/* Calendar face */}
        <rect
          x={2}
          y={6}
          width={40}
          height={36}
          rx={3}
          fill={ILLU_FILL}
          {...ILLU_STROKE}
        />
        {/* Grid rows */}
        {[18, 24, 30, 36].map((y) => (
          <line
            key={y}
            x1={6}
            y1={y}
            x2={38}
            y2={y}
            {...ILLU_STROKE}
            opacity={0.45}
          />
        ))}
        {/* Grid cols */}
        {[14, 22, 30].map((x) => (
          <line
            key={x}
            x1={x}
            y1={12}
            x2={x}
            y2={38}
            {...ILLU_STROKE}
            opacity={0.45}
          />
        ))}
        {/* Highlighted day star */}
        <polygon
          points="32,28 33.2,31 36.5,31 33.8,33 34.8,36.2 32,34.2 29.2,36.2 30.2,33 27.5,31 30.8,31"
          fill={ILLU_ACCENT}
          {...ILLU_STROKE}
          strokeWidth={0.9}
        />
        {/* Top highlight */}
        <line
          x1={6}
          y1={8}
          x2={36}
          y2={8}
          stroke={ILLU_FILL_LIGHT}
          strokeWidth={1.2}
        />
      </g>

      {/* Ticket */}
      <path
        d="M14 46 L14 40 Q14 38 16 38 L24 38 Q26 38 26 36 L26 34 Q26 32 28 32 L32 32 Q34 32 34 34 L34 50 Q34 52 32 52 L28 52 Q26 52 26 50 L26 48 Q26 46 24 46 Z"
        fill={ILLU_FILL_LIGHT}
        {...ILLU_STROKE}
      />
      <line
        x1={30}
        y1={36}
        x2={30}
        y2={50}
        {...ILLU_STROKE}
        strokeDasharray="2 2"
        opacity={0.5}
      />
      <polygon
        points="22,42 23,44.5 25.8,44.5 23.4,46 24.2,48.8 22,47.2 19.8,48.8 20.6,46 18.2,44.5 21,44.5"
        fill={ILLU_ACCENT}
        {...ILLU_STROKE}
        strokeWidth={0.85}
      />

      {/* Clock */}
      <circle cx={66} cy={24} r={9} fill={ILLU_FILL_LIGHT} {...ILLU_STROKE} />
      <line x1={66} y1={24} x2={66} y2={18.5} {...ILLU_STROKE} />
      <line x1={66} y1={24} x2={70.5} y2={26} {...ILLU_STROKE} />

      {/* Sparkles */}
      <polygon
        points={sparklePoints(12, 18, 3.5)}
        fill={ILLU_FILL_LIGHT}
        {...ILLU_STROKE}
      />
      <polygon
        points={sparklePoints(18, 12, 2.2)}
        fill={ILLU_FILL_LIGHT}
        {...ILLU_STROKE}
      />
      <polygon
        points={sparklePoints(74, 38, 2.5)}
        fill={ILLU_FILL_LIGHT}
        {...ILLU_STROKE}
      />

      {/* Motion trails */}
      <path
        d="M8 22 Q14 16 20 20"
        {...ILLU_STROKE}
        strokeDasharray="2.5 2"
        opacity={0.4}
        fill="none"
      />
      <path
        d="M72 30 Q78 24 82 28"
        {...ILLU_STROKE}
        strokeDasharray="2.5 2"
        opacity={0.4}
        fill="none"
      />
    </WorkspaceIllustrationSvg>
  );
}
