# FefeAve — Agent Spec (Lean)

## Skill: Endpoint Change (default workflow)
When changing an API endpoint, keep these aligned:
- validation
- guards
- swagger
- tests (happy + 401/403 when applicable)

## Skill: DB Change
- migration required
- follow existing conventions (soft delete, indexes)
- avoid breaking changes unless instructed

## Skill: Infra Change
- preserve encryption and public access protections
- maintain least privilege
- provide blast radius + rollback note

## Skill: Assume + Proceed
If something is ambiguous:
- choose the safest reasonable assumption
- state it clearly
- implement minimally
- list improvements under "OPTIONAL" (not implemented)
