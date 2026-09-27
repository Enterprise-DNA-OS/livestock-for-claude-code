# CLI reference

Every command accepts --json. Use full or partial UUIDs and case-insensitive unique names. Ambiguous matches list candidates and exit 1. Write flags accept --field=value or --field value. Dates are YYYY-MM-DD. Money is a decimal amount in the farm's currency, AUD in the demo. No command sends.

## Reads

farms, mobs, mob NAME, animals, paddocks, grazing, reconciliation, movements, treatments, withholding, inventory, performance, feed, costs, breeding, tasks, sales, sale-check, compliance, attention, weekly-review, help.

## Writes

```
add farm --name=NAME --pic=PIC --state=NSW
add paddock --farm=NAME --name=NAME --area=HECTARES --rest=DAYS
add mob --paddock=NAME --name=NAME --species=cattle --head=N --dse=N [--date=YYYY-MM-DD] [--breed=BREED] [--cost=AMOUNT]
add product --name=NAME --batch=BATCH --expiry=YYYY-MM-DD --stock=ML --whp=DAYS --esi=DAYS --label=REFERENCE
add animal --mob=NAME --name=TAG --eid=EID --born=YYYY-MM-DD --sex=female
move MOB --to=PADDOCK [--date=YYYY-MM-DD] [--note=TEXT]
treat MOB --product=NAME --head=N --dose=ML --operator=NAME [--cost=AMOUNT] [--date=YYYY-MM-DD]
weigh MOB --head=SAMPLE_COUNT --kg=AVERAGE [--date=YYYY-MM-DD]
feed-add MOB --feed=NAME --kg=DRY_MATTER --cost=AMOUNT [--declaration=REFERENCE] [--date=YYYY-MM-DD]
stocktake MOB --head=N --note=TEXT
stock-event MOB --kind=birth|purchase|death|adjustment --delta=SIGNED_INTEGER --reference=REFERENCE [--amount=AMOUNT] [--date=YYYY-MM-DD]
join MOB --sire=NAME --start=YYYY-MM-DD --end=YYYY-MM-DD --scan-due=YYYY-MM-DD --head=FEMALES
scan JOINING_ID --pregnant=N
plan-sale MOB --name=PLAN --date=YYYY-MM-DD --head=N --market=domestic|export [--pic=DESTINATION] [--nvd=REFERENCE] [--amount=AMOUNT]
release-sale PLAN --reviewed-by=NAME
confirm-nlis SALE_REFERENCE --reference=OFFICIAL_CONFIRMATION
verify-history MOB --evidence=REFERENCE --by=NAME
task-add --farm=NAME --name=TASK --due=YYYY-MM-DD --owner=NAME
task-done TASK
log MOB --note=TEXT --by=NAME
```

Use `npm run livestock --` before any example. Shell-quote names and notes containing spaces. New mobs require treatment history review. Product dose and intervals come from the actual label or authorised veterinary instructions. Products store stock in millilitres. Other dose units need an explicit schema and importer change first.

Stocktakes compare current head and must be dated today. Stock events cannot predate the latest count change. Add missed history through a reviewed reconciliation, not a backdated current balance.

A slaughter plan releases only on its planned date, once head, history, hold intervals and PIC/NVD references pass. It reduces head once and records the review. Enter NLIS confirmation only after using the official system. A mob containing registered individual animals cannot release through the mob workflow. Ask for an individual disposition workflow before using it that way. Internal moves carry the whole mob, not a split.

## Drafts and outputs

```
draft-sale PLAN
draft-treatment MOB
draft-audit
export [--file=PATH]
import agriwebb --farm=NAME --as-of=YYYY-MM-DD --paddocks=PATH --mobs=PATH --treatments=PATH [--animals=PATH] [--weights=PATH] [--feeds=PATH] [--dry-run]
```

The import accepts any subset of the six file types. Mob snapshots require --as-of. See replace-agriwebb.md for headers and limits. Drafts are branded HTML in drafts/. `npm run docs` renders three document types. `npm run view` renders three dashboards. Backup exports are JSON, not a database restore script. Restore into a new database with a reviewed migration or use PostgreSQL's backup tooling for production.
