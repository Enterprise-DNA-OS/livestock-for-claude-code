<h1 align="center">Livestock for Claude Code</h1>

<p align="center">
  <strong>The open-source livestock and grazing records system that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your AgriWebb data brought across.<br/><a href="https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=agriwebb">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/agriwebb?utm_source=github&utm_medium=readme&utm_campaign=agriwebb">How it works</a></td>
  </tr>
</table>



<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

Livestock for Claude Code is a farm office record system for Australian sheep and cattle mobs. It holds paddocks, opening stock, stock changes, treatments, grazing moves, weight samples, feed costs, joining groups, slaughter plans and work due. The included farm is fictional.

AgriWebb's AU calculator gives A$1,030 a year for Essentials, A$1,442 for Compliance and A$1,854 for Performance for 300 cattle and 2,000 sheep, excluding GST, checked 27 September 2026. This is a modest subscription target, not evidence of a five-figure customer bill. Source: [AgriWebb pricing](https://www.agriwebb.com/pricing/). See [the calculation evidence](docs/research.md).

The free version has no licence fee. Agent subscriptions, hosting and your own time remain separate. It is not a complete substitute for AgriWebb's phone, mapping or connected equipment features. [The scope is explicit](docs/why-no-front-end.md).

## Quick start

```bash
git clone https://github.com/Enterprise-DNA-OS/livestock-for-claude-code.git
cd livestock-for-claude-code
npm install
npm run demo
npm test
npm run view
npm run docs
```

Node 20 or newer. No database server, account or credentials needed. Demo creates Wattle Creek with 3 mobs, 4 paddocks, an active treatment hold, overdue work, missing evidence and a muster discrepancy. Run `/attention` first, then `/grazing` and `/sale-check`. It works with Claude Code, Codex, OpenCode or Cursor through the same command files and AGENTS.md.

For a real farm use a new DATA_DIR or a dedicated DATABASE_URL, run npm run migrate, add the property and import its exports. Environment files are read automatically. Set the machine and database timezone to the farm's timezone before use. Never load demo seed data into a production database.

## The commands

| Command | Weekly job |
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

The CLI ships 43 commands including the detailed writes. See [docs/commands.md](docs/commands.md). Human-readable output is the default. Every command accepts --json. Unique partial names or IDs work, and ambiguous matches stop with a list.

## Rules that protect the stock book

- A slaughter plan cannot release with a treatment hold, unknown interval, unverified history, insufficient head or missing destination and NVD references.
- Release only happens on the planned date, reduces head once and records who reviewed it. Official declarations and transfers stay in their own systems.
- Product usage deducts stock in the same transaction as the treatment. Expired or insufficient stock stops the write.
- Moves carry the whole mob within one farm and refuse a paddock under a grazing hold.
- A stocktake records what was observed. It does not silently rewrite head.
- Imports validate the full batch and roll it back on any failed row. Identical imported rows can be replayed without duplicates.

Unknown is different from clear. A treatment of part of a mob holds the whole mob. Clearance dates conservatively allow complete calendar days after the treatment day. Real labels and veterinary directions always need review. Read [docs/compliance.md](docs/compliance.md) for sources and which checks are farm policies.

## Ten questions to ask across the farm records

These are implemented questions, with the command that answers each today. AgriWebb has its own reporting and filters; no claim is made that it cannot answer any particular question.

1. Which slaughter plans are blocked by treatment dates, missing history or paperwork? `sale-check`.
2. Which mobs have unknown holding intervals even after someone reviewed their history? `withholding`.
3. Where does the last muster disagree with the recorded head count? `attention`.
4. Which empty paddocks have met their chosen rest period and have a recent feed estimate? `grazing`.
5. Which mob has a measured daily gain, and how old is the evidence? `performance`.
6. Which sale records still lack a recorded NLIS confirmation? `compliance`.
7. What remains after recorded purchases, treatment and feed costs are taken off recorded sales? `costs`.
8. Which joining groups have an overdue pregnancy scan? `breeding`.
9. Which feed entries lack a supplier declaration reference? `compliance`.
10. Which medicine stock has expired while overdue farm work is still open? `attention`.

## Documents and views in your brand

Edit brand.json for the business name, logo path and colours. npm run docs renders treatment registers, slaughter preparation worksheets and property audit packs as HTML in docs-out/. These are working records, not official NVDs or certifications. Draft commands write only to drafts/.

npm run view renders the weekly decisions, grazing round and performance/cost views. Open the HTML files in views/ or print them to PDF. /new-view adds another read-only view. No web server or editing interface is included.

## Your first hour: ten things to ask for

1. Put our farm, PIC and state in the property book.
2. Replace the demo paddocks with our real names and areas.
3. Use our preferred stock classes and DSE factors.
4. Import our mob snapshot and full treatment history, then show the gaps.
5. Put our logo and colours on the audit pack.
6. Add a water inspection due date to each paddock.
7. Change the pasture estimate review interval to match our grazing round.
8. Add an individual sale workflow before we sell tagged animals here.
9. Add a report combining sale blockers with our buyer's specifications.
10. Draft Monday's priorities from the muster, grazing and slaughter plan.

/customise writes a new migration, applies it, updates the commands and tests the change. No agent-specific fork is needed.

## Instead of AgriWebb

[The switch guide](docs/replace-agriwebb.md) covers vendor export steps, accepted headers, missing fields and the limits of the free importer. Bring the supported mob, paddock, treatment, weight, individual and feed records across in one command after a dry run. Keep the originals and reconcile totals before switching real work.

## Tests and architecture

npm test uses a disposable embedded database. It exercises all 43 commands and asserts stock reconciliation, blocked sale release, treatment inventory rollback, holding date boundaries, CSV dry-run and replay, malformed-row rollback, name ambiguity, generated documents and branded views. Tests were run on Linux. They use portable Node APIs and direct child-process argument arrays for Windows, but this run did not execute on Windows or a hosted PostgreSQL server.

The domain has 15 registers and an import provenance register. scripts/lib/db.mjs selects PGlite or PostgreSQL through the same interface. Plain SQL migrations require no extension. Export a consistent JSON snapshot with `npm run livestock -- export`. Use ordinary PostgreSQL backup tools for a production database and test restoration before relying on it.

## Want it installed and run for you?

Three doors: do it yourself, ask Enterprise DNA to customise it, or have us install and operate it through **Omni by Enterprise DNA**. Custom work includes your fields, farm rules, data migration, a web or phone experience and a different stack where it fits. Setup fee, then a retainer for operation.

[Book a call with Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_medium=github&utm_campaign=agriwebb).

## License

MIT. Copyright 2026 Enterprise DNA. AgriWebb is the incumbent named for comparison. This project is independent and is not affiliated with AgriWebb.
