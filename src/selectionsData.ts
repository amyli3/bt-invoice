import type { ModalAllowance } from './components/AIAPayApp';

export type InvoiceSelectionScenario = ModalAllowance & {
  scenarioNote?: string;
  // V3 model: allowance is never billed directly; only selections invoice.
  // Override the V2 hover text when V3 behavior differs meaningfully.
  scenarioNoteV3?: string;
  closeoutMode?: 'credit';
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
  name: string;
  costCode: string;
  costType: string;
  approvedPrice: number;
  // 'done'    → selection is finalized and counts toward the locked variance
  // 'pending' → still being chosen; blocks a clean full completion
  status: 'done' | 'pending';
};

export type DepositTrueUpAllowance = {
  id: string;
  name: string;
  costCode: string;
  budgetAmount: number;     // contract allowance amount
  billedUpfront: number;    // deposit already invoiced (typically = budgetAmount; 0 = no deposit collected)
  scenario: 'over' | 'under' | 'partial' | 'exact' | 'nodeposit';
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
      { id: 'dt-1a', name: 'Custom shaker cabinets', costCode: '9040', costType: 'Material', approvedPrice: 4400, status: 'done' },
      { id: 'dt-1b', name: 'Soft-close hardware', costCode: '9040', costType: 'Material', approvedPrice: 1800, status: 'done' },
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
      { id: 'dt-2a', name: 'Pendant fixtures', costCode: '8010', costType: 'Material', approvedPrice: 1500, status: 'done' },
      { id: 'dt-2b', name: 'Recessed cans', costCode: '8010', costType: 'Material', approvedPrice: 900, status: 'done' },
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
      { id: 'dt-3a', name: 'Shower valve set', costCode: '4010', costType: 'Material', approvedPrice: 1100, status: 'done' },
      { id: 'dt-3b', name: 'Bathroom faucet set', costCode: '4010', costType: 'Material', approvedPrice: 700, status: 'done' },
      { id: 'dt-3c', name: 'Kitchen faucet (in progress)', costCode: '4010', costType: 'Material', approvedPrice: 0, status: 'pending' },
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
      { id: 'dt-4a', name: 'Interior wall paint', costCode: '9050', costType: 'Material', approvedPrice: 2000, status: 'done' },
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
      { id: 'dt-5a', name: 'Range & hood', costCode: '9060', costType: 'Material', approvedPrice: 3200, status: 'done' },
      { id: 'dt-5b', name: 'Refrigerator', costCode: '9060', costType: 'Material', approvedPrice: 2800, status: 'done' },
    ],
  },
];

export type StandaloneSelection = {
  id: string;
  name: string;
  costCode: string;
  costType: string;
  approvedPrice: number;
  scenarioNote?: string;
};

export const INVOICE_STANDALONE_SELECTIONS: StandaloneSelection[] = [
  {
    id: 'ss-1',
    name: 'Front door hardware',
    costCode: '8020 - Hardware',
    costType: 'Material',
    approvedPrice: 850,
    scenarioNote: 'No allowance backing — invoices the approved price directly.',
  },
  {
    id: 'ss-2',
    name: 'Custom mailbox',
    costCode: '2050 - Sitework',
    costType: 'Material',
    approvedPrice: 320,
  },
];
