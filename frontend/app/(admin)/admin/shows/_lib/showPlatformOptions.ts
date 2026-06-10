/** User-facing platform choices for Log Show (order preserved — TikTok first/default). */
export const SHOW_PLATFORM_OPTIONS = [
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'WHATNOT', label: 'Whatnot' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'OTHER', label: 'Other' },
] as const;

export type ShowPlatform = (typeof SHOW_PLATFORM_OPTIONS)[number]['value'];

export const DEFAULT_SHOW_PLATFORM: ShowPlatform = 'TIKTOK';

const PLATFORM_LABELS: Record<ShowPlatform, string> = {
  WHATNOT: 'Whatnot',
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram',
  OTHER: 'Other',
};

export function formatShowPlatformLabel(
  platform: ShowPlatform | '' | null | undefined,
): string {
  if (!platform) return '';
  return PLATFORM_LABELS[platform as ShowPlatform] ?? platform;
}
