import { Invoice, Job, ColumnDef, InvoicingMode, LineItem } from './types';

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
  {
    id: 1, name: 'Johnson Residence — Full Remodel', addr: '5678 Maple St\nOmaha, NE 68114', group: 'open',
    contractType: 'fixed-price', sector: 'residential',
    drawSchedule: [
      { drawNumber: 1, milestone: 'First Draw', title: 'Draw #1 — First draw', amount: 10000, phaseComplete: true, invoiced: true },
      { drawNumber: 2, milestone: 'Inspection', title: 'Draw #2 — Inspection', amount: 10000, phaseComplete: true, invoiced: false },
      { drawNumber: 3, milestone: 'Removal', title: 'Draw #3 — Removal', amount: 10000, phaseComplete: false },
      { drawNumber: 4, milestone: 'Installation', title: 'Draw #4 — Installation', amount: 10000, phaseComplete: false },
      { drawNumber: 5, milestone: 'Final Inspection', title: 'Draw #5 — Final inspection', amount: 10000, phaseComplete: false },
      { drawNumber: 6, milestone: 'Final Draw', title: 'Draw #6 — Final draw', amount: 10000, phaseComplete: false },
    ],
  },
  { id: 2, name: 'Martinez Kitchen & Bath', addr: '2301 Elm Ave\nLincoln, NE 68502', group: 'open', contractType: 'cost-plus', sector: 'residential' },
  { id: 3, name: 'All 66 Open Jobs', addr: '', group: 'all' },
  { id: 4, name: 'Patel New Construction', addr: '410 Cedar Ln\nPapillion, NE 68046', group: 'all', contractType: 'fixed-price', sector: 'commercial' },
  { id: 5, name: 'Thompson Basement Finish', addr: '8920 Oak Dr\nBellevue, NE 68005', group: 'all', contractType: 'time-and-materials', sector: 'residential' },
  { id: 7, name: 'Davis Deck & Patio Addition', addr: '762 Birch Ct\nGretna, NE 68028', group: 'all' },
  { id: 8, name: 'Nguyen Master Suite Remodel', addr: '3105 Walnut Blvd\nOmaha, NE 68132', group: 'all' },
];

/**
 * "BT does the thinking" — recommend an invoicing mode from data already
 * captured earlier in the job (contract type at proposal signing, whether a
 * draw schedule was set up, commercial vs. residential). Builder can always
 * override; this only sets what's pre-selected.
 */
/* The reason states the signal that was read off the job, not a conclusion
   about how the builder runs their business: "this job has a 6-draw schedule"
   is checkable at a glance, where "invoicing follows that schedule" is an
   assertion the builder may disagree with and can't verify. It's also read
   under a "Recommended" badge that already says what's being suggested, so it
   only has to supply the because. */
export function recommendInvoicingMode(job: Job): { mode: InvoicingMode; reason: string } {
  if (job.sector === 'commercial') {
    return {
      mode: 'aia-percent-complete',
      reason: 'This job is marked commercial, and commercial work is usually billed on certified pay applications (G702/G703).',
    };
  }
  if (job.drawSchedule && job.drawSchedule.length > 0) {
    return {
      mode: 'milestone-draws',
      reason: `The signed proposal for this job set up a ${job.drawSchedule.length}-draw payment schedule.`,
    };
  }
  if (job.contractType === 'fixed-price' && job.fundedByConstructionLoan) {
    return {
      mode: 'milestone-draws',
      reason: 'This job is fixed price and financed by a construction loan. Lenders usually require draws tied to inspected progress.',
    };
  }
  if (job.contractType === 'cost-plus' || job.contractType === 'time-and-materials') {
    return {
      mode: 'time-interval',
      reason: `This job is billed ${job.contractType === 'cost-plus' ? 'cost plus' : 'on time and materials'}, so its invoices come from bills and time entries as they're logged.`,
    };
  }
  // Catch-all: no sector/schedule/contract-type signal points to anything more
  // structured. Time interval / Open book covers this fine: gathering costs
  // into an invoice works whether that happens on a regular schedule or just
  // once for a short, one-and-done job.
  return {
    mode: 'time-interval',
    reason: 'Nothing on file for this job points to a draw schedule or certified billing.',
  };
}

export const INVOICING_MODE_LABELS: Record<InvoicingMode, { label: string; blurb: string }> = {
  'time-interval': { label: 'Time interval / Open book', blurb: "Gather bills, labor, and additional costs into an invoice whenever you're ready — on a regular schedule or as needed." },
  'milestone-draws': { label: 'Milestone / Draws', blurb: 'Bill fixed draw amounts as schedule phases are marked complete.' },
  'aia-percent-complete': { label: 'Progress invoice (AIA style)', blurb: 'Certified pay application (G702/G703) billed on percent of work completed.' },
};

export interface DemoInvoiceRow {
  id: string;
  title: string;
  status: 'Released' | 'Pending' | 'Unreleased';
  amount: number;
  /** Billing period this row covers, e.g. "July" — drives the "X invoice is
   * ready to invoice" banner copy for time-interval/open-book jobs. */
  period?: string;
}

// Demo-only rows for Owner Invoices — illustrate what each billing mode's
// invoice history actually looks like, since it's very different in shape
// from the milestone-draws schedule (which is real job.drawSchedule data).
export const TIME_INTERVAL_DEMO_INVOICES: DemoInvoiceRow[] = [
  { id: '0001', title: 'Invoice #1 - May', status: 'Released', amount: 8500, period: 'May' },
  { id: '0002', title: 'Change orders - May', status: 'Released', amount: 1200, period: 'May' },
  { id: '0003', title: 'Invoice #2 - June', status: 'Released', amount: 9750, period: 'June' },
  { id: '0004', title: 'Invoice #3 - July', status: 'Unreleased', amount: 6300, period: 'July' },
];

// Bills and time-clock hours "auto pulled" for the July time-interval
// invoice above — sums to that row's $6,300 so the prefilled invoice matches
// what the "ready to invoice" banner promised.
export const JULY_TIME_INTERVAL_ITEMS: { description: string; costCode: string; costType: string; amount: number }[] = [
  { description: 'Framing lumber — Bill from ABC Lumber Co.', costCode: '2100 - Framing', costType: 'Material', amount: 2400 },
  { description: 'Electrical rough-in — Bill from Volt Electric', costCode: '2600 - Electrical', costType: 'Subcontractor', amount: 2100 },
  { description: 'Labor — Mike Johnson, 18.5 hrs @ $74.00/hr (time clock)', costCode: '2100 - Framing', costType: 'Labor', amount: 1369 },
  { description: 'Labor — Dan Smith, 5.8 hrs @ $74.00/hr (time clock)', costCode: '2600 - Electrical', costType: 'Labor', amount: 431 },
];

export const AIA_DEMO_INVOICES: DemoInvoiceRow[] = [
  { id: '0001', title: 'Payment application #1 - May', status: 'Released', amount: 42000, period: 'May' },
  { id: '0002', title: 'Payment application #2 - June', status: 'Released', amount: 38500, period: 'June' },
  { id: '0003', title: 'Payment application #3 - July', status: 'Pending', amount: 45200, period: 'July' },
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
  // Closing text is boilerplate the builder sets once in company settings and
  // BT prefills onto every invoice, so it starts populated rather than blank.
  closingText: 'Please use the Pay Online button to submit your payment. For your convenience you can pay by Electronic Check! If you would like instructions on how to pay online, either access the video link below or go to the documents tab for step-by-step instructions.\n\nThank you for your business! (402) 555-0180 | billing@abcbuilders.com | www.abcbuilders.com\nABC Builders LLC is a licensed General & Residential Contractor',
  invoiceToQboOnSend: true,
};

// Invoices already created for this job — the "Add to existing" side of the
// Selections page's +Invoice dropdown. Selecting one loads it (with its
// existing line items) into the invoice-3 builder instead of starting fresh.
export const EXISTING_INVOICES: Invoice[] = [
  {
    ...defaultInvoice,
    invoiceNumber: '0042',
    title: 'Progress invoice draw #1 - May 2026',
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

/* Saved invoice templates, offered from the "+ Invoice" split button in the
   reimagined loop. A template carries its own billing type, so importing one
   answers "How are you billing this invoice?" on the builder's behalf and the
   picker is skipped. Line items come in as a starting point to edit, which is
   the whole reason a builder saves one. */
export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  kind: 'regular' | 'progress';
  lineItems: LineItem[];
}

export const INVOICE_TEMPLATES: InvoiceTemplate[] = [
  {
    id: 'tpl-monthly-draw',
    name: 'Monthly draw',
    description: 'Standard invoice. One line per trade, billed at the end of the month.',
    kind: 'regular',
    lineItems: [
      { id: 'tpl-1-1', description: 'Labor for the period', costCode: '2100', costType: 'Labor', unitCost: 0, quantity: 1, unit: '--', markup: 0 },
      { id: 'tpl-1-2', description: 'Materials for the period', costCode: '2200', costType: 'Material', unitCost: 0, quantity: 1, unit: '--', markup: 0 },
      { id: 'tpl-1-3', description: 'Subcontractors for the period', costCode: '2600', costType: 'Subcontractor', unitCost: 0, quantity: 1, unit: '--', markup: 0 },
    ],
  },
  {
    id: 'tpl-deposit',
    name: 'Deposit / mobilization',
    description: 'Standard invoice. Single line for the up-front payment at contract signing.',
    kind: 'regular',
    lineItems: [
      { id: 'tpl-2-1', description: 'Deposit at contract signing', costCode: '1000', costType: 'Other', unitCost: 0, quantity: 1, unit: '--', markup: 0 },
    ],
  },
  {
    id: 'tpl-aia',
    name: 'AIA pay application',
    description: 'Progress invoice. Schedule of values billed on percent complete.',
    kind: 'progress',
    lineItems: [],
  },
];

// Demo content for the "Invoice (modal)" TopNav entry, so it opens with
// something to look at instead of a blank builder.
// Pre-filled demo content for the "Invoice (modal)" and "Invoice (full page)"
// presentations. This is a plain invoice — not a progress invoice — since both
// of those routes demo the regular invoice builder's presentation, not AIA
// percent-complete billing (that's the separate "Progress Invoice" page).
export const DEMO_INVOICE: Invoice = {
  ...defaultInvoice,
  title: 'Kitchen Demo Work',
  invoiceNumber: '0045',
  type: 'invoice',
  invoiceDescription: 'Covers work completed through July 31, 2026: framing, rough plumbing, rough electrical, and initial finish material purchases.',
  lineItems: [
    { id: 'demo-inv-1', description: 'Framing labor', costCode: '2100', costType: 'Labor', unitCost: 12500, quantity: 1, unit: '--', markup: 0 },
    { id: 'demo-modal-2', description: 'Rough plumbing', costCode: '2200', costType: 'Subcontractor', unitCost: 6800, quantity: 1, unit: '--', markup: 0 },
    { id: 'demo-modal-3', description: 'Electrical rough-in', costCode: '2300', costType: 'Subcontractor', unitCost: 5400, quantity: 1, unit: '--', markup: 0 },
    { id: 'demo-modal-4', description: 'Cabinet hardware materials', costCode: '6090', costType: 'Material', unitCost: 850, quantity: 2, unit: 'ea', markup: 10 },
    { id: 'demo-modal-5', description: 'Kitchen countertop allowance', costCode: '6200', costType: 'Material', unitCost: 4200, quantity: 1, unit: '--', markup: 0 },
  ],
};

let _nextId = 100;
export function getNextId() { return String(_nextId++); }
