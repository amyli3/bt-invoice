import { useState, useCallback } from 'react';

// ─── Formatting ─────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

// ─── Types ──────────────────────────────────────────────────────────
interface CostRecord {
  id: string;
  costCode: string;
  vendor: string;
  type: 'bill' | 'timeclock';
  amount: number;
  date: string;
  description: string;
  details?: { label: string; value: string }[];
}

interface InvoiceLine {
  id: string;
  costCode: string;
  description: string;
  estimateBudget: number;
  previousInvoice: number;
  thisInvoice: number;
  storedMaterials: number;
  costType?: 'bill' | 'timeclock' | 'changeorder';
  isOverBudget?: boolean;
  isFromCO?: boolean;
  isNegativeBalance?: boolean;
  coNumber?: string;
}

interface CostGroup {
  id: string;
  label: string;
  lines: InvoiceLine[];
}

// ─── Workflow Steps ─────────────────────────────────────────────────
type Step =
  | 'invoice-1'
  | 'add-from-cost'
  | 'invoice-1-over-budget'
  | 'create-change-order'
  | 'invoice-1-with-co'
  | 'invoice-co'
  | 'invoice-1-final'
  // unhappy path
  | 'unhappy-invoice-1-ignore'
  | 'unhappy-invoice-2'
  | 'unhappy-add-from-cost-2'
  | 'unhappy-invoice-2-over-budget'
  | 'unhappy-create-co-2'
  | 'unhappy-invoice-2-with-co'
  | 'unhappy-invoice-co-2'
  | 'unhappy-invoice-2-final';

const HAPPY_STEPS: Step[] = [
  'invoice-1',
  'add-from-cost',
  'invoice-1-over-budget',
  'create-change-order',
  'invoice-1-with-co',
  'invoice-co',
  'invoice-1-final',
];

const UNHAPPY_STEPS: Step[] = [
  'unhappy-invoice-1-ignore',
  'unhappy-invoice-2',
  'unhappy-add-from-cost-2',
  'unhappy-invoice-2-over-budget',
  'unhappy-create-co-2',
  'unhappy-invoice-2-with-co',
  'unhappy-invoice-co-2',
  'unhappy-invoice-2-final',
];

const STEP_LABELS: Record<Step, string> = {
  'invoice-1': '1. Progress Invoice #1',
  'add-from-cost': '2. Add from Cost',
  'invoice-1-over-budget': '3. Over Budgeted Alert',
  'create-change-order': '4. Create Change Order',
  'invoice-1-with-co': '5. Invoice with CO',
  'invoice-co': '6. Invoice CO Modal',
  'invoice-1-final': '7. Final — No Overages',
  'unhappy-invoice-1-ignore': '1. Invoice #1 (Ignore Overage)',
  'unhappy-invoice-2': '2. Create Invoice #2',
  'unhappy-add-from-cost-2': '3. Add from Cost',
  'unhappy-invoice-2-over-budget': '4. Over Budgeted Alert',
  'unhappy-create-co-2': '5. Create Change Order',
  'unhappy-invoice-2-with-co': '6. Invoice #2 with CO',
  'unhappy-invoice-co-2': '7. Invoice CO Modal',
  'unhappy-invoice-2-final': '8. Final — Negative Balance',
};

// ─── Mock Cost Records ──────────────────────────────────────────────
const COST_RECORDS: CostRecord[] = [
  {
    id: 'cr-1', costCode: '5004 - Drywall', vendor: 'ABC Drywall Co.',
    type: 'bill', amount: 4200, date: '2026-02-15',
    description: 'Drywall materials and installation',
    details: [
      { label: 'PO #', value: 'PO-2024-0045' },
      { label: 'Bill #', value: 'INV-8891' },
      { label: 'Date received', value: '02/15/2026' },
      { label: 'Due date', value: '03/15/2026' },
      { label: 'Status', value: 'Approved' },
      { label: 'Cost code', value: '5004 - Drywall' },
      { label: 'Amount', value: '$4,200.00' },
      { label: 'Remaining', value: '$4,200.00' },
    ],
  },
  {
    id: 'cr-2', costCode: '4200 - Masonry flatwork', vendor: 'Masonry Co.',
    type: 'bill', amount: 5000, date: '2026-02-20',
    description: 'Masonry flatwork — Phase 2',
    details: [
      { label: 'PO #', value: 'PO-2024-0051' },
      { label: 'Bill #', value: 'INV-9102' },
      { label: 'Date received', value: '02/20/2026' },
      { label: 'Due date', value: '03/20/2026' },
      { label: 'Status', value: 'Approved' },
      { label: 'Cost code', value: '4200 - Masonry flatwork' },
      { label: 'Amount', value: '$5,000.00' },
      { label: 'Remaining', value: '$5,000.00' },
    ],
  },
  {
    id: 'cr-3', costCode: '4100 - Stone masonry', vendor: 'Stone Works LLC',
    type: 'bill', amount: 12000, date: '2026-03-01',
    description: 'Stone masonry — exterior walls',
    details: [
      { label: 'PO #', value: 'PO-2024-0060' },
      { label: 'Bill #', value: 'INV-9203' },
      { label: 'Date received', value: '03/01/2026' },
      { label: 'Due date', value: '03/31/2026' },
      { label: 'Status', value: 'Approved' },
      { label: 'Cost code', value: '4100 - Stone masonry' },
      { label: 'Amount', value: '$12,000.00' },
      { label: 'Remaining', value: '$12,000.00' },
    ],
  },
  {
    id: 'cr-4', costCode: '5004 - Drywall', vendor: 'Buildertrend Flat Rate',
    type: 'timeclock', amount: 927.50, date: '2026-03-05',
    description: 'Labor — Drywall installation',
    details: [
      { label: 'Employee', value: 'Mike Johnson' },
      { label: 'Hours', value: '12.5 hrs' },
      { label: 'Rate', value: '$74.20/hr' },
      { label: 'Date', value: '03/05/2026' },
      { label: 'Status', value: 'Approved' },
      { label: 'Cost code', value: '5004 - Drywall' },
      { label: 'Total', value: '$927.50' },
      { label: 'Remaining', value: '$927.50' },
    ],
  },
  {
    id: 'cr-5', costCode: '4200 - Masonry flatwork', vendor: 'Buildertrend Flat Rate',
    type: 'timeclock', amount: 1850, date: '2026-03-06',
    description: 'Labor — Masonry work',
    details: [
      { label: 'Employee', value: 'Dan Smith' },
      { label: 'Hours', value: '25 hrs' },
      { label: 'Rate', value: '$74.00/hr' },
      { label: 'Date', value: '03/06/2026' },
      { label: 'Status', value: 'Approved' },
      { label: 'Cost code', value: '4200 - Masonry flatwork' },
      { label: 'Total', value: '$1,850.00' },
      { label: 'Remaining', value: '$1,850.00' },
    ],
  },
];

// ─── Estimate Line Items (base) ─────────────────────────────────────
function baseGroups(): CostGroup[] {
  return [
    {
      id: 'g1', label: '4000 - 4999 Masonry',
      lines: [
        { id: 'l1', costCode: '4100', description: 'Stone masonry', estimateBudget: 80000, previousInvoice: 40000, thisInvoice: 0, storedMaterials: 0 },
        { id: 'l2', costCode: '4200', description: 'Masonry flatwork', estimateBudget: 20000, previousInvoice: 15000, thisInvoice: 0, storedMaterials: 0 },
      ],
    },
    {
      id: 'g2', label: '5000 - 5999 Finishings',
      lines: [
        { id: 'l3', costCode: '5004', description: 'Drywall', estimateBudget: 10000, previousInvoice: 0, thisInvoice: 0, storedMaterials: 0 },
      ],
    },
    {
      id: 'g3', label: '7000 - 7999 Electrical',
      lines: [
        { id: 'l4', costCode: '7100', description: 'Electrical rough-in', estimateBudget: 18000, previousInvoice: 12000, thisInvoice: 0, storedMaterials: 0 },
      ],
    },
    {
      id: 'g4', label: '8000 - 8999 Plumbing',
      lines: [
        { id: 'l5', costCode: '8100', description: 'Plumbing rough-in', estimateBudget: 16000, previousInvoice: 10000, thisInvoice: 0, storedMaterials: 0 },
      ],
    },
  ];
}

// After adding costs from bills/timeclock
function groupsWithCosts(): CostGroup[] {
  return [
    {
      id: 'g1', label: '4000 - 4999 Masonry',
      lines: [
        { id: 'l1', costCode: '4100', description: 'Stone masonry', estimateBudget: 80000, previousInvoice: 40000, thisInvoice: 12000, storedMaterials: 0, costType: 'bill' },
        { id: 'l2', costCode: '4200', description: 'Masonry flatwork', estimateBudget: 20000, previousInvoice: 15000, thisInvoice: 6850, storedMaterials: 0, costType: 'bill', isOverBudget: true },
      ],
    },
    {
      id: 'g2', label: '5000 - 5999 Finishings',
      lines: [
        { id: 'l3', costCode: '5004', description: 'Drywall', estimateBudget: 10000, previousInvoice: 0, thisInvoice: 5127.50, storedMaterials: 0, costType: 'bill' },
      ],
    },
    {
      id: 'g3', label: '7000 - 7999 Electrical',
      lines: [
        { id: 'l4', costCode: '7100', description: 'Electrical rough-in', estimateBudget: 18000, previousInvoice: 12000, thisInvoice: 0, storedMaterials: 0 },
      ],
    },
    {
      id: 'g4', label: '8000 - 8999 Plumbing',
      lines: [
        { id: 'l5', costCode: '8100', description: 'Plumbing rough-in', estimateBudget: 16000, previousInvoice: 10000, thisInvoice: 0, storedMaterials: 0 },
      ],
    },
  ];
}

// After CO approved — adds CO line
function groupsWithCO(): CostGroup[] {
  const g = groupsWithCosts();
  // Fix the overbudget line
  g[0].lines[1] = { ...g[0].lines[1], thisInvoice: 5000, isOverBudget: false };
  // Add CO group
  g.push({
    id: 'g-co', label: 'Change Orders',
    lines: [
      { id: 'l-co1', costCode: 'CO-001', description: 'Masonry flatwork overage', estimateBudget: 1850, previousInvoice: 0, thisInvoice: 0, storedMaterials: 0, isFromCO: true, coNumber: 'CO-001', costType: 'changeorder' },
    ],
  });
  return g;
}

// After invoicing CO
function groupsFinal(): CostGroup[] {
  const g = groupsWithCO();
  // Invoice the CO line
  const coGroup = g.find(gg => gg.id === 'g-co')!;
  coGroup.lines[0] = { ...coGroup.lines[0], thisInvoice: 1850 };
  return g;
}

// Unhappy path: invoice 2 with negative balance
function groupsUnhappyInv2WithCO(): CostGroup[] {
  return [
    {
      id: 'g1', label: '4000 - 4999 Masonry',
      lines: [
        { id: 'l1', costCode: '4100', description: 'Stone masonry', estimateBudget: 80000, previousInvoice: 52000, thisInvoice: 0, storedMaterials: 0 },
        { id: 'l2', costCode: '4200', description: 'Masonry flatwork', estimateBudget: 20000, previousInvoice: 20000, thisInvoice: -1850, storedMaterials: 0, isNegativeBalance: true },
      ],
    },
    {
      id: 'g2', label: '5000 - 5999 Finishings',
      lines: [
        { id: 'l3', costCode: '5004', description: 'Drywall', estimateBudget: 10000, previousInvoice: 5127.50, thisInvoice: 0, storedMaterials: 0 },
      ],
    },
    {
      id: 'g3', label: '7000 - 7999 Electrical',
      lines: [
        { id: 'l4', costCode: '7100', description: 'Electrical rough-in', estimateBudget: 18000, previousInvoice: 12000, thisInvoice: 0, storedMaterials: 0 },
      ],
    },
    {
      id: 'g4', label: '8000 - 8999 Plumbing',
      lines: [
        { id: 'l5', costCode: '8100', description: 'Plumbing rough-in', estimateBudget: 16000, previousInvoice: 10000, thisInvoice: 0, storedMaterials: 0 },
      ],
    },
    {
      id: 'g-co', label: 'Change Orders',
      lines: [
        { id: 'l-co1', costCode: 'CO-001', description: 'Masonry flatwork overage', estimateBudget: 1850, previousInvoice: 0, thisInvoice: 0, storedMaterials: 0, isFromCO: true, coNumber: 'CO-001', costType: 'changeorder' },
      ],
    },
  ];
}

function groupsUnhappyFinal(): CostGroup[] {
  const g = groupsUnhappyInv2WithCO();
  const coGroup = g.find(gg => gg.id === 'g-co')!;
  coGroup.lines[0] = { ...coGroup.lines[0], thisInvoice: 1850 };
  // The negative balance on masonry flatwork balances the CO
  return g;
}

// ─── Icons ──────────────────────────────────────────────────────────
function BillIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="#64748b" strokeWidth="1.2" />
      <path d="M5 5h6M5 8h6M5 11h3" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function TimeClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#64748b" strokeWidth="1.2" />
      <path d="M8 4.5V8l2.5 1.5" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ChangeOrderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="#64748b" strokeWidth="1.2" />
      <path d="M5.5 8h5M8 5.5v5" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>
      <path d="M4 6l4 4 4-4" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 1.5L1 16h16L9 1.5z" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
      <path d="M9 7v3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="13" r="0.75" fill="white" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5l3.5 3.5L13 4" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M5 5l8 8M13 5l-8 8" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Shared Styles ──────────────────────────────────────────────────
const S = {
  modal: {
    background: 'white',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    border: '1px solid #e2e8f0',
    maxWidth: 1200,
    margin: '24px auto',
    overflow: 'hidden',
  } as React.CSSProperties,
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #e2e8f0',
    background: '#fafbfc',
  } as React.CSSProperties,
  modalBody: {
    padding: '24px',
  } as React.CSSProperties,
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    gap: 8,
  } as React.CSSProperties,
  btnPrimary: {
    background: '#0065db',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  btnSecondary: {
    background: 'white',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  btnWarning: {
    background: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: '#64748b',
    marginBottom: 4,
    display: 'block',
  } as React.CSSProperties,
  input: {
    fontSize: 13,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '7px 10px',
    width: '100%',
    fontFamily: 'inherit',
    color: '#1e293b',
    background: 'white',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  headerCell: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
    padding: '8px 12px',
    borderBottom: '2px solid #e2e8f0',
    background: '#f8fafc',
    textAlign: 'right' as const,
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  cell: {
    padding: '10px 12px',
    fontSize: 13,
    borderBottom: '1px solid #f1f5f9',
    textAlign: 'right' as const,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  badge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 10,
    display: 'inline-block',
    letterSpacing: '0.02em',
  } as React.CSSProperties,
};

// ─── Sub-components ─────────────────────────────────────────────────

function CostTypeIcon({ type }: { type?: string }) {
  if (type === 'bill') return <BillIcon />;
  if (type === 'timeclock') return <TimeClockIcon />;
  if (type === 'changeorder') return <ChangeOrderIcon />;
  return null;
}

function InvoiceFormFields({ invoiceNum }: { invoiceNum: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
      <div>
        <label style={S.label}>Invoice name</label>
        <input style={S.input} value={`Progress Invoice #${invoiceNum}`} readOnly />
      </div>
      <div>
        <label style={S.label}>Invoice ID</label>
        <input style={S.input} value={`PI-2026-00${invoiceNum}`} readOnly />
      </div>
      <div>
        <label style={S.label}>Billing period from</label>
        <input style={S.input} type="date" defaultValue="2026-03-01" />
      </div>
      <div>
        <label style={S.label}>Billing period to</label>
        <input style={S.input} type="date" defaultValue="2026-03-31" />
      </div>
      <div>
        <label style={S.label}>Payment terms</label>
        <select style={S.input}>
          <option>Net 30</option>
          <option>Net 15</option>
          <option>Due on receipt</option>
        </select>
      </div>
    </div>
  );
}

function InvoiceLineItemsTable({
  groups,
  expanded,
  onToggle,
}: {
  groups: CostGroup[];
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const grandTotalBudget = groups.reduce((s, g) => s + g.lines.reduce((ss, l) => ss + l.estimateBudget, 0), 0);
  const grandTotalPrev = groups.reduce((s, g) => s + g.lines.reduce((ss, l) => ss + l.previousInvoice, 0), 0);
  const grandTotalThis = groups.reduce((s, g) => s + g.lines.reduce((ss, l) => ss + l.thisInvoice, 0), 0);
  const grandTotalStored = groups.reduce((s, g) => s + g.lines.reduce((ss, l) => ss + l.storedMaterials, 0), 0);
  const grandTotalCompleted = grandTotalPrev + grandTotalThis + grandTotalStored;
  const grandPctComplete = grandTotalBudget > 0 ? (grandTotalCompleted / grandTotalBudget) * 100 : 0;
  const grandBalance = grandTotalBudget - grandTotalCompleted;

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ ...S.headerCell, textAlign: 'left', minWidth: 220 }}>Description</th>
            <th style={{ ...S.headerCell, width: 50, textAlign: 'center' }}>Type</th>
            <th style={{ ...S.headerCell, width: 110 }}>Budget</th>
            <th style={{ ...S.headerCell, width: 110 }}>Previous invoice</th>
            <th style={{ ...S.headerCell, width: 110 }}>This invoice</th>
            <th style={{ ...S.headerCell, width: 100 }}>Stored materials</th>
            <th style={{ ...S.headerCell, width: 110 }}>Completed</th>
            <th style={{ ...S.headerCell, width: 80 }}>% Complete</th>
            <th style={{ ...S.headerCell, width: 110 }}>Balance to finish</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(group => {
            const isOpen = expanded[group.id] !== false;
            const gBudget = group.lines.reduce((s, l) => s + l.estimateBudget, 0);
            const gPrev = group.lines.reduce((s, l) => s + l.previousInvoice, 0);
            const gThis = group.lines.reduce((s, l) => s + l.thisInvoice, 0);
            const gStored = group.lines.reduce((s, l) => s + l.storedMaterials, 0);
            const gCompleted = gPrev + gThis + gStored;
            const gPct = gBudget > 0 ? (gCompleted / gBudget) * 100 : 0;
            const gBalance = gBudget - gCompleted;

            return (
              <GroupSection
                key={group.id}
                group={group}
                isOpen={isOpen}
                onToggle={() => onToggle(group.id)}
                gBudget={gBudget}
                gPrev={gPrev}
                gThis={gThis}
                gStored={gStored}
                gCompleted={gCompleted}
                gPct={gPct}
                gBalance={gBalance}
              />
            );
          })}
          {/* Grand total */}
          <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
            <td style={{ ...S.cell, textAlign: 'left', borderBottom: 'none' }}>Grand Total</td>
            <td style={{ ...S.cell, borderBottom: 'none' }} />
            <td style={{ ...S.cell, borderBottom: 'none' }}>${fmt(grandTotalBudget)}</td>
            <td style={{ ...S.cell, borderBottom: 'none' }}>${fmt(grandTotalPrev)}</td>
            <td style={{ ...S.cell, borderBottom: 'none', color: grandTotalThis < 0 ? '#dc2626' : undefined }}>{grandTotalThis < 0 ? `-$${fmt(Math.abs(grandTotalThis))}` : `$${fmt(grandTotalThis)}`}</td>
            <td style={{ ...S.cell, borderBottom: 'none' }}>${fmt(grandTotalStored)}</td>
            <td style={{ ...S.cell, borderBottom: 'none' }}>${fmt(grandTotalCompleted)}</td>
            <td style={{ ...S.cell, borderBottom: 'none' }}>{fmtPct(grandPctComplete)}</td>
            <td style={{ ...S.cell, borderBottom: 'none', color: grandBalance < 0 ? '#dc2626' : undefined }}>{grandBalance < 0 ? `-$${fmt(Math.abs(grandBalance))}` : `$${fmt(grandBalance)}`}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function GroupSection({
  group, isOpen, onToggle,
  gBudget, gPrev, gThis, gStored, gCompleted, gPct, gBalance,
}: {
  group: CostGroup; isOpen: boolean; onToggle: () => void;
  gBudget: number; gPrev: number; gThis: number; gStored: number; gCompleted: number; gPct: number; gBalance: number;
}) {
  return (
    <>
      <tr
        style={{ background: '#f8fafc', cursor: 'pointer' }}
        onClick={onToggle}
      >
        <td style={{ ...S.cell, textAlign: 'left', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ChevronDown open={isOpen} />
          {group.label}
          {group.id === 'g-co' && (
            <span style={{ ...S.badge, background: '#dbeafe', color: '#1d4ed8', marginLeft: 6 }}>CO</span>
          )}
        </td>
        <td style={S.cell} />
        <td style={{ ...S.cell, fontWeight: 600 }}>${fmt(gBudget)}</td>
        <td style={{ ...S.cell, fontWeight: 600 }}>${fmt(gPrev)}</td>
        <td style={{ ...S.cell, fontWeight: 600, color: gThis < 0 ? '#dc2626' : undefined }}>{gThis < 0 ? `-$${fmt(Math.abs(gThis))}` : `$${fmt(gThis)}`}</td>
        <td style={{ ...S.cell, fontWeight: 600 }}>${fmt(gStored)}</td>
        <td style={{ ...S.cell, fontWeight: 600 }}>${fmt(gCompleted)}</td>
        <td style={{ ...S.cell, fontWeight: 600 }}>{fmtPct(gPct)}</td>
        <td style={{ ...S.cell, fontWeight: 600, color: gBalance < 0 ? '#dc2626' : undefined }}>{gBalance < 0 ? `-$${fmt(Math.abs(gBalance))}` : `$${fmt(gBalance)}`}</td>
      </tr>
      {isOpen && group.lines.map(line => {
        const completed = line.previousInvoice + line.thisInvoice + line.storedMaterials;
        const pct = line.estimateBudget > 0 ? (completed / line.estimateBudget) * 100 : 0;
        const balance = line.estimateBudget - completed;
        const isOver = line.isOverBudget || completed > line.estimateBudget;
        const rowBg = line.isNegativeBalance ? '#fef2f2' : line.isFromCO ? '#eff6ff' : isOver ? '#fffbeb' : 'white';

        return (
          <tr key={line.id} style={{ background: rowBg }}>
            <td style={{ ...S.cell, textAlign: 'left', paddingLeft: 40, display: 'flex', alignItems: 'center', gap: 6 }}>
              {line.description}
              {line.coNumber && <span style={{ ...S.badge, background: '#dbeafe', color: '#1d4ed8' }}>{line.coNumber}</span>}
              {isOver && !line.isNegativeBalance && <span style={{ ...S.badge, background: '#fef3c7', color: '#92400e' }}>Over budget</span>}
              {line.isNegativeBalance && <span style={{ ...S.badge, background: '#fee2e2', color: '#991b1b' }}>Negative balance</span>}
            </td>
            <td style={{ ...S.cell, textAlign: 'center' }}><CostTypeIcon type={line.costType} /></td>
            <td style={S.cell}>${fmt(line.estimateBudget)}</td>
            <td style={S.cell}>${fmt(line.previousInvoice)}</td>
            <td style={{ ...S.cell, color: line.thisInvoice < 0 ? '#dc2626' : line.thisInvoice > 0 ? '#0065db' : undefined, fontWeight: line.thisInvoice !== 0 ? 600 : 400 }}>
              {line.thisInvoice < 0 ? `-$${fmt(Math.abs(line.thisInvoice))}` : `$${fmt(line.thisInvoice)}`}
            </td>
            <td style={S.cell}>${fmt(line.storedMaterials)}</td>
            <td style={S.cell}>${fmt(completed)}</td>
            <td style={{ ...S.cell, color: pct > 100 ? '#dc2626' : undefined }}>{fmtPct(pct)}</td>
            <td style={{ ...S.cell, color: balance < 0 ? '#dc2626' : undefined }}>{balance < 0 ? `-$${fmt(Math.abs(balance))}` : `$${fmt(balance)}`}</td>
          </tr>
        );
      })}
    </>
  );
}

// ─── Alert Banner ───────────────────────────────────────────────────
function OverBudgetAlert({ onCreateCO }: { onCreateCO: () => void }) {
  return (
    <div style={{
      background: '#fffbeb',
      border: '1px solid #f59e0b',
      borderRadius: 8,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    }}>
      <AlertIcon />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
          Over budgeted line items detected
        </div>
        <div style={{ fontSize: 12, color: '#a16207', marginTop: 2 }}>
          Masonry flatwork is $1,850.00 over the estimate budget. Create a change order to capture the overage before submitting.
        </div>
      </div>
      <button style={S.btnWarning} onClick={onCreateCO}>Create Change Order</button>
    </div>
  );
}

// ─── Add from Cost Modal ────────────────────────────────────────────
function AddFromCostModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (selected: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['cr-1']));
  const [typeFilter, setTypeFilter] = useState<'all' | 'bill' | 'timeclock'>('all');
  const [showAlreadyInvoiced, setShowAlreadyInvoiced] = useState(false);

  const filtered = COST_RECORDS.filter(r => typeFilter === 'all' || r.type === typeFilter);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(r => r.id)));
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{ ...S.modal, margin: 0, width: 900, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={S.modalHeader}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Add from cost</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <CloseIcon />
          </button>
        </div>

        {/* Filters */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={S.label}>Cost code</label>
            <select style={{ ...S.input, width: 180 }}>
              <option>All cost codes</option>
              <option>4100 - Stone masonry</option>
              <option>4200 - Masonry flatwork</option>
              <option>5004 - Drywall</option>
            </select>
          </div>
          <div>
            <label style={S.label}>Date range</label>
            <input style={{ ...S.input, width: 150 }} type="date" defaultValue="2026-02-01" />
          </div>
          <div>
            <label style={S.label}>Cost type</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'bill', 'timeclock'] as const).map(t => (
                <button
                  key={t}
                  style={{
                    ...S.btnSecondary,
                    padding: '6px 12px',
                    fontSize: 12,
                    background: typeFilter === t ? '#eff6ff' : 'white',
                    borderColor: typeFilter === t ? '#0065db' : '#d1d5db',
                    color: typeFilter === t ? '#0065db' : '#374151',
                  }}
                  onClick={() => setTypeFilter(t)}
                >
                  {t === 'all' ? 'All' : t === 'bill' ? 'Bills' : 'Time Clock'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 18 }}>
            <input
              type="checkbox"
              id="show-invoiced"
              checked={showAlreadyInvoiced}
              onChange={() => setShowAlreadyInvoiced(!showAlreadyInvoiced)}
              style={{ accentColor: '#0065db' }}
            />
            <label htmlFor="show-invoiced" style={{ fontSize: 12, color: '#64748b' }}>Include already invoiced</label>
          </div>
        </div>

        {/* Cost records list */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
          {/* Select all header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
            fontSize: 12, fontWeight: 600, color: '#64748b',
          }}>
            <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={selectAll} style={{ accentColor: '#0065db' }} />
            Select all ({filtered.length} records)
          </div>

          {filtered.map(record => {
            const isExpanded = expandedItems.has(record.id);
            const isSelected = selected.has(record.id);

            return (
              <div key={record.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                {/* Record row */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 24px',
                  background: isSelected ? '#f0f7ff' : 'white',
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(record.id)}
                    style={{ accentColor: '#0065db' }}
                  />
                  <button
                    onClick={() => toggleExpand(record.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <ChevronDown open={isExpanded} />
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{record.description}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{record.vendor}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ ...S.badge, background: '#f1f5f9', color: '#475569' }}>{record.costCode}</span>
                    <span style={{ ...S.badge, background: '#f1f5f9', color: '#475569' }}>{record.date}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', minWidth: 80, textAlign: 'right' }}>
                    ${fmt(record.amount)}
                  </div>
                  <div style={{ width: 20, display: 'flex', justifyContent: 'center' }}>
                    {record.type === 'bill' ? <BillIcon /> : <TimeClockIcon />}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && record.details && (
                  <div style={{ padding: '8px 24px 16px 64px', background: '#fafbfc' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px 24px' }}>
                      {record.details.map((d, i) => (
                        <div key={i}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.label}</div>
                          <div style={{ fontSize: 12, color: '#1e293b', marginTop: 2 }}>{d.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={S.modalFooter}>
          <div style={{ flex: 1, fontSize: 12, color: '#64748b' }}>
            {selected.size} record{selected.size !== 1 ? 's' : ''} selected
            {selected.size > 0 && ` — Total: $${fmt(COST_RECORDS.filter(r => selected.has(r.id)).reduce((s, r) => s + r.amount, 0))}`}
          </div>
          <button style={S.btnSecondary} onClick={onClose}>Cancel</button>
          <button
            style={{ ...S.btnPrimary, opacity: selected.size === 0 ? 0.5 : 1 }}
            onClick={() => onAdd(Array.from(selected))}
            disabled={selected.size === 0}
          >
            Add to Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Change Order Screen ─────────────────────────────────────
function CreateChangeOrderScreen({ onDone }: { onDone: () => void }) {
  return (
    <div style={S.modal}>
      <div style={S.modalHeader}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Create Change Order</div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} onClick={onDone}>
          <CloseIcon />
        </button>
      </div>
      <div style={S.modalBody}>
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
          padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#1e40af',
        }}>
          Creating a change order to capture the overage amount on line items that exceed the estimate budget.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={S.label}>Change order name</label>
            <input style={S.input} value="Masonry flatwork overage" readOnly />
          </div>
          <div>
            <label style={S.label}>CO number</label>
            <input style={S.input} value="CO-001" readOnly />
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Overage Line Items</div>

        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...S.headerCell, textAlign: 'left' }}>Cost Code</th>
                <th style={{ ...S.headerCell, textAlign: 'left' }}>Description</th>
                <th style={S.headerCell}>Budget</th>
                <th style={S.headerCell}>Total Costs</th>
                <th style={S.headerCell}>Overage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...S.cell, textAlign: 'left' }}>4200</td>
                <td style={{ ...S.cell, textAlign: 'left' }}>Masonry flatwork</td>
                <td style={S.cell}>$20,000.00</td>
                <td style={S.cell}>$21,850.00</td>
                <td style={{ ...S.cell, color: '#dc2626', fontWeight: 600 }}>$1,850.00</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', fontWeight: 600 }}>
                <td colSpan={4} style={{ ...S.cell, textAlign: 'left' }}>Total overage</td>
                <td style={{ ...S.cell, color: '#dc2626' }}>$1,850.00</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={S.label}>Description / notes</label>
          <textarea
            style={{ ...S.input, height: 80, resize: 'vertical' }}
            defaultValue="Masonry flatwork costs exceeded the original estimate by $1,850.00 due to additional materials and labor required for Phase 2."
          />
        </div>
      </div>
      <div style={S.modalFooter}>
        <button style={S.btnSecondary}>Cancel</button>
        <button style={S.btnPrimary} onClick={onDone}>Create &amp; Approve CO</button>
      </div>
    </div>
  );
}

// ─── Invoice CO Modal ───────────────────────────────────────────────
function InvoiceCOModal({ onClose, onInvoice }: { onClose: () => void; onInvoice: () => void }) {
  const [selectedCO, setSelectedCO] = useState(true);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{ ...S.modal, margin: 0, width: 800 }}>
        <div style={S.modalHeader}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Invoice Change Order</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <CloseIcon />
          </button>
        </div>
        <div style={S.modalBody}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Select change orders to invoice</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Add approved change orders to the current progress invoice.</div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ ...S.headerCell, textAlign: 'center', width: 40 }}>
                    <input type="checkbox" checked={selectedCO} onChange={() => setSelectedCO(!selectedCO)} style={{ accentColor: '#0065db' }} />
                  </th>
                  <th style={{ ...S.headerCell, textAlign: 'left' }}>CO #</th>
                  <th style={{ ...S.headerCell, textAlign: 'left' }}>Description</th>
                  <th style={S.headerCell}>Status</th>
                  <th style={S.headerCell}>Amount</th>
                  <th style={S.headerCell}>This invoice</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: selectedCO ? '#f0f7ff' : 'white' }}>
                  <td style={{ ...S.cell, textAlign: 'center' }}>
                    <input type="checkbox" checked={selectedCO} onChange={() => setSelectedCO(!selectedCO)} style={{ accentColor: '#0065db' }} />
                  </td>
                  <td style={{ ...S.cell, textAlign: 'left', fontWeight: 600 }}>CO-001</td>
                  <td style={{ ...S.cell, textAlign: 'left' }}>Masonry flatwork overage</td>
                  <td style={{ ...S.cell, textAlign: 'center' }}>
                    <span style={{ ...S.badge, background: '#dcfce7', color: '#15803d' }}>Approved</span>
                  </td>
                  <td style={S.cell}>$1,850.00</td>
                  <td style={S.cell}>
                    <input
                      type="text"
                      defaultValue="$1,850.00"
                      style={{ ...S.input, width: 100, textAlign: 'right', fontWeight: 600, padding: '4px 8px' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, fontSize: 14, fontWeight: 600 }}>
            Invoice subtotal: <span style={{ color: '#0065db', marginLeft: 8 }}>${fmt(selectedCO ? 1850 : 0)}</span>
          </div>
        </div>
        <div style={S.modalFooter}>
          <button style={S.btnSecondary} onClick={onClose}>Cancel</button>
          <button style={{ ...S.btnPrimary, opacity: selectedCO ? 1 : 0.5 }} onClick={onInvoice} disabled={!selectedCO}>
            Add to Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Progress Invoice Screen ────────────────────────────────────────
function ProgressInvoiceScreen({
  invoiceNum,
  groups,
  expanded,
  onToggle,
  showOverBudgetAlert,
  showSuccessBanner,
  onAddFromCost,
  onCreateCO,
  onAddFromCO,
  onSave,
  footer,
}: {
  invoiceNum: number;
  groups: CostGroup[];
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  showOverBudgetAlert?: boolean;
  showSuccessBanner?: boolean;
  onAddFromCost?: () => void;
  onCreateCO?: () => void;
  onAddFromCO?: () => void;
  onSave?: () => void;
  footer?: React.ReactNode;
}) {
  return (
    <div style={S.modal}>
      {/* Header */}
      <div style={S.modalHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Johnson Residence</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Progress Invoice</div>
          </div>
          <span style={{ ...S.badge, background: '#dbeafe', color: '#1d4ed8', fontSize: 12, padding: '3px 10px' }}>
            #{invoiceNum}
          </span>
          <span style={{ ...S.badge, background: '#fef3c7', color: '#92400e', fontSize: 11, padding: '3px 10px' }}>
            Unreleased
          </span>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <CloseIcon />
        </button>
      </div>

      <div style={S.modalBody}>
        {/* Success banner */}
        {showSuccessBanner && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8,
            padding: '12px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <CheckIcon />
            <div style={{ fontSize: 13, color: '#166534' }}>
              <strong>Change order invoiced successfully.</strong> All line items are now within budget.
            </div>
          </div>
        )}

        {/* Over budget alert */}
        {showOverBudgetAlert && onCreateCO && <OverBudgetAlert onCreateCO={onCreateCO} />}

        {/* Form fields */}
        <InvoiceFormFields invoiceNum={invoiceNum} />

        {/* Section header with Add from button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Continuation Sheet</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {onAddFromCost && (
              <button style={S.btnSecondary} onClick={onAddFromCost}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2v10M2 7h10" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Add from costs
                </span>
              </button>
            )}
            {onAddFromCO && (
              <button style={{ ...S.btnSecondary, borderColor: '#0065db', color: '#0065db' }} onClick={onAddFromCO}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ChangeOrderIcon />
                  Add from change order
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Line items table */}
        <InvoiceLineItemsTable groups={groups} expanded={expanded} onToggle={onToggle} />

        {/* Bottom sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
          <div>
            <label style={S.label}>Internal Notes</label>
            <textarea style={{ ...S.input, height: 60, resize: 'vertical' }} placeholder="Notes visible only to your team..." />
            <label style={{ ...S.label, marginTop: 12 }}>Invoice Description</label>
            <textarea style={{ ...S.input, height: 60, resize: 'vertical' }} placeholder="Description visible to client..." />
          </div>
          <div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Notifications</div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {['Email', 'Text', 'Push'].map(t => (
                  <button key={t} style={{ ...S.btnSecondary, padding: '4px 12px', fontSize: 11 }}>{t}</button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Notifications will be sent when invoice is released.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ ...S.modalFooter, justifyContent: 'space-between' }}>
        <button style={S.btnSecondary}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="3" cy="8" r="1.2" fill="#64748b" />
            <circle cx="8" cy="8" r="1.2" fill="#64748b" />
            <circle cx="13" cy="8" r="1.2" fill="#64748b" />
          </svg>
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {footer}
          <button style={S.btnSecondary}>Cancel</button>
          <button style={S.btnSecondary}>Export</button>
          <button style={S.btnPrimary} onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Workflow Component ────────────────────────────────────────
export default function OpenbookFlow() {
  const [step, setStep] = useState<Step>('invoice-1');
  const [path, setPath] = useState<'happy' | 'unhappy'>('happy');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showAddFromCost, setShowAddFromCost] = useState(false);
  const [showInvoiceCO, setShowInvoiceCO] = useState(false);

  const toggleGroup = useCallback((id: string) => {
    setExpanded(prev => ({ ...prev, [id]: prev[id] === false ? true : !prev[id] !== false ? false : true }));
  }, []);

  const steps = path === 'happy' ? HAPPY_STEPS : UNHAPPY_STEPS;
  const currentIndex = steps.indexOf(step);

  const goNext = () => {
    if (currentIndex < steps.length - 1) setStep(steps[currentIndex + 1]);
  };

  const switchPath = (p: 'happy' | 'unhappy') => {
    setPath(p);
    setStep(p === 'happy' ? HAPPY_STEPS[0] : UNHAPPY_STEPS[0]);
  };

  // ─── Step navigation bar ────────────────────────────────────────
  const renderStepNav = () => (
    <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Path toggle */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Path:</span>
        <button
          style={{
            ...S.btnSecondary,
            padding: '5px 14px',
            fontSize: 12,
            background: path === 'happy' ? '#dcfce7' : 'white',
            borderColor: path === 'happy' ? '#15803d' : '#d1d5db',
            color: path === 'happy' ? '#15803d' : '#374151',
          }}
          onClick={() => switchPath('happy')}
        >
          Happy Path
        </button>
        <button
          style={{
            ...S.btnSecondary,
            padding: '5px 14px',
            fontSize: 12,
            background: path === 'unhappy' ? '#fee2e2' : 'white',
            borderColor: path === 'unhappy' ? '#dc2626' : '#d1d5db',
            color: path === 'unhappy' ? '#dc2626' : '#374151',
          }}
          onClick={() => switchPath('unhappy')}
        >
          Unhappy Path
        </button>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {steps.map((s, i) => (
          <button
            key={s}
            style={{
              padding: '6px 12px',
              fontSize: 11,
              fontWeight: step === s ? 700 : 500,
              border: '1px solid',
              borderColor: step === s ? '#0065db' : i < currentIndex ? '#86efac' : '#d1d5db',
              borderRadius: 6,
              background: step === s ? '#eff6ff' : i < currentIndex ? '#f0fdf4' : 'white',
              color: step === s ? '#0065db' : i < currentIndex ? '#15803d' : '#64748b',
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
            onClick={() => setStep(s)}
          >
            {i < currentIndex && <span style={{ marginRight: 4 }}>✓</span>}
            {STEP_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Description */}
      <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
        {path === 'happy' ? (
          <span><strong>Happy path:</strong> User creates progress invoice → sees overage → creates change order → adds approved CO → invoice balanced.</span>
        ) : (
          <span><strong>Unhappy path:</strong> User ignores overage on invoice #1 → submits → creates invoice #2 → notices overage → creates CO → negative "this invoice" amount balances the change order.</span>
        )}
      </div>
    </div>
  );

  // ─── Render current step ────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // ── Happy Path ──
      case 'invoice-1':
        return (
          <>
            <ProgressInvoiceScreen
              invoiceNum={1}
              groups={baseGroups()}
              expanded={expanded}
              onToggle={toggleGroup}
              onAddFromCost={() => setShowAddFromCost(true)}
              onSave={goNext}
            />
            {showAddFromCost && (
              <AddFromCostModal
                onClose={() => setShowAddFromCost(false)}
                onAdd={() => {
                  setShowAddFromCost(false);
                  goNext();
                }}
              />
            )}
          </>
        );

      case 'add-from-cost':
        return (
          <AddFromCostModal
            onClose={() => setStep('invoice-1')}
            onAdd={() => goNext()}
          />
        );

      case 'invoice-1-over-budget':
        return (
          <ProgressInvoiceScreen
            invoiceNum={1}
            groups={groupsWithCosts()}
            expanded={expanded}
            onToggle={toggleGroup}
            showOverBudgetAlert
            onCreateCO={goNext}
            onSave={goNext}
          />
        );

      case 'create-change-order':
        return <CreateChangeOrderScreen onDone={goNext} />;

      case 'invoice-1-with-co':
        return (
          <>
            <ProgressInvoiceScreen
              invoiceNum={1}
              groups={groupsWithCO()}
              expanded={expanded}
              onToggle={toggleGroup}
              onAddFromCO={() => setShowInvoiceCO(true)}
              onSave={goNext}
            />
            {showInvoiceCO && (
              <InvoiceCOModal
                onClose={() => setShowInvoiceCO(false)}
                onInvoice={() => {
                  setShowInvoiceCO(false);
                  goNext();
                }}
              />
            )}
          </>
        );

      case 'invoice-co':
        return (
          <InvoiceCOModal
            onClose={() => setStep('invoice-1-with-co')}
            onInvoice={goNext}
          />
        );

      case 'invoice-1-final':
        return (
          <ProgressInvoiceScreen
            invoiceNum={1}
            groups={groupsFinal()}
            expanded={expanded}
            onToggle={toggleGroup}
            showSuccessBanner
          />
        );

      // ── Unhappy Path ──
      case 'unhappy-invoice-1-ignore':
        return (
          <ProgressInvoiceScreen
            invoiceNum={1}
            groups={groupsWithCosts()}
            expanded={expanded}
            onToggle={toggleGroup}
            showOverBudgetAlert
            onCreateCO={() => {}} // user ignores
            onSave={goNext}
            footer={
              <button
                style={{ ...S.btnWarning, fontSize: 12 }}
                onClick={goNext}
              >
                Submit Anyway (Ignore Overage)
              </button>
            }
          />
        );

      case 'unhappy-invoice-2':
        return (
          <ProgressInvoiceScreen
            invoiceNum={2}
            groups={baseGroups().map(g => ({
              ...g,
              lines: g.lines.map(l => ({
                ...l,
                previousInvoice: l.previousInvoice + (
                  l.id === 'l1' ? 12000 :
                  l.id === 'l2' ? 6850 :
                  l.id === 'l3' ? 5127.50 : 0
                ),
              })),
            }))}
            expanded={expanded}
            onToggle={toggleGroup}
            onAddFromCost={() => setShowAddFromCost(true)}
            onSave={goNext}
          />
        );

      case 'unhappy-add-from-cost-2':
        return (
          <AddFromCostModal
            onClose={() => setStep('unhappy-invoice-2')}
            onAdd={() => goNext()}
          />
        );

      case 'unhappy-invoice-2-over-budget':
        return (
          <ProgressInvoiceScreen
            invoiceNum={2}
            groups={(() => {
              const g = groupsWithCosts();
              g[0].lines[0].previousInvoice = 52000;
              g[0].lines[0].thisInvoice = 0;
              g[0].lines[1].previousInvoice = 20000;
              g[0].lines[1].thisInvoice = 1850;
              g[0].lines[1].isOverBudget = true;
              g[1].lines[0].previousInvoice = 5127.50;
              g[1].lines[0].thisInvoice = 0;
              return g;
            })()}
            expanded={expanded}
            onToggle={toggleGroup}
            showOverBudgetAlert
            onCreateCO={goNext}
          />
        );

      case 'unhappy-create-co-2':
        return <CreateChangeOrderScreen onDone={goNext} />;

      case 'unhappy-invoice-2-with-co':
        return (
          <>
            <ProgressInvoiceScreen
              invoiceNum={2}
              groups={groupsUnhappyInv2WithCO()}
              expanded={expanded}
              onToggle={toggleGroup}
              onAddFromCO={() => setShowInvoiceCO(true)}
            />
            {showInvoiceCO && (
              <InvoiceCOModal
                onClose={() => setShowInvoiceCO(false)}
                onInvoice={() => {
                  setShowInvoiceCO(false);
                  goNext();
                }}
              />
            )}
          </>
        );

      case 'unhappy-invoice-co-2':
        return (
          <InvoiceCOModal
            onClose={() => setStep('unhappy-invoice-2-with-co')}
            onInvoice={goNext}
          />
        );

      case 'unhappy-invoice-2-final':
        return (
          <ProgressInvoiceScreen
            invoiceNum={2}
            groups={groupsUnhappyFinal()}
            expanded={expanded}
            onToggle={toggleGroup}
            showSuccessBanner
          />
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '0 0 40px' }}>
      {renderStepNav()}
      <div style={{ padding: '0 24px' }}>
        {renderStep()}
      </div>
    </div>
  );
}
