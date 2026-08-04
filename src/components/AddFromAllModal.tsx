import { useState } from 'react';
import { createPortal } from 'react-dom';
import { fmt } from '../utils';
import { getNextId } from '../mockData';
import { BdsButton, BdsText, BdsIcon } from '../bds';
import {
  AllowanceCard,
  StandaloneCard,
  availableAllowances,
  availableStandalone,
  allowanceToOutGroup,
  standaloneToOutGroup,
  variance,
  standaloneTotal,
  hasPending,
  type OutGroup,
} from './SelectionCards';
import { useCostsState, CostsDateFilter, CostsRecordsList, costOptions, OptionCheck, KIND_ORDER, KIND_LABEL } from './CostsModal';

/* ─────────────────────────────────────────────────────────────────────────
   Unified "Add to invoice" wizard — grouped by source. Each source gets a
   title and its line items underneath, keeping that source's native columns:
     • Estimate / Change Orders → Client price · Invoice overview · New invoice % · amount
       (with an Adjust Invoice % / Apply all control)
     • Selections → the SAME allowance / selection cards as the "Add selections
       to invoice" wizard (SelectionsModalV5), rendered from the shared
       SelectionCards module so this view can't drift from it.
     • Costs (includeCosts only) → the SAME bill / time-clock / QuickBooks
       record list as the standalone "Add costs to invoice" modal, rendered from
       CostsModal's exported list so the two can't drift. Here it arrives
       without that modal's banner or filter card: the cost kinds nest under
       "Costs" in this bar's Record type menu, and the import options fold into
       the single Options menu beside it. That modal still exists on its own in
       the "Add from" menu; this is a second, wider entry point, not a
       replacement.
   Styled with BDS components + design tokens.
   ───────────────────────────────────────────────────────────────────────── */

type SourceKey = 'Estimate' | 'Change Orders' | 'Selections' | 'Costs';
const BASE_SOURCES: SourceKey[] = ['Estimate', 'Change Orders', 'Selections'];

interface PctRow { id: string; title: string; costCode: string; costType: string; clientPrice: number; prevPct: number; }

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

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (lineItems: any[]) => void;
  /** Selections route through the invoice's selections handler so allowance
      true-ups land as the same rolled-up lines the selections wizard produces. */
  onAddSelections?: (groups: OutGroup[], opts?: { grouped?: boolean }) => void;
  /** Child ids already on the invoice — those cards drop out of the list. */
  addedChildIds?: string[];
  /** "Combined view 2": adds Costs (bills + time clock) as a fourth record type,
      so one pass covers estimate, change orders, selections AND job costs. Off
      by default, which leaves the original combined view untouched. */
  includeCosts?: boolean;
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

export default function AddFromAllModal({ open, onClose, onAdd, onAddSelections, addedChildIds = [], variant = 'modal', includeCosts = false }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [sources, setSources] = useState<Record<SourceKey, boolean>>({ Estimate: true, 'Change Orders': true, Selections: true, Costs: true });
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);
  // Combined view 2's single "Options" menu — every on/off import option in one
  // place, so the filter bar stays four controls wide.
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  // Carry each source record's description / internal notes onto the invoice
  // line, same option the selections wizard offers.
  const [includeDescs, setIncludeDescs] = useState(true);
  const [query, setQuery] = useState('');
  const [pct, setPct] = useState<Record<string, number>>({});
  const [adjust, setAdjust] = useState<Record<SourceKey, string>>({ Estimate: '100.00', 'Change Orders': '100.00', Selections: '100.00', Costs: '100.00' });
  // Cards start expanded, same as the selections wizard; undefined = expanded.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const isExpanded = (id: string) => !collapsed[id];
  const toggleExpand = (id: string) => setCollapsed(c => ({ ...c, [id]: !c[id] }));
  /* Costs keep their own state (record checks, date / record-type filters, bill
     and time-clock import options) because they're the same records the costs
     modal shows — the hook is that modal's, so the two can't drift. Called
     unconditionally: hooks can't hide behind includeCosts. */
  const costs = useCostsState({ query });

  if (!open) return null;

  const SOURCE_ORDER: SourceKey[] = includeCosts ? [...BASE_SOURCES, 'Costs'] : BASE_SOURCES;
  const costsOn = includeCosts && sources['Costs'];

  // Selections come from the same source of truth as the selections wizard.
  const allowances = availableAllowances(addedChildIds);
  const standalone = availableStandalone(addedChildIds);
  // Every available allowance here is finalized (pending ones are filtered out),
  // so it's treated as marked-complete — that's what unlocks its true-up amount.
  const complete = (a: (typeof allowances)[number]) => !hasPending(a);
  // Charges (overage / on-budget) vs. credits owed back to the client.
  const chargeCards = allowances.filter(a => variance(a) >= 0);
  const creditCards = allowances.filter(a => variance(a) < 0);
  // Settled-on-budget allowances aren't invoiceable, so they aren't selectable.
  const billableAllowances = allowances.filter(a => variance(a) !== 0);

  // Search filters what's LISTED, not what's selected: anything already checked
  // stays checked and keeps counting toward the subtotal, so searching can't
  // silently drop items you've picked.
  const q = query.trim().toLowerCase();
  const hit = (...vals: (string | undefined)[]) => vals.some(v => (v ?? '').toLowerCase().includes(q));
  const matchPct = (r: PctRow) => !q || hit(r.title, r.costCode, r.costType);
  const matchAllowance = (a: (typeof allowances)[number]) =>
    !q || hit(a.name, a.costCode) || a.selections.some(sel => hit(sel.name, sel.title, sel.costCode));
  const matchStandalone = (g: (typeof standalone)[number]) =>
    !q || hit(g.title) || g.options.some(o => hit(o.name, o.costCode));

  const visibleEstimate = ESTIMATE_ROWS.filter(matchPct);
  const visibleCO = CO_ROWS.filter(matchPct);
  const visibleCharges = chargeCards.filter(matchAllowance);
  const visibleCredits = creditCards.filter(matchAllowance);
  const visibleStandalone = standalone.filter(matchStandalone);
  const visibleSelectionCount = visibleCharges.length + visibleCredits.length + visibleStandalone.length;
  // The costs list does its own query filtering inside useCostsState.
  const visibleCostCount = costsOn ? costs.visible.length : 0;
  const nothingMatches = q.length > 0
    && visibleEstimate.length === 0 && visibleCO.length === 0 && visibleSelectionCount === 0
    && visibleCostCount === 0;

  const pctAmount = (r: PctRow) => r.clientPrice * (pct[r.id] ?? 0) / 100;
  const rowAmount = (id: string): number => {
    const e = ESTIMATE_ROWS.find(r => r.id === id); if (e) return pctAmount(e);
    const c = CO_ROWS.find(r => r.id === id); if (c) return pctAmount(c);
    const a = billableAllowances.find(x => x.id === id); if (a) return variance(a);
    const g = standalone.find(x => x.id === id); if (g) return standaloneTotal(g);
    return 0;
  };

  const idsForSource = (src: SourceKey): string[] => {
    if (!sources[src]) return [];
    if (src === 'Estimate') return ESTIMATE_ROWS.map(r => r.id);
    if (src === 'Change Orders') return CO_ROWS.map(r => r.id);
    // Cost records track their own checked state in useCostsState, not here.
    if (src === 'Costs') return [];
    return [...billableAllowances.map(a => a.id), ...standalone.map(g => g.id)];
  };
  const allIds = SOURCE_ORDER.flatMap(idsForSource);
  const checkedIds = allIds.filter(id => checked[id]);
  // Cost records price off builder cost, so their own subtotal joins this one.
  const checkedCostRecords = costsOn ? costs.checkedRecords : [];
  const subtotal = checkedIds.reduce((s, id) => s + rowAmount(id), 0)
    + checkedCostRecords.reduce((s, r) => s + r.total, 0);
  const selectedCount = checkedIds.length + checkedCostRecords.length;
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
  const toggleSource = (s: SourceKey) => setSources(p => ({ ...p, [s]: !p[s] }));
  const applyAll = (src: SourceKey) => {
    const val = parseFloat(adjust[src]) || 0;
    const rows = src === 'Estimate' ? visibleEstimate : src === 'Change Orders' ? visibleCO : [];
    setPct(p => { const n = { ...p }; rows.forEach(r => { n[r.id] = val; }); return n; });
  };

  const handleAdd = () => {
    // Estimate / Change Orders → plain line items at their invoice %.
    const items = checkedIds
      .map(id => ESTIMATE_ROWS.find(r => r.id === id) || CO_ROWS.find(r => r.id === id))
      .filter(Boolean)
      .map(e => ({ id: getNextId(), description: e!.title, costCode: e!.costCode, costType: e!.costType === 'None' ? 'Material' : e!.costType, unitCost: pctAmount(e!), quantity: 1, unit: '--', markup: 0 }));
    if (items.length > 0) onAdd(items);

    // Selections → the same rolled-up groups the selections wizard emits.
    const groups: OutGroup[] = [
      ...billableAllowances.filter(a => checked[a.id]).map(a => allowanceToOutGroup(a, complete(a))),
      ...standalone.filter(g => checked[g.id]).map(standaloneToOutGroup),
    ];
    if (groups.length > 0) onAddSelections?.(groups, { grouped: true });

    // Costs → the same lines the costs modal and Auto fill produce.
    if (costsOn) {
      const costItems = costs.toLineItems();
      if (costItems.length > 0) onAdd(costItems);
    }

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
  // Narrow panel / narrow window: the table scrolls sideways inside its card
  // instead of squashing columns until the right-hand ones are clipped away.
  const scrollerStyle: React.CSSProperties = { overflowX: 'auto', maxWidth: '100%' };
  const pctTableStyle: React.CSSProperties = { width: '100%', minWidth: 860, borderCollapse: 'collapse' };
  const cellVal = (v: string, opts?: { strong?: boolean; muted?: boolean }) => (
    <BdsText as="span" size={opts?.strong ? 'heavy-md' : 'normal-md'} style={{ color: opts?.muted ? 'var(--bds-color-gray-50)' : 'var(--bds-color-gray-90)', fontSize: 13 }}>{v}</BdsText>
  );

  // Spacing between top-level record-type groups (Estimate → Change Orders →
  // Allowances with selections → Credits owed → Selections). The selections
  // sub-groups sit inside .selv2-sections, whose 10px flex gap is already
  // between them, so they subtract it to land on the same visual gap.
  const GROUP_GAP = 40;

  const renderPctSection = (src: SourceKey, rows: PctRow[]) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12, flexWrap: 'wrap' }}>
        <BdsText as="span" size="heavy-md">{src}</BdsText>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <BdsText as="span" size="normal-sm" style={{ color: 'var(--bds-color-gray-50)' }}>Adjust invoice %</BdsText>
          <NumField value={adjust[src]} onChange={v => setAdjust(p => ({ ...p, [src]: v }))} suffix="%" width={52} />
          <BdsButton displayType="secondary" text="Apply all" onClick={() => applyAll(src)} />
        </div>
      </div>
      <div style={cardStyle}>
        <div style={scrollerStyle}>
        <table style={pctTableStyle}>
          <thead><tr style={{ borderBottom: '1px solid var(--bds-color-gray-15)', background: 'var(--bds-color-gray-5)' }}>
            {titleHeader(rows.map(r => r.id), 'Title')}{thText('Cost code')}{thText('Cost types')}
            {/* Invoice overview reads left-aligned — header and bar share the
                column's left edge instead of hugging the numeric columns. */}
            {thText('Client price', true)}
            <th style={{ ...TH_L, paddingLeft: 20 }}><BdsText as="span" size="heavy-sm" style={{ color: 'var(--bds-color-gray-50)' }}>Invoice overview</BdsText></th>
            {thText('New invoice %', true)}
            <th style={{ ...TH_R, paddingRight: 14 }}><BdsText as="span" size="heavy-sm" style={{ color: 'var(--bds-color-gray-50)' }}>New invoice amount</BdsText></th>
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--bds-color-gray-10)' }}>
                <td style={{ ...TD_L, paddingLeft: 14 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Check id={r.id} />{cellVal(r.title)}</div></td>
                <td style={TD_L}>{cellVal(r.costCode)}</td>
                <td style={TD_L}>{cellVal(r.costType, { muted: true })}</td>
                <td style={TD_R}>{cellVal('$' + fmt(r.clientPrice))}</td>
                <td style={{ ...TD_L, paddingLeft: 20 }}><div style={{ display: 'flex', justifyContent: 'flex-start' }}><OverviewBar prevPct={r.prevPct} /></div></td>
                <td style={TD_R}><NumField value={(pct[r.id] ?? 0).toString()} onChange={v => setPct(p => ({ ...p, [r.id]: parseFloat(v) || 0 }))} suffix="%" /></td>
                <td style={{ ...TD_R, paddingRight: 14 }}>{cellVal('$' + fmt(pctAmount(r)), { strong: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );

  // The Selections record type renders as peer sections titled like Estimate /
  // Change Orders, using the SAME cards as the selections wizard.
  // Section titles are text only — no source glyphs. Expand all / Collapse all
  // lives in the filter bar up top, not on these rows.
  const sectionHeading = (label: string) => (
    <div style={{ marginBottom: 8 }}>
      <BdsText as="span" size="heavy-md">{label}</BdsText>
    </div>
  );

  // One control for every allowance + selection card, on the first section's
  // heading row. Collapsed is keyed per card, so "expand all" clears the keys.
  const selectionCardIds = [...allowances.map(a => a.id), ...standalone.map(g => g.id)];
  const allExpanded = selectionCardIds.length > 0 && selectionCardIds.every(id => isExpanded(id));
  const toggleExpandAll = () => setCollapsed(() => {
    const next: Record<string, boolean> = {};
    selectionCardIds.forEach(id => { next[id] = allExpanded; });
    return next;
  });
  const expandAllBtn = (
    <button
      type="button"
      className="est-expand-btn"
      onClick={toggleExpandAll}
      style={{ height: 38, boxSizing: 'border-box', padding: '0 16px', borderRadius: 8, fontSize: 14 }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 20l5-5 5 5" /><path d="M7 4l5 5 5-5" /></svg>
      {allExpanded ? 'Collapse all' : 'Expand all'}
    </button>
  );

  const renderAllowanceCard = (a: (typeof allowances)[number]) => (
    <AllowanceCard
      key={a.id}
      a={a}
      complete={complete(a)}
      checked={!!checked[a.id]}
      expanded={isExpanded(a.id)}
      onToggleCheck={() => { if (variance(a) !== 0) setChecked(p => ({ ...p, [a.id]: !p[a.id] })); }}
      onToggleExpand={() => toggleExpand(a.id)}
      showIcon={false}
    />
  );

  const renderSelectionSection = () => (
    <div className="selv2-sections">
      {visibleCharges.length > 0 && (
        <>
          {sectionHeading('Allowances with selections')}
          {visibleCharges.map(renderAllowanceCard)}
        </>
      )}
      {visibleCredits.length > 0 && (
        // Flex column + gap so the cards inside this wrapper get the same
        // spacing .selv2-sections gives its own direct children.
        <div style={{ marginTop: visibleCharges.length > 0 ? GROUP_GAP - 10 : 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sectionHeading('Credits owed')}
          <div className="selv2-section-help">You've invoiced more than the approved selections on these completed allowances. Apply the credit to this invoice, or refund it at the end of the job.</div>
          {visibleCredits.map(renderAllowanceCard)}
        </div>
      )}
      {visibleStandalone.length > 0 && (
        <div style={{ marginTop: visibleCharges.length + visibleCredits.length > 0 ? GROUP_GAP - 10 : 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sectionHeading('Selections')}
          {visibleStandalone.map(g => (
            <StandaloneCard
              key={g.id}
              g={g}
              checked={!!checked[g.id]}
              expanded={isExpanded(g.id)}
              onToggleCheck={() => { if (standaloneTotal(g) !== 0) setChecked(p => ({ ...p, [g.id]: !p[g.id] })); }}
              onToggleExpand={() => toggleExpand(g.id)}
            />
          ))}
        </div>
      )}
      {visibleSelectionCount === 0 && !q && (
        <div className="selv2-empty">No selections to add.</div>
      )}
    </div>
  );

  /* Costs in the body is just the record list — the same bill and time-clock
     rows the costs modal shows. Its Date / record-type / import options live in
     this wizard's filter bar with Search and Record type, and its
     recommendation banner is dropped: with four record types stacked here, a
     banner about one of them read as a note about the whole invoice. */
  const renderCostsSection = () => (
    <div>
      {sectionHeading('Costs')}
      <CostsRecordsList s={costs} showReset={false} />
    </div>
  );

  const anyActive = SOURCE_ORDER.some(s => sources[s]);
  /* The Options menu's contents: the wizard-level descriptions toggle plus,
     when Costs is showing, that section's import options. The count on the
     button reads off this same list, so it can't drift from the menu. */
  const allOptions = [
    { on: includeDescs, toggle: () => setIncludeDescs(v => !v), label: 'Include line item descriptions & notes' },
    ...(costsOn ? costOptions(costs) : []),
  ];
  const optionsLabel = (
    <BdsText as="div" size="heavy-sm" style={{ marginBottom: 6 }}>Options</BdsText>
  );

  const cardContent = (
    <>
      {/* Header */}
      <div style={{ padding: '20px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', flexShrink: 0 }}>
        <div>
          {variant !== 'panel' && <BdsText as="div" size="normal-sm" style={{ color: 'var(--bds-color-gray-40)', marginBottom: 2 }}>Job title</BdsText>}
          <BdsText as="div" size="distinct-lg">Add to invoice</BdsText>
        </div>
        <BdsButton displayType="tertiary" ariaLabel="Close" icon={<BdsIcon name="x" size={18} />} onClick={onClose} />
      </div>

      {/* Filter bar */}
      <div style={{ borderBottom: '1px solid var(--bds-color-gray-15)', flexShrink: 0 }}>
      <div style={{ padding: '0 28px 18px', display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <BdsText as="div" size="heavy-sm" style={{ marginBottom: 6 }}>Search</BdsText>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, boxSizing: 'border-box', padding: '0 12px', border: '1px solid var(--bds-color-gray-15)', borderRadius: 8, background: 'var(--bds-color-base-background)', minWidth: 260 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: 'var(--bds-color-gray-50)' }}><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Title, cost code, selection…"
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, fontFamily: 'inherit', color: 'var(--bds-color-gray-90)' }}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'var(--bds-color-gray-50)' }}>
                <BdsIcon name="x" size={12} />
              </button>
            )}
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
                      <div key={s}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', cursor: 'pointer', borderRadius: 6 }}>
                          <input type="checkbox" checked={sources[s]} onChange={() => toggleSource(s)} style={{ width: 16, height: 16, accentColor: 'var(--bds-color-blue-60)' }} />
                          <BdsText as="span" size="normal-md" style={{ fontSize: 13 }}>{s}</BdsText>
                        </label>
                        {/* Costs is the only source with more than one kind of
                            record behind it, so its three sources nest under it
                            here rather than standing as a second record-type
                            control elsewhere in the bar. Indented and shown only
                            while Costs is on — off, they'd filter nothing. */}
                        {s === 'Costs' && sources['Costs'] && (
                          <div style={{ paddingLeft: 22, borderLeft: '1px solid var(--bds-color-gray-15)', marginLeft: 18 }}>
                            {KIND_ORDER.map(k => (
                              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', borderRadius: 6 }}>
                                <input type="checkbox" checked={costs.kinds[k]} onChange={() => costs.toggleKind(k)} style={{ width: 15, height: 15, accentColor: 'var(--bds-color-blue-60)' }} />
                                <BdsText as="span" size="normal-md" style={{ fontSize: 13, color: 'var(--bds-color-gray-70)' }}>{KIND_LABEL[k]}</BdsText>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* No selected-source chips — the section titles in the body already
                say which record types are showing, so chips only repeated them. */}
          </div>
        </div>
        {/* Combined view 2 has one more source and a set of costs options, so
            loose checkboxes in this bar don't scale: everything that is an
            on/off import option collapses into a single Options menu, which
            keeps the bar to Search · Record type · Cost date · Options. The
            original combined view has only the one checkbox, so it stays
            inline there rather than hiding a single toggle behind a click. */}
        {includeCosts ? (
          <>
            {costsOn && <CostsDateFilter s={costs} />}
            <div>
              {optionsLabel}
              <div style={{ position: 'relative' }}>
                <BdsButton
                  displayType="secondary"
                  text={`${allOptions.filter(o => o.on).length} of ${allOptions.length} on`}
                  iconRight={<BdsIcon name="chevron-down" size={12} />}
                  onClick={() => setOptionsMenuOpen(o => !o)}
                />
                {optionsMenuOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1 }} onClick={() => setOptionsMenuOpen(false)} />
                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'var(--bds-color-base-background)', border: '1px solid var(--bds-color-gray-15)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '8px 12px', zIndex: 2, minWidth: 300 }}>
                      <OptionCheck o={{ on: includeDescs, toggle: () => setIncludeDescs(v => !v), label: 'Include line item descriptions & notes' }} />
                      {costsOn && costOptions(costs).length > 0 && (
                        <>
                          {/* Subhead, because these apply to the Costs section
                              only — the one above applies to every source. */}
                          <BdsText as="div" size="heavy-sm" style={{ color: 'var(--bds-color-gray-50)', margin: '8px 0 2px', paddingTop: 6, borderTop: '1px solid var(--bds-color-gray-15)' }}>
                            Costs
                          </BdsText>
                          {costOptions(costs).map(o => <OptionCheck key={o.label} o={o} />)}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', alignSelf: 'flex-end', paddingBottom: 8 }}>
            <input
              type="checkbox"
              checked={includeDescs}
              onChange={() => setIncludeDescs(v => !v)}
              style={{ width: 16, height: 16, accentColor: 'var(--bds-color-blue-60)', cursor: 'pointer' }}
            />
            <BdsText as="span" size="normal-md" style={{ fontSize: 13 }}>Include line item descriptions &amp; notes</BdsText>
          </label>
        )}
        {sources['Selections'] && selectionCardIds.length > 0 && (
          <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>{expandAllBtn}</div>
        )}
      </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 28px', overflowY: 'auto', overflowX: 'auto', flex: 1, background: 'var(--bds-color-base-background)' }}>
        {!anyActive ? (
          <div style={{ ...cardStyle, padding: 32, textAlign: 'center' }}><BdsText as="span" size="normal-md" style={{ color: 'var(--bds-color-gray-40)' }}>No record types selected.</BdsText></div>
        ) : nothingMatches ? (
          <div style={{ ...cardStyle, padding: 32, textAlign: 'center' }}><BdsText as="span" size="normal-md" style={{ color: 'var(--bds-color-gray-40)' }}>No items match &ldquo;{query.trim()}&rdquo;.</BdsText></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: GROUP_GAP }}>
            {sources['Estimate'] && visibleEstimate.length > 0 && renderPctSection('Estimate', visibleEstimate)}
            {sources['Change Orders'] && visibleCO.length > 0 && renderPctSection('Change Orders', visibleCO)}
            {sources['Selections'] && (visibleSelectionCount > 0 || !q) && renderSelectionSection()}
            {costsOn && (visibleCostCount > 0 || !q) && renderCostsSection()}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 28px', background: 'var(--bds-color-base-background)', borderTop: '1px solid var(--bds-color-gray-15)', borderRadius: variant === 'panel' ? 0 : '0 0 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexShrink: 0 }}>
        <div>
          <BdsText as="div" size="normal-sm" style={{ color: 'var(--bds-color-gray-50)' }}>
            Invoice subtotal{includeCosts ? ` · ${selectedCount} selected` : ''}
          </BdsText>
          <BdsText as="div" size="heavy-lg">${fmt(subtotal)}</BdsText>
        </div>
        <BdsButton displayType="primary" text="Add to invoice" disabled={selectedCount === 0} onClick={handleAdd} />
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
      {/* Combined view 2 matches the costs modal's 1440: it carries a fourth
          record type plus four filter columns in the header, and at 1040 the
          Bill / Time Clock option columns wrapped onto a second line while the
          estimate table clipped its right-hand amounts. The original combined
          view keeps 1040 — three sources fit it. */}
      <div className="bds-scope bds-real-scope" style={{ background: 'var(--bds-color-base-background)', borderRadius: 12, width: includeCosts ? 1440 : 1040, maxWidth: '97vw', maxHeight: includeCosts ? '92vh' : '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        {cardContent}
      </div>
    </div>,
    document.body,
  );
}
