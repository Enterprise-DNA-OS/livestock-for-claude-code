# Australian livestock record checks

Sources checked 2026-09-27. Scope: sheep and beef mob records and preparation for LPA review. This command checks the evidence stored here. It is not legal advice, official clearance or a complete LPA audit. The farm's state rules, veterinary directions and current product labels govern actual work. Nothing submits to NLIS or eNVD.

## LPA-TREATMENT

ISC requires treatment records and appropriate medicine use. The checker flags absent batch, operator, label reference, WHP or ESI. The treatment command refuses expired stock, insufficient stock and unknown intervals. A missing interval stays unknown, including when ESI is not applicable: the reviewer must record an evidenced zero.

Source: [ISC animal treatments factsheet](https://www.integritysystems.com.au/globalassets/isc/pdf-files/lpa-documents/lpa-factsheets/safe-and-responsible-animal-treatments-factsheet-and-checklist.pdf).

Farm policy: the treatment day is day zero and clearance is the following day after all entered withholding days have elapsed. Both intervals apply to export slaughter plans; WHP applies to domestic slaughter plans. A partial-mob treatment conservatively holds the whole mob. The label, time of administration and destination market still need human review. These policies deliberately do not claim a universal legal interval. Demo products are fictional and their intervals must never guide treatment.

## LPA-HISTORY

A CSV snapshot cannot prove that every treatment came across. Imports and newly added mobs remain unverified until a named operator records evidence using verify-history. This local review policy implements evidence checking, not an extra statutory obligation. Verification does not clear unknown intervals on existing treatment records.

Source: [LPA Rules and Standards, treatment and dispatch elements](https://www.integritysystems.com.au/on-farm-assurance/lpa-rules--standards/).

## LPA-MOVEMENT

The checker flags local sales without destination PIC, NVD reference or NLIS confirmation. The CLI never calls these official services. A reference means someone recorded it here, not that its validity was checked externally. State, species and transaction rules differ, so there is no invented national reporting deadline in this build.

Source: [ISC record keeping and movement guidance](https://www.integritysystems.com.au/on-farm-assurance/templates/text-page2/?a=77636).

## LPA-FEED

Feed entries with no supplier declaration reference are flagged for review. This is a conservative farm evidence policy. Which declaration is required depends on the feed and transaction. It is not a blanket claim that every feed purchase legally requires the same document.

Source: [LPA Rules and Standards, stock foods and fodder element](https://www.integritysystems.com.au/on-farm-assurance/lpa-rules--standards/).

## LPA-PLAN

LPA requires a current documented biosecurity plan and property risk assessment. Missing dates and reviews over 365 days old are flagged. The annual threshold is this demo farm's review policy, not a universal statutory expiry.

Source: [ISC farm staff responsibilities](https://www.integritysystems.com.au/on-farm-assurance/lpa-rules--standards/), property risk and biosecurity elements.

## FARM-INVENTORY

Expired medicine with remaining stock is flagged. Actual storage, disposal, authorised use and operator qualifications remain the operator's responsibility.

Source: [ISC animal treatments factsheet](https://www.integritysystems.com.au/globalassets/isc/pdf-files/lpa-documents/lpa-factsheets/safe-and-responsible-animal-treatments-factsheet-and-checklist.pdf).

## Other farm policies

Attention uses 30 days for stale weighings, 14 days for pasture estimates and each paddock's chosen rest_days. Rest met says only that the entered rest period elapsed. It does not assess pasture quality, animal nutrition or carrying capacity. Recorded cash margin excludes livestock valuation, labour, overheads and missing entries. The CLI preserves records rather than applying automatic retention deletion.
