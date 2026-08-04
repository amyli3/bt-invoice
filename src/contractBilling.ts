import { getNextId } from './mockData';

/* ─────────────────────────────────────────────────────────────────────────
   Fixed-price billing source for "Auto fill".

   Open book bills what the job COST (bills, time clock, accounting costs) and
   so its auto fill reads from CostsModal's records. Fixed price bills what was
   CONTRACTED, so nothing about a cost record tells you what to invoice: the
   builder bills contract lines as the work is finished, at percent complete,
   plus approved change orders that haven't been billed yet.

   That makes the suggestion rule deterministic and explainable, which is the
   same bar the open-book recommendation is held to (US #283497): a line is
   suggested when the schedule says more of it is done than has been billed.
   The amount is the difference, never a guess:

       amount = contract value × (percent complete − percent already billed)

   No history model and no confidence score, because none is needed here. If
   the schedule is wrong the builder edits the percent, which is the same
   correction they'd make by hand.
   ───────────────────────────────────────────────────────────────────────── */

export interface ContractRow {
  id: string;
  /** Contract line, or the change order's title. */
  title: string;
  costCode: string;
  costType: string;
  /** Contracted amount for this line. Change orders use the approved amount. */
  contractValue: number;
  /** Percent of this line already invoiced on past invoices. */
  billedPct: number;
  /** Percent the schedule says is complete. */
  completePct: number;
  /** Why this line is suggested, in the builder's own terms. */
  reason: string;
  kind: 'contract' | 'changeOrder';
}

/* Mirrors the phases the estimate rows in AddFromAllModal use, so a builder
   comparing "Add from → Combined view" against Auto fill sees the same job. */
export const CONTRACT_ROWS: ContractRow[] = [
  {
    id: 'ct-found', title: 'Foundation pour', costCode: '02.30 - Concrete', costType: 'Subcontractor',
    contractValue: 15400, billedPct: 40, completePct: 100, kind: 'contract',
    reason: 'Foundation was marked complete on Nov 19',
  },
  {
    id: 'ct-framing', title: 'Framing labor', costCode: '03.10 - Framing', costType: 'Labor',
    contractValue: 8500, billedPct: 60, completePct: 85, kind: 'contract',
    reason: 'Framing is 85% complete on the schedule',
  },
  {
    id: 'ct-plumbing', title: 'Plumbing rough-in', costCode: '06.15 - Plumbing', costType: 'Subcontractor',
    contractValue: 4750, billedPct: 80, completePct: 100, kind: 'contract',
    reason: 'Plumbing rough-in passed inspection Nov 26',
  },
  {
    id: 'ct-co-2', title: 'CO-0002 · Engineered beam', costCode: '3100 - Framing', costType: 'Labor',
    contractValue: 10000, billedPct: 99, completePct: 100, kind: 'changeOrder',
    reason: 'Approved change order, 1% left unbilled',
  },
  {
    id: 'ct-co-1', title: 'CO-0001 · Stone veneer', costCode: '4100 - Stone Masonry', costType: 'Materials',
    contractValue: 13600, billedPct: 0, completePct: 100, kind: 'changeOrder',
    reason: 'Approved change order, complete and never billed',
  },
  /* Not suggested: the schedule has it starting next month, so there is nothing
     to bill. Kept in the data so the rule has something to exclude. */
  {
    id: 'ct-roofing', title: 'Roofing, architectural shingle', costCode: '07.10 - Roofing', costType: 'Subcontractor',
    contractValue: 9800, billedPct: 0, completePct: 0, kind: 'contract',
    reason: 'Not started on the schedule',
  },
  /* Not suggested: fully billed already. Guards against re-billing a line whose
     percent complete and percent billed have converged. */
  {
    id: 'ct-site', title: 'Site excavation', costCode: '02.20 - Sitework', costType: 'Subcontractor',
    contractValue: 6200, billedPct: 100, completePct: 100, kind: 'contract',
    reason: 'Already invoiced in full',
  },
];

/** Percent of the line that is complete but not yet billed. Never negative: a
    line billed ahead of the schedule is a credit question, not an auto fill. */
export const unbilledPct = (r: ContractRow) => Math.max(0, r.completePct - r.billedPct);
export const contractRowAmount = (r: ContractRow) => r.contractValue * unbilledPct(r) / 100;

/** What Auto fill proposes on a fixed-price job. Callers must treat an empty
    result as "hide the trigger" rather than offering an empty fill. */
export const contractAutoFillRows = () => CONTRACT_ROWS.filter(r => unbilledPct(r) > 0);
export const contractAutoFillTotal = () =>
  contractAutoFillRows().reduce((s, r) => s + contractRowAmount(r), 0);

/* One invoice line per suggested contract line, at its unbilled percent. The
   percent goes in the description because on a fixed-price invoice the client
   is owed that context: "Foundation pour" for $9,240 means nothing next to a
   $15,400 contract line without it. */
export const contractAutoFillLineItems = () =>
  contractAutoFillRows().map(r => ({
    id: getNextId(),
    description: `${r.title} (${unbilledPct(r)}% of contract)`,
    costCode: r.costCode,
    costType: r.costType === 'Materials' ? 'Material' : r.costType,
    unitCost: contractRowAmount(r),
    quantity: 1,
    unit: '--',
    markup: 0,
    // Traceability back to the contract line or change order the amount came
    // from, the same way cost lines point at their bill or time-clock record.
    relatedItem: r.kind === 'changeOrder'
      ? { type: 'changeOrder' as const, name: r.title, groupId: r.id }
      : { type: 'contract' as const, name: r.title, groupId: r.id },
  }));
