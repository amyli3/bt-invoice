import { useState, useRef, useEffect } from 'react';
import { Invoice, LineItem, ColumnVisibility } from '../types';
import { COST_TYPES, getNextId } from '../mockData';
import { fmt, parseTaxRate } from '../utils';
import ColumnToggle from './ColumnToggle';

function AddFromDropdown({ onOpenEstimate, onOpenSelections }: { onOpenEstimate?: () => void; onOpenSelections?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="btn btn-s" style={{ fontSize: 13, padding: '6px 14px' }} onClick={() => setOpen(!open)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        Add from
        <svg width="12" height="12" viewBox="0 0 12 8" fill="none" style={{ marginLeft: 2 }}>
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="add-from-dropdown">
          <button className="add-from-option" onClick={() => { setOpen(false); onOpenEstimate?.(); }}>
            <span style={{ fontWeight: 500 }}>Estimate</span>
          </button>
          <button className="add-from-option" onClick={() => { setOpen(false); onOpenSelections?.(); }}>
            <span style={{ fontWeight: 500 }}>Selections</span>
          </button>
        </div>
      )}
    </div>
  );
}

interface LineRowProps {
  item: LineItem;
  onChange: (item: LineItem) => void;
  onRemove: () => void;
  vis: ColumnVisibility;
  taxRate: number;
}

function fmtCurrency(v: number) {
  const abs = Math.abs(v);
  const formatted = '$' + fmt(abs);
  return v < 0 ? '-' + formatted : formatted;
}

function LineRow({ item, onChange, onRemove, vis, taxRate }: LineRowProps) {
  const [editingUnitCost, setEditingUnitCost] = useState(false);
  const u = (f: string, v: string | number) => onChange({...item, [f]: v});
  const bc = item.unitCost * item.quantity;
  const cp = bc * (1 + item.markup / 100);
  const taxAmt = cp * (taxRate / 100);
  return (
    <tr>
      <td>
        <div><textarea className="cell-input cell-input-multi" style={{fontWeight: 600}} rows={1} value={item.description} onChange={e => u('description', e.target.value)} /></div>
        <div><input className="cell-input" style={{fontSize: 11, color: 'var(--g400)'}} value={item.costCode} onChange={e => u('costCode', e.target.value)} /></div>
      </td>
      {vis.costType && <td><select className="badge" style={{cursor: 'pointer', fontSize: 12, padding: '2px 6px'}} value={item.costType} onChange={e => u('costType', e.target.value)}>{COST_TYPES.map(t => <option key={t}>{t}</option>)}</select></td>}
      {vis.unitCost && <td style={{textAlign: 'right'}}>
        {editingUnitCost
          ? <input className="cell-input" type="number" style={{textAlign: 'right', width: 90}} value={item.unitCost} autoFocus onBlur={() => setEditingUnitCost(false)} onChange={e => u('unitCost', parseFloat(e.target.value) || 0)} />
          : <span className="cell-input" style={{textAlign: 'right', cursor: 'text', display: 'inline-block', width: 110}} onClick={() => setEditingUnitCost(true)}>{fmtCurrency(item.unitCost)}</span>
        }
      </td>}
      {vis.quantity && <td style={{textAlign: 'center'}}><input className="cell-input" type="number" style={{textAlign: 'center', width: 45}} value={item.quantity} onChange={e => u('quantity', parseFloat(e.target.value) || 0)} /></td>}
      {vis.unit && <td style={{textAlign: 'center', color: 'var(--g400)', fontSize: 12}}>{item.unit}</td>}
      {vis.builderCost && <td style={{textAlign: 'right', fontWeight: 500, fontSize: 13}}>{fmtCurrency(bc)}</td>}
      {vis.markup && <td style={{textAlign: 'center', whiteSpace: 'nowrap'}}><input className="cell-input" type="number" style={{textAlign: 'center', width: 45}} value={item.markup} onChange={e => u('markup', parseFloat(e.target.value) || 0)} />%</td>}
      <td style={{textAlign: 'right', fontWeight: 600, fontSize: 13}}>{fmtCurrency(cp)}</td>
      {vis.tax && taxRate > 0 && <td style={{textAlign: 'right', fontSize: 12, color: 'var(--g500)'}}>{fmtCurrency(taxAmt)}</td>}
      {vis.bill && <td></td>}
      <td style={{whiteSpace: 'nowrap'}}>
        {item.relatedItem && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
            background: item.relatedItem.type === 'allowance' ? '#e8f1fc' : 'var(--green-bg)',
            color: item.relatedItem.type === 'allowance' ? 'var(--bt-blue)' : 'var(--green)',
          }}>
            {item.relatedItem.type === 'allowance' ? 'Allowance' : 'Selection'}: {item.relatedItem.name}
          </span>
        )}
      </td>
      <td style={{width: 32, textAlign: 'center'}}><button className="rr" onClick={onRemove}>&times;</button></td>
    </tr>
  );
}

interface Props {
  invoice: Invoice;
  onChange: (inv: Invoice) => void;
  vis: ColumnVisibility;
  onVisChange: (vis: ColumnVisibility) => void;
  onOpenEstimate?: () => void;
  onOpenSelections?: () => void;
}

export default function LineItems({ invoice, onChange, vis, onVisChange, onOpenEstimate, onOpenSelections }: Props) {
  const add = () => onChange({...invoice, lineItems: [...invoice.lineItems, { id: getNextId(), description: '', costCode: '', costType: 'Material', unitCost: 0, quantity: 1, unit: '--', markup: 0 }]});
  const upd = (i: number, item: LineItem) => { const l = [...invoice.lineItems]; l[i] = item; onChange({...invoice, lineItems: l}); };
  const rem = (i: number) => {
    const item = invoice.lineItems[i];
    const groupId = item.relatedItem?.groupId;
    if (groupId) {
      // Remove all items from the same allowance/selection group
      onChange({...invoice, lineItems: invoice.lineItems.filter(li => li.relatedItem?.groupId !== groupId)});
    } else {
      onChange({...invoice, lineItems: invoice.lineItems.filter((_, idx) => idx !== i)});
    }
  };
  const tbc = invoice.lineItems.reduce((s, i) => s + i.unitCost * i.quantity, 0);
  const tcp = invoice.lineItems.reduce((s, i) => s + i.unitCost * i.quantity * (1 + i.markup / 100), 0);
  const taxRate = parseTaxRate(invoice.taxType);
  const taxTotal = tcp * (taxRate / 100);

  return (
    <div className="sec" style={{paddingBottom: 0}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8}}>
        <ColumnToggle columns={vis} onChange={onVisChange} />
        <AddFromDropdown onOpenEstimate={onOpenEstimate} onOpenSelections={onOpenSelections} />
      </div>
      <div className="lt-scroll">
        <table className="lt">
          <thead><tr>
            <th>Items</th>
            {vis.costType && <th>Cost type</th>}
            {vis.unitCost && <th style={{textAlign: 'right'}}>Unit cost</th>}
            {vis.quantity && <th style={{textAlign: 'center'}}>Quantity</th>}
            {vis.unit && <th style={{textAlign: 'center'}}>Unit</th>}
            {vis.builderCost && <th style={{textAlign: 'right'}}>Builder cost</th>}
            {vis.markup && <th style={{textAlign: 'center'}}>Markup</th>}
            <th style={{textAlign: 'right'}}>Client price</th>
            {vis.tax && taxRate > 0 && <th style={{textAlign: 'right'}}>Tax ({taxRate}%)</th>}
            {vis.bill && <th>Bill</th>}
            <th>Related item</th>
            <th style={{width: 32}}></th>
          </tr></thead>
          <tbody>
            {invoice.lineItems.map((item, i) => <LineRow key={item.id} item={item} onChange={u => upd(i, u)} onRemove={() => rem(i)} vis={vis} taxRate={taxRate} />)}
          </tbody>
        </table>
      </div>
      <div style={{padding: '10px 0'}}><button className="add-btn" onClick={add}><span className="add-icon">+</span> Item</button></div>
      <div className="totals-row" style={{margin: '0 -24px', padding: '12px 24px'}}>
        <span>Total</span>
        <div style={{display: 'flex', gap: 60}}>
          {vis.builderCost && <span>{fmtCurrency(tbc)}</span>}
          <span>{fmtCurrency(tcp)}</span>
          {vis.tax && taxRate > 0 && <span style={{fontSize: 12, color: 'var(--g500)'}}>+{fmtCurrency(taxTotal)}</span>}
        </div>
      </div>
      <div style={{display: 'flex', justifyContent: 'flex-end', padding: '14px 0'}}>
        <div style={{textAlign: 'right'}}>
          {taxRate > 0 && (
            <div style={{fontSize: 13, color: 'var(--g500)', marginBottom: 4}}>
              Subtotal: {fmtCurrency(tcp)} &nbsp;|&nbsp; Tax: {fmtCurrency(taxTotal)}
            </div>
          )}
          <div style={{fontSize: 14, fontWeight: 700, color: 'var(--bt-midnight)', display: 'flex', gap: 24}}>
            <span>Total price</span><span>{fmtCurrency(tcp + taxTotal)}</span>
          </div>
          <button className="btn-g" style={{fontSize: 12, marginTop: 4}}>&#9654; Show full price breakdown</button>
        </div>
      </div>
    </div>
  );
}
