# Cursor rules — documentation index

Cursor rules in `.cursor/rules/` encode **durable principles** only. This index maps each principle area to canonical project docs, which may evolve without changing the rules.

| Principle area                     | Cursor rule                 | Canonical documentation                                                                                                                |
| ---------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Scope, trust, security             | `00-fefeave-core.mdc`       | [architecture.md](../architecture.md), [roadmap.md](../roadmap.md)                                                                     |
| Financial source of truth & ledger | `10-financial-domain.mdc`   | [financial-event-sourcing.md](../architecture/financial-event-sourcing.md), [architecture.md](../architecture.md) § Financial domain   |
| Product surfaces & design          | `20-product-surfaces.mdc`   | [reseller-workspace-v2.md](../product/reseller-workspace-v2.md), [ux-direction-felicia-first.md](../ux-direction-felicia-first.md)     |
| Engineering & contracts            | `30-engineering.mdc`        | [agent-spec.md](./agent-spec.md), [architecture.md](../architecture.md), [testing.md](../testing.md)                                   |
| Operator design (current)          | (via `20-product-surfaces`) | [a1-workspace-design-system.md](../design/a1-workspace-design-system.md), [admin README](<../../frontend/app/(admin)/admin/README.md>) |
| Public design (current)            | (via `20-product-surfaces`) | [design/](../../design/), [frontend/system/README.md](../../frontend/system/README.md)                                                 |
| Infrastructure & deploy            | (via `30-engineering`)      | [infra/README.md](../../infra/README.md)                                                                                               |
| Local dev & ports                  | —                           | [DEV.md](../DEV.md)                                                                                                                    |
| Auth configuration                 | —                           | [frontend/AUTH_SETUP.md](../../frontend/AUTH_SETUP.md)                                                                                 |
| Product vision (directional)       | —                           | [financials-vision-v2.md](../product/financials-vision-v2.md)                                                                          |

## Rule files

| File                      | Applies                                 | Purpose                                                                |
| ------------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| `00-fefeave-core.mdc`     | Always                                  | Constitution: multi-surface product, server authority, scope, security |
| `10-financial-domain.mdc` | `backend/**`, `frontend/**`             | Money, ledger integrity, financial invariants                          |
| `20-product-surfaces.mdc` | `frontend/**`, `design/**`              | Public / operator / portal separation, design systems                  |
| `30-engineering.mdc`      | `backend/**`, `frontend/**`, `infra/**` | Layers, API/DB/infra change alignment, verification                    |

When a rule and a doc disagree, **the doc reflects current implementation**; update the doc first, then adjust rules only if a durable principle changed.
