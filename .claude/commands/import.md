# Bring the farm records across

Read docs/replace-agriwebb.md. Keep original exports. Run `npm run livestock -- import agriwebb --farm="<farm>" --as-of=YYYY-MM-DD --paddocks=paddocks.csv --mobs=mobs.csv --treatments=treatments.csv --dry-run`. Inspect row counts, then repeat without --dry-run when the operator requested import. Run reconciliation and compliance. Resolve column differences explicitly. Never mark history verified just because an import succeeded.
