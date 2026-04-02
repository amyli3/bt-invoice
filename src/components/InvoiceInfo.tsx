import { Invoice } from '../types';
import { calcDueDate, fmtDate } from '../utils';

interface Props {
  invoice: Invoice;
  onChange: (inv: Invoice) => void;
}

export default function InvoiceInfo({ invoice, onChange }: Props) {
  const handleDateChange = (date: string) => {
    const dueDate = calcDueDate(date, invoice.paymentTerms);
    onChange({...invoice, date, dueDate});
  };
  const handleTermsChange = (terms: string) => {
    const dueDate = calcDueDate(invoice.date, terms);
    onChange({...invoice, paymentTerms: terms, dueDate});
  };
  return (
    <div className="sec">
      <div className="sec-title">Invoice information</div>
      <div className="g3">
        <div><label className="fl">Title</label><input className="fi" value={invoice.title} onChange={e => onChange({...invoice, title: e.target.value})} /></div>
        <div><label className="fl">ID #</label><input className="fi" value={invoice.invoiceNumber} onChange={e => onChange({...invoice, invoiceNumber: e.target.value})} /></div>
        <div><label className="fl">Date paid</label><input type="date" className="fi" value={invoice.datePaid} onChange={e => onChange({...invoice, datePaid: e.target.value})} /></div>
      </div>
      <div style={{marginTop: 12}}>
        <div className="tabs"><button className="tab on">Invoice date</button><button className="tab">Link to schedule item</button></div>
      </div>
      <div className="g3" style={{marginTop: 12}}>
        <div><label className="fl">Invoice date</label><input type="date" className="fi" value={invoice.date} onChange={e => handleDateChange(e.target.value)} /></div>
        <div><label className="fl">Payment terms</label><select className="fi" value={invoice.paymentTerms} onChange={e => handleTermsChange(e.target.value)}><option>None</option><option>Net 15</option><option>Net 30</option><option>Net 45</option><option>Net 60</option><option>Due on Receipt</option></select></div>
        <div><label className="fl">Due date</label><div style={{padding: '8px 0', fontSize: 14, color: 'var(--g700)', fontWeight: 500}}>{fmtDate(invoice.dueDate)}</div></div>
      </div>
    </div>
  );
}
