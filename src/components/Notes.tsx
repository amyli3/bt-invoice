import { Invoice } from '../types';

interface Props {
  invoice: Invoice;
  onChange: (inv: Invoice) => void;
}

export default function Notes({ invoice, onChange }: Props) {
  return (
    <div style={{borderTop: '1px solid var(--g100)'}}>
      <div className="sec">
        <div className="sec-title" style={{fontSize: 14}}>Invoice description <span style={{fontWeight: 400, fontSize: 11, color: 'var(--g400)'}}>(visible to client)</span></div>
        <textarea className="fi" style={{resize: 'vertical', minHeight: 72}} placeholder="Add context or details about this invoice for the client..." value={invoice.invoiceDescription} onChange={e => onChange({...invoice, invoiceDescription: e.target.value})} />
      </div>
      <div className="g2">
        <div className="sec" style={{borderRight: '1px solid var(--g100)'}}>
          <div className="sec-title" style={{fontSize: 14}}>Email message <span style={{fontWeight: 400, fontSize: 11, color: 'var(--g400)'}}>(included in email)</span></div>
          <textarea className="fi" style={{resize: 'vertical', minHeight: 72}} placeholder="Add a personal message to include in the invoice email..." value={invoice.emailMessage} onChange={e => onChange({...invoice, emailMessage: e.target.value})} />
        </div>
        <div className="sec">
          <div className="sec-title" style={{fontSize: 14}}>Internal notes <span style={{fontWeight: 400, fontSize: 11, color: 'var(--g400)'}}>(builder only)</span></div>
          <textarea className="fi" style={{resize: 'vertical', minHeight: 72}} placeholder="Private notes, not visible to client..." value={invoice.notes} onChange={e => onChange({...invoice, notes: e.target.value})} />
        </div>
      </div>
    </div>
  );
}
