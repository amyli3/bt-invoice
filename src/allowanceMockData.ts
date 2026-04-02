import {
  Allowance,
  Selection,
  Deposit,
  AllowanceWithInvoicing,
} from './allowanceTypes';

// ─── Scenario: Kitchen Remodel ─────────────────────────────────────
// Allowance: $5,000 for kitchen fixtures
// Selections: Homeowner picked items totaling $6,200 (overage of $1,200)

export const kitchenAllowance: Allowance = {
  id: 'allow-1',
  name: 'Kitchen Fixtures Allowance',
  costCode: { code: '09.30', label: 'Kitchen Fixtures' },
  budgetAmount: 5000,
  status: 'selections_made',
  selectionIds: ['sel-1'],
};

export const kitchenSelections: Selection[] = [
  {
    id: 'sel-1',
    allowanceId: 'allow-1',
    name: 'Kitchen Fixtures',
    status: 'approved',
    options: [
      {
        id: 'opt-1',
        name: 'Kohler Farmhouse Sink',
        vendor: 'Kohler',
        costCode: { code: '09.30', label: 'Kitchen Fixtures' },
        costType: 'Material',
        unitCost: 1800,
        quantity: 1,
        unit: 'ea',
        markup: 20,
      },
      {
        id: 'opt-2',
        name: 'Delta Touchless Faucet',
        vendor: 'Delta',
        costCode: { code: '09.30', label: 'Kitchen Fixtures' },
        costType: 'Material',
        unitCost: 650,
        quantity: 1,
        unit: 'ea',
        markup: 20,
      },
      {
        id: 'opt-3',
        name: 'Plumbing Install Labor',
        vendor: 'In-house',
        costCode: { code: '09.31', label: 'Plumbing Labor' },
        costType: 'Labor',
        unitCost: 95,
        quantity: 16,
        unit: 'hr',
        markup: 50,
      },
      {
        id: 'opt-4',
        name: 'GE Dishwasher',
        vendor: 'GE Appliances',
        costCode: { code: '09.30', label: 'Kitchen Fixtures' },
        costType: 'Material',
        unitCost: 899,
        quantity: 1,
        unit: 'ea',
        markup: 20,
      },
    ],
  },
];

// ─── Scenario 2: Flooring (underage) ───────────────────────────────
// Allowance: $8,000 for flooring
// Selections: Homeowner picked items totaling $6,500 (underage of $1,500)

export const flooringAllowance: Allowance = {
  id: 'allow-2',
  name: 'Flooring Allowance',
  costCode: { code: '06.10', label: 'Flooring' },
  budgetAmount: 8000,
  status: 'selections_made',
  selectionIds: ['sel-2'],
};

export const flooringSelections: Selection[] = [
  {
    id: 'sel-2',
    allowanceId: 'allow-2',
    name: 'Main Floor Flooring',
    status: 'approved',
    options: [
      {
        id: 'opt-5',
        name: 'Engineered Hardwood — Living Room',
        vendor: 'Shaw Floors',
        costCode: { code: '06.10', label: 'Flooring' },
        costType: 'Material',
        unitCost: 4.50,
        quantity: 800,
        unit: 'sqft',
        markup: 25,
      },
      {
        id: 'opt-6',
        name: 'Floor Install Labor',
        vendor: 'In-house',
        costCode: { code: '06.11', label: 'Flooring Labor' },
        costType: 'Labor',
        unitCost: 75,
        quantity: 24,
        unit: 'hr',
        markup: 50,
      },
    ],
  },
];

// ─── Option 1 variant: Allowance that was already invoiced ─────────

export const kitchenAllowanceInvoiced: AllowanceWithInvoicing = {
  ...kitchenAllowance,
  amountInvoiced: 5000,
  invoiceIds: ['inv-001'],
};

// ─── Deposits (Option 2 escape hatch) ──────────────────────────────

export const sampleDeposits: Deposit[] = [
  {
    id: 'dep-1',
    description: 'Kitchen project deposit',
    amount: 3000,
    dateCollected: '2026-01-15',
    paymentMethod: 'Check',
    status: 'collected',
    appliedToInvoiceIds: [],
    remainingBalance: 3000,
  },
  {
    id: 'dep-2',
    description: 'Initial retainer',
    amount: 5000,
    dateCollected: '2026-01-02',
    paymentMethod: 'Bank Transfer',
    status: 'applied',
    appliedToInvoiceIds: ['inv-001'],
    remainingBalance: 2000,
  },
];

// ─── All allowances & selections for the demo ──────────────────────

export const allAllowances: Allowance[] = [kitchenAllowance, flooringAllowance];
export const allSelections: Selection[] = [...kitchenSelections, ...flooringSelections];
