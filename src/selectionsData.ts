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
    scenarioNote: 'Scenario 2 · Allowance not yet invoiced, selections go over → invoice selections only (allowance row shows --)',
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
    scenarioNote: 'Scenario 3 · Allowance not yet invoiced, selection comes in under → bill the actual selection only. Unspent amount stays on the allowance and can be applied to additional selections later.',
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
    scenarioNote: 'Scenario 6 · Allowance close-out, no credit — $1,200 selection already invoiced, $800 unspent. The allowance placeholder was never invoiced, so marking complete just closes it out (Remaining to invoice: $0). The client was only billed for actual work — there\'s nothing to refund. Compare with Scenario 4 (Flooring) where the placeholder was pre-billed and a real credit is owed.',
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
    scenarioNote: 'Scenario 1 · Allowance previously invoiced, selections go over → invoice the overage',
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
    scenarioNote: 'Scenario 4 · Allowance placeholder previously invoiced ($8,000 via Add from estimate), selections come in under at $7,200 → wizard auto-reverses the placeholder and bills the actuals, netting to a -$800 credit.',
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
    scenarioNote: 'Scenario 5 · Edge case — allowance + prior selections already invoiced; only the newly added selection is billable',
    selections: [
      { id: 'ms-16', name: 'Custom cabinetry', costCode: '9040', costType: 'Material', originalPrice: 20000, approvedPrice: 20000, status: 'invoiced' },
      { id: 'ms-17', name: 'Cabinet install', costCode: '9045', costType: 'Labor', originalPrice: 14800, approvedPrice: 14800, status: 'invoiced' },
      { id: 'ms-18', name: 'Cabinet handles (new)', costCode: '9041', costType: 'Material', originalPrice: 5000, approvedPrice: 5000, status: 'approved' },
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
    scenarioNote: 'Standalone selection · No allowance backing — bills the approved price directly.',
  },
  {
    id: 'ss-2',
    name: 'Custom mailbox',
    costCode: '2050 - Sitework',
    costType: 'Material',
    approvedPrice: 320,
  },
];
