export function normalizeCognitoDomain(domain: string): string {
  return domain
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
}

export function buildCognitoLogoutUrl({
  domain,
  clientId,
  logoutUri,
}: {
  domain: string;
  clientId: string;
  logoutUri: string;
}): string {
  const normalizedDomain = normalizeCognitoDomain(domain);
  const params = new URLSearchParams({
    client_id: clientId,
    logout_uri: logoutUri,
  });
  return `https://${normalizedDomain}/logout?${params.toString()}`;
}
