import type { ModalAllowance } from './components/AIAPayApp';

// Cost-code number → category name, so a bare code like "8010" can be shown
// with its title ("8010 - Lighting").
export const COST_CODE_NAMES: Record<string, string> = {
  '9040': 'Cabinets', '9045': 'Cabinet install', '9041': 'Cabinet handles',
  '8010': 'Lighting', '4010': 'Plumbing', '9050': 'Paint', '9060': 'Appliances',
  '9070': 'Tile', '6020': 'Electrical', '6025': 'Smart Home', '8020': 'Hardware',
  '2050': 'Sitework', '9035': 'Countertops', '9030': 'Kitchen Fixtures',
};

// Normalize a cost code to "NUM - Title". Leaves already-titled codes as-is.
export function costCodeLabel(cc: string | undefined): string {
  if (!cc) return cc || '';
  if (cc.includes(' - ')) return cc;
  const n = cc.trim();
  return COST_CODE_NAMES[n] ? `${n} - ${COST_CODE_NAMES[n]}` : cc;
}

export type InvoiceSelectionScenario = ModalAllowance & {
  scenarioNote?: string;
  // V3 model: allowance is never billed directly; only selections invoice.
  // Override the V2 hover text when V3 behavior differs meaningfully.
  scenarioNoteV3?: string;
  closeoutMode?: 'credit' | 'complete';
};

export const INVOICE_SELECTION_SCENARIOS: InvoiceSelectionScenario[] = [
  {
    id: 'ma-5',
    name: 'Plumbing Allowance',
    costCode: '4010 - Plumbing',
    budgetAmount: 4000,
    previouslyInvoiced: 0,
    scenarioNote: 'Allowance not yet invoiced. Selections came in over budget.',
    scenarioNoteV3: 'Selections came in over budget. Invoice the selections at full price — the allowance budget is exceeded but is a tracker only, never invoiced as a line.',
    selections: [
      { id: 'ms-12', name: 'Bathroom Faucet Set', costCode: '4010', costType: 'Material', originalPrice: 2000, approvedPrice: 2200, status: 'approved' },
      { id: 'ms-13', name: 'Shower Valve Kit', costCode: '4010', costType: 'Material', originalPrice: 2000, approvedPrice: 2500, status: 'approved' },
    ],
  },
  {
    id: 'ma-6',
    name: 'Lighting Allowance',
    costCode: '8010 - Lighting',
    budgetAmount: 1000,
    previouslyInvoiced: 0,
    scenarioNote: 'Allowance not yet invoiced. Selection came in under — unspent amount stays available.',
    scenarioNoteV3: 'Selection came in under budget. Only the selection invoices; unspent allowance budget stays on the budget side and is never invoiced.',
    selections: [
      { id: 'ms-14', name: 'Pendant light fixtures', costCode: '8010', costType: 'Material', originalPrice: 500, approvedPrice: 500, status: 'approved' },
    ],
  },
  {
    id: 'ma-6c',
    name: 'Lighting Allowance (marked complete)',
    costCode: '8010 - Lighting',
    budgetAmount: 1000,
    previouslyInvoiced: 0,
    closeoutMode: 'complete',
    scenarioNote: 'Allowance never invoiced, marked complete. Selection came in under — invoice just the selection; unspent budget closes out, no credit owed.',
    scenarioNoteV3: 'Marked complete, allowance never invoiced. Only the $700 selection invoices; the unused $300 closes out on the budget side (no credit, since nothing was pre-billed).',
    selections: [
      { id: 'ms-14c', name: 'Pendant light fixtures', costCode: '8010', costType: 'Material', originalPrice: 700, approvedPrice: 700, status: 'approved' },
    ],
  },
  {
    id: 'ma-8',
    name: 'Paint Allowance',
    costCode: '9050 - Paint',
    budgetAmount: 2000,
    previouslyInvoiced: 0,
    scenarioNote: 'Selection already invoiced, allowance has unspent budget. Allowance was never pre-invoiced — no credit owed on close-out.',
    scenarioNoteV3: 'The selection was already invoiced on a prior invoice (filtered out of the list). Nothing new to invoice. Unspent allowance budget stays on the budget side.',
    selections: [
      { id: 'ms-19', name: 'Interior wall paint', costCode: '9050', costType: 'Material', originalPrice: 1200, approvedPrice: 1200, status: 'invoiced' },
    ],
  },
  {
    id: 'ma-1',
    name: 'Kitchen Allowance',
    costCode: '9030 - Kitchen Fixtures',
    budgetAmount: 5000,
    previouslyInvoiced: 5000,
    scenarioNote: 'Allowance previously invoiced. Selections went over budget.',
    scenarioNoteV3: 'Allowance previously invoiced for $5,000 (same cost code as selections). Selections are absorbed by the credit; only the overage portion ($1,500) invoices. The stack on the invoice line preserves the reversal + selection breakdown.',
    selections: [
      { id: 'ms-1', name: 'Kohler Farmhouse Sink', costCode: '9030', costType: 'Material', originalPrice: 2000, approvedPrice: 2500, status: 'approved' },
      { id: 'ms-2', name: 'Delta Touchless Faucet', costCode: '9030', costType: 'Material', originalPrice: 1000, approvedPrice: 1500, status: 'approved' },
      { id: 'ms-4', name: 'GE Dishwasher', costCode: '9030', costType: 'Material', originalPrice: 2000, approvedPrice: 2500, status: 'approved' },
    ],
  },
  {
    id: 'ma-2',
    name: 'Flooring Allowance',
    costCode: '6010 - Flooring',
    budgetAmount: 8000,
    previouslyInvoiced: 8000,
    closeoutMode: 'credit',
    scenarioNote: 'Allowance previously invoiced ($8,000). Marked complete at $7,200 — client overpaid by $800.',
    scenarioNoteV3: 'Allowance previously invoiced for $8,000. Marked complete at $7,200 — client overpaid by $800. Surfaces in the "Credits owed" section so the credit can be applied to this invoice.',
    selections: [
      { id: 'ms-5', name: 'Engineered Hardwood — Living Room', costCode: '6010', costType: 'Material', originalPrice: 5000, approvedPrice: 4500, status: 'approved' },
      { id: 'ms-6', name: 'Luxury Vinyl Plank — Entryway', costCode: '6010', costType: 'Labor', originalPrice: 3000, approvedPrice: 2700, status: 'approved' },
    ],
  },
  {
    id: 'ma-7',
    name: 'Master Bath Cabinets Allowance',
    costCode: '9040 - Cabinets',
    budgetAmount: 24000,
    previouslyInvoiced: 24000,
    scenarioNote: 'Allowance + prior selections already invoiced. Only the new selection can be invoiced.',
    scenarioNoteV3: 'Allowance previously invoiced for $24,000, but $34,800 of selections have already been invoiced too — the credit is fully consumed. The new selection ($5,000 cabinet handles) invoices at full price; no reversal is needed.',
    selections: [
      { id: 'ms-16', name: 'Custom cabinetry', costCode: '9040', costType: 'Material', originalPrice: 20000, approvedPrice: 20000, status: 'invoiced' },
      { id: 'ms-17', name: 'Cabinet install', costCode: '9045', costType: 'Labor', originalPrice: 14800, approvedPrice: 14800, status: 'invoiced' },
      { id: 'ms-18', name: 'Cabinet handles (new)', costCode: '9041', costType: 'Material', originalPrice: 5000, approvedPrice: 5000, status: 'approved' },
    ],
  },
  {
    id: 'ma-12',
    name: 'Electrical Allowance',
    costCode: '6020 - Electrical',
    budgetAmount: 3000,
    previouslyInvoiced: 3000,
    scenarioNote: 'Pre-invoiced. Selections split across cost codes — 6020 reversal nets against the same-code selection; 6025 selection invoices on its own.',
    scenarioNoteV3: 'Allowance previously invoiced for $3,000. Same-code selections absorb the credit in a stacked line; for different-code selections, an explicit reversal line is emitted at the allowance\'s code so the budget stays correctly tracked.',
    selections: [
      { id: 'ms-25', name: 'Smart panel upgrade', costCode: '6025 - Smart Home', costType: 'Equipment', originalPrice: 2200, approvedPrice: 2500, status: 'approved' },
      { id: 'ms-26', name: 'Premium recessed lighting', costCode: '6020', costType: 'Material', originalPrice: 1500, approvedPrice: 1800, status: 'approved' },
    ],
  },
  {
    // Demo scenario for the "last allowance on the job" over-invoiced/refund
    // prompt. Billed upfront as a deposit ($3,200); the finalized selections
    // came in under that, so completing this allowance should surface a
    // refund owed to the client rather than the usual hold/reallocate choice.
    id: 'ma-14',
    name: 'Exterior Lighting Allowance',
    costCode: '8010 - Lighting',
    budgetAmount: 3200,
    previouslyInvoiced: 3200,
    scenarioNote: 'Last allowance on the job — all other selections are finalized. Previously invoiced $3,200 upfront; selections finalized at $2,450, so the client was overinvoiced by $750. Marking this allowance complete should prompt a refund.',
    scenarioNoteV3: 'Final allowance closing out the job\'s selections. The $3,200 deposit exceeds the $2,450 of approved selections — closing it out surfaces a $750 refund owed to the client instead of a hold/reallocate choice.',
    selections: [
      { id: 'ms-30', name: 'Exterior sconces', costCode: '8010', costType: 'Material', originalPrice: 1800, approvedPrice: 1450, status: 'approved' },
      { id: 'ms-31', name: 'Landscape path lighting', costCode: '8010', costType: 'Material', originalPrice: 1200, approvedPrice: 1000, status: 'approved' },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────────
   Deposit & true-up model (Selection 2 / V4)
   ---------------------------------------------------------------------------
   The CCH pattern from the SRI planning doc: the allowance is part of the
   contract price, so it's BILLED UPFRONT as a deposit. When the selection(s)
   drawing from it are finalized, the builder marks the allowance complete,
   which LOCKS the variance. The difference (over or under the deposit) then
   settles on THIS invoice — a charge if over, a credit if under. The
   allowance is never billed twice; only the variance moves.
   ───────────────────────────────────────────────────────────────────────── */
export type DepositSelection = {
  id: string;
  // The selection's title (the decision, e.g. "Kitchen Faucet").
  title: string;
  // The chosen line item under that selection (e.g. "Delta Touchless Faucet").
  name: string;
  costCode: string;
  costType: string;
  approvedPrice: number;
  // 'done'    → selection is finalized and counts toward the locked variance
  // 'pending' → still being chosen; blocks a clean full completion
  status: 'done' | 'pending';
  // This selection's amount was already billed on a PRIOR invoice (round-1).
  // It still counts toward the approved-selections total, but isn't re-billed.
  alreadyInvoiced?: boolean;
};

export type DepositTrueUpAllowance = {
  id: string;
  name: string;
  costCode: string;
  budgetAmount: number;     // contract allowance amount
  billedUpfront: number;    // deposit already invoiced (typically = budgetAmount; 0 = no deposit collected)
  // Total already invoiced against this allowance across ALL prior invoices
  // (deposit + any earlier true-ups). Defaults to billedUpfront when omitted.
  // When a builder invoiced the allowance, put some selections against it, then
  // adds another selection later, this is what "previously invoiced" reflects.
  invoicedToDate?: number;
  scenario: 'over' | 'under' | 'partial' | 'exact' | 'nodeposit' | 'addmore' | 'crosscode';
  scenarioNote: string;
  selections: DepositSelection[];
};

export const DEPOSIT_TRUEUP_ALLOWANCES: DepositTrueUpAllowance[] = [
  {
    id: 'dt-1',
    name: 'Cabinets Allowance',
    costCode: '9040 - Cabinets',
    budgetAmount: 5000,
    billedUpfront: 5000,
    scenario: 'over',
    scenarioNote: 'Allowance billed upfront ($5,000). Selections finalized at $6,200 — mark complete to lock the +$1,200 overage and charge it on this invoice.',
    selections: [
      { id: 'dt-1a', title: 'Cabinetry', name: 'Custom shaker cabinets', costCode: '9040', costType: 'Material', approvedPrice: 4400, status: 'done' },
      { id: 'dt-1b', title: 'Cabinet hardware', name: 'Soft-close hardware', costCode: '9040', costType: 'Material', approvedPrice: 1800, status: 'done' },
    ],
  },
  {
    id: 'dt-2',
    name: 'Lighting Allowance',
    costCode: '8010 - Lighting',
    budgetAmount: 3000,
    billedUpfront: 3000,
    scenario: 'under',
    scenarioNote: 'Allowance billed upfront ($3,000). Selections finalized at $2,400 — mark complete to lock the -$600 credit and apply it on this invoice.',
    selections: [
      { id: 'dt-2a', title: 'Pendant lighting', name: 'Pendant fixtures', costCode: '8010', costType: 'Material', approvedPrice: 1500, status: 'done' },
      { id: 'dt-2b', title: 'Recessed lighting', name: 'Recessed cans', costCode: '8010', costType: 'Material', approvedPrice: 900, status: 'done' },
    ],
  },
  {
    id: 'dt-3',
    name: 'Plumbing Allowance',
    costCode: '4010 - Plumbing',
    budgetAmount: 4000,
    billedUpfront: 4000,
    scenario: 'partial',
    scenarioNote: 'Allowance billed upfront ($4,000). Two selections are done ($1,800); the kitchen faucet is still being chosen. The variance can’t be fully locked until every selection is finalized.',
    selections: [
      { id: 'dt-3a', title: 'Shower valve', name: 'Shower valve set', costCode: '4010', costType: 'Material', approvedPrice: 1100, status: 'done' },
      { id: 'dt-3b', title: 'Bathroom faucet', name: 'Bathroom faucet set', costCode: '4010', costType: 'Material', approvedPrice: 700, status: 'done' },
      { id: 'dt-3c', title: 'Kitchen faucet', name: 'Kitchen faucet (in progress)', costCode: '4010', costType: 'Material', approvedPrice: 0, status: 'pending' },
    ],
  },
  {
    id: 'dt-4',
    name: 'Paint Allowance',
    costCode: '9050 - Paint',
    budgetAmount: 2000,
    billedUpfront: 2000,
    scenario: 'exact',
    scenarioNote: 'Allowance billed upfront ($2,000). Selection finalized at exactly $2,000 — mark complete and the variance nets to $0, so no line is added.',
    selections: [
      { id: 'dt-4a', title: 'Interior paint', name: 'Interior wall paint', costCode: '9050', costType: 'Material', approvedPrice: 2000, status: 'done' },
    ],
  },
  {
    id: 'dt-5',
    name: 'Appliances Allowance',
    costCode: '9060 - Appliances',
    budgetAmount: 0,
    billedUpfront: 0,
    scenario: 'nodeposit',
    scenarioNote: 'No deposit collected — nothing was billed upfront for this allowance. The finalized selections bill at full price as their own line, with no deposit reversal.',
    selections: [
      { id: 'dt-5a', title: 'Range & hood', name: 'Gas range & vent hood', costCode: '9060', costType: 'Material', approvedPrice: 3200, status: 'done' },
      { id: 'dt-5b', title: 'Refrigerator', name: 'French-door refrigerator', costCode: '9060', costType: 'Material', approvedPrice: 2800, status: 'done' },
    ],
  },
  {
    // "Add another selection later": allowance was invoiced ($5,000 deposit),
    // then two selections ($4,400 + $1,800 = $6,200) were reconciled on a prior
    // invoice — so $6,200 has been invoiced to date. Now a third selection
    // ($900) comes in. Approved selections total $7,100; invoiced-to-date
    // $6,200 → only the new $900 is billable now.
    id: 'dt-6',
    name: 'Tile Allowance',
    costCode: '9070 - Tile',
    budgetAmount: 5000,
    billedUpfront: 5000,
    invoicedToDate: 6200,
    scenario: 'addmore',
    scenarioNote: 'Allowance invoiced, then selections reconciled on a prior invoice. A new selection came in later — only the new amount is billable now.',
    selections: [
      { id: 'dt-6a', title: 'Floor tile', name: 'Floor tile — main bath', costCode: '9070', costType: 'Material', approvedPrice: 4400, status: 'done', alreadyInvoiced: true },
      { id: 'dt-6b', title: 'Accent wall tile', name: 'Accent wall tile', costCode: '9070', costType: 'Material', approvedPrice: 1800, status: 'done', alreadyInvoiced: true },
      { id: 'dt-6c', title: 'Shower niche tile', name: 'Shower niche tile (new)', costCode: '9070', costType: 'Material', approvedPrice: 900, status: 'done' },
    ],
  },
  {
    // Cross-cost-code reconciliation: the allowance was billed upfront at its
    // own cost code (6020 Electrical, $500), but the chosen selection lands on a
    // DIFFERENT cost code (6025 Smart Home, $400). The true-up can't collapse to
    // one net line — it reverses the allowance at 6020 (−$500) and books the
    // selection at 6025 (+$400), moving dollars between codes. Net is a −$100
    // credit, but split across two budget lines so each code stays accurate.
    id: 'dt-7',
    name: 'Fixtures Allowance',
    costCode: '6020 - Electrical',
    budgetAmount: 500,
    billedUpfront: 500,
    scenario: 'crosscode',
    scenarioNote: 'Allowance billed upfront at 6020 ($500). The chosen selection lands on a different cost code (6025) at $400 — the allowance is reversed at 6020 and the selection booked at 6025, netting a $100 credit across the two codes.',
    selections: [
      { id: 'dt-7a', title: 'Smart switches', name: 'Smart dimmer switches', costCode: '6025 - Smart Home', costType: 'Equipment', approvedPrice: 400, status: 'done' },
    ],
  },
  {
    // Cross-code with MULTIPLE selections spanning several different codes,
    // none matching the allowance's code. The allowance was billed upfront at
    // 9030 (Kitchen Fixtures, $8,000); the chosen selections land on 4010,
    // 8010, and 9035. The true-up reverses the allowance at 9030 and books each
    // selection at its own code — dollars move across four budget lines, netting
    // a $500 overage overall.
    id: 'dt-8',
    name: 'Kitchen Package Allowance',
    costCode: '9030 - Kitchen Fixtures',
    budgetAmount: 8000,
    billedUpfront: 8000,
    scenario: 'crosscode',
    scenarioNote: 'Allowance billed upfront at 9030 ($8,000). The selections land on three different cost codes (4010 Plumbing, 8010 Lighting, 9035 Countertops) — the allowance is reversed at 9030 and each selection booked at its own code, so all four budget lines stay accurate. Net is a $500 overage.',
    selections: [
      { id: 'dt-8a', title: 'Kitchen sink', name: 'Farmhouse apron sink', costCode: '4010 - Plumbing', costType: 'Material', approvedPrice: 2500, status: 'done' },
      { id: 'dt-8b', title: 'Island pendants', name: 'Brass pendant lights', costCode: '8010 - Lighting', costType: 'Material', approvedPrice: 1800, status: 'done' },
      { id: 'dt-8c', title: 'Countertops', name: 'Quartz countertop', costCode: '9035 - Countertops', costType: 'Material', approvedPrice: 4200, status: 'done' },
    ],
  },
];

export type StandaloneSelection = {
  id: string;
  name: string;        // the chosen product — the invoice line item
  title?: string;      // the parent selection/decision this was picked for
  costCode: string;
  costType: string;
  approvedPrice: number;
  scenarioNote?: string;
};

export const INVOICE_STANDALONE_SELECTIONS: StandaloneSelection[] = [
  {
    id: 'ss-1',
    name: 'Front door hardware',
    title: 'Front entry hardware',
    costCode: '8020 - Hardware',
    costType: 'Material',
    approvedPrice: 850,
    scenarioNote: 'No allowance backing — invoices the approved price directly.',
  },
  {
    id: 'ss-2',
    name: 'Custom mailbox',
    title: 'Mailbox',
    costCode: '2050 - Sitework',
    costType: 'Material',
    approvedPrice: 320,
  },
];

/* ─────────────────────────────────────────────────────────────────────────
   Standalone selections, grouped — a selection can have multiple approved
   line items under it (e.g. a "Flooring Tile" selection with 4 approved
   options), and they invoice together as ONE line, the same way an
   allowance's selections net into one line. This is the grouped/nested
   sibling of INVOICE_STANDALONE_SELECTIONS above (which stays flat for its
   existing consumers — invoice-2's wizard, the Selections grid).
   ───────────────────────────────────────────────────────────────────────── */
export type SelectionGroupOption = {
  id: string;
  name: string;        // the specific chosen product/line item
  costCode: string;
  costType: string;
  approvedPrice: number;
};
export type StandaloneSelectionGroup = {
  id: string;
  title: string;        // the selection/decision, e.g. "Flooring Tile"
  scenarioNote?: string;
  options: SelectionGroupOption[];
};

export const INVOICE_STANDALONE_SELECTION_GROUPS: StandaloneSelectionGroup[] = [
  {
    id: 'selg-1',
    title: 'Front entry hardware',
    scenarioNote: 'No allowance backing — invoices the approved price directly.',
    options: [
      { id: 'ss-1', name: 'Front door hardware', costCode: '8020 - Hardware', costType: 'Material', approvedPrice: 850 },
    ],
  },
  {
    id: 'selg-2',
    title: 'Mailbox',
    options: [
      { id: 'ss-2', name: 'Custom mailbox', costCode: '2050 - Sitework', costType: 'Material', approvedPrice: 320 },
    ],
  },
  {
    id: 'selg-3',
    title: 'Flooring Tile',
    scenarioNote: 'One selection, four approved line items across different cost codes — they still invoice together as a single line, not separately.',
    options: [
      { id: 'ss-3a', name: 'Porcelain Tile — Living Room', costCode: '9070 - Tile', costType: 'Material', approvedPrice: 2400 },
      { id: 'ss-3b', name: 'Mosaic Accent — Entryway', costCode: '9075 - Decorative Tile', costType: 'Material', approvedPrice: 650 },
      { id: 'ss-3c', name: 'Grout & Sealant', costCode: '9072 - Tile Supplies', costType: 'Material', approvedPrice: 180 },
      { id: 'ss-3d', name: 'Tile Installation Labor', costCode: '6030 - Flooring Labor', costType: 'Labor', approvedPrice: 3200 },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────────
   Standalone allowances — allowances with no selections chosen yet. There's
   no variance to reconcile, so they bill as a single flat line (the allowance
   amount) and render as a lightweight row, exactly like a standalone
   selection. The card/expand treatment is reserved for allowances that have
   linked selections (where there's a breakdown to drill into).
   ───────────────────────────────────────────────────────────────────────── */
export type StandaloneAllowance = {
  id: string;
  name: string;
  costCode: string;
  costType: string;
  amount: number;         // allowance amount to invoice
  scenarioNote?: string;
};

export const INVOICE_STANDALONE_ALLOWANCES: StandaloneAllowance[] = [
  {
    id: 'sa-1',
    name: 'Landscaping Allowance',
    costCode: '2050 - Sitework',
    costType: 'Allowance',
    amount: 6000,
    scenarioNote: 'Allowance with no selections chosen yet — invoice the allowance amount directly. The variance settles later, once selections come in and it’s marked complete.',
  },
  {
    id: 'sa-2',
    name: 'Countertops Allowance',
    costCode: '9035 - Countertops',
    costType: 'Allowance',
    amount: 4500,
    scenarioNote: 'Allowance with no selections chosen yet — invoice the allowance amount directly.',
  },
];

// Hypothetical estimate groupings, keyed by the source allowance/selection id.
// Many builders organize an estimate by room; the client preview's "By estimate"
// view uses this to show room parent rows over just the invoiced line items,
// mirroring how the estimate itself is grouped. Ids not listed fall under "Other".
export const ESTIMATE_GROUP_BY_ID: Record<string, string> = {
  'dt-1': 'Kitchen',           // Cabinets Allowance
  'dt-5': 'Kitchen',           // Appliances Allowance
  'dt-8': 'Kitchen',           // Kitchen Package Allowance
  'sa-2': 'Kitchen',           // Countertops Allowance
  'dt-2': 'Primary Bathroom',  // Lighting Allowance
  'dt-4': 'Primary Bathroom',  // Paint Allowance (reconciles on budget)
  'dt-6': 'Primary Bathroom',  // Tile Allowance
  'dt-7': 'Primary Bathroom',  // Fixtures Allowance
  'sa-1': 'Exterior',          // Landscaping Allowance
  'ss-1': 'Exterior',          // Front door hardware
  'ss-2': 'Exterior',          // Custom mailbox
};
