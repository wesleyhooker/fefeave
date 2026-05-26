# Phase 4.0: OpenNext validation spike

> **Temporary** — consolidate with prod release docs before final merge.

## Versions

| Package           | Version                                    |
| ----------------- | ------------------------------------------ |
| Next.js           | `15.5.18` (pinned; peer for OpenNext 4)    |
| `@opennextjs/aws` | `4.0.2`                                    |
| `patch-package`   | `next+15.5.18.patch` (font manifest guard) |

## Build commands

```bash
cd frontend
npm install
npm run build          # next build only
npm run build:opennext # next build + open-next build
```

Local dev is unchanged: `make dev` / `npm run dev` (port 3001 via Makefile).

## OpenNext output (`.open-next/`)

| Path                           | Purpose                                            |
| ------------------------------ | -------------------------------------------------- |
| `server-functions/default/`    | Main Lambda bundle (`index.mjs`, `middleware.mjs`) |
| `assets/`                      | Static files for S3 (`_next/`, public images)      |
| `image-optimization-function/` | `next/image` Lambda (sharp)                        |
| `revalidation-function/`       | ISR/revalidation                                   |
| `warmer-function/`             | Optional warmer                                    |
| `open-next.output.json`        | Deploy manifest (origins, behaviors)               |

## Spike result (2026-05-26)

- `npm run build` — pass
- `npm run build:opennext` — pass
- No auth/middleware/BFF code changes required

## Next steps (not this spike)

- Terraform / CloudFront behaviors for `/api/*` → server Lambda
- GitHub OIDC deploy workflow
- Prod Cognito callback URLs on CloudFront domain
- Runtime smoke (login, BFF) on deployed preview
