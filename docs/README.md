# Documentation

Technical documentation for the FefeAve monorepo. The root [README.md](../README.md) is the primary entry point.

## Start here

| Document                                               | Audience       | Contents                                          |
| ------------------------------------------------------ | -------------- | ------------------------------------------------- |
| [architecture.md](architecture.md)                     | Contributors   | System structure, layers, auth, financial domain  |
| [testing.md](testing.md)                               | Contributors   | Unit/integration tests, `make check`, CI behavior |
| [DEV.md](DEV.md)                                       | All developers | Local setup, ports, `make dev`, troubleshooting   |
| [roadmap.md](roadmap.md)                               | Contributors   | V1 phases, epics, completion criteria             |
| [../backend/README.md](../backend/README.md)           | Backend        | Env vars, migrations, API tests                   |
| [../infra/README.md](../infra/README.md)               | Ops / infra    | Terraform, deploy, AWS flags                      |
| [../frontend/AUTH_SETUP.md](../frontend/AUTH_SETUP.md) | Auth           | Cognito and session configuration                 |

## Design

| Path                                                                                                | Contents                                    |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| [../design/](../design/)                                                                            | Brand colors, typography, homepage guidance |
| [../frontend/system/README.md](../frontend/system/README.md)                                        | Shared UI primitives (`@/system`)           |
| [../frontend/app/(public)/\_components/README.md](<../frontend/app/(public)/_components/README.md>) | Public marketing components                 |

## Domain and UX (historical)

Product and UX notes from V1 delivery. Useful for context; not required for daily dev.

| Document                                                                       | Topic               |
| ------------------------------------------------------------------------------ | ------------------- |
| [admin-v1-acceptance-checklist.md](admin-v1-acceptance-checklist.md)           | Admin V1 acceptance |
| [admin-ux-audit-and-close-show-flow.md](admin-ux-audit-and-close-show-flow.md) | Close-show UX       |
| [settlement-entry-ux-stage3.md](settlement-entry-ux-stage3.md)                 | Settlement entry UX |
| [ux-direction-felicia-first.md](ux-direction-felicia-first.md)                 | UX direction        |
| [wholesaler-config-and-e2e-report.md](wholesaler-config-and-e2e-report.md)     | Wholesaler E2E      |
| [dev-e2e.md](dev-e2e.md)                                                       | Dev E2E notes       |

## Optional / future

| Document                                                   | Topic                 |
| ---------------------------------------------------------- | --------------------- |
| [SaaS-PRODUCTIZATION-PLAN.md](SaaS-PRODUCTIZATION-PLAN.md) | Productization ideas  |
| [HOMEPAGE-DESIGN-BRIEF.md](HOMEPAGE-DESIGN-BRIEF.md)       | Homepage design brief |
| [HOMEPAGE-FIGMA-BRIEF.md](HOMEPAGE-FIGMA-BRIEF.md)         | Figma brief           |

## Agent and contributor conventions

Moved from `context/`: see [internal/agent-spec.md](internal/agent-spec.md) for endpoint, DB, and infra change checklists.
