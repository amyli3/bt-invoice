import { useState } from 'react';
import { createPortal } from 'react-dom';
import { fmt } from '../utils';
import { getNextId } from '../mockData';
import { BdsButton, BdsText, BdsIcon, BdsPill } from '../bds';

/* ─────────────────────────────────────────────────────────────────────────
   Unified "Add to invoice" wizard — grouped by source. Each source gets a
   title and its line items underneath, keeping that source's native columns:
     • Estimate / Change Orders → Client price · Invoice overview · New invoice % · amount
       (with an Adjust Invoice % / Apply all control)
     • Selections → Selection · Price · New invoice amount
     • Costs → Builder cost · % Markup · Invoice amount
   Styled with BDS components + design tokens.
   ───────────────────────────────────────────────────────────────────────── */

type SourceKey = 'Estimate' | 'Change Orders' | 'Selections' | 'Costs';
const SOURCE_ORDER: SourceKey[] = ['Estimate', 'Change Orders', 'Selections', 'Costs'];

interface PctRow { id: string; title: string; costCode: string; costType: string; clientPrice: number; prevPct: number; }
interface SelRow { id: string; lineItem: string; costCode: string; selection: string; price: number; }
interface CostRow { id: string; item: string; costCode: string; costType: string; builderCost: number; }
// Allowance group: a header + nested selection rows. prevInvoiced = the
// allowance amount already billed on a prior invoice (0 = none).
interface AllowanceGroup { id: string; name: string; prevInvoiced: number; children: SelRow[]; }

const ESTIMATE_ROWS: PctRow[] = [
  { id: 'est-1', title: 'Framing labor', costCode: '03.10 - Framing', costType: 'Labor', clientPrice: 8500, prevPct: 60 },
  { id: 'est-2', title: 'Exterior paint', costCode: '09.30 - Painting', costType: 'Materials', clientPrice: 2100, prevPct: 0 },
  { id: 'est-3', title: 'Plumbing rough-in', costCode: '06.15 - Plumbing', costType: 'Subcontractor', clientPrice: 4750, prevPct: 80 },
];
const CO_ROWS: PctRow[] = [
  { id: 'co-1', title: 'CO-0001 · Stone veneer', costCode: '4100 - Stone Masonry', costType: 'Materials', clientPrice: 13600, prevPct: 0 },
  { id: 'co-2', title: 'CO-0002 · Engineered beam', costCode: '3100 - Framing', costType: 'Labor', clientPrice: 10000, prevPct: 99 },
];
// Allowances with their selections nested underneath.
const ALLOWANCE_GROUPS: AllowanceGroup[] = [
  {
    id: 'alw-1', name: 'Allowance amt 1 - Electrical', prevInvoiced: 0,
    children: [
      { id: 'alw-1a', lineItem: 'electrical - ASTB', costCode: 'Electrical', selection: 'New choice', price: 500 },
      { id: 'alw-1b', lineItem: 'electrical', costCode: 'Electrical', selection: 'selection 1', price: 555 },
    ],
  },
  {
    id: 'alw-2', name: 'Cabinets Allowance', prevInvoiced: 5000,
    children: [
      { id: 'alw-2a', lineItem: 'Custom shaker cabinets', costCode: '9040 - Cabinets', selection: 'Premium package', price: 4400 },
      { id: 'alw-2b', lineItem: 'Soft-close hardware', costCode: '9040 - Cabinets', selection: 'Premium package', price: 1800 },
    ],
  },
];
// Standalone selections (no allowance backing).
const SELECTION_ROWS: SelRow[] = [
  { id: 'sel-3', lineItem: 'Front door hardware', costCode: '8020 - Hardware', selection: 'Standalone selection', price: 850 },
];
const COST_ROWS: CostRow[] = [
  { id: 'cost-1', item: 'Limestone blocks & mortar', costCode: '4100 - Stone Masonry', costType: 'None', builderCost: 4800 },
  { id: 'cost-2', item: 'Framing lumber delivery', costCode: '3100 - Framing', costType: 'None', builderCost: 3200 },
];

const SourceIcon = ({ source }: { source: SourceKey }) => {
  const c = 'var(--bds-color-gray-70)';
  if (source === 'Costs' || source === 'Change Orders') {
    return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="1.5" width="12" height="13" rx="1.5" stroke={c} strokeWidth="1.2"/><path d="M5 5h6M5 8h6M5 11h3" stroke={c} strokeWidth="1" strokeLinecap="round"/></svg>;
  }
  if (source === 'Selections') {
    return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4l6-3 6 3-6 3-6-3z" stroke={c} strokeWidth="1.2" strokeLinejoin="round"/><path d="M2 8l6 3 6-3M2 12l6 3 6-3" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  }
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 2h8v12H4z" stroke={c} strokeWidth="1.2"/><path d="M6 5h4M6 8h4M6 11h2" stroke={c} strokeWidth="1" strokeLinecap="round"/></svg>;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (lineItems: any[]) => void;
}

const TH_L: React.CSSProperties = { padding: '10px 12px 10px 0', textAlign: 'left' };
const TH_R: React.CSSProperties = { padding: '10px 0 10px 12px', textAlign: 'right' };
const TD_L: React.CSSProperties = { padding: '12px 12px 12px 0', verticalAlign: 'middle' };
const TD_R: React.CSSProperties = { padding: '12px 0 12px 12px', textAlign: 'right', verticalAlign: 'middle' };
const thText = (label: string, right?: boolean) => (
  <th style={right ? TH_R : TH_L}><BdsText as="span" size="heavy-sm" style={{ color: 'var(--bds-color-gray-50)' }}>{label}</BdsText></th>
);

// Small numeric input styled with BDS tokens, with optional % / $ adornment.
function NumField({ value, onChange, suffix, prefix, width = 46 }: { value: string; onChange: (v: string) => void; suffix?: string; prefix?: string; width?: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--bds-color-gray-15)', borderRadius: 6, overflow: 'hidden', background: 'var(--bds-color-base-background)' }}>
      {prefix && <span style={{ padding: '5px 6px', fontSize: 12, color: 'var(--bds-color-gray-50)', borderRight: '1px solid var(--bds-color-gray-15)', background: 'var(--bds-color-gray-5)' }}>{prefix}</span>}
      <input type="text" value={value} onChange={e => onChange(e.target.value)} style={{ width, padding: '5px 8px', fontSize: 13, border: 'none', outline: 'none', textAlign: 'right', fontFamily: 'inherit', color: 'var(--bds-color-gray-90)', background: 'transparent' }} />
      {suffix && <span style={{ padding: '5px 6px', fontSize: 12, color: 'var(--bds-color-gray-50)', borderLeft: '1px solid var(--bds-color-gray-15)', background: 'var(--bds-color-gray-5)' }}>{suffix}</span>}
    </div>
  );
}

export default function AddFromAllModal({ open, onClose, onAdd }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [sources, setSources] = useState<Record<SourceKey, boolean>>({ Estimate: true, 'Change Orders': true, Selections: true, Costs: true });
  const [includeDescs, setIncludeDescs] = useState(true);
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);
  const [pct, setPct] = useState<Record<string, number>>({});
  const [markup, setMarkup] = useState<Record<string, number>>({});
  const [adjust, setAdjust] = useState<Record<SourceKey, string>>({ Estimate: '100.00', 'Change Orders': '100.00', Selections: '100.00', Costs: '100.00' });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (!open) return null;

  const pctAmount = (r: PctRow) => r.clientPrice * (pct[r.id] ?? 0) / 100;
  const costAmount = (r: CostRow) => r.builderCost * (1 + (markup[r.id] ?? 0) / 100);
  const ALLOWANCE_CHILDREN = ALLOWANCE_GROUPS.flatMap(g => g.children);
  const rowAmount = (id: string): number => {
    const e = ESTIMATE_ROWS.find(r => r.id === id); if (e) return pctAmount(e);
    const c = CO_ROWS.find(r => r.id === id); if (c) return pctAmount(c);
    const a = ALLOWANCE_CHILDREN.find(r => r.id === id); if (a) return a.price;
    const s = SELECTION_ROWS.find(r => r.id === id); if (s) return s.price;
    const k = COST_ROWS.find(r => r.id === id); if (k) return costAmount(k);
    return 0;
  };

  const idsForSource = (src: SourceKey): string[] => {
    if (!sources[src]) return [];
    if (src === 'Estimate') return ESTIMATE_ROWS.map(r => r.id);
    if (src === 'Change Orders') return CO_ROWS.map(r => r.id);
    if (src === 'Selections') return [...ALLOWANCE_CHILDREN.map(r => r.id), ...SELECTION_ROWS.map(r => r.id)];
    return COST_ROWS.map(r => r.id);
  };
  const allIds = SOURCE_ORDER.flatMap(idsForSource);
  const checkedIds = allIds.filter(id => checked[id]);
  const subtotal = checkedIds.reduce((s, id) => s + rowAmount(id), 0);

  // Per-section tri-state header checkbox.
  const sectionState = (ids: string[]): 'all' | 'none' | 'some' => {
    if (ids.length === 0) return 'none';
    const on = ids.filter(id => checked[id]).length;
    return on === 0 ? 'none' : on === ids.length ? 'all' : 'some';
  };
  const toggleSection = (ids: string[]) => {
    const v = sectionState(ids) !== 'all';
    setChecked(p => { const n = { ...p }; ids.forEach(id => { n[id] = v; }); return n; });
  };
  const removeSource = (s: SourceKey) => setSources(p => ({ ...p, [s]: false }));
  const toggleSource = (s: SourceKey) => setSources(p => ({ ...p, [s]: !p[s] }));
  const applyAll = (src: SourceKey) => {
    const val = parseFloat(adjust[src]) || 0;
    setPct(p => { const n = { ...p }; idsForSource(src).forEach(id => { n[id] = val; }); return n; });
  };

  const handleAdd = () => {
    const items = checkedIds.map(id => {
      const e = ESTIMATE_ROWS.find(r => r.id === id) || CO_ROWS.find(r => r.id === id);
      if (e) return { id: getNextId(), description: e.title, costCode: e.costCode, costType: e.costType === 'None' ? 'Material' : e.costType, unitCost: pctAmount(e), quantity: 1, unit: '--', markup: 0 };
      const a = ALLOWANCE_CHILDREN.find(r => r.id === id);
      if (a) return { id: getNextId(), description: a.lineItem, costCode: a.costCode, costType: 'Selection', unitCost: a.price, quantity: 1, unit: '--', markup: 0 };
      const s = SELECTION_ROWS.find(r => r.id === id);
      if (s) return { id: getNextId(), description: s.lineItem, costCode: s.costCode, costType: 'Selection', unitCost: s.price, quantity: 1, unit: '--', markup: 0 };
      const k = COST_ROWS.find(r => r.id === id)!;
      return { id: getNextId(), description: k.item, costCode: k.costCode, costType: 'Material', unitCost: k.builderCost, quantity: 1, unit: '--', markup: markup[k.id] ?? 0 };
    });
    if (items.length > 0) onAdd(items);
    onClose();
  };

  const Check = ({ id }: { id: string }) => (
    <input type="checkbox" checked={!!checked[id]} onChange={() => setChecked(p => ({ ...p, [id]: !p[id] }))} style={{ width: 16, height: 16, accentColor: 'var(--bds-color-blue-60)', cursor: 'pointer' }} />
  );

  // Header checkbox embedded in the Title column — selects all rows in its section.
  const HeaderCheck = ({ ids }: { ids: string[] }) => {
    const st = sectionState(ids);
    return (
      <input
        type="checkbox"
        ref={el => { if (el) el.indeterminate = st === 'some'; }}
        checked={st === 'all'}
        onChange={() => toggleSection(ids)}
        style={{ width: 16, height: 16, accentColor: 'var(--bds-color-blue-60)', cursor: 'pointer' }}
      />
    );
  };
  const titleHeader = (ids: string[], label: string) => (
    <th style={{ ...TH_L, paddingLeft: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <HeaderCheck ids={ids} />
        <BdsText as="span" size="heavy-sm" style={{ color: 'var(--bds-color-gray-50)' }}>{label}</BdsText>
      </div>
    </th>
  );

  // Invoice overview bar — previously-invoiced fills GREEN from the left (with
  // its % label inside); the remaining balance is gray on the right with its %.
  // When nothing's been invoiced yet, the whole bar is solid gray.
  const OverviewBar = ({ prevPct }: { prevPct: number }) => {
    const p = Math.max(0, Math.min(prevPct, 100));
    const remaining = 100 - p;
    return (
      <div style={{ display: 'flex', height: 22, borderRadius: 4, overflow: 'hidden', width: 160, fontSize: 11, fontWeight: 600 }}>
        {p > 0 && (
          <div style={{ width: `${p}%`, background: 'var(--bds-color-green-60)', color: 'var(--bds-color-gray-80)', display: 'flex', alignItems: 'center', paddingLeft: 6 }}>{p}%</div>
        )}
        {remaining > 0 && (
          <div style={{ width: `${remaining}%`, background: 'var(--bds-color-gray-30)', color: 'var(--bds-color-gray-80)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>{p > 0 ? `${remaining}%` : ''}</div>
        )}
      </div>
    );
  };

  const cardStyle: React.CSSProperties = { background: 'var(--bds-color-base-background)', border: '1px solid var(--bds-color-gray-15)', borderRadius: 8, overflow: 'hidden' };
  const cellVal = (v: string, opts?: { strong?: boolean; muted?: boolean }) => (
    <BdsText as="span" size={opts?.strong ? 'heavy-md' : 'normal-md'} style={{ color: opts?.muted ? 'var(--bds-color-gray-50)' : 'var(--bds-color-gray-90)', fontSize: 13 }}>{v}</BdsText>
  );

  const renderPctSection = (src: SourceKey, rows: PctRow[]) => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><SourceIcon source={src} /><BdsText as="span" size="heavy-md">{src}</BdsText></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BdsText as="span" size="normal-sm" style={{ color: 'var(--bds-color-gray-50)' }}>Adjust invoice %</BdsText>
          <NumField value={adjust[src]} onChange={v => setAdjust(p => ({ ...p, [src]: v }))} suffix="%" width={52} />
          <BdsButton displayType="secondary" text="Apply all" onClick={() => applyAll(src)} />
        </div>
      </div>
      <div style={cardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--bds-color-gray-15)', background: 'var(--bds-color-gray-5)' }}>
            {titleHeader(rows.map(r => r.id), 'Title')}{thText('Cost code')}{thText('Cost types')}
            {thText('Client price', true)}{thText('Invoice overview', true)}{thText('New invoice %', true)}
            <th style={{ ...TH_R, paddingRight: 14 }}><BdsText as="span" size="heavy-sm" style={{ color: 'var(--bds-color-gray-50)' }}>New invoice amount</BdsText></th>
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--bds-color-gray-10)' }}>
                <td style={{ ...TD_L, paddingLeft: 14 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Check id={r.id} />{cellVal(r.title)}</div></td>
                <td style={TD_L}>{cellVal(r.costCode)}</td>
                <td style={TD_L}>{cellVal(r.costType, { muted: true })}</td>
                <td style={TD_R}>{cellVal('$' + fmt(r.clientPrice))}</td>
                <td style={TD_R}><div style={{ display: 'flex', justifyContent: 'flex-end' }}><OverviewBar prevPct={r.prevPct} /></div></td>
                <td style={TD_R}><NumField value={(pct[r.id] ?? 0).toString()} onChange={v => setPct(p => ({ ...p, [r.id]: parseFloat(v) || 0 }))} suffix="%" /></td>
                <td style={{ ...TD_R, paddingRight: 14 }}>{cellVal('$' + fmt(pctAmount(r)), { strong: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const selColgroup = (
    <colgroup><col /><col style={{ width: 160 }} /><col style={{ width: 180 }} /><col style={{ width: 110 }} /><col style={{ width: 150 }} /></colgroup>
  );
  const renderSelectionSection = () => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><SourceIcon source="Selections" /><BdsText as="span" size="heavy-md">Selections</BdsText></div>

      {/* Allowance groups (each collapsible) */}
      {ALLOWANCE_GROUPS.map(g => {
        const ids = g.children.map(c => c.id);
        const groupAmt = ids.filter(id => checked[id]).reduce((s, id) => s + (g.children.find(c => c.id === id)?.price ?? 0), 0);
        const isCollapsed = !!collapsed[g.id];
        return (
          <div key={g.id} style={{ ...cardStyle, marginBottom: 8 }}>
            {/* Group header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--bds-color-gray-5)', borderBottom: isCollapsed ? 'none' : '1px solid var(--bds-color-gray-15)' }}>
              <HeaderCheck ids={ids} />
              <button onClick={() => setCollapsed(p => ({ ...p, [g.id]: !p[g.id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--bds-color-gray-60)' }}>
                <BdsIcon name={isCollapsed ? 'chevron-right' : 'chevron-down'} size={14} />
              </button>
              <SourceIcon source="Costs" />
              <BdsText as="span" size="heavy-md" style={{ flex: 1 }}>{g.name}</BdsText>
              {g.prevInvoiced > 0 && (
                <div style={{ textAlign: 'right', marginRight: 18 }}>
                  <BdsText as="div" size="normal-sm" style={{ color: 'var(--bds-color-gray-50)' }}>Previously invoiced allowance</BdsText>
                  <BdsText as="div" size="heavy-md">${fmt(g.prevInvoiced)}</BdsText>
                </div>
              )}
              <div style={{ textAlign: 'right' }}>
                <BdsText as="div" size="normal-sm" style={{ color: 'var(--bds-color-gray-50)' }}>Invoice amount</BdsText>
                <BdsText as="div" size="heavy-md" style={{ color: 'var(--bds-color-blue-60)' }}>${fmt(groupAmt)}</BdsText>
              </div>
            </div>
            {!isCollapsed && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                {selColgroup}
                <thead><tr style={{ borderBottom: '1px solid var(--bds-color-gray-10)' }}>
                  <th style={{ ...TH_L, paddingLeft: 46 }}><BdsText as="span" size="heavy-sm" style={{ color: 'var(--bds-color-gray-50)' }}>Line item</BdsText></th>
                  {thText('Cost code')}{thText('Selection')}{thText('Price', true)}
                  <th style={{ ...TH_R, paddingRight: 14 }}><BdsText as="span" size="heavy-sm" style={{ color: 'var(--bds-color-gray-50)' }}>New invoice amount</BdsText></th>
                </tr></thead>
                <tbody>
                  {g.children.map(r => (
                    <tr key={r.id} style={{ borderTop: '1px solid var(--bds-color-gray-10)' }}>
                      <td style={{ ...TD_L, paddingLeft: 46 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Check id={r.id} />{cellVal(r.lineItem)}</div></td>
                      <td style={TD_L}>{cellVal(r.costCode)}</td>
                      <td style={TD_L}>{cellVal(r.selection, { muted: true })}</td>
                      <td style={TD_R}>{cellVal('$' + fmt(r.price))}</td>
                      <td style={{ ...TD_R, paddingRight: 14 }}>{cellVal('$' + fmt(r.price), { strong: true })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}

      {/* Standalone selections */}
      {SELECTION_ROWS.length > 0 && (
        <div style={cardStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            {selColgroup}
            <thead><tr style={{ borderBottom: '1px solid var(--bds-color-gray-15)', background: 'var(--bds-color-gray-5)' }}>
              {titleHeader(SELECTION_ROWS.map(r => r.id), 'Line item')}{thText('Cost code')}{thText('Selection')}
              {thText('Price', true)}
              <th style={{ ...TH_R, paddingRight: 14 }}><BdsText as="span" size="heavy-sm" style={{ color: 'var(--bds-color-gray-50)' }}>New invoice amount</BdsText></th>
            </tr></thead>
            <tbody>
              {SELECTION_ROWS.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--bds-color-gray-10)' }}>
                  <td style={{ ...TD_L, paddingLeft: 14 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Check id={r.id} />{cellVal(r.lineItem)}</div></td>
                  <td style={TD_L}>{cellVal(r.costCode)}</td>
                  <td style={TD_L}>{cellVal(r.selection, { muted: true })}</td>
                  <td style={TD_R}>{cellVal('$' + fmt(r.price))}</td>
                  <td style={{ ...TD_R, paddingRight: 14 }}>{cellVal('$' + fmt(r.price), { strong: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderCostSection = () => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><SourceIcon source="Costs" /><BdsText as="span" size="heavy-md">Costs</BdsText></div>
      <div style={cardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--bds-color-gray-15)', background: 'var(--bds-color-gray-5)' }}>
            {titleHeader(COST_ROWS.map(r => r.id), 'Item')}{thText('Cost code')}{thText('Cost types')}
            {thText('Builder cost', true)}{thText('% Markup', true)}
            <th style={{ ...TH_R, paddingRight: 14 }}><BdsText as="span" size="heavy-sm" style={{ color: 'var(--bds-color-gray-50)' }}>Invoice amount</BdsText></th>
          </tr></thead>
          <tbody>
            {COST_ROWS.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--bds-color-gray-10)' }}>
                <td style={{ ...TD_L, paddingLeft: 14 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Check id={r.id} />{cellVal(r.item)}</div></td>
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
  );

  const anyActive = SOURCE_ORDER.some(s => sources[s]);

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,15,16,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div className="bds-scope bds-real-scope" style={{ background: 'var(--bds-color-base-background)', borderRadius: 12, width: 1040, maxWidth: '97vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <BdsText as="div" size="normal-sm" style={{ color: 'var(--bds-color-gray-40)', marginBottom: 2 }}>Job title</BdsText>
            <BdsText as="div" size="distinct-lg">Add to invoice</BdsText>
          </div>
          <BdsButton displayType="tertiary" ariaLabel="Close" icon={<BdsIcon name="x" size={18} />} onClick={onClose} />
        </div>

        {/* Filter bar */}
        <div style={{ padding: '0 28px 18px', display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap', borderBottom: '1px solid var(--bds-color-gray-15)' }}>
          <div>
            <BdsText as="div" size="heavy-sm" style={{ marginBottom: 6 }}>Date</BdsText>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', border: '1px solid var(--bds-color-gray-15)', borderRadius: 6, fontSize: 13, color: 'var(--bds-color-gray-70)', background: 'var(--bds-color-base-background)', cursor: 'pointer' }}>
              All<BdsIcon name="chevron-down" size={12} />
            </div>
          </div>
          <div>
            <BdsText as="div" size="heavy-sm" style={{ marginBottom: 6 }}>Record type</BdsText>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <BdsButton
                  displayType="secondary"
                  text={anyActive ? `${SOURCE_ORDER.filter(s => sources[s]).length} selected` : 'Select record types'}
                  iconRight={<BdsIcon name="chevron-down" size={12} />}
                  onClick={() => setSourceMenuOpen(o => !o)}
                />
                {sourceMenuOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1 }} onClick={() => setSourceMenuOpen(false)} />
                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'var(--bds-color-base-background)', border: '1px solid var(--bds-color-gray-15)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 6, zIndex: 2, minWidth: 210 }}>
                      {SOURCE_ORDER.map(s => (
                        <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', cursor: 'pointer', borderRadius: 6 }}>
                          <input type="checkbox" checked={sources[s]} onChange={() => toggleSource(s)} style={{ width: 16, height: 16, accentColor: 'var(--bds-color-blue-60)' }} />
                          <SourceIcon source={s} /><BdsText as="span" size="normal-md" style={{ fontSize: 13 }}>{s}</BdsText>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {SOURCE_ORDER.filter(s => sources[s]).map(s => (
                <BdsPill
                  key={s}
                  text={s}
                  selected
                  onClick={() => removeSource(s)}
                  icon={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><SourceIcon source={s} /><BdsIcon name="x" size={11} /></span>}
                />
              ))}
            </div>
          </div>
          <div>
            <BdsText as="div" size="heavy-sm" style={{ marginBottom: 6 }}>Bill options</BdsText>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={includeDescs} onChange={() => setIncludeDescs(!includeDescs)} style={{ width: 16, height: 16, accentColor: 'var(--bds-color-blue-60)' }} />
              <BdsText as="span" size="normal-md" style={{ fontSize: 13 }}>Include line item descriptions &amp; notes</BdsText>
            </label>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 28px', overflowY: 'auto', flex: 1, background: 'var(--bds-color-base-background)' }}>
          {!anyActive ? (
            <div style={{ ...cardStyle, padding: 32, textAlign: 'center' }}><BdsText as="span" size="normal-md" style={{ color: 'var(--bds-color-gray-40)' }}>No record types selected.</BdsText></div>
          ) : (
            <>
              {sources['Estimate'] && renderPctSection('Estimate', ESTIMATE_ROWS)}
              {sources['Change Orders'] && renderPctSection('Change Orders', CO_ROWS)}
              {sources['Selections'] && renderSelectionSection()}
              {sources['Costs'] && renderCostSection()}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', background: 'var(--bds-color-base-background)', borderTop: '1px solid var(--bds-color-gray-15)', borderRadius: '0 0 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
          <div>
            <BdsText as="div" size="normal-sm" style={{ color: 'var(--bds-color-gray-50)' }}>Invoice subtotal</BdsText>
            <BdsText as="div" size="heavy-lg">${fmt(subtotal)}</BdsText>
          </div>
          <BdsButton displayType="primary" text="Add to invoice" disabled={checkedIds.length === 0} onClick={handleAdd} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
