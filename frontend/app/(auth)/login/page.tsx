function buildAuthorizeUrl(): string | null {
  const domain = process.env.COGNITO_DOMAIN?.trim();
  const clientId = process.env.COGNITO_CLIENT_ID?.trim();
  const redirectUri = process.env.COGNITO_REDIRECT_URI?.trim();
  if (!domain || !clientId || !redirectUri) return null;

  const normalizedDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid email profile",
  });
  return `https://${normalizedDomain}/oauth2/authorize?${params.toString()}`;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const authorizeUrl = buildAuthorizeUrl();
  const resolvedSearchParams = await searchParams;
  const hasAuthError = resolvedSearchParams?.error === "auth_failed";

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className="w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
        <p className="mt-2 text-sm text-gray-600">
          Continue to FefeAve using your secure account.
        </p>
        {!authorizeUrl ? (
          <div
            className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
            role="alert"
          >
            Login is not configured. Set Cognito environment variables.
          </div>
        ) : (
          <>
            {hasAuthError && (
              <div
                className="mt-4 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
                role="alert"
              >
                Sign-in failed. Please try again.
              </div>
            )}
            <a
              href={authorizeUrl}
              className="mt-6 inline-flex w-full items-center justify-center rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Continue with FefeAve
            </a>
          </>
        )}
      </div>
    </main>
  );
}
