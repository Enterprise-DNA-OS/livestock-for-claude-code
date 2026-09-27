# AgriWebb research

Checked 2026-09-27. Public sources only. No customer records, production data or vendor credentials were used.

## AU pricing calculation

[AgriWebb pricing](https://www.agriwebb.com/pricing/) redirects from /au/pricing/. Its embedded globalData.pricing_data.AU contains the calculator brackets. The shipped calculator script calculates cattle times 8 plus sheep times 1.5, picks the first unitCap at least that total, then divides the stored price by 100.

For 300 cattle and 2,000 sheep the calculation is 5,400 DSE and the applicable cap is 5,600. Annual raw price values are Essentials 103000, Compliance 144200 and Performance 185400. Displayed annual AUD figures are 1,030, 1,442 and 1,854, excluding GST. Monthly raw values are 10300, 14420 and 18540. Annual billing is a distinct price, not twelve monthly payments.

[Subscription FAQ](https://help.agriwebb.com/en/articles/8319220-pricing-and-subscription-faqs) confirms livestock-based pricing, annual and monthly billing, and the livestock factors. Corporate pricing is quoted separately. Nothing here estimates a corporate invoice or claims a verified customer saving.

## Workflow and exports

[Reporting Guide](https://help.agriwebb.com/en/articles/3153281-reporting-guide): reports download with the selected columns, filters and grouping. Use record rows with complete history for migration.

[Treatment Report](https://help.agriwebb.com/en/articles/3767839-livestock-treatment-report): treatment records include batch, application rate, withholding and costs.

[Export Slaughter Interval](https://help.agriwebb.com/en/articles/3222418-export-slaughter-interval-esi): AgriWebb warns about an active ESI but allows saving the sale. This free version's slaughter-release command instead refuses active holds. That is a deliberately stricter local policy, not a statement that all livestock transactions during an interval are unlawful.

[Web navigation](https://help.agriwebb.com/en/articles/1928117-navigating-the-web-app): the vendor includes mapping, calendar, livestock, movements, inventory, tasks and reports. The free build covers mob records in the farm office. It does not claim phone or integration parity.

The importer was tested against synthetic fixtures matching its published header contract. No actual customer's export was available. Validate the account's real headers and units in a dry run before migration.
