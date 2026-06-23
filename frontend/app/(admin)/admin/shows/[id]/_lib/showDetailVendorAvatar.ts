/** Stable vendor initials avatar tones for show-detail obligation rows (page-local). */

const AVATAR_TONES = [
  'bg-emerald-100 text-emerald-900',
  'bg-violet-100 text-violet-900',
  'bg-amber-100 text-amber-950',
  'bg-sky-100 text-sky-900',
  'bg-rose-100 text-rose-900',
  'bg-stone-200 text-stone-800',
] as const;

export function vendorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

export function vendorAvatarToneClass(vendorId: string): string {
  let hash = 0;
  for (let i = 0; i < vendorId.length; i += 1) {
    hash = (hash + vendorId.charCodeAt(i)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[hash] ?? AVATAR_TONES[0];
}

export const SHOW_DETAIL_VENDOR_AVATAR = [
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
  'text-xs font-semibold tracking-wide',
].join(' ');
