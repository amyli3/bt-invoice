import { Invoice } from '../types';

interface Props {
  invoice: Invoice;
  onChange: (inv: Invoice) => void;
}

/* QuickBooks sync state + the on-send setting. Lives in the full-page invoice's
   right rail, level with Invoice information at the top of the form so it isn't
   buried under the description fields. Carded — in a rail it needs its own edges
   to read as a distinct region rather than text floating in the margin. */
export default function QuickBooksStatus({ invoice, onChange }: Props) {
  return (
    <div style={{ border: '1px solid var(--g200)', borderRadius: 8, background: 'white', overflow: 'hidden' }}>
      <div className="sec-title" style={{ fontSize: 14, margin: 0, padding: '12px 16px', borderBottom: '1px solid var(--g100)' }}>
        QuickBooks Status
      </div>
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 13, marginBottom: 12 }}>
          <span style={{ fontWeight: 600, color: 'var(--g700)' }}>Invoice Status:</span>
          <span style={{ color: 'var(--g600)' }}>
            {invoice.status === 'Unreleased' || invoice.status === 'Draft' ? 'Not Invoiced' : 'Invoiced'}
          </span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--g700)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={invoice.invoiceToQboOnSend ?? false}
            onChange={e => onChange({ ...invoice, invoiceToQboOnSend: e.target.checked })}
          />
          Invoice to QuickBooks on Send
        </label>
      </div>
    </div>
  );
}
