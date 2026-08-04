import type { ReactNode } from 'react';
import { Invoice } from '../types';
import { fmt, parseTaxRate } from '../utils';

interface Props {
  invoice: Invoice;
  onChange: (inv: Invoice) => void;
  // The full-page invoice moves this toggle inline with "Add from" (see
  // LineItemsV2's `modeToggle` slot), so Owner price suppresses its own copy.
  // Only ever set while in line-items mode — in flat-fee mode LineItemsV2 isn't
  // rendered at all, so the toggle has to stay here or there'd be no way back.
  hideModeToggle?: boolean;
  // Rendered beside the toggle when it shows here. Flat-fee mode renders no
  // line-items grid, so a control that normally sits by the grid has to ride
  // here too or flat fee becomes a dead end.
  modeToggleExtra?: ReactNode;
}

/* Flat fee / Line items segmented toggle — shared so it can render either
   inside Owner price or inline with the line-items "Add from" button. */
export function PriceModeToggle({ invoice, onChange }: Pick<Props, 'invoice' | 'onChange'>) {
  return (
    <div className="tabs">
      <button className={"tab" + (invoice.mode === 'flatFee' ? ' on' : '')} onClick={() => onChange({...invoice, mode: 'flatFee'})}>Flat fee</button>
      <button className={"tab" + (invoice.mode === 'lineItems' ? ' on' : '')} onClick={() => onChange({...invoice, mode: 'lineItems'})}>Line items</button>
    </div>
  );
}

export default function OwnerPrice({ invoice, onChange, hideModeToggle = false, modeToggleExtra }: Props) {
  return (
    <div className="sec">
      <div className="sec-title">Client price</div>
      <div style={{marginBottom: 14}}>
        <label className="fl">Taxes</label>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'}}>
          <select className="fi" style={{width: 180, flexShrink: 0}} value={invoice.taxType} onChange={e => onChange({...invoice, taxType: e.target.value})}><option>No tax</option><option>Sales tax (7.5%)</option><option>Sales tax (8%)</option></select>
          <button className="btn-g">Manage Taxes</button>
        </div>
      </div>
      {!hideModeToggle && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <PriceModeToggle invoice={invoice} onChange={onChange} />
          {modeToggleExtra}
        </div>
      )}
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
