export type LivePlatformId = 'whatnot' | 'tiktok';

export type LivePlatformLink = {
  id: LivePlatformId;
  label: string;
  href: string;
};

export type PublicFooterLink = {
  id: 'about' | 'instagram' | LivePlatformId | 'email';
  label: string;
  href: string;
  external?: boolean;
};

/** Default contact email when no env override is set. */
export const PUBLIC_CONTACT_EMAIL = 'fefeave@outlook.com';

function readEnvUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getPublicContactEmail(): string {
  return (
    readEnvUrl(process.env.NEXT_PUBLIC_FEFE_CONTACT_EMAIL) ??
    PUBLIC_CONTACT_EMAIL
  );
}

/**
 * Instagram profile URL for public marketing (optional).
 * Set `NEXT_PUBLIC_FEFE_INSTAGRAM_URL` to show Instagram in footer and contact.
 */
export function getInstagramUrl(): string | null {
  return readEnvUrl(process.env.NEXT_PUBLIC_FEFE_INSTAGRAM_URL);
}

/**
 * Configured external links for Felicia's live platforms (Whatnot, TikTok).
 * Omits platforms whose NEXT_PUBLIC_* URL is unset or empty.
 */
export function getLivePlatformLinks(): LivePlatformLink[] {
  const links: LivePlatformLink[] = [];

  const whatnot = readEnvUrl(process.env.NEXT_PUBLIC_FEFE_WHATNOT_URL);
  if (whatnot) {
    links.push({ id: 'whatnot', label: 'Whatnot', href: whatnot });
  }

  const tiktok = readEnvUrl(process.env.NEXT_PUBLIC_FEFE_TIKTOK_URL);
  if (tiktok) {
    links.push({ id: 'tiktok', label: 'TikTok', href: tiktok });
  }

  return links;
}

export function hasLivePlatformLinks(): boolean {
  return getLivePlatformLinks().length > 0;
}

/** Ordered links for the shared public footer. Omits unset external URLs. */
export function getPublicFooterLinks(): PublicFooterLink[] {
  const links: PublicFooterLink[] = [
    { id: 'about', label: 'About', href: '/about' },
  ];

  const instagram = getInstagramUrl();
  if (instagram) {
    links.push({
      id: 'instagram',
      label: 'Instagram',
      href: instagram,
      external: true,
    });
  }

  for (const platform of getLivePlatformLinks()) {
    links.push({
      id: platform.id,
      label: platform.label,
      href: platform.href,
      external: true,
    });
  }

  links.push({
    id: 'email',
    label: 'Email',
    href: `mailto:${getPublicContactEmail()}`,
    external: true,
  });

  return links;
}
