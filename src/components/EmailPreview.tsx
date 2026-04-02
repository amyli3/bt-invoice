import { Invoice } from '../types';
import { fmt, fmtDate, parseTaxRate } from '../utils';

interface Props {
  invoice: Invoice;
}

export default function EmailPreview({ invoice }: Props) {
  const isFlatFee = invoice.mode === 'flatFee';
  const subtotal = isFlatFee ? (invoice.flatFeeAmount || 0) : invoice.lineItems.reduce((s, i) => s + i.unitCost * i.quantity * (1 + i.markup / 100), 0);
  const taxRate = parseTaxRate(invoice.taxType);
  const taxAmt = subtotal * (taxRate / 100);
  const invoiceTotal = subtotal + taxAmt;
  const totalPaid = (invoice.payments || []).reduce((s, p) => s + (p.refund ? -p.amount : p.amount), 0);
  const tcp = Math.max(invoiceTotal - totalPaid, 0);
  return (
    <div className="email-wrap">
      <div className="email-subject-bar">
        <div className="email-subject-label">Subject</div>
        <div className="email-subject-text">Invoice #{invoice.invoiceNumber} from {invoice.from.name}</div>
      </div>
      <div className="email-subject-bar" style={{marginBottom: 16}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--g500)'}}>
          <span><strong style={{color: 'var(--g700)'}}>To:</strong> {invoice.to.email || invoice.to.name}</span>
          <span><strong style={{color: 'var(--g700)'}}>From:</strong> {invoice.from.email}</span>
        </div>
      </div>
      <div className="email-outer">
        <div className="email-card">
          <div className="email-brand">
            <div className="email-brand-logo">b</div>
            <div style={{fontSize: 13, fontWeight: 600, color: 'var(--bt-midnight)', marginTop: 8}}>{invoice.from.name}</div>
          </div>
          <div className="email-body">
            <h2>You have a new invoice</h2>
            <div className="email-sub">Invoice #{invoice.invoiceNumber} &middot; {invoice.title}</div>

            <div className="email-amount-card">
              <div className="email-amount-label">Amount Requested</div>
              <div className="email-amount">${fmt(tcp)}</div>
              <div className="email-due">Due {fmtDate(invoice.dueDate)} &middot; {invoice.paymentTerms}</div>
            </div>

            <div className="email-details">
              <div className="email-detail-row">
                <span className="email-detail-label">Invoice #</span>
                <span className="email-detail-value">{invoice.invoiceNumber}</span>
              </div>
              <div className="email-detail-row">
                <span className="email-detail-label">Invoice Date</span>
                <span className="email-detail-value">{fmtDate(invoice.date)}</span>
              </div>
              <div className="email-detail-row">
                <span className="email-detail-label">Due Date</span>
                <span className="email-detail-value">{fmtDate(invoice.dueDate)}</span>
              </div>
              <div className="email-detail-row">
                <span className="email-detail-label">Bill To</span>
                <span className="email-detail-value">{invoice.to.name}</span>
              </div>
              {invoice.lineItems.length > 0 && (
                <div className="email-detail-row">
                  <span className="email-detail-label">Line Items</span>
                  <span className="email-detail-value">{invoice.lineItems.length} item{invoice.lineItems.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            {invoice.emailMessage && (
              <div className="email-msg">{invoice.emailMessage}</div>
            )}

            <button className="email-cta">View Invoice & Pay</button>

            <div style={{fontSize: 11, color: 'var(--g400)', textAlign: 'center'}}>
              You can view the full invoice details and make a payment by clicking the button above.
            </div>
          </div>
          <div className="email-footer">
            Sent via Buildertrend on behalf of {invoice.from.name}<br/>
            {invoice.from.address}, {invoice.from.city}, {invoice.from.state} {invoice.from.zip}
          </div>
        </div>
      </div>
    </div>
  );
}
