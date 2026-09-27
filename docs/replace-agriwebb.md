# Move mob records from AgriWebb

Checked 2026-09-27 against AgriWebb's [Reporting Guide](https://help.agriwebb.com/en/articles/3153281-reporting-guide) and [Livestock Treatment Report](https://help.agriwebb.com/en/articles/3767839-livestock-treatment-report). Reports export the currently filtered and grouped data. Remove unwanted filters, expose the required columns and export CSV. For treatments, choose the full available history. Keep the original download unchanged.

## One import command

Start with a fresh DATA_DIR, run npm run migrate, and add your farm with its actual PIC and state. Do not put live records into the demo database. Export the paddock list, current mob list, treatment records and any optional weight, individual or feed records. Use ungrouped records, not subtotal rows. If the download is Excel, save the required sheet as UTF-8 CSV first.

```bash
npm run livestock -- import agriwebb --farm="Your Farm" --as-of=2026-09-27 --paddocks=paddocks.csv --mobs=mobs.csv --treatments=treatments.csv --dry-run
npm run livestock -- import agriwebb --farm="Your Farm" --as-of=2026-09-27 --paddocks=paddocks.csv --mobs=mobs.csv --treatments=treatments.csv
```

The first command validates everything then rolls back. The second commits all rows together. The same rows can be replayed without duplicates. A malformed CSV, bad date, wrong farm, duplicate record, unsupported number or missing required field rejects the entire batch. Changed existing records are not silently overwritten. A reviewer must map and reconcile corrections.

## Column mapping

AgriWebb lets operators choose report columns, so the exact exported layout varies. These accepted aliases are implemented, not a claim that every account has an identical header. fixtures/agriwebb contains synthetic examples of the supported layout, not captured vendor files.

| File | Required columns | Accepted alternatives and notes |
|---|---|---|
| Paddocks | Paddock Name, Area (ha) | Paddock or Name; Area or Hectares. Names must be unique for exact matching. |
| Mobs | Mob Name, Paddock, Species, Number of Animals, DSE per Head | Name or Mob; Paddock Name or Location; Animal Type; Head, Head Count, Number or Count. Species must resolve to cattle or sheep. |
| Treatments | Mob, Product, Date, Head, Dose | Mob Name; Treatment or Product Name; Treatment Date; Dosage or Dose (ml). Dose must be millilitres per head. |
| Treatment evidence | Batch, WHP, ESI, Operator, Label Reference | Batch Number; WHP (days) or Withholding Period; ESI (days) or Export Slaughter Interval; User or Applied By. Missing evidence is imported as unknown and flagged. |
| Weights | Mob, Date, Average Weight (kg), Head | Weigh Date; Average Weight or Weight (kg). Head is sample count. |
| Animals | Mob, VID, EID | Visual ID or Tag; Electronic ID. Optional Date of Birth and Sex. Individual IDs supplement the mob head count. |
| Feeds | Mob, Date, Feed, Dry Matter (kg), Cost | Feed Name; kg DM. Optional Supplier Declaration. Do not substitute wet weight without conversion. |

WHP and ESI must be whole days, not text like '14 days'. Dates accept YYYY-MM-DD or Australian DD/MM/YYYY. Numbers are plain decimals without currency signs or thousands separators. Quoted commas, BOMs and line breaks are supported. Currency stays consistent across one farm. Set DSE per Head for each mob from the farm's chosen factors, or explicitly supply --dse-cattle and --dse-sheep. The importer does not infer livestock factors from breed.

## What carries across

The six supported files populate paddocks, opening mobs, treatment history, weight history, optional individual identifiers and feed records. Current mob head is the opening snapshot at --as-of, so old births, deaths and sales are not re-applied and double counted. Exact mob names connect the history. Every imported row keeps a content hash, source filename and row number.

## What needs a separate mapping

Historical movement reports, transactions, joining history, custom columns, drawings, photographs, attachments, live device readings, rainfall, crop records, user accounts and official service connections are not imported by this command. Retain those exports. Ask the agent or Enterprise DNA to add their mapping and tests before switching those jobs. Map exports themselves require [AgriWebb support](https://www.agriwebb.com/blog/5-trending-questions-for-our-support-team/).

## Reconcile before switching

Compare paddock area, mob head totals, sample sizes and the treatment row count against the source reports. Run reconciliation, withholding, sale-check and compliance. Read the original treatment evidence and enter a named history review for every mob. Missing intervals still block release. Keep NLIS and eNVD in their official channels. One command loads the supported record set; reaching a reviewed live farm depends on the quality and completeness of the exports.
