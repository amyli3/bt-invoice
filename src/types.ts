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
  /** Where the money actually went, carried through from the source cost record.
      Today the costs picker renders all of this while the builder chooses what to
      bill and then discards it at the add step, so the client copy shows a cost
      code and a BT reference number and nothing a homeowner can read. Open-book
      builders rebuild it by hand in Excel; see the Aug 2026 Hanson Land & Sea and
      Renee feedback. Optional because estimate/change-order/selection lines have
      no vendor or crew behind them. */
  provenance?: LineProvenance;
}

/** Bill-backed lines carry vendor identity; time-clock lines carry the crew.
    A line has one or the other, never both, but they share a shape so the
    client preview can render one nested "backup" block for either. */
export interface LineProvenance {
  vendor?: string;
  /** The vendor's own invoice number, which is what a client or a lender
      references against the attached PDF. Distinct from BT's internal id. */
  billNumber?: string;
  billDate?: string;
  /** Receipts and subcontractor invoices already attached to the source bill.
      Builders currently mail these separately every cycle. */
  attachments?: { name: string }[];
  /** Per-employee labor behind a time-clock line. Buildertrend collapses this
      to a lump sum per day on the client copy with no expand affordance, so
      nine people on site reads as one number. */
  labor?: { employee: string; hours: number; rate: number; payType: string }[];
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

/** Which backup details render beneath a client-facing line. Keyed by
    CLIENT_DETAIL_OPTIONS. Separate from ClientColumnVisibility because these
    are disclosure decisions about where the money went, not layout decisions
    about the money columns — and because they are prose-shaped, so they render
    as an indented sub-row rather than as table columns. */
export interface ClientDetailVisibility {
  [key: string]: boolean | undefined;
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
