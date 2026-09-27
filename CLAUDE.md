# Livestock for Claude Code

## Who this is for

The demo operator is Jo at Wattle Creek, a fictional Australian sheep and cattle farm. Replace this block with the real business, PICs, state, operator and reviewer before loading real records. The priorities are reliable muster numbers, treatment history and the paddock round.

## How to work

Read the CLI before answering. Explain the record and the missing evidence in plain words. A record check is not proof of official clearance. Never invent product directions, doses, withholding periods or NLIS references. The embedded database uses the local machine date. Set the farm timezone on the machine and the PostgreSQL session before real use.

## One path per recurring job

| Command | Job |
|---|---|
| `/attention` | The morning muster |
| `/mobs` | The mob book |
| `/animals` | The individual tag register |
| `/paddocks` | The paddock book |
| `/grazing` | The grazing round |
| `/reconciliation` | Reconcile the muster |
| `/movements` | The movement book |
| `/withholding` | Before booking slaughter |
| `/treatments` | The animal health book |
| `/inventory` | The medicine cupboard |
| `/performance` | The weighing review |
| `/feed` | The feed book |
| `/costs` | The recorded cost review |
| `/breeding` | The joining and scan round |
| `/sale-check` | The slaughter plan |
| `/sales` | The sale book |
| `/compliance` | The audit preparation round |
| `/farms` | The property book |
| `/tasks` | The work list |
| `/mob` | One mob before a decision |
| `/add` | Add the missing record |
| `/log` | Record a farm decision |
| `/move` | Move the whole mob |
| `/treat` | Record a completed treatment |
| `/weigh` | Record a weighing |
| `/stocktake` | Reconcile what was mustered |
| `/weekly-review` | Monday farm review |
| `/draft-sale` | Draft the slaughter preparation worksheet |
| `/draft-treatment` | Draft the treatment register |
| `/draft-audit` | Draft the audit pack |
| `/import` | Bring the farm records across |
| `/customise` | Make the records fit this farm |
| `/new-view` | Add a read-only view |
| `/export` | Back up the farm record |

All agent runtimes use these same recipes in .claude/commands. For detailed write syntax, read docs/commands.md and run `npm run livestock -- help`.

## House rules

- Draft to drafts/. Never send, register a transfer, submit to NLIS, or issue an official NVD.
- Keep source exports and label evidence. Never infer a missing holding interval as zero.
- Imports start unverified. Verification requires a named reviewer and evidence. Unknown treatment intervals still block release after history verification.
- The slaughter release check uses full calendar days after treatment and holds the whole mob even when only part was treated. This is a conservative farm policy, not a dosing guide.
- Every negative stock change needs a reference. Use stocktake to record a discrepancy before an explained adjustment.
- All current stock mutations are transactional. Do not write directly around their gates. Individual disposition, mob splits and cross-property transfers are not implemented.
- Export before customisation. Add migrations, never rewrite an applied one. Run npm test after code or schema changes.
- No deletes without the operator's explicit instruction. Never copy production records into public examples or tests.

## Where things live

scripts/livestock.mjs is the CLI. scripts/lib/db.mjs chooses DATABASE_URL or PGlite in .data/db. supabase/migrations contains portable SQL. brand.json controls read-only views and paperwork. docs/compliance.md holds sourced checks and the farm policies.

Built and operated by Enterprise DNA through Omni by Enterprise DNA: https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=agriwebb
