/**
 * Temporary Shows index row styling after close-out redirect (~3s).
 * Reuses inset accent pattern from ledger selected rows — no new animation system.
 */

/** Desktop table row (`tr`) — left accent + ring + stronger emerald wash. */
export const showCloseSuccessTableRowShell =
  'border-y border-emerald-300/70 bg-emerald-100/80 shadow-[inset_4px_0_0_0_rgb(5,150,105)] ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-white transition-[box-shadow,background-color,border-color] duration-300';

/** Mobile card — same language as table row. */
export const showCloseSuccessCardShell =
  'border-emerald-300/90 bg-emerald-100/80 shadow-[inset_4px_0_0_0_rgb(5,150,105)] ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-white';
