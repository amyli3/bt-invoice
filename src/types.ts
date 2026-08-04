export interface Address {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
}

export interface LineItem {
  id: string;
  description: string;
  costCode: string;
  costType: string;
  unitCost: number;
  quantity: number;
  unit: string;
  markup: number;
  /** Where the line came from, shown as a tag in the Related item column.
      'bill' / 'timeClock' are the cost sources; each cost record yields exactly
      one line, so their groupId is just the record's own id. */
  relatedItem?: { type: 'allowance' | 'selection' | 'bill' | 'timeClock' | 'quickBooks' | 'contract' | 'changeOrder'; name: string; groupId: string; childIds?: string[] };
  // Underage reallocation metadata. When present, this line is the source
  // (negative) side of a reallocation from one allowance to another. The
  // builder view shows it at its own cost code; the client view (when
  // grouped by cost code or estimate) can roll it under the target.
  reallocation?: { sourceAllowanceId: string; targetAllowanceId: string; targetName: string; targetCostCode: string };
  // Breakdown of selections that were netted into this line (when the
  // selections wizard combined same-cost-code rows). Present only on lines
  // produced by the V2 wizard with grouping enabled.
  rolledUp?: { name: string; amount: number; costCode?: string; isAllowance?: boolean }[];
}

export interface Payment {
  id: string;
  date: string;
  method: string;
  amount: number;
  refund: boolean;
}

export interface Invoice {
  title: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  paymentTerms: string;
  status: string;
  /** Regular invoice vs. a progress-billing draw. Defaults to 'invoice' when unset. */
  type?: 'invoice' | 'progress';
  taxType: string;
  mode: 'lineItems' | 'flatFee';
  from: Address;
  to: Address;
  lineItems: LineItem[];
  flatFeeAmount: number;
  datePaid: string;
  payments: Payment[];
  notes: string;
  invoiceDescription: string;
  emailMessage: string;
  // Surfaced on the full-page invoice, which mirrors the real invoice form's
  // field set (description / closing text / internal notes + QuickBooks status)
  // rather than the prototype's older description / email message / notes trio.
  closingText?: string;
  invoiceToQboOnSend?: boolean;
}

export interface ColumnVisibility {
  [key: string]: boolean;
}

export interface ClientColumnVisibility {
  [key: string]: boolean;
}

export type InvoicingMode = 'time-interval' | 'milestone-draws' | 'aia-percent-complete';

export interface DrawScheduleLine {
  drawNumber: number;
  milestone: string;
  title: string;
  amount: number;
  /** Whether the schedule phase tied to this milestone has been marked complete. */
  phaseComplete: boolean;
  /** Whether this draw has already been invoiced. */
  invoiced?: boolean;
}

export interface Job {
  id: number;
  name: string;
  addr: string;
  group: string;
  tag?: string;
  /** How this job's contract is structured — known as early as proposal signing. */
  contractType?: 'fixed-price' | 'cost-plus' | 'time-and-materials';
  /** Commercial jobs typically bill on certified AIA pay applications. */
  sector?: 'residential' | 'commercial';
  /** Draw/milestone payment schedule set up when the proposal was built, if any. */
  drawSchedule?: DrawScheduleLine[];
  /** Set on Job Details — lenders typically require draw-based disbursements
   * tied to inspected progress, which feeds the invoicing-mode recommendation. */
  fundedByConstructionLoan?: boolean;
}

export interface ColumnDef {
  key: string;
  label: string;
  alwaysOn?: boolean;
}
