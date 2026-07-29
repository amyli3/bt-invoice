import { useState } from 'react';
import { createPortal } from 'react-dom';
import { fmt } from '../utils';
import { getNextId } from '../mockData';
import { BdsButton, BdsText, BdsIcon } from '../bds';

/* ─────────────────────────────────────────────────────────────────────────
   Standalone "Add costs to invoice" wizard — bills/receipts logged against
   the job that haven't been billed to the client yet. Kept separate from
   the combined Estimate/Change Orders/Selections view (AddFromAllModal)
   since costs price off Builder cost + markup rather than a client price
   or a completed-selection amount.
   ───────────────────────────────────────────────────────────────────────── */

interface CostRow { id: string; item: string; costCode: string; costType: string; builderCost: number; }

const COST_ROWS: CostRow[] = [
  { id: 'cost-1', item: 'Limestone blocks & mortar', costCode: '4100 - Stone Masonry', costType: 'None', builderCost: 4800 },
  { id: 'cost-2', item: 'Framing lumber delivery', costCode: '3100 - Framing', costType: 'None', builderCost: 3200 },
  { id: 'cost-3', item: 'Dumpster rental - month 2', costCode: '01.50 - Temp Facilities', costType: 'None', builderCost: 650 },
  { id: 'cost-4', item: 'Permit fees - electrical', costCode: 'Electrical', costType: 'None', builderCost: 275 },
  { id: 'cost-5', item: 'Rebar & concrete accessories', costCode: '02.30 - Concrete', costType: 'None', builderCost: 1900 },
  { id: 'cost-6', item: 'Equipment rental - scissor lift', costCode: '01.50 - Temp Facilities', costType: 'None', builderCost: 540 },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (lineItems: any[]) => void;
  variant?: 'modal' | 'panel';
}

const TH_L: React.CSSProperties = { padding: '10px 12px 10px 0', textAlign: 'left' };
const TH_R: React.CSSProperties = { padding: '10px 0 10px 12px', textAlign: 'right' };
const TD_L: React.CSSProperties = { padding: '12px 12px 12px 0', verticalAlign: 'middle' };
const TD_R: React.CSSProperties = { padding: '12px 0 12px 12px', textAlign: 'right', verticalAlign: 'middle' };
const thText = (label: string, right?: boolean) => (
  <th style={right ? TH_R : TH_L}><BdsText as="span" size="heavy-sm" style={{ color: 'var(--bds-color-gray-50)' }}>{label}</BdsText></th>
);

function NumField({ value, onChange, suffix, width = 46 }: { value: string; onChange: (v: string) => void; suffix?: string; width?: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--bds-color-gray-15)', borderRadius: 6, overflow: 'hidden', background: 'var(--bds-color-base-background)' }}>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} style={{ width, padding: '5px 8px', fontSize: 13, border: 'none', outline: 'none', textAlign: 'right', fontFamily: 'inherit', color: 'var(--bds-color-gray-90)', background: 'transparent' }} />
      {suffix && <span style={{ padding: '5px 6px', fontSize: 12, color: 'var(--bds-color-gray-50)', borderLeft: '1px solid var(--bds-color-gray-15)', background: 'var(--bds-color-gray-5)' }}>{suffix}</span>}
    </div>
  );
}

export default function CostsModal({ open, onClose, onAdd, variant = 'modal' }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [markup, setMarkup] = useState<Record<string, number>>({});

  if (!open) return null;

  const costAmount = (r: CostRow) => r.builderCost * (1 + (markup[r.id] ?? 0) / 100);
  const checkedIds = COST_ROWS.filter(r => checked[r.id]).map(r => r.id);
  const subtotal = checkedIds.reduce((s, id) => s + costAmount(COST_ROWS.find(r => r.id === id)!), 0);

  const allChecked = COST_ROWS.length > 0 && COST_ROWS.every(r => checked[r.id]);
  const someChecked = COST_ROWS.some(r => checked[r.id]);
  const toggleAll = () => {
    const v = !allChecked;
    setChecked(() => {
      const n: Record<string, boolean> = {};
      COST_ROWS.forEach(r => { n[r.id] = v; });
      return n;
    });
  };

  const handleAdd = () => {
    const items = checkedIds.map(id => {
      const k = COST_ROWS.find(r => r.id === id)!;
      return { id: getNextId(), description: k.item, costCode: k.costCode, costType: 'Material', unitCost: k.builderCost, quantity: 1, unit: '--', markup: markup[k.id] ?? 0 };
    });
    if (items.length > 0) onAdd(items);
    onClose();
  };

  const cardStyle: React.CSSProperties = { background: 'var(--bds-color-base-background)', border: '1px solid var(--bds-color-gray-15)', borderRadius: 8, overflow: 'hidden' };
  const cellVal = (v: string, opts?: { strong?: boolean; muted?: boolean }) => (
    <BdsText as="span" size={opts?.strong ? 'heavy-md' : 'normal-md'} style={{ color: opts?.muted ? 'var(--bds-color-gray-50)' : 'var(--bds-color-gray-90)', fontSize: 13 }}>{v}</BdsText>
  );

  const cardContent = (
    <>
      {/* Header */}
      <div style={{ padding: '20px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0, borderBottom: '1px solid var(--bds-color-gray-15)' }}>
        <div>
          {variant !== 'panel' && <BdsText as="div" size="normal-sm" style={{ color: 'var(--bds-color-gray-40)', marginBottom: 2 }}>Job title</BdsText>}
          <BdsText as="div" size="distinct-lg">Add costs to invoice</BdsText>
        </div>
        <BdsButton displayType="tertiary" ariaLabel="Close" icon={<BdsIcon name="x" size={18} />} onClick={onClose} />
      </div>

      {/* Body */}
      <div style={{ padding: '16px 28px', overflowY: 'auto', flex: 1, background: 'var(--bds-color-base-background)' }}>
        <div style={cardStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--bds-color-gray-15)', background: 'var(--bds-color-gray-5)' }}>
              <th style={{ ...TH_L, paddingLeft: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={el => { if (el) el.indeterminate = !allChecked && someChecked; }}
                    onChange={toggleAll}
                    style={{ width: 16, height: 16, accentColor: 'var(--bds-color-blue-60)', cursor: 'pointer' }}
                  />
                  <BdsText as="span" size="heavy-sm" style={{ color: 'var(--bds-color-gray-50)' }}>Item</BdsText>
                </div>
              </th>
              {thText('Cost code')}{thText('Cost types')}
              {thText('Builder cost', true)}{thText('% Markup', true)}
              <th style={{ ...TH_R, paddingRight: 14 }}><BdsText as="span" size="heavy-sm" style={{ color: 'var(--bds-color-gray-50)' }}>Invoice amount</BdsText></th>
            </tr></thead>
            <tbody>
              {COST_ROWS.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--bds-color-gray-10)' }}>
                  <td style={{ ...TD_L, paddingLeft: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input type="checkbox" checked={!!checked[r.id]} onChange={() => setChecked(p => ({ ...p, [r.id]: !p[r.id] }))} style={{ width: 16, height: 16, accentColor: 'var(--bds-color-blue-60)', cursor: 'pointer' }} />
                      {cellVal(r.item)}
                    </div>
                  </td>
                  <td style={TD_L}>{cellVal(r.costCode)}</td>
                  <td style={TD_L}>{cellVal(r.costType, { muted: true })}</td>
                  <td style={TD_R}>{cellVal('$' + fmt(r.builderCost))}</td>
                  <td style={TD_R}><NumField value={(markup[r.id] ?? 0).toString()} onChange={v => setMarkup(p => ({ ...p, [r.id]: parseFloat(v) || 0 }))} suffix="%" /></td>
                  <td style={{ ...TD_R, paddingRight: 14 }}>{cellVal('$' + fmt(costAmount(r)), { strong: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 28px', background: 'var(--bds-color-base-background)', borderTop: '1px solid var(--bds-color-gray-15)', borderRadius: '0 0 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
        <div>
          <BdsText as="div" size="normal-sm" style={{ color: 'var(--bds-color-gray-50)' }}>Invoice subtotal</BdsText>
          <BdsText as="div" size="heavy-lg">${fmt(subtotal)}</BdsText>
        </div>
        <BdsButton displayType="primary" text="Add to invoice" disabled={checkedIds.length === 0} onClick={handleAdd} />
      </div>
    </>
  );

  if (variant === 'panel') {
    return (
      <div
        className="bds-scope bds-real-scope"
        style={{ background: 'var(--bds-color-base-background)', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {cardContent}
      </div>
    );
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,15,16,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div className="bds-scope bds-real-scope" style={{ background: 'var(--bds-color-base-background)', borderRadius: 12, width: 820, maxWidth: '97vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        {cardContent}
      </div>
    </div>,
    document.body,
  );
}
