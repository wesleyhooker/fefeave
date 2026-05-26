# Cloudflare DNS + ACM cutover (fefeave.com)

> **Temporary** — consolidate before final merge.

Production frontend targets **https://fefeave.com** (optional **https://www.fefeave.com**). Terraform variables, outputs, and Cognito URLs use this domain even before ACM is attached. The CloudFront `*.cloudfront.net` URL is for temporary testing only — not the canonical production URL.

**DNS provider:** Cloudflare (registrar + DNS). **Route53 hosted zone is not used** for this launch; leave `route53_zone_id` unset in `prod.tfvars` and create public DNS records in Cloudflare manually.

## Expected costs

| Item                                        | Approximate cost                    |
| ------------------------------------------- | ----------------------------------- |
| Domain registration (`fefeave.com`)         | ~$10–20/year (Cloudflare registrar) |
| Cloudflare DNS (on same account)            | **Free** at basic plan              |
| Route53 hosted zone                         | **Not used** (skip ~$0.50/mo)       |
| ACM certificate (us-east-1, for CloudFront) | **Free**                            |
| CloudFront + S3 (existing stack)            | Low at minimal traffic              |

## Prerequisites

- `fefeave.com` registered on **Cloudflare** (registrar + DNS active)
- AWS account with Terraform prod workspace access
- Cognito app client callback/sign-out URLs matching tfvars (see below)

---

## 1. Cloudflare account and zone

1. Confirm **fefeave.com** appears under Cloudflare → **Websites** with status **Active**.
2. Nameservers should be Cloudflare’s (assigned at registration). No AWS Route53 hosted zone is required.
3. Under **SSL/TLS** → **Overview**, set encryption mode to **Full (strict)** once CloudFront serves a valid ACM certificate on the custom domain. Do **not** use **Flexible** (that terminates TLS at Cloudflare only and breaks strict origin validation).

---

## 2. Request ACM certificate (us-east-1)

CloudFront requires certificates in **us-east-1** (N. Virginia), regardless of where other resources live.

```bash
aws acm request-certificate \
  --region us-east-1 \
  --domain-name fefeave.com \
  --subject-alternative-names www.fefeave.com \
  --validation-method DNS
```

1. Open the certificate in **ACM (us-east-1)** → **Domains** → copy each **CNAME name** and **CNAME value** for validation.
2. In **Cloudflare** → **DNS** → **Records**, add each validation record:
   - **Type:** CNAME
   - **Name:** the ACM label only (e.g. `_abc123…` — Cloudflare strips the apex suffix)
   - **Target:** the ACM validation target (e.g. `_xyz.acm-validations.aws.`)
   - **Proxy status:** **DNS only** (grey cloud) — required so ACM can see the record
3. Wait until ACM status is **ISSUED** (usually minutes after DNS propagates).
4. Copy the certificate ARN: `arn:aws:acm:us-east-1:ACCOUNT:certificate/UUID`.

---

## 3. Enable custom domain in Terraform

In `infra/prod.tfvars` — set **only after** ACM is **ISSUED**:

```hcl
frontend_domain               = "fefeave.com"
frontend_www_domain           = "www.fefeave.com"
enable_frontend_custom_domain = true
acm_certificate_arn           = "arn:aws:acm:us-east-1:ACCOUNT:certificate/UUID"
# route53_zone_id omitted — DNS lives in Cloudflare, not Route53
```

Run `make plan-prod` then `make apply-prod`. This:

- Adds **CloudFront aliases** for `fefeave.com` and `www.fefeave.com`
- Attaches the ACM cert to CloudFront

It does **not** create public DNS records when `route53_zone_id` is unset (`infra/route53-acm.tf` resources stay at count 0).

Keep `enable_frontend_custom_domain = false` until ACM is issued so plan/apply works without a validated cert.

After apply, note outputs:

```bash
terraform -chdir=infra output -raw cloudfront_distribution_domain
# e.g. d1234abcdef.cloudfront.net
```

---

## 4. Cloudflare DNS records (after CloudFront is ready)

Add or update records in **Cloudflare** → **DNS** using the distribution hostname from Terraform (`cloudfront_distribution_domain`).

| Purpose        | Type  | Name            | Target                     | Proxy               | Notes                               |
| -------------- | ----- | --------------- | -------------------------- | ------------------- | ----------------------------------- |
| Apex site      | CNAME | `@`             | `dxxxxxxxx.cloudfront.net` | Proxied (orange)    | Cloudflare CNAME flattening at apex |
| www alias      | CNAME | `www`           | `dxxxxxxxx.cloudfront.net` | Proxied (orange)    | Same distribution as apex           |
| ACM validation | CNAME | per ACM console | per ACM console            | **DNS only** (grey) | Remove or leave after issued        |

**SSL/TLS:** **Full (strict)** (Cloudflare → CloudFront over HTTPS with valid ACM on the origin).

**Do not** point `fefeave.com` / `www` at CloudFront until:

1. ACM is **ISSUED**
2. `enable_frontend_custom_domain = true` and `make apply-prod` has attached aliases + cert

Otherwise browsers see certificate mismatch while Cognito URLs already use `https://fefeave.com`.

---

## 5. Before public DNS cutover (safe bootstrap)

With `enable_frontend_custom_domain = false`:

- CloudFront uses the default `*.cloudfront.net` certificate — plan/apply succeeds without DNS validation
- **`frontend_app_url` output remains `https://fefeave.com`** (configured domain, not the CloudFront default URL)
- **Do not** add apex/www CNAMEs in Cloudflare to CloudFront yet
- Smoke test via `https://<cloudfront_distribution_domain>/` output only

### Cognito URLs (fixed for production)

| Setting                | Value                                   |
| ---------------------- | --------------------------------------- |
| `cognito_redirect_uri` | `https://fefeave.com/api/auth/callback` |
| `cognito_logout_uri`   | `https://fefeave.com/login`             |

Configure the **prod Cognito app client** with these URLs before go-live (manual — prod Cognito is not in Terraform).

After apply: `make gh-sync-prod` (includes `COGNITO_REDIRECT_URI`, `COGNITO_LOGOUT_URI`, `FRONTEND_APP_URL`).

---

## 6. www handling

Both apex and www are aliases on the **same** CloudFront distribution. Canonical URL is apex (`https://fefeave.com`). Optional www→apex or apex→www redirect in Cloudflare **Rules** is out of scope for Phase 5.

---

## 7. Post-cutover checks

- `https://fefeave.com/` — public homepage
- `https://www.fefeave.com/` — same distribution (cert SAN includes www)
- `https://fefeave.com/api/auth/health` — JSON (not HTML SPA fallback)
- `https://fefeave.com/login` — Cognito login flow
- Admin/portal routes after auth

---

## Optional: Route53 instead of Cloudflare

If you later move DNS to AWS, set `route53_zone_id` in `prod.tfvars` and Terraform can create A/AAAA alias records via `infra/route53-acm.tf`. **Not required** for the current Cloudflare launch.

---

## Related

- [opennext-phase5.md](opennext-phase5.md) — OpenNext infra and deploy workflow
- [prod-release.md](prod-release.md) — full prod release checklist
- [infra/README.md](../../infra/README.md) — Terraform overview
