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
   Styled with BDS components + design tokens.
   ───────────────────────────────────────────────────────────────────────── */

type SourceKey = 'Estimate' | 'Change Orders' | 'Selections';
const SOURCE_ORDER: SourceKey[] = ['Estimate', 'Change Orders', 'Selections'];

interface PctRow { id: string; title: string; costCode: string; costType: string; clientPrice: number; prevPct: number; }
interface SelRow { id: string; lineItem: string; costCode: string; selection: string; price: number; }
// Allowance group: a header + nested selection rows. prevInvoiced = the
// allowance amount already billed on a prior invoice (0 = none).
interface AllowanceGroup { id: string; name: string; prevInvoiced: number; children: SelRow[]; }

const ESTIMATE_ROWS: PctRow[] = [
  { id: 'est-1', title: 'Framing labor', costCode: '03.10 - Framing', costType: 'Labor', clientPrice: 8500, prevPct: 60 },
  { id: 'est-2', title: 'Exterior paint', costCode: '09.30 - Painting', costType: 'Materials', clientPrice: 2100, prevPct: 0 },
  { id: 'est-3', title: 'Plumbing rough-in', costCode: '06.15 - Plumbing', costType: 'Subcontractor', clientPrice: 4750, prevPct: 80 },
  { id: 'est-4', title: 'Site excavation', costCode: '02.20 - Sitework', costType: 'Subcontractor', clientPrice: 6200, prevPct: 100 },
  { id: 'est-5', title: 'Foundation pour', costCode: '02.30 - Concrete', costType: 'Subcontractor', clientPrice: 15400, prevPct: 40 },
  { id: 'est-6', title: 'Roofing - architectural shingle', costCode: '07.10 - Roofing', costType: 'Subcontractor', clientPrice: 9800, prevPct: 0 },
  { id: 'est-7', title: 'HVAC rough-in', costCode: '15.10 - Mechanical', costType: 'Subcontractor', clientPrice: 7100, prevPct: 25 },
  { id: 'est-8', title: 'Drywall hang & finish', costCode: '09.20 - Drywall', costType: 'Labor', clientPrice: 5600, prevPct: 0 },
  { id: 'est-9', title: 'Interior trim & doors', costCode: '06.20 - Finish Carpentry', costType: 'Labor', clientPrice: 4300, prevPct: 0 },
];
const CO_ROWS: PctRow[] = [
  { id: 'co-1', title: 'CO-0001 · Stone veneer', costCode: '4100 - Stone Masonry', costType: 'Materials', clientPrice: 13600, prevPct: 0 },
  { id: 'co-2', title: 'CO-0002 · Engineered beam', costCode: '3100 - Framing', costType: 'Labor', clientPrice: 10000, prevPct: 99 },
  { id: 'co-3', title: 'CO-0003 · Basement egress window', costCode: '02.20 - Sitework', costType: 'Subcontractor', clientPrice: 4200, prevPct: 0 },
  { id: 'co-4', title: 'CO-0004 · Upgrade to tankless water heater', costCode: '15.10 - Mechanical', costType: 'Materials', clientPrice: 2850, prevPct: 50 },
  { id: 'co-5', title: 'CO-0005 · Add covered back patio', costCode: '06.10 - Rough Carpentry', costType: 'Subcontractor', clientPrice: 11200, prevPct: 0 },
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
  {
    id: 'alw-3', name: 'Plumbing Fixtures Allowance', prevInvoiced: 2200,
    children: [
      { id: 'alw-3a', lineItem: 'Kitchen faucet', costCode: '6015 - Plumbing', selection: 'Delta Trinsic', price: 620 },
      { id: 'alw-3b', lineItem: 'Master bath shower system', costCode: '6015 - Plumbing', selection: 'Kohler Statement', price: 1950 },
      { id: 'alw-3c', lineItem: 'Powder room sink', costCode: '9040 - Cabinets', selection: 'Vessel sink - white', price: 340 },
    ],
  },
  {
    id: 'alw-4', name: 'Flooring Allowance', prevInvoiced: 0,
    children: [
      { id: 'alw-4a', lineItem: 'Engineered hardwood - main level', costCode: '9640 - Flooring', selection: 'White oak, wide plank', price: 8200 },
      { id: 'alw-4b', lineItem: 'Tile - bathrooms', costCode: '9640 - Flooring', selection: 'Porcelain 12x24', price: 1650 },
    ],
  },
  {
    id: 'alw-5', name: 'Lighting Fixtures Allowance', prevInvoiced: 1100,
    children: [
      { id: 'alw-5a', lineItem: 'Kitchen pendant lights (3)', costCode: 'Electrical', selection: 'Brass schoolhouse', price: 780 },
      { id: 'alw-5b', lineItem: 'Dining room chandelier', costCode: 'Electrical', selection: 'Modern linear', price: 610 },
    ],
  },
];
// Standalone selections (no allowance backing).
const SELECTION_ROWS: SelRow[] = [
  { id: 'sel-3', lineItem: 'Front door hardware', costCode: '8020 - Hardware', selection: 'Standalone selection', price: 850 },
  { id: 'sel-4', lineItem: 'Garage door opener upgrade', costCode: '8020 - Hardware', selection: 'Chamberlain WiFi', price: 420 },
  { id: 'sel-5', lineItem: 'Mailbox & house numbers', costCode: '8020 - Hardware', selection: 'Black aluminum', price: 180 },
];
const SourceIcon = ({ source }: { source: SourceKey | 'Folder' }) => {
  const c = 'var(--bds-color-gray-70)';
  if (source === 'Folder' || source === 'Change Orders') {
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
  // "Invoice (modal)" only — renders as a panel docked beside the invoice
  // modal instead of its own centered dialog + backdrop. Defaults to the
  // original centered-modal presentation everywhere else.
  variant?: 'modal' | 'panel';
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

export default function AddFromAllModal({ open, onClose, onAdd, variant = 'modal' }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [sources, setSources] = useState<Record<SourceKey, boolean>>({ Estimate: true, 'Change Orders': true, Selections: true });
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);
  const [pct, setPct] = useState<Record<string, number>>({});
  const [adjust, setAdjust] = useState<Record<SourceKey, string>>({ Estimate: '100.00', 'Change Orders': '100.00', Selections: '100.00' });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (!open) return null;

  const pctAmount = (r: PctRow) => r.clientPrice * (pct[r.id] ?? 0) / 100;
  const ALLOWANCE_CHILDREN = ALLOWANCE_GROUPS.flatMap(g => g.children);
  const rowAmount = (id: string): number => {
    const e = ESTIMATE_ROWS.find(r => r.id === id); if (e) return pctAmount(e);
    const c = CO_ROWS.find(r => r.id === id); if (c) return pctAmount(c);
    const a = ALLOWANCE_CHILDREN.find(r => r.id === id); if (a) return a.price;
    const s = SELECTION_ROWS.find(r => r.id === id); if (s) return s.price;
    return 0;
  };

  const idsForSource = (src: SourceKey): string[] => {
    if (!sources[src]) return [];
    if (src === 'Estimate') return ESTIMATE_ROWS.map(r => r.id);
    if (src === 'Change Orders') return CO_ROWS.map(r => r.id);
    return [...ALLOWANCE_CHILDREN.map(r => r.id), ...SELECTION_ROWS.map(r => r.id)];
  };
  const allIds = SOURCE_ORDER.flatMap(idsForSource);
  const checkedIds = allIds.filter(id => checked[id]);
  const subtotal = checkedIds.reduce((s, id) => s + rowAmount(id), 0);
  const allSourcesSelected = SOURCE_ORDER.every(s => sources[s]);
  const toggleAllSources = () => {
    const v = !allSourcesSelected;
    setSources(() => {
      const n = {} as Record<SourceKey, boolean>;
      SOURCE_ORDER.forEach(s => { n[s] = v; });
      return n;
    });
  };

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
      const s = SELECTION_ROWS.find(r => r.id === id)!;
      return { id: getNextId(), description: s.lineItem, costCode: s.costCode, costType: 'Selection', unitCost: s.price, quantity: 1, unit: '--', markup: 0 };
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
              <SourceIcon source="Folder" />
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

  const anyActive = SOURCE_ORDER.some(s => sources[s]);

  const cardContent = (
    <>
      {/* Header */}
      <div style={{ padding: '20px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          {variant !== 'panel' && <BdsText as="div" size="normal-sm" style={{ color: 'var(--bds-color-gray-40)', marginBottom: 2 }}>Job title</BdsText>}
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
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', cursor: 'pointer', borderRadius: 6, borderBottom: '1px solid var(--bds-color-gray-15)', marginBottom: 4 }}>
                      <input
                        type="checkbox"
                        checked={allSourcesSelected}
                        ref={el => { if (el) el.indeterminate = !allSourcesSelected && SOURCE_ORDER.some(s => sources[s]); }}
                        onChange={toggleAllSources}
                        style={{ width: 16, height: 16, accentColor: 'var(--bds-color-blue-60)' }}
                      />
                      <BdsText as="span" size="heavy-sm" style={{ fontSize: 13 }}>Select all</BdsText>
                    </label>
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
      </div>

      {/* Body */}
      <div style={{ padding: '16px 28px', overflowY: 'auto', overflowX: 'auto', flex: 1, background: 'var(--bds-color-base-background)' }}>
        {!anyActive ? (
          <div style={{ ...cardStyle, padding: 32, textAlign: 'center' }}><BdsText as="span" size="normal-md" style={{ color: 'var(--bds-color-gray-40)' }}>No record types selected.</BdsText></div>
        ) : (
          <>
            {sources['Estimate'] && renderPctSection('Estimate', ESTIMATE_ROWS)}
            {sources['Change Orders'] && renderPctSection('Change Orders', CO_ROWS)}
            {sources['Selections'] && renderSelectionSection()}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 28px', background: 'var(--bds-color-base-background)', borderTop: '1px solid var(--bds-color-gray-15)', borderRadius: variant === 'panel' ? 0 : '0 0 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexShrink: 0 }}>
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
      <div className="bds-scope bds-real-scope" style={{ background: 'var(--bds-color-base-background)', borderRadius: 12, width: 1040, maxWidth: '97vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        {cardContent}
      </div>
    </div>,
    document.body,
  );
}
