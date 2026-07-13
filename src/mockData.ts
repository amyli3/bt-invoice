import { Invoice, Job, ColumnDef } from './types';

export const COST_TYPES = ['None', 'Labor', 'Material', 'Equipment', 'Subcontractor', 'Other'];

export const ALL_COLUMNS: ColumnDef[] = [
  { key: 'items', label: 'Items', alwaysOn: true },
  { key: 'costType', label: 'Cost type' },
  { key: 'unitCost', label: 'Unit cost' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'unit', label: 'Unit' },
  { key: 'builderCost', label: 'Builder cost' },
  { key: 'markup', label: 'Markup' },
  { key: 'clientPrice', label: 'Client price', alwaysOn: true },
  { key: 'tax', label: 'Tax' },
  { key: 'bill', label: 'Bill' },
];

export const CLIENT_COLUMNS = [
  { key: 'costType', label: 'Cost type' },
  { key: 'markedAs', label: 'Marked as' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'unit', label: 'Unit' },
  { key: 'unitCost', label: 'Unit cost' },
  { key: 'builderCost', label: 'Builder cost' },
  { key: 'markup', label: 'Markup' },
  { key: 'markupAmount', label: 'Markup amount' },
  { key: 'unitPrice', label: 'Unit price' },
];

export const JOBS: Job[] = [
  { id: 1, name: 'Johnson Residence — Full Remodel', addr: '5678 Maple St\nOmaha, NE 68114', group: 'open' },
  { id: 2, name: 'Martinez Kitchen & Bath', addr: '2301 Elm Ave\nLincoln, NE 68502', group: 'open' },
  { id: 3, name: 'All 66 Open Jobs', addr: '', group: 'all' },
  { id: 4, name: 'Patel New Construction', addr: '410 Cedar Ln\nPapillion, NE 68046', group: 'all' },
  { id: 5, name: 'Thompson Basement Finish', addr: '8920 Oak Dr\nBellevue, NE 68005', group: 'all' },
  { id: 7, name: 'Davis Deck & Patio Addition', addr: '762 Birch Ct\nGretna, NE 68028', group: 'all' },
  { id: 8, name: 'Nguyen Master Suite Remodel', addr: '3105 Walnut Blvd\nOmaha, NE 68132', group: 'all' },
];

export const defaultInvoice: Invoice = {
  title: '',
  invoiceNumber: '0001',
  date: new Date().toISOString().split('T')[0],
  dueDate: '2026-04-03',
  paymentTerms: 'Net 30',
  status: 'Unreleased',
  type: 'invoice',
  taxType: 'No tax',
  mode: 'lineItems',
  from: { name: 'ABC Builders LLC', address: '1234 Construction Ave', city: 'Omaha', state: 'NE', zip: '68102', phone: '(402) 555-0180', email: 'billing@abcbuilders.com' },
  to: { name: 'Johnson Residence', address: '5678 Maple Street', city: 'Omaha', state: 'NE', zip: '68114', phone: '(402) 555-0242', email: 'mike.johnson@email.com' },
  lineItems: [],
  flatFeeAmount: 0,
  datePaid: '',
  payments: [],
  notes: '',
  invoiceDescription: '',
  emailMessage: '',
};

// Invoices already created for this job — the "Add to existing" side of the
// Selections page's +Invoice dropdown. Selecting one loads it (with its
// existing line items) into the invoice-3 builder instead of starting fresh.
export const EXISTING_INVOICES: Invoice[] = [
  {
    ...defaultInvoice,
    invoiceNumber: '0042',
    title: 'Draw 2 — May',
    status: 'Sent',
    type: 'progress',
    date: '2026-05-02',
    lineItems: [
      { id: 'ei-42-1', description: 'Draw 2 — Framing labor', costCode: '2100', costType: 'Labor', unitCost: 1500, quantity: 1, unit: '--', markup: 0 },
      { id: 'ei-42-2', description: 'Draw 2 — Rough plumbing', costCode: '2200', costType: 'Subcontractor', unitCost: 900, quantity: 1, unit: '--', markup: 0 },
    ],
  },
  {
    ...defaultInvoice,
    invoiceNumber: '0044',
    title: 'Materials draft',
    status: 'Draft',
    type: 'invoice',
    date: '2026-06-18',
    lineItems: [
      { id: 'ei-44-1', description: 'Cabinet hardware materials', costCode: '6090', costType: 'Material', unitCost: 850, quantity: 1, unit: '--', markup: 0 },
    ],
  },
];

let _nextId = 100;
export function getNextId() { return String(_nextId++); }
