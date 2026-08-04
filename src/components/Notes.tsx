import { Invoice } from '../types';
import QuickBooksStatus from './QuickBooksStatus';

interface Props {
  invoice: Invoice;
  onChange: (inv: Invoice) => void;
  // 'full-page' mirrors the real invoice form's field set — Invoice description,
  // Closing text, Internal notes, plus the QuickBooks status panel — and drops
  // Email message, which doesn't exist on that screen today. Every other route
  // keeps the original description / email message / notes trio.
  variant?: 'default' | 'full-page';
}

const hint = { fontWeight: 400, fontSize: 11, color: 'var(--g400)' };

export default function Notes({ invoice, onChange, variant = 'default' }: Props) {
  if (variant === 'full-page') {
    // Text fields on the left with the QuickBooks card in a right column level
    // with Invoice description, then Attachments full width underneath. No rules
    // between the fields — the card's own border is the only edge in here.
    return (
      <>
        {/* 60/40 proportional, not a fixed-width rail — a fixed rail let the
            description keep growing on wider screens. The 320px floor keeps the
            card usable when the window is narrow. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 6fr) minmax(320px, 4fr)', columnGap: 24, alignItems: 'start' }}>
          <div style={{ minWidth: 0 }}>
            <div className="sec" style={{ borderBottom: 'none' }}>
              <div className="sec-title" style={{ fontSize: 14 }}>Invoice description <span style={hint}>(visible to client)</span></div>
              <textarea
                className="fi"
                style={{ resize: 'vertical', minHeight: 72 }}
                placeholder="Add context or details about this invoice for the client..."
                value={invoice.invoiceDescription}
                onChange={e => onChange({ ...invoice, invoiceDescription: e.target.value })}
              />
            </div>
            <div className="sec" style={{ borderBottom: 'none' }}>
              <div className="sec-title" style={{ fontSize: 14 }}>Closing text <span style={hint}>(visible to client)</span></div>
              <textarea
                className="fi"
                style={{ resize: 'vertical', minHeight: 120 }}
                placeholder="Payment instructions and sign-off shown at the end of the invoice..."
                value={invoice.closingText ?? ''}
                onChange={e => onChange({ ...invoice, closingText: e.target.value })}
              />
            </div>
            <div className="sec" style={{ borderBottom: 'none' }}>
              <div className="sec-title" style={{ fontSize: 14 }}>Internal notes <span style={hint}>(builder only)</span></div>
              <textarea
                className="fi"
                style={{ resize: 'vertical', minHeight: 72 }}
                placeholder="Private notes, not visible to client..."
                value={invoice.notes}
                onChange={e => onChange({ ...invoice, notes: e.target.value })}
              />
            </div>
          </div>

          <div style={{ padding: '20px 24px 20px 0' }}>
            <QuickBooksStatus invoice={invoice} onChange={onChange} />
          </div>
        </div>

        <div className="sec" style={{ borderBottom: 'none' }}>
          <div className="sec-title" style={{ fontSize: 14 }}>Attachments</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-s">Add</button>
            <button type="button" className="btn btn-s">Create new doc</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div style={{borderTop: '1px solid var(--g100)'}}>
      <div className="sec">
        <div className="sec-title" style={{fontSize: 14}}>Invoice description <span style={hint}>(visible to client)</span></div>
        <textarea className="fi" style={{resize: 'vertical', minHeight: 72}} placeholder="Add context or details about this invoice for the client..." value={invoice.invoiceDescription} onChange={e => onChange({...invoice, invoiceDescription: e.target.value})} />
      </div>
      <div className="g2">
        <div className="sec" style={{borderRight: '1px solid var(--g100)'}}>
          <div className="sec-title" style={{fontSize: 14}}>Email message <span style={hint}>(included in email)</span></div>
          <textarea className="fi" style={{resize: 'vertical', minHeight: 72}} placeholder="Add a personal message to include in the invoice email..." value={invoice.emailMessage} onChange={e => onChange({...invoice, emailMessage: e.target.value})} />
        </div>
        <div className="sec">
          <div className="sec-title" style={{fontSize: 14}}>Internal notes <span style={hint}>(builder only)</span></div>
          <textarea className="fi" style={{resize: 'vertical', minHeight: 72}} placeholder="Private notes, not visible to client..." value={invoice.notes} onChange={e => onChange({...invoice, notes: e.target.value})} />
        </div>
      </div>
    </div>
  );
}
