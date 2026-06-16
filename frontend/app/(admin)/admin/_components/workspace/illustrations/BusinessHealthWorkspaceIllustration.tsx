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

/** Business health — report chart, shield, plant, upward trend. */
export function BusinessHealthWorkspaceIllustration(
  props: SVGProps<SVGSVGElement>,
) {
  const bars = [
    { x: 34, h: 8 },
    { x: 40, h: 12 },
    { x: 46, h: 16 },
    { x: 52, h: 22 },
    { x: 58, h: 28 },
  ];

  return (
    <WorkspaceIllustrationSvg {...props}>
      <ellipse
        cx="44"
        cy="66"
        rx="26"
        ry={2.5}
        fill={ILLU_FILL_MID}
        opacity={0.5}
      />

      {/* Upward trend arrows (behind) */}
      <path
        d="M48 14 L62 6 L62 10 M62 6 L58 6"
        fill="none"
        {...ILLU_STROKE}
        opacity={0.4}
      />
      <path
        d="M54 18 L68 10 L68 14 M68 10 L64 10"
        fill="none"
        {...ILLU_STROKE}
        opacity={0.35}
      />

      {/* Dashed arcs */}
      <path
        d="M6 30 Q14 18 24 26"
        fill="none"
        {...ILLU_STROKE}
        strokeDasharray="2.5 2"
        opacity={0.35}
      />
      <path
        d="M72 28 Q80 16 84 24"
        fill="none"
        {...ILLU_STROKE}
        strokeDasharray="2.5 2"
        opacity={0.35}
      />

      {/* Potted plant */}
      <g transform="translate(8 22)">
        <path d="M6 28 L10 20 L14 28 Z" fill={ILLU_FILL_MID} {...ILLU_STROKE} />
        <rect
          x={5}
          y={28}
          width={10}
          height={6}
          rx={1}
          fill={ILLU_FILL}
          {...ILLU_STROKE}
        />
        <line x1={10} y1={20} x2={10} y2={12} {...ILLU_STROKE} />
        <ellipse
          cx={6}
          cy={14}
          rx={4}
          ry={3}
          fill={ILLU_FILL_LIGHT}
          {...ILLU_STROKE}
        />
        <ellipse
          cx={14}
          cy={15}
          rx={3.5}
          ry={2.8}
          fill={ILLU_FILL_LIGHT}
          {...ILLU_STROKE}
        />
        <ellipse
          cx={10}
          cy={10}
          rx={3.5}
          ry={3}
          fill={ILLU_FILL_LIGHT}
          {...ILLU_STROKE}
        />
      </g>

      {/* Clipboard / report */}
      <g transform="translate(28 8)">
        <rect
          x={0}
          y={6}
          width={36}
          height={44}
          rx={3}
          fill={ILLU_FILL}
          {...ILLU_STROKE}
        />
        <rect
          x={12}
          y={0}
          width={12}
          height={8}
          rx={2}
          fill={ILLU_FILL_LIGHT}
          {...ILLU_STROKE}
        />
        <circle
          cx={18}
          cy={4}
          r={1.2}
          fill={ILLU_FILL_MID}
          {...ILLU_STROKE}
          strokeWidth={0.8}
        />
        {/* Bar chart */}
        {bars.map((bar) => (
          <rect
            key={bar.x}
            x={bar.x - 28}
            y={46 - bar.h}
            width={4}
            height={bar.h}
            rx={0.8}
            fill={ILLU_FILL_MID}
            {...ILLU_STROKE}
            strokeWidth={0.9}
          />
        ))}
        {/* Trend line */}
        <polyline
          points="8,38 14,34 20,30 26,24 32,18"
          fill="none"
          {...ILLU_STROKE}
        />
        <polyline points="30,18 32,18 32,20" fill="none" {...ILLU_STROKE} />
        {/* Pie chart */}
        <circle cx={12} cy={40} r={6} fill={ILLU_FILL_LIGHT} {...ILLU_STROKE} />
        <path
          d="M12 34 A6 6 0 0 1 17.2 42 Z"
          fill={ILLU_ACCENT}
          opacity={0.45}
          {...ILLU_STROKE}
          strokeWidth={0.9}
        />
        {/* Meta lines */}
        <line
          x1={22}
          y1={38}
          x2={32}
          y2={38}
          {...ILLU_STROKE}
          opacity={0.4}
          strokeWidth={0.85}
        />
        <line
          x1={22}
          y1={42}
          x2={30}
          y2={42}
          {...ILLU_STROKE}
          opacity={0.4}
          strokeWidth={0.85}
        />
        <line
          x1={22}
          y1={46}
          x2={28}
          y2={46}
          {...ILLU_STROKE}
          opacity={0.4}
          strokeWidth={0.85}
        />
      </g>

      {/* Shield */}
      <g transform="translate(62 18)">
        <path
          d="M10 2 L18 6 L18 18 Q18 26 10 30 Q2 26 2 18 L2 6 Z"
          fill={ILLU_FILL_LIGHT}
          {...ILLU_STROKE}
        />
        <line
          x1={10}
          y1={12}
          x2={10}
          y2={22}
          stroke={ILLU_ACCENT}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
        <line
          x1={5}
          y1={17}
          x2={15}
          y2={17}
          stroke={ILLU_ACCENT}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      </g>

      {/* Sparkles */}
      <polygon
        points={sparklePoints(8, 12, 2.2)}
        fill={ILLU_FILL_LIGHT}
        {...ILLU_STROKE}
      />
      <polygon
        points={sparklePoints(80, 14, 2.5)}
        fill={ILLU_FILL_LIGHT}
        {...ILLU_STROKE}
      />
    </WorkspaceIllustrationSvg>
  );
}
