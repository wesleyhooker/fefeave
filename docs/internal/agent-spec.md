# FefeAve — Contributor conventions (agent spec)

Lean checklists for API, database, and infrastructure changes.

## Endpoint change

When changing an API endpoint, keep these aligned:

- validation
- guards
- swagger
- tests (happy + 401/403 when applicable)

## Database change

- migration required
- follow existing conventions (soft delete, indexes)
- avoid breaking changes unless instructed

## Infrastructure change

- preserve encryption and public access protections
- maintain least privilege
- provide blast radius + rollback note

## Ambiguity

If something is ambiguous:

- choose the safest reasonable assumption
- state it clearly
- implement minimally
- list improvements under "OPTIONAL" (not implemented)
