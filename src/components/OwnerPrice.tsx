import { Invoice } from '../types';
import { fmt, parseTaxRate } from '../utils';

interface Props {
  invoice: Invoice;
  onChange: (inv: Invoice) => void;
}

export default function OwnerPrice({ invoice, onChange }: Props) {
  return (
    <div className="sec">
      <div className="sec-title">Owner price</div>
      <div style={{marginBottom: 14}}>
        <label className="fl">Taxes</label>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'}}>
          <select className="fi" style={{width: 180, flexShrink: 0}} value={invoice.taxType} onChange={e => onChange({...invoice, taxType: e.target.value})}><option>No tax</option><option>Sales tax (7.5%)</option><option>Sales tax (8%)</option></select>
          <button className="btn-g">Manage Taxes</button>
        </div>
      </div>
      <div className="tabs">
        <button className={"tab" + (invoice.mode === 'flatFee' ? ' on' : '')} onClick={() => onChange({...invoice, mode: 'flatFee'})}>Flat fee</button>
        <button className={"tab" + (invoice.mode === 'lineItems' ? ' on' : '')} onClick={() => onChange({...invoice, mode: 'lineItems'})}>Line items</button>
      </div>
      {invoice.mode === 'flatFee' && (
        <div style={{marginTop: 16}}>
          <label className="fl">Invoice Amount</label>
          <div style={{display: 'flex', alignItems: 'center', gap: 8, maxWidth: 240}}>
            <span style={{fontSize: 16, fontWeight: 600, color: 'var(--g600)'}}>$</span>
            <input type="number" className="fi" style={{fontSize: 18, fontWeight: 700, textAlign: 'right'}} value={invoice.flatFeeAmount || ''} placeholder="0.00" onChange={e => onChange({...invoice, flatFeeAmount: parseFloat(e.target.value) || 0})} />
          </div>
          {parseTaxRate(invoice.taxType) > 0 && (
            <div style={{marginTop: 8, fontSize: 13, color: 'var(--g500)'}}>
              + Tax ({invoice.taxType.match(/([\d.]+%)/)?.[1]}): <strong style={{color: 'var(--g700)'}}>${fmt(invoice.flatFeeAmount * parseTaxRate(invoice.taxType) / 100)}</strong>
              <span style={{marginLeft: 12}}>= <strong style={{color: 'var(--bt-midnight)'}}>${fmt(invoice.flatFeeAmount * (1 + parseTaxRate(invoice.taxType) / 100))}</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
