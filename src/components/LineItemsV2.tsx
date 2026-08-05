import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Invoice, LineItem, ColumnVisibility } from '../types';
import { COST_TYPES, getNextId } from '../mockData';
import { fmt, parseTaxRate } from '../utils';
import { costCodeLabel } from '../selectionsData';
import { BdsBadge } from '../bds';
import { autoFillLineItems } from './CostsModal';
import { contractAutoFillLineItems } from '../contractBilling';

/* Which billing model the job runs on, which decides what Auto fill reads.
   Open book (cost plus, time and materials) bills what the job cost; fixed
   price bills what was contracted. They are not two styles of the same fill:
   the sources, the amounts and the copy all differ. */
export type BillingModel = 'openBook' | 'fixedPrice';

/* Sparkle marks the affordance as "the product is doing this for you", matching
   how Bills / Client Updates / Job Options use BdsIconSparkle today. Open
   question on the story: whether a sparkle is right for a deterministic,
   history-based recommendation. It is statistical, but it is not AI. */
const Sparkle = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
    <path d="M6.8 1.2 7.9 5.7 12.4 6.8 7.9 7.9 6.8 12.4 5.7 7.9 1.2 6.8 5.7 5.7Z" fill="currentColor" />
    <path d="M12.2 9.6 12.8 11.6 14.8 12.2 12.8 12.8 12.2 14.8 11.6 12.8 9.6 12.2 11.6 11.6Z" fill="currentColor" opacity="0.7" />
  </svg>
);

export function AddFromDropdown({ onOpenEstimate, onOpenSelections2b, onOpenSelections3, onOpenAll, onOpenAll2, onOpenCosts, hideSingleSourceOptions = false }: { onOpenEstimate?: () => void; onOpenSelections?: () => void; onOpenSelections2?: () => void; onOpenSelections2b?: () => void; onOpenSelections3?: () => void; onOpenAll?: () => void; onOpenAll2?: () => void; onOpenCosts?: () => void; hideSingleSourceOptions?: boolean }) {
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
          {/* The single-source wizards. Invoice (modal) hides them — the
              combined view already covers estimate + change orders +
              selections there — but every other page keeps them. */}
          {!hideSingleSourceOptions && (
            <>
              <button className="add-from-option" onClick={() => { setOpen(false); onOpenEstimate?.(); }}>
                <span style={{ fontWeight: 500 }}>Estimate</span>
              </button>
              {/* "Selections" opens the V5 Selections & Allowances wizard. The older
                  plain-selections wizard (onOpenSelections) is hidden. */}
              <button className="add-from-option" onClick={() => { setOpen(false); onOpenSelections2b?.(); }}>
                <span style={{ fontWeight: 500 }}>Selections</span>
              </button>
              {/* The pre-redesign wizard, kept for reference — groups by allowance
                  and lets the builder check individual selections to invoice. */}
              <button className="add-from-option" onClick={() => { setOpen(false); onOpenSelections3?.(); }}>
                <span style={{ fontWeight: 500 }}>Selections 2 (old)</span>
              </button>
            </>
          )}
          <button className="add-from-option" onClick={() => { setOpen(false); onOpenAll?.(); }} style={hideSingleSourceOptions ? undefined : { borderTop: '1px solid var(--g200)' }}>
            <span style={{ fontWeight: 600 }}>Combined view</span>
          </button>
          {/* Combined view 2 = the same wizard with Costs added as a fourth
              record type. The Costs entry below stays: the standalone costs
              modal is still its own flow. */}
          <button className="add-from-option" onClick={() => { setOpen(false); onOpenAll2?.(); }}>
            <span style={{ fontWeight: 600 }}>Combined view 2</span>
            <span style={{ display: 'block', fontSize: 11, fontWeight: 400, color: 'var(--g500)', marginTop: 2 }}>Includes costs</span>
          </button>
          <button className="add-from-option" onClick={() => { setOpen(false); onOpenCosts?.(); }}>
            <span style={{ fontWeight: 500 }}>Costs</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* Related item tag per source. Allowance and selection keep the colors they
   already had; the two cost sources are neutral, since a cost line's provenance
   is reference information rather than a status worth a color. */
const RELATED_ITEM_TAG: Record<
  NonNullable<LineItem['relatedItem']>['type'],
  { label: string; background: string; color: string }
> = {
  allowance: { label: 'Allowance', background: '#e8f1fc', color: 'var(--bt-blue)' },
  selection: { label: 'Selection', background: 'var(--green-bg)', color: 'var(--green)' },
  bill: { label: 'Bill', background: 'var(--g100)', color: 'var(--g700)' },
  timeClock: { label: 'Time clock', background: 'var(--g100)', color: 'var(--g700)' },
  quickBooks: { label: 'QuickBooks', background: 'var(--g100)', color: 'var(--g700)' },
  // Fixed-price provenance: a contract line or an approved change order.
  contract: { label: 'Contract', background: '#e8f1fc', color: 'var(--bt-blue)' },
  changeOrder: { label: 'Change order', background: '#e8f1fc', color: 'var(--bt-blue)' },
};

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
  const hasStack = !!item.rolledUp && item.rolledUp.length > 1;
  return (
    <tr>
      <td>
        <div style={{display: 'flex', alignItems: 'flex-start', gap: 6}}>
          <textarea className="cell-input cell-input-multi" style={{fontWeight: 600, flex: 1}} rows={1} value={item.description} onChange={e => u('description', e.target.value)} />
        </div>
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
        {item.relatedItem && !hasStack && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
            background: RELATED_ITEM_TAG[item.relatedItem.type].background,
            color: RELATED_ITEM_TAG[item.relatedItem.type].color,
          }}>
            {RELATED_ITEM_TAG[item.relatedItem.type].label}: {item.relatedItem.name}
          </span>
        )}
      </td>
      <td style={{width: 32, textAlign: 'center'}}><button className="rr" onClick={onRemove}>&times;</button></td>
    </tr>
  );
}

const WalletIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: 'var(--g500)' }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M2.25928 3.20305C1.32316 3.6243 0.5 4.30937 0.5 5.25V7.75C0.5 8.69103 1.32264 9.37614 2.25891 9.79738C2.88695 10.0799 3.6538 10.2883 4.5 10.4019V10.75C4.5 11.691 5.32264 12.3761 6.25891 12.7974C7.24189 13.2396 8.56489 13.5 10 13.5C11.4351 13.5 12.7581 13.2396 13.7411 12.7974C14.6774 12.3761 15.5 11.691 15.5 10.75V8.25655L15.5 8.24998C15.5 7.42295 14.8571 6.79464 14.0945 6.37957C13.4062 6.00494 12.5055 5.7344 11.5 5.59774V5.25C11.5 4.30937 10.6768 3.6243 9.74072 3.20305C8.75766 2.76067 7.43467 2.5 6 2.5C4.56533 2.5 3.24234 2.76067 2.25928 3.20305ZM2.66965 4.11497C1.79613 4.50806 1.5 4.94799 1.5 5.25C1.5 5.55201 1.79613 5.99194 2.66965 6.38503C3.49624 6.75699 4.67325 7 6 7C7.32675 7 8.50376 6.75699 9.33035 6.38503C10.2039 5.99194 10.5 5.55201 10.5 5.25C10.5 4.94799 10.2039 4.50806 9.33035 4.11497C8.50376 3.74301 7.32675 3.5 6 3.5C4.67325 3.5 3.49624 3.74301 2.66965 4.11497ZM10.5 6.87067C10.2673 7.03424 10.0086 7.1764 9.74072 7.29695C8.75766 7.73933 7.43467 8 6 8C4.56533 8 3.24234 7.73933 2.25928 7.29695C1.99139 7.1764 1.73275 7.03424 1.5 6.87067V7.75C1.5 8.05272 1.79611 8.49261 2.66921 8.88543C3.54231 9.27825 4.71099 9.5 6 9.5C7.28901 9.5 8.45769 9.27825 9.33079 8.88543C10.2039 8.49261 10.5 8.05272 10.5 7.75V6.87067ZM14.5 8.24743C14.4977 8.55611 14.2005 8.99412 13.3308 9.38542C12.4571 9.77851 11.2801 10 10 10C9.76049 10 9.52556 9.99201 9.29648 9.97672C9.4513 9.92085 9.59974 9.86099 9.74117 9.79734C10.6774 9.37611 11.5 8.69103 11.5 7.75V6.60791C12.3571 6.73703 13.0865 6.96946 13.6165 7.2579C14.2813 7.61977 14.4986 7.98712 14.5 8.24743Z" fill="currentColor"/>
  </svg>
);
const TagIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, color: 'var(--g500)' }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M1.55443 0.826519C1.64598 0.307348 2.12272 -0.0471547 2.63892 0.00510098L6.15972 0.623128C6.67889 0.714673 7.03339 1.19141 6.98113 1.70761L6.278 5.708L10.025 4.34428C10.5192 4.16438 11.0633 4.39852 11.2771 4.86954L12.5038 8.23088C12.5877 8.46141 12.5837 8.71404 12.4939 8.94088L12.4932 11.6711C12.4932 12.1983 12.0853 12.6302 11.4932 12.6711H2.74322C0.836606 12.406 -0.176726 10.9928 0.025735 9.50854L1.55443 0.826519ZM2.53924 1.00017L1.02754 9.57347C0.855115 10.5513 1.51423 11.4999 2.47301 11.6501L4.46664 10.225L5.98607 1.60794L2.53924 1.00017ZM6.0775 6.845L5.33552 10.8402L11.5641 8.5729L10.367 5.28397L6.0775 6.845ZM2.74324 9.17112C3.15745 9.17112 3.49324 9.50691 3.49324 9.92112C3.49324 10.3353 3.15745 10.6711 2.74324 10.6711C2.32902 10.6711 1.99324 10.3353 1.99324 9.92112C1.99324 9.50691 2.32902 9.17112 2.74324 9.17112Z" fill="currentColor"/>
  </svg>
);

// Clean summary row for a grouped allowance line, matching the design mockup:
// icon + name + cost-code (or "N cost codes" chip), with a caret that expands
// to edit. Replaces the editable LineRow for grouped lines in Summary view.
function GroupSummaryRow({ item, colCount, vis, taxRate, activeEditId, onActivate, onChange, onRemove }: { item: LineItem; colCount: number; vis: ColumnVisibility; taxRate: number; activeEditId?: string | null; onActivate?: (id: string) => void; onChange: (i: LineItem) => void; onRemove: () => void }) {
  const [editing, setEditing] = useState(false);
  const isActive = activeEditId === item.id;
  const u = (f: string, v: string | number) => onChange({ ...item, [f]: v });
  const bc = item.unitCost * item.quantity;
  const cp = bc * (1 + item.markup / 100);
  const taxAmt = cp * (taxRate / 100);
  const isAllowance = item.relatedItem?.type === 'allowance';
  const name = item.relatedItem?.name || item.description || (isAllowance ? 'Allowance' : 'Selection');
  const movements = item.rolledUp || [];
  const codes = Array.from(new Set(movements.map(m => (m.costCode || '').split(' - ')[0].trim()).filter(Boolean)));
  const multiCode = codes.length > 1;
  const codeLabel = movements[0]?.costCode || item.costCode;
  const editBg = editing ? { background: isActive ? 'var(--bt-blue-light)' : '#fff' } : {};
  const lbl = (t: string) => <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--g600)', marginBottom: 4, whiteSpace: 'nowrap' }}>{t}</div>;
  const box = { background: '#fff', border: '1px solid var(--g300)', borderRadius: 6, padding: '6px 8px', fontSize: 13, fontFamily: 'inherit', color: 'var(--bt-midnight)' } as const;
  const vtop = { verticalAlign: 'top' as const };
  return (
    <>
      <tr onMouseDown={() => onActivate?.(item.id)}>
        <td style={{ ...editBg, ...vtop }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <button type="button" onClick={() => { if (!editing) onActivate?.(item.id); setEditing(e => !e); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g400)', padding: 0, marginTop: 2, lineHeight: 0, transform: editing ? 'rotate(90deg)' : 'none', transition: 'transform .12s' }} aria-label="Expand to edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
            <span style={{ marginTop: 1 }}>{isAllowance ? <WalletIcon /> : <TagIcon />}</span>
            {editing ? (
              <div style={{ minWidth: 0, flex: 1 }}>
                {lbl('Title')}
                <input style={{ ...box, width: '100%', fontWeight: 600 }} value={name} onChange={e => u('description', e.target.value)} />
                <div style={{ marginTop: 10 }}>
                  {lbl('Cost code *')}
                  {multiCode
                    ? <span style={{ display: 'inline-block', fontSize: 11, color: 'var(--bt-blue)', background: '#dbe9fb', padding: '2px 8px', borderRadius: 20 }}>{codes.length} cost codes</span>
                    : <input style={{ ...box, width: '100%' }} value={item.costCode} onChange={e => u('costCode', e.target.value)} />}
                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--bt-blue)', cursor: 'pointer' }}>Add</span>
                    <span style={{ fontSize: 12, color: 'var(--bt-blue)', cursor: 'pointer' }}>Edit</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--bt-midnight)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {name}
                  {(item.rolledUp?.length ?? 0) > 1 && (
                    <BdsBadge
                      text="Combined"
                      displayType="info"
                      icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l9 5-9 5-9-5 9-5z" /><path d="M3 12l9 5 9-5" /><path d="M3 17l9 5 9-5" /></svg>}
                    />
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--g400)', marginTop: 2 }}>
                  {multiCode
                    ? <span style={{ display: 'inline-block', fontSize: 11, color: 'var(--bt-blue)', background: '#e8f1fc', padding: '1px 8px', borderRadius: 20 }}>{codes.length} cost codes</span>
                    : costCodeLabel(codeLabel)}
                </div>
              </div>
            )}
          </div>
        </td>
        {vis.costType && <td style={{ ...editBg, ...vtop }}>{editing
          ? <>{lbl('Cost type')}<select className="badge" style={{ cursor: 'pointer', fontSize: 12, padding: '4px 6px' }} value={COST_TYPES.includes(item.costType) ? item.costType : 'None'} onChange={e => u('costType', e.target.value)}>{COST_TYPES.map(t => <option key={t}>{t}</option>)}</select><label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: 'var(--g600)' }}><input type="checkbox" />Mark as Bid</label></>
          : <span style={{ color: 'var(--g500)' }}>{COST_TYPES.includes(item.costType) ? item.costType : ''}</span>}</td>}
        {vis.unitCost && <td style={{ ...editBg, ...vtop, textAlign: editing ? 'left' : 'right' }}>{editing ? <>{lbl('Unit cost')}<input type="number" style={{ ...box, width: 80 }} value={item.unitCost} onChange={e => u('unitCost', parseFloat(e.target.value) || 0)} /></> : null}</td>}
        {vis.quantity && <td style={{ ...editBg, ...vtop, textAlign: editing ? 'left' : 'center' }}>{editing ? <>{lbl('Quantity')}<input type="number" style={{ ...box, width: 60 }} value={item.quantity} onChange={e => u('quantity', parseFloat(e.target.value) || 0)} /></> : null}</td>}
        {vis.unit && <td style={{ ...editBg, ...vtop, textAlign: editing ? 'left' : 'center', color: 'var(--g400)', fontSize: 12 }}>{editing ? <>{lbl('Unit')}<input style={{ ...box, width: 50 }} value={item.unit === '--' ? '' : item.unit} onChange={e => u('unit', e.target.value)} /></> : null}</td>}
        {vis.builderCost && <td style={{ ...editBg, ...vtop, textAlign: editing ? 'left' : 'right', fontWeight: 500, fontSize: 13 }}>{editing ? <>{lbl('Builder cost')}<div style={{ paddingTop: 6 }}>{fmtCurrency(bc)}</div></> : null}</td>}
        {vis.markup && <td style={{ ...editBg, ...vtop, textAlign: editing ? 'left' : 'center', whiteSpace: 'nowrap' }}>{editing ? <>{lbl('Markup')}<div style={{ display: 'flex', gap: 4 }}><input type="number" style={{ ...box, width: 50 }} value={item.markup} onChange={e => u('markup', parseFloat(e.target.value) || 0)} /><select className="badge" style={{ fontSize: 12, padding: '4px 4px' }}><option>%</option><option>$</option></select></div></> : null}</td>}
        <td style={{ ...editBg, ...vtop, textAlign: editing ? 'left' : 'right', fontWeight: 600, fontSize: 13 }}>{editing ? <>{lbl('Client price')}<div style={{ ...box, background: 'var(--g100)', display: 'inline-block', minWidth: 70 }}>{fmtCurrency(cp)}</div></> : fmtCurrency(cp)}</td>
        {vis.tax && taxRate > 0 && <td style={{ ...editBg, ...vtop, textAlign: 'right', fontSize: 12, color: 'var(--g500)' }}>{editing ? <label style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 6 }}><input type="checkbox" defaultChecked />Taxable</label> : fmtCurrency(taxAmt)}</td>}
        {vis.bill && <td style={{ ...editBg }}></td>}
        <td style={{ ...editBg }}></td>
        <td style={{ ...editBg, ...vtop, width: 32, textAlign: 'center' }}><button className="rr" style={editing ? { color: 'var(--bt-blue)', marginTop: 4 } : undefined} onClick={onRemove}>&times;</button></td>
      </tr>
      {editing && (
        <tr onMouseDown={() => onActivate?.(item.id)}>
          <td colSpan={colCount} style={{ padding: 0 }}>
            <div style={{ background: isActive ? 'var(--bt-blue-light)' : '#fff', padding: '4px 14px 16px 42px', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 320px', minWidth: 220 }}>
                {lbl('Description')}
                <textarea rows={2} style={{ ...box, width: '100%', resize: 'vertical' }} value={item.description} onChange={e => u('description', e.target.value)} />
              </div>
              <div style={{ flex: '1 1 320px', minWidth: 220 }}>
                {lbl('Internal notes')}
                <textarea rows={2} style={{ ...box, width: '100%', resize: 'vertical' }} placeholder="--" />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Itemized rendering of a grouped allowance line: real table rows so the
// columns line up — an allowance header, a cost-code sub-header per code, and
// the reversal + selections nested underneath. Names sit in the Items column
// and amounts align under Client price. Read-only here; edit in Summary.
function GroupItemizedRows({ item, vis, taxRate, activeEditId, onActivate, onChange, onRemove }: { item: LineItem; vis: ColumnVisibility; taxRate: number; activeEditId?: string | null; onActivate?: (id: string) => void; onChange: (i: LineItem) => void; onRemove: () => void }) {
  const [openLeaf, setOpenLeaf] = useState<Record<number, boolean>>({});
  const elbl = (t: string) => <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--g600)', marginBottom: 4, whiteSpace: 'nowrap' }}>{t}</div>;
  const removeLeaf = (mi: number) => {
    const rolled = (item.rolledUp || []).filter((_, i) => i !== mi);
    const newNet = rolled.reduce((s, m) => s + m.amount, 0);
    onChange({ ...item, rolledUp: rolled, unitCost: newNet, quantity: 1 });
  };
  const movements = item.rolledUp || [];
  const colCount = 1 + (vis.costType ? 1 : 0) + (vis.unitCost ? 1 : 0) + (vis.quantity ? 1 : 0)
    + (vis.unit ? 1 : 0) + (vis.builderCost ? 1 : 0) + (vis.markup ? 1 : 0) + 1
    + (vis.tax && taxRate > 0 ? 1 : 0) + (vis.bill ? 1 : 0) + 1 + 1;

  // Editing a broken-out line updates its entry in the rolled-up breakdown and
  // re-nets the line's total, so the itemized rows behave like real line items.
  const editLeaf = (mi: number, field: string, value: string | number) => {
    const rolled = (item.rolledUp || []).map((m, i) => (i === mi ? { ...m, [field]: value } : m));
    const newNet = rolled.reduce((s, m) => s + m.amount, 0);
    onChange({ ...item, rolledUp: rolled, unitCost: newNet, quantity: 1 });
  };
  const boxInput = { width: '100%', background: '#fff', border: '1px solid var(--g200)', borderRadius: 6, padding: '7px 9px', fontSize: 13, fontFamily: 'inherit', color: 'var(--bt-midnight)' } as const;

  // Trailing cells (cost type → client price → related → delete) so every row
  // aligns to the table columns. `amount` lands under Client price.
  const tail = (costTypeText: string, amount: number | null, opts: { muted?: boolean; bold?: boolean; del?: boolean } = {}) => (
    <>
      {vis.costType && <td style={{ color: 'var(--g500)' }}>{costTypeText}</td>}
      {vis.unitCost && <td></td>}
      {vis.quantity && <td></td>}
      {vis.unit && <td></td>}
      {vis.builderCost && <td></td>}
      {vis.markup && <td></td>}
      <td style={{ textAlign: 'right', fontWeight: opts.bold ? 600 : 500, fontSize: 13, color: opts.muted ? 'var(--g500)' : 'var(--bt-midnight)' }}>{amount == null ? '' : fmtCurrency(amount)}</td>
      {vis.tax && taxRate > 0 && <td></td>}
      {vis.bill && <td></td>}
      <td></td>
      <td style={{ width: 32, textAlign: 'center' }}>{opts.del ? <button className="rr" onClick={onRemove}>&times;</button> : ''}</td>
    </>
  );

  const rows: JSX.Element[] = [];
  movements.forEach((m, mi) => {
    const open = !!openLeaf[mi];
    const leafId = item.id + '#' + mi;
    const active = activeEditId === leafId;
    const toggle = () => { if (!open) onActivate?.(leafId); setOpenLeaf(o => ({ ...o, [mi]: !o[mi] })); };
    if (!open) {
      rows.push(
        <tr key={'l-' + mi}>
          <td>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <button type="button" onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g400)', padding: 0, marginTop: 2, lineHeight: 0 }} aria-label="Expand to edit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
              </button>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--bt-midnight)' }}>{m.name}</div>
                {m.costCode && <div style={{ fontSize: 11, color: 'var(--g400)', marginTop: 2 }}>{costCodeLabel(m.costCode)}</div>}
              </div>
            </div>
          </td>
          {tail('', m.amount)}
        </tr>,
      );
      return;
    }
    const bg = active ? { background: 'var(--bt-blue-light)' } : { background: '#fff' };
    const cell = { ...bg, verticalAlign: 'top' as const };
    rows.push(
      <tr key={'l-' + mi} onMouseDown={() => onActivate?.(leafId)}>
        <td style={cell}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, paddingLeft: 30 }}>
            <button type="button" onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g400)', padding: 0, marginTop: 2, lineHeight: 0, transform: 'rotate(90deg)', transition: 'transform .12s' }} aria-label="Collapse">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
            <div style={{ minWidth: 0, flex: 1 }}>
              {elbl('Title')}
              <input style={{ ...boxInput, width: '100%', fontWeight: 600 }} value={m.name} onChange={e => editLeaf(mi, 'name', e.target.value)} />
              <div style={{ marginTop: 10 }}>
                {elbl('Cost code *')}
                <input style={{ ...boxInput, width: '100%' }} value={costCodeLabel(m.costCode)} onChange={e => editLeaf(mi, 'costCode', e.target.value)} />
                <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--bt-blue)', cursor: 'pointer' }}>Add</span>
                  <span style={{ fontSize: 12, color: 'var(--bt-blue)', cursor: 'pointer' }}>Edit</span>
                </div>
              </div>
            </div>
          </div>
        </td>
        {vis.costType && <td style={cell}>{elbl('Cost type')}<select className="badge" style={{ cursor: 'pointer', fontSize: 12, padding: '4px 6px' }} defaultValue="None">{COST_TYPES.map(t => <option key={t}>{t}</option>)}</select><label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: 'var(--g600)' }}><input type="checkbox" />Mark as Bid</label></td>}
        {vis.unitCost && <td style={cell}>{elbl('Unit cost')}<input type="number" style={{ ...boxInput, width: 80 }} value={m.amount} onChange={e => editLeaf(mi, 'amount', parseFloat(e.target.value) || 0)} /></td>}
        {vis.quantity && <td style={cell}>{elbl('Quantity')}<input style={{ ...boxInput, width: 55 }} defaultValue="1" /></td>}
        {vis.unit && <td style={cell}>{elbl('Unit')}<input style={{ ...boxInput, width: 50 }} /></td>}
        {vis.builderCost && <td style={cell}>{elbl('Builder cost')}<div style={{ paddingTop: 6, fontWeight: 500, fontSize: 13 }}>{fmtCurrency(m.amount)}</div></td>}
        {vis.markup && <td style={cell}>{elbl('Markup')}<div style={{ display: 'flex', gap: 4 }}><input style={{ ...boxInput, width: 45 }} defaultValue="0" /><select className="badge" style={{ fontSize: 12, padding: '4px 4px' }}><option>%</option><option>$</option></select></div></td>}
        <td style={cell}>{elbl('Client price')}<div style={{ ...boxInput, background: 'var(--g100)', display: 'inline-block', minWidth: 70, fontWeight: 600 }}>{fmtCurrency(m.amount)}</div></td>
        {vis.tax && taxRate > 0 && <td style={cell}><label style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 6 }}><input type="checkbox" defaultChecked />Taxable</label></td>}
        {vis.bill && <td style={bg}></td>}
        <td style={bg}></td>
        <td style={{ ...cell, width: 32, textAlign: 'center' }}><button className="rr" style={{ color: 'var(--bt-blue)', marginTop: 4 }} onClick={() => removeLeaf(mi)}>&times;</button></td>
      </tr>,
    );
    rows.push(
      <tr key={'d-' + mi} onMouseDown={() => onActivate?.(leafId)}>
        <td colSpan={colCount} style={{ padding: 0 }}>
          <div style={{ background: active ? 'var(--bt-blue-light)' : '#fff', padding: '4px 14px 16px 28px', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px', minWidth: 220 }}>
              {elbl('Description')}
              <textarea rows={2} style={{ ...boxInput, width: '100%', resize: 'vertical' }} value={m.name} onChange={e => editLeaf(mi, 'name', e.target.value)} />
            </div>
            <div style={{ flex: '1 1 320px', minWidth: 220 }}>
              {elbl('Internal notes')}
              <textarea rows={2} style={{ ...boxInput, width: '100%', resize: 'vertical' }} placeholder="--" />
            </div>
          </div>
        </td>
      </tr>,
    );
  });
  return <>{rows}</>;
}

interface Props {
  invoice: Invoice;
  onChange: (inv: Invoice) => void;
  vis: ColumnVisibility;
  onVisChange: (vis: ColumnVisibility) => void;
  stackView?: 'summary' | 'itemized';
  onStackViewChange?: (v: 'summary' | 'itemized') => void;
  onOpenEstimate?: () => void;
  onOpenSelections?: () => void;
  onOpenSelections2?: () => void;
  onOpenSelections2b?: () => void;
  onOpenSelections3?: () => void;
  onOpenAll?: () => void;
  /** "Combined view 2" — the combined wizard with Costs added as a source. */
  onOpenAll2?: () => void;
  /** Billing model of the job, which decides what Auto fill offers. Comes from
      the job's contractType, so it isn't an invoice-level decision. */
  billingModel?: BillingModel;
  /** Invoice (modal) only: show just Combined view + Costs in "Add from". */
  hideSingleSourceOptions?: boolean;
  /** Financial > Invoice: the reference copy of what's in product today, so it
      carries none of the prototype's additions, Auto fill included. */
  hideAutoFill?: boolean;
  /** Slot under the "Add from" row — used for the "we pre-filled this invoice"
      note, which belongs next to the lines it's explaining. */
  notice?: ReactNode;
  onOpenCosts?: () => void;
  // Optional slot rendered at the left of the "Add from" row — the full-page
  // invoice puts the Flat fee / Line items toggle inline here.
  modeToggle?: ReactNode;
}

export default function LineItems({ invoice, onChange, vis, stackView = 'summary', onStackViewChange, onOpenEstimate, onOpenSelections, onOpenSelections2, onOpenSelections2b, onOpenSelections3, onOpenAll, onOpenAll2, onOpenCosts, hideSingleSourceOptions, hideAutoFill, notice, modeToggle, billingModel = 'openBook' }: Props) {
  // The row the builder is actively editing — only this one gets the blue
  // edit highlight; other expanded rows stay neutral white.
  const [activeEditId, setActiveEditId] = useState<string | null>(null);

  /* Auto fill: the one-click path from US #283497. Populates unsaved form state
     rather than creating anything, so abandoning the invoice costs nothing.
     Holds the ids it added so Undo can remove exactly those lines and nothing
     the builder typed themselves. Non-null also means "already run", which
     hides the trigger so a second click can't duplicate the lines. */
  const [autoFilledIds, setAutoFilledIds] = useState<string[] | null>(null);
  const isFixedPrice = billingModel === 'fixedPrice';
  /* Open book reads unbilled cost records; fixed price reads contract lines and
     approved change orders at percent complete. Same one-click shape, different
     source of truth, so the two can never be mixed on one invoice by accident. */
  const autoFillCandidates = isFixedPrice ? contractAutoFillLineItems() : autoFillLineItems();
  const canAutoFill = !hideAutoFill && autoFillCandidates.length > 0 && autoFilledIds === null;

  const runAutoFill = () => {
    if (autoFillCandidates.length === 0) return;
    setAutoFilledIds(autoFillCandidates.map(i => i.id));
    onChange({ ...invoice, lineItems: [...invoice.lineItems, ...autoFillCandidates] });
  };
  const undoAutoFill = () => {
    if (!autoFilledIds) return;
    onChange({ ...invoice, lineItems: invoice.lineItems.filter(li => !autoFilledIds.includes(li.id)) });
    setAutoFilledIds(null);
  };

  /* If the billing model changes under us (the builder switched to a job on a
     different contract type), pull the previous model's auto-filled lines back
     off. Cost lines on a fixed-price invoice, or contract percentages on an
     open-book one, are not just mislabeled, they are the wrong amounts owed, so
     leaving them behind would be worse than clearing them. Only touches lines
     Auto fill added; anything typed by hand stays. */
  useEffect(() => {
    if (autoFilledIds) undoAutoFill();
    // Deliberately keyed on the model alone: this is a reset on switch, not a
    // reaction to line-item edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingModel]);

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

  // A line is a "group" (an allowance rolled up with its selections) when it
  // carries a multi-entry breakdown. The Summary/Itemized toggle only matters
  // when at least one such group is present.
  const hasGroups = invoice.lineItems.some(li => li.rolledUp && li.rolledUp.length > 1);
  const colCount = 1 + (vis.costType ? 1 : 0) + (vis.unitCost ? 1 : 0) + (vis.quantity ? 1 : 0)
    + (vis.unit ? 1 : 0) + (vis.builderCost ? 1 : 0) + (vis.markup ? 1 : 0) + 1
    + (vis.tax && taxRate > 0 ? 1 : 0) + (vis.bill ? 1 : 0) + 1 + 1;

  return (
    <div className="sec" style={{paddingBottom: 0}}>
      <div style={{display: 'flex', justifyContent: modeToggle ? 'space-between' : 'flex-end', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 16}}>
        {modeToggle}
        {modeToggle && <div style={{flex: 1}} />}
        {hasGroups && onStackViewChange && (
          <button
            type="button"
            onClick={() => onStackViewChange(stackView === 'summary' ? 'itemized' : 'summary')}
            style={{ background: 'none', border: 'none', color: 'var(--bt-blue)', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            {stackView === 'summary' ? 'Switch to itemized' : 'Switch to summary'}
          </button>
        )}
        <AddFromDropdown onOpenEstimate={onOpenEstimate} onOpenSelections={onOpenSelections} onOpenSelections2={onOpenSelections2} onOpenSelections2b={onOpenSelections2b} onOpenSelections3={onOpenSelections3} onOpenAll={onOpenAll} onOpenAll2={onOpenAll2} onOpenCosts={onOpenCosts} hideSingleSourceOptions={hideSingleSourceOptions} />
      </div>

      {/* The offer. Only rendered when there is something to generate, so a job
          with nothing to bill gets no banner rather than a dead end. Names the
          two sources out loud (bills, time clock) because "costs" on its own
          doesn't tell the builder what is about to be pulled in, and says
          nothing about dates: the service applies no cutoff, so promising
          "since your last invoice" would be wrong. */}
      {canAutoFill && (
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
            background: 'var(--bds-color-info-background)', border: '1px solid var(--bds-color-info-foreground)',
            borderRadius: 'var(--bds-radius-lg, 12px)', padding: '14px 16px', marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ color: 'var(--bds-color-info-foreground)', paddingTop: 2 }}><Sparkle size={16} /></span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--bds-color-gray-90)' }}>
                Let Buildertrend fill in this invoice
              </div>
              {/* Sources named to match what open book actually pulls, per the
                  research (ADO #284248 / Confluence "what builders actually
                  treat as invoiceable"):
                    bills            no approval and no payment filter. "Approved
                                     bills" is Trap 2 in that research: IsApproved
                                     is a display flag and must not become a
                                     filter. Unapproved bills invoice at ~77%.
                    time clock       approved only. This one IS gated, 84.6% vs
                                     0.6% for pending, so "approved" belongs here.
                    accounting costs all types, negatives included.
                  Change orders are NOT pulled: scope is costs only, and on open
                  book change orders are 2.4% of invoice lines. No date language,
                  since bills over 180 days old invoice more (86.0%) than newer
                  ones and any window would lose revenue. */}
              {/* Fixed price never mentions costs: on a fixed-price contract a
                  bill is the builder's own margin problem, not something the
                  client owes. What they owe is the contracted value of finished
                  work, so the copy names the schedule and the change orders. */}
              <div style={{ fontSize: 12, color: 'var(--bds-color-gray-70)', marginTop: 2, lineHeight: 1.45 }}>
                {isFixedPrice
                  ? `We'll bill the contract lines the schedule says have moved since your last invoice, at their
                     percent complete, plus approved change orders you haven't billed yet. You can review and make
                     changes before you send it to your client.`
                  : `We'll pull in the unbilled costs you usually bill on this job (bills, approved time clock hours,
                     and accounting costs) and add them as line items. You can review and make changes before you
                     send it to your client.`}
              </div>
            </div>
          </div>
          {/* Secondary, not primary: the banner already carries the colour, and
              Auto fill is an offer rather than the page's main action (Save and
              Send are). The other blue banners in the app do use a primary
              button here, so this is the deliberate difference. */}
          <button
            type="button"
            className="btn btn-s"
            onClick={runAutoFill}
            /* The default gray-15 border measures 1.11:1 against the banner
               fill, so the button edge effectively disappears. g500 clears the
               3:1 WCAG needs for a control boundary while staying neutral. */
            style={{ fontSize: 13, padding: '8px 16px', gap: 6, borderColor: 'var(--g500)' }}
          >
            <Sparkle />
            Auto fill
          </button>
        </div>
      )}

      {/* Auto fill skips the review modal, so the review has to happen here.
          role="status" announces it; Undo makes the whole thing reversible in
          one click, which is what makes an 82%-precision suggestion safe. */}
      {autoFilledIds && (
        <div
          role="status"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
            background: 'var(--bds-color-info-background)', border: '1px solid var(--bds-color-info-foreground)',
            borderRadius: 'var(--bds-radius-lg, 12px)', padding: '12px 16px', marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ color: 'var(--bds-color-info-foreground)', paddingTop: 2 }}><Sparkle size={16} /></span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--bds-color-gray-90)' }}>
                Added line items
              </div>
              <div style={{ fontSize: 12, color: 'var(--bds-color-gray-70)', marginTop: 2 }}>
                Review line items and remove anything you don't want to invoice to the client yet.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={undoAutoFill}
              style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: 'var(--bds-color-info-foreground)', cursor: 'pointer' }}
            >
              Undo
            </button>
          </div>
        </div>
      )}
      {notice}
      <div className="lt-scroll liv2-lt-scroll">
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
            {invoice.lineItems.map((item, i) => {
              const grouped = !!item.rolledUp && item.rolledUp.length > 1;
              // Grouped allowances break out (nested by cost code) in Itemized view.
              if (grouped && stackView === 'itemized') {
                return <GroupItemizedRows key={item.id} item={item} vis={vis} taxRate={taxRate} activeEditId={activeEditId} onActivate={setActiveEditId} onChange={u => upd(i, u)} onRemove={() => rem(i)} />;
              }
              // Allowance and selection lines use the clean icon + name +
              // cost-code row with a caret to edit. Cost lines (bill / time
              // clock) keep the inline-editable row: they carry a relatedItem
              // for traceability but are ordinary single lines, and the builder
              // needs to adjust their amounts in place before sending.
              if (item.relatedItem && (item.relatedItem.type === 'allowance' || item.relatedItem.type === 'selection')) {
                return <GroupSummaryRow key={item.id} item={item} colCount={colCount} vis={vis} taxRate={taxRate} activeEditId={activeEditId} onActivate={setActiveEditId} onChange={u => upd(i, u)} onRemove={() => rem(i)} />;
              }
              return <LineRow key={item.id} item={item} onChange={u => upd(i, u)} onRemove={() => rem(i)} vis={vis} taxRate={taxRate} />;
            })}
            {/* Add row lives inside the table, above the Total row — not as a
                loose button under the container. */}
            <tr>
              <td colSpan={colCount} style={{ padding: '10px 16px' }}>
                <button className="add-btn" onClick={add}><span className="add-icon">+</span> Item</button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--g200)', background: 'var(--g50)' }}>
              <td style={{ fontWeight: 700, fontSize: 14, padding: '20px 16px' }}>Total</td>
              {vis.costType && <td style={{ padding: '20px 16px' }}></td>}
              {vis.unitCost && <td style={{ padding: '20px 16px' }}></td>}
              {vis.quantity && <td style={{ padding: '20px 16px' }}></td>}
              {vis.unit && <td style={{ padding: '20px 16px' }}></td>}
              {vis.builderCost && <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, padding: '20px 16px' }}>{fmtCurrency(tbc)}</td>}
              {vis.markup && <td style={{ padding: '20px 16px' }}></td>}
              <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, padding: '20px 16px' }}>{fmtCurrency(tcp)}</td>
              {vis.tax && taxRate > 0 && <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--g500)', padding: '20px 16px' }}>+{fmtCurrency(taxTotal)}</td>}
              {vis.bill && <td style={{ padding: '20px 16px' }}></td>}
              <td style={{ padding: '20px 16px' }}></td>
              <td style={{ padding: '20px 16px' }}></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div style={{display: 'flex', justifyContent: 'flex-end', padding: '14px 0'}}>
        <div style={{minWidth: 260}}>
          <div style={{display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 13, color: 'var(--g700)', marginBottom: 4}}>
            <span>Subtotal</span><span>{fmtCurrency(tcp)}</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 13, color: 'var(--g700)'}}>
            <span>Tax</span><span>{fmtCurrency(taxTotal)}</span>
          </div>
          <div style={{borderTop: '1px solid var(--g200)', margin: '10px 0'}} />
          <div style={{display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 16, fontWeight: 700, color: 'var(--bt-midnight)'}}>
            <span>Total price</span><span>{fmtCurrency(tcp + taxTotal)}</span>
          </div>
          <div style={{textAlign: 'right', marginTop: 6}}>
            <button className="btn-g" style={{fontSize: 13, textDecoration: 'underline'}}>See full price breakdown</button>
          </div>
        </div>
      </div>
    </div>
  );
}
