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
  { id: 1, name: 'Amy Roof (BWF)', addr: '', group: 'open' },
  { id: 2, name: 'Homeowner Name', addr: '5456 Main St\nSpringfield, IL 62036', group: 'open' },
  { id: 3, name: 'All 66 Open Jobs', addr: '', group: 'all' },
  { id: 4, name: '11 BT Brownstone', addr: '', group: 'all' },
  { id: 5, name: 'Options Test', addr: '', group: 'all' },
  { id: 6, name: '1234 S Main St — Kitchen Re...', addr: '', group: 'all', tag: 'QB' },
  { id: 7, name: 'Amy - selections test Job', addr: '', group: 'all' },
  { id: 8, name: 'Amy BWF Job', addr: '', group: 'all' },
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
