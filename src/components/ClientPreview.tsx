import { Invoice, ClientColumnVisibility, LineItem } from '../types';
import { fmt, fmtDate, parseTaxRate } from '../utils';
import { ESTIMATE_GROUP_BY_ID } from '../selectionsData';

interface ColumnConfig {
  key: string;
  label: string;
  align: string;
}

interface Props {
  invoice: Invoice;
  clientVis: ClientColumnVisibility;
  groupBy?: 'estimate' | 'costcode' | 'all';
}

// Reallocation lines (the negative source) get re-attributed to the
// target's group and cost code for any grouped client view so the math
// nets cleanly under the destination. Builder view always shows them at
// their own source code.
function attributeReallocationsToTarget(lineItems: LineItem[]): LineItem[] {
  return lineItems.map(li => {
    if (!li.reallocation) return li;
    return {
      ...li,
      costCode: li.reallocation.targetCostCode,
      relatedItem: { type: 'allowance' as const, name: li.reallocation.targetName, groupId: li.reallocation.targetAllowanceId },
    };
  });
}

// Turn "Cabinets Allowance (previously invoiced)" into a client-facing credit
// label ("Cabinets Allowance — credit applied") so a reversal reads as an
// intentional offset rather than a bare negative amount.
function creditLabel(rawName: string): string {
  return rawName.replace(/\s*\(previously invoiced\)\s*/i, '').trim() + ' — credit applied';
}

// An "atom" is one indivisible amount at one cost code. A grouped allowance
// line carries its breakdown in rolledUp (the reversal + each selection, each
// with its own cost code), so a single line can span several codes. Both the
// "By cost code" and "All line items" views build from atoms — that's what lets
// a cross-cost-code true-up be attributed to the codes where the money actually
// landed, instead of collapsing under the allowance's original code.
interface Atom { description: string; costCode: string; costType: string; amount: number; isReversal: boolean; }
function toAtoms(item: LineItem): Atom[] {
  if (item.rolledUp && item.rolledUp.length) {
    return item.rolledUp.map(m => {
      const isReversal = !!m.isAllowance && m.amount < 0;
      return {
        // rolledUp amounts are already the client-facing figures (these lines
        // carry markup 0), so no markup is re-applied here.
        description: isReversal ? creditLabel(m.name) : m.name,
        costCode: m.costCode || item.costCode,
        costType: m.isAllowance ? 'Allowance' : item.costType,
        amount: m.amount,
        isReversal,
      };
    });
  }
  const amount = item.unitCost * item.quantity * (1 + item.markup / 100);
  return [{ description: item.description || item.costCode, costCode: item.costCode, costType: item.costType, amount, isReversal: false }];
}

// Cost codes are stored inconsistently — bare ("9040") on some selections vs.
// full ("9040 - Cabinets") on allowances. Key by the code NUMBER and track the
// most descriptive label seen for it, so display stays consistent everywhere.
const codeNum = (cc: string) => (cc || '').split(' - ')[0].trim();
function buildLabelByNum(lineItems: LineItem[]): Record<string, string> {
  const m: Record<string, string> = {};
  const note = (cc?: string) => {
    const k = codeNum(cc || '');
    if (!k) return;
    if (!m[k] || (cc!.includes(' - ') && !m[k].includes(' - '))) m[k] = cc!;
  };
  lineItems.forEach(li => { note(li.costCode); (li.rolledUp || []).forEach(mv => note(mv.costCode || li.costCode)); });
  return m;
}

// Collapse line items added from the same allowance/selection group into one
// row per cost code, so the client sees a single net amount per category
// instead of the allowance reversal + individual selections side-by-side.
// When the selection bills under a different cost code than the allowance
// (e.g. a built-in upgrade), the two cost codes stay as separate rows.
function rollUpByGroup(lineItems: LineItem[]): LineItem[] {
  const result: LineItem[] = [];
  const keyIndex: Record<string, number> = {};
  for (const item of lineItems) {
    const gid = item.relatedItem?.groupId;
    if (!gid) {
      result.push(item);
      continue;
    }
    const lineTotal = item.unitCost * item.quantity * (1 + item.markup / 100);
    const key = `${gid}::${item.costCode}`;
    if (keyIndex[key] === undefined) {
      keyIndex[key] = result.length;
      result.push({
        ...item,
        // Under the room parent rows, label each item by its combined title
        // (e.g. "Cabinets Allowance — final balance") rather than a cost code.
        description: item.relatedItem?.name || item.description || item.costCode,
        unitCost: lineTotal,
        quantity: 1,
        markup: 0,
        unit: '--',
      });
    } else {
      const existing = result[keyIndex[key]];
      result[keyIndex[key]] = {
        ...existing,
        unitCost: existing.unitCost + lineTotal,
      };
    }
  }
  return result;
}

// Collapse by cost code — every amount at the same cost code becomes one row.
// Grouped allowance lines are first broken into atoms, so a cross-cost-code
// true-up is distributed to the codes where the money landed (its selections
// merge with any other lines at those codes) rather than sitting as one net
// figure under the allowance's original code. A code that is purely a reversal
// (no same-code selection to net against) is labeled as an allowance credit
// instead of a bare negative cost-code row.
function rollUpByCostCode(lineItems: LineItem[]): LineItem[] {
  const labelByNum = buildLabelByNum(lineItems);
  const order: string[] = [];
  // Per code number: running total, whether it has a real (non-reversal) amount,
  // and — if it is reversal-only — the credit label to show instead of the code.
  const agg: Record<string, { amount: number; costType: string; hasSelection: boolean; creditDesc?: string }> = {};
  const looseRows: LineItem[] = [];
  for (const a of lineItems.flatMap(toAtoms)) {
    const key = codeNum(a.costCode);
    if (!key) {
      looseRows.push({ id: `cc-none-${looseRows.length}`, description: a.description, costCode: '', costType: a.costType, unitCost: a.amount, quantity: 1, unit: '--', markup: 0 });
      continue;
    }
    if (!agg[key]) { order.push(key); agg[key] = { amount: 0, costType: a.costType, hasSelection: false, creditDesc: undefined }; }
    const g = agg[key];
    g.amount += a.amount;
    if (a.isReversal) { if (!g.creditDesc) g.creditDesc = a.description; }
    else g.hasSelection = true;
  }
  const rows = order.map(key => {
    const g = agg[key];
    const label = labelByNum[key] || key;
    // A code with only a reversal (no same-code selection to net against) reads
    // as an allowance credit; otherwise it's the merged net at that cost code.
    const description = !g.hasSelection && g.creditDesc ? g.creditDesc : label;
    return { id: `cc-${key}`, description, costCode: label, costType: g.costType, unitCost: g.amount, quantity: 1, unit: '--', markup: 0 };
  });
  return [...rows, ...looseRows];
}

// Fully itemized view: expand every grouped allowance line into its individual
// movement rows (the reversal + each selection), so nothing stays combined.
// Ungrouped lines pass through unchanged (preserving their own markup, etc.).
function expandAllLineItems(lineItems: LineItem[]): LineItem[] {
  const labelByNum = buildLabelByNum(lineItems);
  const out: LineItem[] = [];
  for (const item of lineItems) {
    if (item.rolledUp && item.rolledUp.length) {
      toAtoms(item).forEach((a, i) => out.push({
        id: `${item.id}-m${i}`,
        description: a.description,
        costCode: labelByNum[codeNum(a.costCode)] || a.costCode,
        costType: a.costType,
        unitCost: a.amount,
        quantity: 1,
        unit: '--',
        markup: 0,
      }));
    } else {
      out.push(item);
    }
  }
  return out;
}

export default function ClientPreview({ invoice, clientVis, groupBy = 'estimate' }: Props) {
  const isFlatFee = invoice.mode === 'flatFee';
  const displayLineItems = (() => {
    if (isFlatFee) return invoice.lineItems;
    if (groupBy === 'all') return expandAllLineItems(invoice.lineItems);
    const attributed = attributeReallocationsToTarget(invoice.lineItems);
    return groupBy === 'costcode' ? rollUpByCostCode(attributed) : rollUpByGroup(attributed);
  })();
  // "By estimate" mirrors how the builder organized the estimate (e.g. by room):
  // group the invoiced items under parent rows, each with its own subtotal.
  const estimateGroups = (() => {
    if (groupBy !== 'estimate' || isFlatFee) return [];
    const order: string[] = [];
    const byGroup: Record<string, LineItem[]> = {};
    for (const item of displayLineItems) {
      const g = ESTIMATE_GROUP_BY_ID[item.relatedItem?.groupId || ''] || 'Other';
      if (!byGroup[g]) { order.push(g); byGroup[g] = []; }
      byGroup[g].push(item);
    }
    return order.map(name => ({
      name,
      items: byGroup[name],
      subtotal: byGroup[name].reduce((s, i) => s + i.unitCost * i.quantity * (1 + i.markup / 100), 0),
    }));
  })();

  const subtotal = isFlatFee
    ? (invoice.flatFeeAmount || 0)
    : invoice.lineItems.reduce((s, i) => s + i.unitCost * i.quantity * (1 + i.markup / 100), 0);
  const taxRate = parseTaxRate(invoice.taxType);
  const taxAmt = subtotal * (taxRate / 100);
  const invoiceTotal = subtotal + taxAmt;
  const payments = invoice.payments || [];
  const totalPaid = payments.reduce((s, p) => s + (p.refund ? -p.amount : p.amount), 0);
  const amountDue = invoiceTotal - totalPaid;

  const cols: ColumnConfig[] = [];
  cols.push({ key: 'desc', label: 'Description', align: 'left' });
  // The itemized view labels rows by item name, so surface the cost code as its
  // own column there (the grouped views already encode the code in the label).
  if (groupBy === 'all') cols.push({ key: 'costCode', label: 'Cost code', align: 'left' });
  if (clientVis.costType) cols.push({ key: 'costType', label: 'Type', align: 'left' });
  if (clientVis.quantity) cols.push({ key: 'qty', label: 'Qty', align: 'center' });
  if (clientVis.unit) cols.push({ key: 'unit', label: 'Unit', align: 'center' });
  if (clientVis.unitPrice) cols.push({ key: 'unitPrice', label: 'Price', align: 'right' });
  cols.push({ key: 'amount', label: 'Amount', align: 'right' });
  if (taxRate > 0) cols.push({ key: 'tax', label: 'Tax', align: 'right' });

  const renderCell = (item: LineItem, c: ColumnConfig, indent = false) => {
    const cp = item.unitCost * item.quantity * (1 + item.markup / 100);
    const unitClient = item.unitCost * (1 + item.markup / 100);
    const itemTax = cp * (taxRate / 100);
    switch (c.key) {
      case 'desc': return <td key={c.key} style={{fontWeight: 500, color: 'var(--g800)', whiteSpace: 'normal', paddingLeft: indent ? 24 : undefined}}>{item.description || '—'}</td>;
      case 'costCode': return <td key={c.key} style={{color: 'var(--g500)', whiteSpace: 'nowrap'}}>{item.costCode || '—'}</td>;
      case 'costType': return <td key={c.key}><span style={{padding: '1px 6px', fontSize: 10, border: '1px solid var(--g200)', borderRadius: 3}}>{item.costType}</span></td>;
      case 'qty': return <td key={c.key} style={{textAlign: 'center'}}>{item.quantity}</td>;
      case 'unit': return <td key={c.key} style={{textAlign: 'center', color: 'var(--g400)'}}>{item.unit}</td>;
      case 'unitPrice': return <td key={c.key} style={{textAlign: 'right'}}>${fmt(unitClient)}</td>;
      case 'amount': return <td key={c.key} className="amt">${fmt(cp)}</td>;
      case 'tax': return <td key={c.key} style={{textAlign: 'right', color: 'var(--g500)'}}>${fmt(itemTax)}</td>;
      default: return <td key={c.key}></td>;
    }
  };

  return (
    <div className="paper">
      <div className="paper-sec" style={{padding: '24px 28px'}}>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24}}>
          <div>
            <div className="paper-logo" style={{marginBottom: 12}}>
              <div className="paper-logo-icon">b</div>
              <div style={{fontSize: 15, fontWeight: 700, color: 'var(--bt-midnight)'}}>{invoice.from.name}</div>
            </div>
            <div className="paper-val" style={{fontSize: 11, lineHeight: 1.6}}>
              {invoice.from.address}<br/>
              {invoice.from.city}, {invoice.from.state} {invoice.from.zip}<br/>
              Email: {invoice.from.email}<br/>
              Phone: {invoice.from.phone}
            </div>
          </div>
          <div style={{textAlign: 'right'}}>
            <div className="paper-lbl" style={{textAlign: 'right'}}>Bill to</div>
            <div className="paper-val" style={{textAlign: 'right'}}>
              <strong>{invoice.to.name}</strong><br/>
              {invoice.to.address}<br/>
              {invoice.to.city}, {invoice.to.state} {invoice.to.zip}
            </div>
          </div>
        </div>
      </div>

      <div style={{display: 'flex', alignItems: 'stretch', borderTop: '1px solid var(--g100)', borderBottom: '1px solid var(--g100)', fontSize: 11}}>
        <div style={{flex: 1, padding: '10px 14px 10px 28px', borderRight: '1px solid var(--g100)'}}>
          <div style={{color: 'var(--g400)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Invoice Date</div>
          <div style={{color: 'var(--g700)', fontWeight: 500, marginTop: 2}}>{fmtDate(invoice.date)}</div>
        </div>
        {invoice.dueDate && (
          <div style={{flex: 1, padding: '10px 14px', borderRight: '1px solid var(--g100)'}}>
            <div style={{color: 'var(--g400)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Due Date</div>
            <div style={{color: 'var(--g700)', fontWeight: 500, marginTop: 2}}>{fmtDate(invoice.dueDate)}</div>
          </div>
        )}
        {totalPaid > 0 && (
          <div style={{flex: 1, padding: '10px 14px', borderRight: '1px solid var(--g100)'}}>
            <div style={{color: 'var(--g400)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Paid</div>
            <div style={{color: 'var(--green)', fontWeight: 600, marginTop: 2}}>${fmt(totalPaid)}</div>
          </div>
        )}
        <div style={{flex: 1, padding: '10px 14px 10px', paddingRight: 28, background: amountDue > 0 ? 'var(--bt-blue-light)' : 'var(--green-bg)'}}>
          <div style={{color: amountDue > 0 ? 'var(--bt-blue)' : 'var(--green)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Amount Due</div>
          <div style={{color: amountDue > 0 ? 'var(--bt-midnight)' : 'var(--green)', fontWeight: 700, fontSize: 14, marginTop: 1}}>${fmt(Math.max(amountDue, 0))}</div>
        </div>
      </div>

      {invoice.invoiceDescription && (
        <div className="paper-sec" style={{padding: '14px 28px'}}>
          <div className="paper-lbl">Description of invoice</div>
          <div style={{fontSize: 11, color: 'var(--g600)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginTop: 4}}>{invoice.invoiceDescription}</div>
        </div>
      )}

      {!isFlatFee && (
        <div className="paper-sec">
          <div style={{overflowX: 'auto'}}>
            <table className="paper-tbl">
              <thead><tr>{cols.map(c => <th key={c.key} style={{textAlign: c.align as 'left'|'right'|'center'}}>{c.label}</th>)}</tr></thead>
              <tbody>
                {groupBy === 'estimate'
                  ? estimateGroups.flatMap(g => [
                      <tr key={`grp-${g.name}`} style={{background: 'var(--g50)'}}>
                        {cols.map(c => (
                          <td key={c.key} style={{fontWeight: 700, color: 'var(--bt-midnight)', textAlign: (c.align as 'left'|'right'|'center'), borderTop: '1px solid var(--g200)'}}>
                            {c.key === 'desc' ? g.name : c.key === 'amount' ? `$${fmt(g.subtotal)}` : ''}
                          </td>
                        ))}
                      </tr>,
                      ...g.items.map(item => <tr key={item.id}>{cols.map(c => renderCell(item, c, true))}</tr>),
                    ])
                  : displayLineItems.map(item => <tr key={item.id}>{cols.map(c => renderCell(item, c))}</tr>)}
                {displayLineItems.length === 0 && <tr><td colSpan={cols.length} style={{padding: 24, textAlign: 'center', color: 'var(--g300)', fontStyle: 'italic'}}>No line items</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="paper-totals">
            <div className="paper-totals-box" style={{width: 200}}>
              <div className="paper-t-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
              {taxRate > 0 && <div className="paper-t-row"><span>Tax ({taxRate}%)</span><span>${fmt(taxAmt)}</span></div>}
              {taxRate === 0 && <div className="paper-t-row"><span>Tax</span><span>$0.00</span></div>}
              <div className="paper-t-final"><span>Total</span><span>${fmt(invoiceTotal)}</span></div>
            </div>
          </div>
        </div>
      )}

      {isFlatFee && (
        <div className="paper-sec" style={{textAlign: 'center', padding: '28px'}}>
          <div style={{fontSize: 13, color: 'var(--g500)', marginBottom: 4}}>Flat fee invoice</div>
          <div style={{fontSize: 22, fontWeight: 700, color: 'var(--bt-midnight)'}}>${fmt(subtotal)}</div>
          {taxRate > 0 && <div style={{fontSize: 12, color: 'var(--g500)', marginTop: 4}}>+ Tax: ${fmt(taxAmt)} = ${fmt(invoiceTotal)}</div>}
        </div>
      )}

      {payments.length > 0 && (
        <div className="paper-sec">
          <div style={{fontSize: 11, fontWeight: 600, color: 'var(--bt-midnight)', marginBottom: 8}}>Payment history</div>
          <table className="paper-tbl">
            <thead><tr>
              <th>Date</th>
              <th>Payment method</th>
              <th>Refund</th>
              <th style={{textAlign: 'right'}}>Status</th>
            </tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td>{fmtDate(p.date)}</td>
                  <td>{p.method}</td>
                  <td>{p.refund ? 'Yes' : ''}</td>
                  <td style={{textAlign: 'right', fontWeight: 600, color: 'var(--g800)'}}>${fmt(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {invoice.notes && (
        <div className="paper-sec" style={{padding: '14px 28px'}}>
          <div className="paper-lbl">Notes</div>
          <div style={{fontSize: 11, color: 'var(--g500)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginTop: 2}}>{invoice.notes}</div>
        </div>
      )}

      <div className="paper-footer">Generated with Buildertrend &middot; Thank you for your business</div>
    </div>
  );
}
