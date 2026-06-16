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

/** Vendors — clipboard, shipping box, warehouse silhouette. */
export function VendorsWorkspaceIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <WorkspaceIllustrationSvg {...props}>
      {/* Ground puddles */}
      <ellipse
        cx="22"
        cy="64"
        rx="12"
        ry="2"
        fill={ILLU_FILL_MID}
        opacity={0.5}
      />
      <ellipse
        cx="44"
        cy="65"
        rx="10"
        ry="2"
        fill={ILLU_FILL_MID}
        opacity={0.5}
      />
      <ellipse
        cx="66"
        cy="64"
        rx="11"
        ry="2"
        fill={ILLU_FILL_MID}
        opacity={0.5}
      />

      {/* Dashed arcs */}
      <path
        d="M6 28 Q18 14 34 24"
        fill="none"
        {...ILLU_STROKE}
        strokeDasharray="2.5 2"
        opacity={0.35}
      />
      <path
        d="M54 20 Q72 10 82 26"
        fill="none"
        {...ILLU_STROKE}
        strokeDasharray="2.5 2"
        opacity={0.35}
      />

      {/* Clipboard */}
      <g transform="translate(8 10)">
        <rect
          x={0}
          y={6}
          width={22}
          height={34}
          rx={2.5}
          fill={ILLU_FILL}
          {...ILLU_STROKE}
        />
        <rect
          x={6}
          y={0}
          width={10}
          height={8}
          rx={2}
          fill={ILLU_FILL_LIGHT}
          {...ILLU_STROKE}
        />
        <circle
          cx={11}
          cy={4}
          r={1.2}
          fill={ILLU_FILL_MID}
          {...ILLU_STROKE}
          strokeWidth={0.8}
        />
        {/* Checklist — no text labels */}
        {[16, 22, 28].map((y, i) => (
          <g key={y}>
            <rect
              x={3}
              y={y}
              width={5}
              height={5}
              rx={1}
              fill={ILLU_FILL_LIGHT}
              {...ILLU_STROKE}
              strokeWidth={0.95}
            />
            <polyline
              points={`${4.2},${y + 2.8} ${5.8},${y + 4} ${8.5},${y + 1.5}`}
              fill="none"
              {...ILLU_STROKE}
              strokeWidth={0.9}
            />
            <line
              x1={11}
              y1={y + 2.5}
              x2={19 - i}
              y2={y + 2.5}
              {...ILLU_STROKE}
              opacity={0.45}
            />
          </g>
        ))}
      </g>

      {/* Shipping box (3/4 view) */}
      <g transform="translate(30 30)">
        {/* Top face */}
        <path
          d="M4 8 L16 2 L28 8 L16 14 Z"
          fill={ILLU_FILL_LIGHT}
          {...ILLU_STROKE}
        />
        {/* Front face */}
        <rect
          x={4}
          y={8}
          width={24}
          height={18}
          fill={ILLU_FILL}
          {...ILLU_STROKE}
        />
        {/* Side face */}
        <path
          d="M28 8 L32 10 L32 28 L28 26 Z"
          fill={ILLU_FILL_MID}
          {...ILLU_STROKE}
        />
        {/* Tape */}
        <path
          d="M14 2 L18 2 L18 26 L14 26 Z"
          fill={ILLU_ACCENT}
          opacity={0.35}
        />
        <line x1={14} y1={2} x2={14} y2={26} {...ILLU_STROKE} opacity={0.5} />
        <line x1={18} y1={2} x2={18} y2={26} {...ILLU_STROKE} opacity={0.5} />
        {/* Label */}
        <rect
          x={9}
          y={14}
          width={10}
          height={7}
          rx={1}
          fill={ILLU_FILL_LIGHT}
          {...ILLU_STROKE}
          strokeWidth={0.9}
        />
        <line
          x1={10}
          y1={16.5}
          x2={18}
          y2={16.5}
          {...ILLU_STROKE}
          opacity={0.4}
          strokeWidth={0.8}
        />
        <line
          x1={10}
          y1={18.5}
          x2={16}
          y2={18.5}
          {...ILLU_STROKE}
          opacity={0.4}
          strokeWidth={0.8}
        />
        {/* Up arrows on side */}
        <path
          d="M30 14 L30 18 M28.5 15.5 L30 14 L31.5 15.5"
          {...ILLU_STROKE}
          strokeWidth={0.85}
        />
        <path
          d="M30 20 L30 24 M28.5 21.5 L30 20 L31.5 21.5"
          {...ILLU_STROKE}
          strokeWidth={0.85}
        />
      </g>

      {/* Warehouse silhouette */}
      <g transform="translate(52 16)">
        <path
          d="M4 30 L16 18 L28 30 Z"
          fill={ILLU_FILL_LIGHT}
          {...ILLU_STROKE}
        />
        <rect
          x={4}
          y={30}
          width={24}
          height={18}
          fill={ILLU_FILL}
          {...ILLU_STROKE}
        />
        <rect
          x={10}
          y={34}
          width={12}
          height={14}
          fill={ILLU_FILL_MID}
          {...ILLU_STROKE}
        />
        {/* Boxes inside door */}
        <rect
          x={12}
          y={40}
          width={5}
          height={4}
          fill={ILLU_FILL_LIGHT}
          {...ILLU_STROKE}
          strokeWidth={0.85}
        />
        <rect
          x={18}
          y={38}
          width={4}
          height={3.5}
          fill={ILLU_FILL_LIGHT}
          {...ILLU_STROKE}
          strokeWidth={0.85}
        />
        <rect
          x={14}
          y={36}
          width={4}
          height={3}
          fill={ILLU_FILL_LIGHT}
          {...ILLU_STROKE}
          strokeWidth={0.85}
        />
        <rect
          x={13}
          y={26}
          width={6}
          height={3}
          rx={0.5}
          fill={ILLU_FILL_MID}
          {...ILLU_STROKE}
          strokeWidth={0.85}
        />
      </g>

      {/* Sparkles */}
      <polygon
        points={sparklePoints(44, 10, 2.5)}
        fill={ILLU_FILL_LIGHT}
        {...ILLU_STROKE}
      />
      <polygon
        points={sparklePoints(6, 14, 2)}
        fill={ILLU_FILL_LIGHT}
        {...ILLU_STROKE}
      />
    </WorkspaceIllustrationSvg>
  );
}
