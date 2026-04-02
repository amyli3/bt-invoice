// ─── Shared Types (Both Options) ───────────────────────────────────

export interface CostCodeRef {
  code: string;       // e.g. "04.41"
  label: string;      // e.g. "Material"
}

export interface Allowance {
  id: string;
  name: string;                     // "Kitchen Fixtures Allowance"
  costCode: CostCodeRef;
  budgetAmount: number;             // What the builder budgeted
  status: 'open' | 'selections_made' | 'closed';
  selectionIds: string[];           // Linked selections
}

export interface SelectionOption {
  id: string;
  name: string;                     // "Kohler Farmhouse Sink"
  vendor: string;
  costCode: CostCodeRef;           // May differ from allowance cost code
  costType: string;                // Labor, Material, Equipment, etc.
  unitCost: number;
  quantity: number;
  unit: string;
  markup: number;                  // Percentage
}

export interface Selection {
  id: string;
  allowanceId: string;
  name: string;                    // "Kitchen Sink Selection"
  status: 'pending' | 'approved' | 'invoiced';
  options: SelectionOption[];      // The chosen items
}

// Computed helpers
export function selectionTotal(sel: Selection): number {
  return sel.options.reduce((sum, o) => sum + o.unitCost * o.quantity, 0);
}

export function selectionClientPrice(sel: Selection): number {
  return sel.options.reduce(
    (sum, o) => sum + o.unitCost * o.quantity * (1 + o.markup / 100),
    0
  );
}

export function allowanceVariance(allowance: Allowance, selections: Selection[]): number {
  const linked = selections.filter(s => s.allowanceId === allowance.id);
  const selectedTotal = linked.reduce((sum, s) => sum + selectionClientPrice(s), 0);
  return allowance.budgetAmount - selectedTotal; // positive = underage, negative = overage
}


// ─── Option 2: No Allowance Invoicing ──────────────────────────────
// Allowances are INFORMATIONAL ONLY. Selections are the invoiceable units.
// No additional types needed — the base types above are sufficient.
// Invoicing flow: approved Selection → converted to LineItem[] on invoice.

export function selectionToLineItems(sel: Selection): Array<{
  description: string;
  costCode: string;
  costType: string;
  unitCost: number;
  quantity: number;
  unit: string;
  markup: number;
  sourceSelectionId: string;
  sourceOptionId: string;
}> {
  return sel.options.map(opt => ({
    description: `${sel.name} — ${opt.name}`,
    costCode: `${opt.costCode.code} - ${opt.costCode.label}`,
    costType: opt.costType,
    unitCost: opt.unitCost,
    quantity: opt.quantity,
    unit: opt.unit,
    markup: opt.markup,
    sourceSelectionId: sel.id,
    sourceOptionId: opt.id,
  }));
}


// ─── Option 1: 100% Reconciliation ────────────────────────────────
// Allowances ARE invoiceable. When selections are approved,
// reconciliation creates negative line items to reverse allowance billing.

export interface AllowanceWithInvoicing extends Allowance {
  amountInvoiced: number;          // How much has been billed against allowance
  invoiceIds: string[];            // Which invoices carry allowance charges
}

export interface ReconciliationResult {
  selectionLineItems: Array<{
    description: string;
    costCode: string;
    costType: string;
    unitCost: number;
    quantity: number;
    unit: string;
    markup: number;
  }>;
  reversalLineItem: {
    description: string;
    costCode: string;
    costType: string;
    unitCost: number;              // Negative
    quantity: number;
    unit: string;
    markup: number;
  } | null;
  netTotal: number;
  requiresCreditMemo: boolean;     // True if net would go negative
}

export function reconcileAllowance(
  allowance: AllowanceWithInvoicing,
  selections: Selection[],
): ReconciliationResult {
  const linked = selections.filter(s => s.allowanceId === allowance.id);
  const selectionLines = linked.flatMap(sel => selectionToLineItems(sel));

  const selectionTotal = selectionLines.reduce(
    (sum, li) => sum + li.unitCost * li.quantity * (1 + li.markup / 100),
    0
  );

  const reversalAmount = allowance.amountInvoiced;
  const netTotal = selectionTotal - reversalAmount;

  const reversalLineItem = reversalAmount > 0
    ? {
        description: `Allowance reversal — ${allowance.name}`,
        costCode: `${allowance.costCode.code} - ${allowance.costCode.label}`,
        costType: 'Other',
        unitCost: -reversalAmount,
        quantity: 1,
        unit: '--',
        markup: 0,
      }
    : null;

  return {
    selectionLineItems: selectionLines,
    reversalLineItem,
    netTotal,
    requiresCreditMemo: netTotal < 0,
  };
}


// ─── Deposit Escape Hatch (Option 2 companion) ────────────────────
// Deposits are payments, not revenue. They don't hit cost codes.
// They live in the payment system and get applied against future invoices.

export interface Deposit {
  id: string;
  description: string;             // "Kitchen deposit" or "Initial deposit"
  amount: number;
  dateCollected: string;
  paymentMethod: string;
  status: 'collected' | 'applied' | 'refunded';
  appliedToInvoiceIds: string[];   // Which invoices this deposit offsets
  remainingBalance: number;        // amount - sum(applied)
}

export function applyDepositToInvoice(
  deposit: Deposit,
  invoiceTotal: number,
): { amountApplied: number; remainingDeposit: number; remainingInvoice: number } {
  const available = deposit.remainingBalance;
  const amountApplied = Math.min(available, invoiceTotal);
  return {
    amountApplied,
    remainingDeposit: available - amountApplied,
    remainingInvoice: invoiceTotal - amountApplied,
  };
}
