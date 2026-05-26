# Phase 5: OpenNext frontend infrastructure + deploy

> **Temporary** — consolidate before final merge.

## What Terraform adds (`create_serverless_frontend = true`)

| Resource                                  | Purpose                                      |
| ----------------------------------------- | -------------------------------------------- |
| Lambda `fefeave-frontend-server-{env}`    | OpenNext server (middleware, `/api`, SSR)    |
| Lambda `fefeave-frontend-image-{env}`     | `next/image` optimizer                       |
| CloudFront (multi-origin)                 | S3 `_assets`, server Lambda, image Lambda    |
| OIDC role `fefeave-frontend-deploy-{env}` | S3 sync, Lambda code update, CF invalidation |

**Not created:** DynamoDB, SQS, warmer/EventBridge, ECS, ECR, NAT, ALB, RDS.

## Domain / Cognito (prod)

| Setting                | Value                                   |
| ---------------------- | --------------------------------------- |
| `frontend_domain`      | `fefeave.com`                           |
| `frontend_www_domain`  | `www.fefeave.com`                       |
| `cognito_redirect_uri` | `https://fefeave.com/api/auth/callback` |
| `cognito_logout_uri`   | `https://fefeave.com/login`             |

ACM + Cloudflare DNS: [route53-acm-cutover.md](route53-acm-cutover.md) (`enable_frontend_custom_domain = false` until ACM issued; no Route53 zone).

## Build / package (before plan or deploy)

```bash
cd frontend
npm ci
npm run build:opennext
npm run package:opennext   # → opennext-server.zip, opennext-image.zip
```

OpenNext config (`open-next.config.ts`): `tagCache: dummy`, `queue: dummy` (no DynamoDB/SQS).

## GitHub Actions

**Frontend Deploy (prod)** — `workflow_dispatch` only:

1. `npm run build:opennext` + `package:opennext`
2. `aws s3 sync` → `s3://$S3_BUCKET/_assets`
3. `aws lambda update-function-code` (server + image)
4. CloudFront invalidation

### Prod environment variables (from `make gh-sync-prod`)

| Var                                                              | Notes                |
| ---------------------------------------------------------------- | -------------------- |
| `FRONTEND_DEPLOY_ROLE_ARN`                                       | OIDC role            |
| `S3_BUCKET`, `CF_DIST_ID`, `AWS_REGION`                          |                      |
| `FRONTEND_SERVER_LAMBDA_NAME`, `FRONTEND_IMAGE_LAMBDA_NAME`      |                      |
| `BACKEND_BASE_URL`                                               | API Gateway + `/api` |
| `FRONTEND_APP_URL`, `COGNITO_REDIRECT_URI`, `COGNITO_LOGOUT_URI` | docs / optional      |

### Secrets (manual, not in Terraform)

| Secret                                | Used by                                         |
| ------------------------------------- | ----------------------------------------------- |
| `AUTH_SESSION_SECRET`                 | Frontend server Lambda                          |
| `COGNITO_CLIENT_SECRET`               | OAuth token exchange                            |
| `COGNITO_DOMAIN`, `COGNITO_CLIENT_ID` | Set on Lambda via console or workflow extension |

## CloudFront routing summary

| Path                                                | Origin                                      |
| --------------------------------------------------- | ------------------------------------------- |
| Default + `/api/*`                                  | Server Lambda (no cache, cookies forwarded) |
| `/_next/image*`                                     | Image Lambda                                |
| `/_next/static/*`, `/_next/*`, images, icons, logos | S3 `/_assets`                               |
| No global 403→index.html                            | Protects `/api` from SPA fallback           |

## Related

- [opennext-phase4-spike.md](opennext-phase4-spike.md)
- [lambda-phase3.md](lambda-phase3.md)
- [prod-release.md](prod-release.md)
