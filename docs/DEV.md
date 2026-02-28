# FefeAve Dev Commands

Recommended local setup is **frontend running locally** with the **AWS dev backend**. In dev, backend ECS can run with `AUTH_MODE=dev_bypass`, so admin routes work without Cognito token flow during UI wiring and QA.

Frontend API calls use same-origin `/api/*` (`NEXT_PUBLIC_BACKEND_URL=/api`). Next.js proxies those requests to `DEV_BACKEND_ORIGIN`, which avoids browser CORS issues because the browser only talks to the frontend origin.

## Common commands

- `make dev-plan` — Terraform dev plan (`infra`, `dev.tfvars`)
- `make dev-apply` — Terraform dev apply (`infra`, `dev.tfvars`)
- `make ui-aws` — start frontend dev against AWS backend via `/api` proxy
- `make dev-backend-health` — check `/api/health` on dev ALB
- `make dev-backend-wholesalers` — check `/api/wholesalers/balances` status code
- `make test` — run backend tests, then frontend build
