import type { SVGAttributes } from 'react';

/** Warm Clay illustration palette — works on hub card surfaces. */
export const ILLU_FILL = '#F3E8DE';
export const ILLU_FILL_LIGHT = '#FAF4EE';
export const ILLU_FILL_MID = '#E8D9CC';
export const ILLU_ACCENT = '#C47A5C';

export const ILLU_STROKE: Pick<
  SVGAttributes<SVGElement>,
  'stroke' | 'strokeWidth' | 'strokeLinecap' | 'strokeLinejoin'
> = {
  stroke: 'currentColor',
  strokeWidth: 1.15,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/** Four-point sparkle star centered at (cx, cy). */
export function sparklePoints(cx: number, cy: number, r: number): string {
  return `${cx},${cy - r} ${cx + r * 0.28},${cy - r * 0.28} ${cx + r},${cy} ${cx + r * 0.28},${cy + r * 0.28} ${cx},${cy + r} ${cx - r * 0.28},${cy + r * 0.28} ${cx - r},${cy} ${cx - r * 0.28},${cy - r * 0.28}`;
}
