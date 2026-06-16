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

function boxTape(x: number, y: number, w: number, h: number, key: string) {
  return (
    <g key={key}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={1}
        fill={ILLU_FILL}
        {...ILLU_STROKE}
      />
      <path
        d={`M${x + w / 2 - 1.5} ${y} L${x + w / 2 + 1.5} ${y} L${x + w / 2 + 1.5} ${y + h} L${x + w / 2 - 1.5} ${y + h} Z`}
        fill={ILLU_ACCENT}
        opacity={0.3}
      />
    </g>
  );
}

/** Purchases — cart, receipt, stacked boxes. */
export function PurchasesWorkspaceIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <WorkspaceIllustrationSvg {...props}>
      <ellipse
        cx="44"
        cy="66"
        rx="28"
        ry={2.5}
        fill={ILLU_FILL_MID}
        opacity={0.5}
      />

      {/* Motion lines */}
      <line x1={4} y1={28} x2={12} y2={28} {...ILLU_STROKE} opacity={0.35} />
      <line x1={6} y1={32} x2={11} y2={32} {...ILLU_STROKE} opacity={0.3} />
      <circle cx={13} cy={30} r={0.8} fill="currentColor" opacity={0.3} />
      <line x1={78} y1={34} x2={84} y2={34} {...ILLU_STROKE} opacity={0.35} />

      {/* Receipt */}
      <path
        d="M10 38 L10 32 L18 32 L18 52 L17 53 L16 52 L15 53 L14 52 L13 53 L12 52 L11 53 L10 52 Z"
        fill={ILLU_FILL_LIGHT}
        {...ILLU_STROKE}
      />
      {[36, 39, 42, 45].map((y, i) => (
        <line
          key={y}
          x1={12}
          y1={y}
          x2={16 - i * 0.5}
          y2={y}
          {...ILLU_STROKE}
          opacity={0.4}
          strokeWidth={0.85}
        />
      ))}
      <path
        d="M14 46 L14 44 Q14 42 15.5 42 Q17 42 17 43.5 Q17 45 15.5 45.5 Q14 46 14 48"
        fill="none"
        stroke={ILLU_ACCENT}
        strokeWidth={0.9}
        strokeLinecap="round"
      />

      {/* Shopping cart */}
      <g transform="translate(20 18)">
        {/* Handle */}
        <path d="M0 8 L0 2 L10 2" fill="none" {...ILLU_STROKE} />
        {/* Basket frame */}
        <path
          d="M10 2 L28 2 L32 22 L6 22 Z"
          fill={ILLU_FILL_LIGHT}
          {...ILLU_STROKE}
        />
        {/* Grid */}
        <line
          x1={12}
          y1={8}
          x2={28}
          y2={8}
          {...ILLU_STROKE}
          opacity={0.4}
          strokeWidth={0.85}
        />
        <line
          x1={12}
          y1={14}
          x2={28}
          y2={14}
          {...ILLU_STROKE}
          opacity={0.4}
          strokeWidth={0.85}
        />
        <line
          x1={12}
          y1={20}
          x2={28}
          y2={20}
          {...ILLU_STROKE}
          opacity={0.4}
          strokeWidth={0.85}
        />
        <line
          x1={16}
          y1={4}
          x2={14}
          y2={22}
          {...ILLU_STROKE}
          opacity={0.35}
          strokeWidth={0.85}
        />
        <line
          x1={22}
          y1={4}
          x2={20}
          y2={22}
          {...ILLU_STROKE}
          opacity={0.35}
          strokeWidth={0.85}
        />
        {/* Wheels */}
        <circle cx={12} cy={26} r={3} fill={ILLU_FILL} {...ILLU_STROKE} />
        <circle cx={26} cy={26} r={3} fill={ILLU_FILL} {...ILLU_STROKE} />
        <circle cx={12} cy={26} r={1} fill={ILLU_FILL_LIGHT} />
        <circle cx={26} cy={26} r={1} fill={ILLU_FILL_LIGHT} />
        {/* Boxes in cart */}
        {boxTape(14, 10, 8, 7, "in-cart-1")}
        {boxTape(20, 12, 7, 6, "in-cart-2")}
      </g>

      {/* Stacked boxes */}
      <g transform="translate(56 28)">
        {boxTape(0, 14, 14, 10, "stack-1")}
        {boxTape(2, 7, 12, 8, "stack-2")}
        {boxTape(4, 2, 10, 6, "stack-3")}
      </g>

      {/* Sparkles */}
      <polygon
        points={sparklePoints(16, 16, 2.5)}
        fill={ILLU_FILL_LIGHT}
        {...ILLU_STROKE}
      />
      <polygon
        points={sparklePoints(24, 10, 2)}
        fill={ILLU_FILL_LIGHT}
        {...ILLU_STROKE}
      />
      <polygon
        points={sparklePoints(72, 18, 2.2)}
        fill={ILLU_FILL_LIGHT}
        {...ILLU_STROKE}
      />
    </WorkspaceIllustrationSvg>
  );
}
