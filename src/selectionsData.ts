import type { ModalAllowance } from './components/AIAPayApp';

export type InvoiceSelectionScenario = ModalAllowance & {
  scenarioNote?: string;
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
    scenarioNote: 'Selection already invoiced, allowance has unspent budget. Allowance was never pre-billed — no credit owed on close-out.',
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
    selections: [
      { id: 'ms-5', name: 'Engineered Hardwood — Living Room', costCode: '6010', costType: 'Material', originalPrice: 5000, approvedPrice: 4500, status: 'approved' },
      { id: 'ms-6', name: 'Luxury Vinyl Plank — Entryway', costCode: '6010', costType: 'Labor', originalPrice: 3000, approvedPrice: 2700, status: 'approved' },
    ],
  },
  {
    id: 'ma-9',
    name: 'Appliances Allowance',
    costCode: '9070 - Appliances',
    budgetAmount: 4000,
    previouslyInvoiced: 4000,
    closeoutMode: 'credit',
    scenarioNote: 'Allowance pre-invoiced. Selection bills at a different cost code — keep both rows so categories stay transparent.',
    selections: [
      { id: 'ms-21', name: 'Sub-Zero Built-in Refrigerator', costCode: '9075 - Built-in Appliances', costType: 'Material', originalPrice: 4000, approvedPrice: 2500, status: 'approved' },
    ],
  },
  {
    id: 'ma-7',
    name: 'Master Bath Cabinets Allowance',
    costCode: '9040 - Cabinets',
    budgetAmount: 24000,
    previouslyInvoiced: 24000,
    scenarioNote: 'Allowance + prior selections already invoiced. Only the new selection is billable.',
    selections: [
      { id: 'ms-16', name: 'Custom cabinetry', costCode: '9040', costType: 'Material', originalPrice: 20000, approvedPrice: 20000, status: 'invoiced' },
      { id: 'ms-17', name: 'Cabinet install', costCode: '9045', costType: 'Labor', originalPrice: 14800, approvedPrice: 14800, status: 'invoiced' },
      { id: 'ms-18', name: 'Cabinet handles (new)', costCode: '9041', costType: 'Material', originalPrice: 5000, approvedPrice: 5000, status: 'approved' },
    ],
  },
  {
    id: 'ma-10',
    name: 'Tile Allowance',
    costCode: '7020 - Tile',
    budgetAmount: 3000,
    previouslyInvoiced: 0,
    scenarioNote: 'Not pre-invoiced. Selections at different cost codes ran over budget — each code stays on its own invoice line.',
    selections: [
      { id: 'ms-22', name: 'Porcelain floor tile', costCode: '7020', costType: 'Material', originalPrice: 1800, approvedPrice: 2000, status: 'approved' },
      { id: 'ms-23', name: 'Marble accent border', costCode: '7025 - Decorative Tile', costType: 'Material', originalPrice: 1200, approvedPrice: 1500, status: 'approved' },
    ],
  },
  {
    id: 'ma-11',
    name: 'HVAC Allowance',
    costCode: '5010 - HVAC',
    budgetAmount: 6000,
    previouslyInvoiced: 0,
    scenarioNote: 'Not pre-invoiced. Selection came in under at a different cost code — remaining $2,000 stays in the allowance bucket.',
    selections: [
      { id: 'ms-24', name: 'Heat pump unit', costCode: '5015 - HVAC Equipment', costType: 'Equipment', originalPrice: 4200, approvedPrice: 4000, status: 'approved' },
    ],
  },
  {
    id: 'ma-12',
    name: 'Electrical Allowance',
    costCode: '6020 - Electrical',
    budgetAmount: 3000,
    previouslyInvoiced: 3000,
    scenarioNote: 'Pre-invoiced. Selections split across cost codes — 6020 reversal nets against the same-code selection; 6025 selection invoices on its own.',
    selections: [
      { id: 'ms-25', name: 'Smart panel upgrade', costCode: '6025 - Smart Home', costType: 'Equipment', originalPrice: 2200, approvedPrice: 2500, status: 'approved' },
      { id: 'ms-26', name: 'Premium recessed lighting', costCode: '6020', costType: 'Material', originalPrice: 1500, approvedPrice: 1800, status: 'approved' },
    ],
  },
  {
    id: 'ma-13',
    name: 'Trim & Millwork Allowance',
    costCode: '8030 - Trim',
    budgetAmount: 5000,
    previouslyInvoiced: 5000,
    scenarioNote: 'Pre-invoiced, not closed out. Selection at a different cost code — reversal and selection stay on separate invoice lines, netting to a credit.',
    selections: [
      { id: 'ms-27', name: 'Premium baseboards', costCode: '8035 - Specialty Millwork', costType: 'Material', originalPrice: 2000, approvedPrice: 2200, status: 'approved' },
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
    scenarioNote: 'No allowance backing — bills the approved price directly.',
  },
  {
    id: 'ss-2',
    name: 'Custom mailbox',
    costCode: '2050 - Sitework',
    costType: 'Material',
    approvedPrice: 320,
  },
];
