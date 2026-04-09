import { Invoice, Job, ColumnDef } from './types';

export const COST_TYPES = ['Labor', 'Material', 'Equipment', 'Subcontractor', 'Other'];

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
  { key: 'quantity', label: 'Quantity' },
  { key: 'unit', label: 'Unit' },
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
  title: 'Deposit',
  invoiceNumber: '0001',
  date: new Date().toISOString().split('T')[0],
  dueDate: '2026-04-03',
  paymentTerms: 'Net 30',
  status: 'Unreleased',
  taxType: 'No tax',
  mode: 'lineItems',
  from: { name: 'ABC Builders LLC', address: '1234 Construction Ave', city: 'Omaha', state: 'NE', zip: '68102', phone: '(402) 555-0180', email: 'billing@abcbuilders.com' },
  to: { name: 'Johnson Residence', address: '5678 Maple Street', city: 'Omaha', state: 'NE', zip: '68114', phone: '(402) 555-0242', email: 'mike.johnson@email.com' },
  lineItems: [],
  flatFeeAmount: 0,
  datePaid: '',
  payments: [
    { id: 'p1', date: '2026-02-15', method: 'Credit Card', amount: 2000, refund: false },
  ],
  notes: '',
  invoiceDescription: '',
  emailMessage: '',
};

let _nextId = 100;
export function getNextId() { return String(_nextId++); }
