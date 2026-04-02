import { Invoice, ClientColumnVisibility, LineItem } from '../types';
import { fmt, fmtDate, parseTaxRate } from '../utils';

interface ColumnConfig {
  key: string;
  label: string;
  align: string;
}

interface Props {
  invoice: Invoice;
  clientVis: ClientColumnVisibility;
}

export default function ClientPreview({ invoice, clientVis }: Props) {
  const isFlatFee = invoice.mode === 'flatFee';
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
  if (clientVis.costType) cols.push({ key: 'costType', label: 'Type', align: 'left' });
  if (clientVis.quantity) cols.push({ key: 'qty', label: 'Qty', align: 'center' });
  if (clientVis.unit) cols.push({ key: 'unit', label: 'Unit', align: 'center' });
  if (clientVis.unitPrice) cols.push({ key: 'unitPrice', label: 'Price', align: 'right' });
  cols.push({ key: 'amount', label: 'Amount', align: 'right' });
  if (taxRate > 0) cols.push({ key: 'tax', label: 'Tax', align: 'right' });

  const renderCell = (item: LineItem, c: ColumnConfig) => {
    const cp = item.unitCost * item.quantity * (1 + item.markup / 100);
    const unitClient = item.unitCost * (1 + item.markup / 100);
    const itemTax = cp * (taxRate / 100);
    switch (c.key) {
      case 'desc': return <td key={c.key} style={{fontWeight: 500, color: 'var(--g800)', whiteSpace: 'normal'}}>{item.description || '—'}</td>;
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
      <div className="paper-accent"></div>

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
                {invoice.lineItems.map(item => <tr key={item.id}>{cols.map(c => renderCell(item, c))}</tr>)}
                {invoice.lineItems.length === 0 && <tr><td colSpan={cols.length} style={{padding: 24, textAlign: 'center', color: 'var(--g300)', fontStyle: 'italic'}}>No line items</td></tr>}
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
