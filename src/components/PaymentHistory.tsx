import { Invoice } from '../types';
import { getNextId } from '../mockData';

interface Props {
  invoice: Invoice;
  onChange: (inv: Invoice) => void;
}

export default function PaymentHistory({ invoice, onChange }: Props) {
  const addPayment = () => {
    const p = { id: 'p' + getNextId(), date: new Date().toISOString().split('T')[0], method: 'Credit Card', amount: 0, refund: false };
    onChange({...invoice, payments: [...(invoice.payments || []), p]});
  };
  const updPayment = (i: number, field: string, val: string | number | boolean) => {
    const ps = [...(invoice.payments || [])];
    ps[i] = {...ps[i], [field]: val};
    onChange({...invoice, payments: ps});
  };
  const remPayment = (i: number) => onChange({...invoice, payments: (invoice.payments || []).filter((_, idx) => idx !== i)});
  const payments = invoice.payments || [];
  return (
    <div className="sec">
      <div className="sec-title" style={{fontSize: 14}}>Payment history</div>
      {payments.length > 0 && (
        <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 8}}>
          <thead><tr style={{borderBottom: '2px solid var(--g200)'}}>
            <th style={{textAlign: 'left', padding: '6px 8px', fontSize: 11, fontWeight: 600, color: 'var(--g400)'}}>Date</th>
            <th style={{textAlign: 'left', padding: '6px 8px', fontSize: 11, fontWeight: 600, color: 'var(--g400)'}}>Method</th>
            <th style={{textAlign: 'right', padding: '6px 8px', fontSize: 11, fontWeight: 600, color: 'var(--g400)'}}>Amount</th>
            <th style={{textAlign: 'center', padding: '6px 8px', fontSize: 11, fontWeight: 600, color: 'var(--g400)'}}>Refund</th>
            <th style={{width: 32}}></th>
          </tr></thead>
          <tbody>
            {payments.map((p, i) => (
              <tr key={p.id} style={{borderBottom: '1px solid var(--g100)'}}>
                <td style={{padding: '6px 8px'}}><input type="date" className="cell-input" value={p.date} onChange={e => updPayment(i, 'date', e.target.value)} /></td>
                <td style={{padding: '6px 8px'}}><select className="cell-input" style={{cursor: 'pointer'}} value={p.method} onChange={e => updPayment(i, 'method', e.target.value)}><option>Credit Card</option><option>Check</option><option>Cash</option><option>Bank Transfer</option><option>Other</option></select></td>
                <td style={{padding: '6px 8px', textAlign: 'right'}}><input type="number" className="cell-input" style={{textAlign: 'right', width: 90}} value={p.amount} onChange={e => updPayment(i, 'amount', parseFloat(e.target.value) || 0)} /></td>
                <td style={{padding: '6px 8px', textAlign: 'center'}}><input type="checkbox" checked={p.refund} onChange={e => updPayment(i, 'refund', e.target.checked)} /></td>
                <td style={{textAlign: 'center'}}><button className="rr" style={{opacity: 1}} onClick={() => remPayment(i)}>&times;</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button className="add-btn" onClick={addPayment}><span className="add-icon">+</span> Payment</button>
    </div>
  );
}
