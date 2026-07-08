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
  relatedItem?: { type: 'allowance' | 'selection'; name: string; groupId: string; childIds?: string[] };
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
}

export interface ColumnVisibility {
  [key: string]: boolean;
}

export interface ClientColumnVisibility {
  [key: string]: boolean;
}

export interface Job {
  id: number;
  name: string;
  addr: string;
  group: string;
  tag?: string;
}

export interface ColumnDef {
  key: string;
  label: string;
  alwaysOn?: boolean;
}
