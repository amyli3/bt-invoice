import { useState } from 'react';
import { createPortal } from 'react-dom';
import { fmt } from '../utils';
import { getNextId } from '../mockData';
import { BdsButton, BdsText, BdsIcon } from '../bds';

/* ─────────────────────────────────────────────────────────────────────────
   "Add costs to invoice" — job costs not yet billed to the client, listed as
   RECORDS rather than loose line items: each row is a bill or a time-clock
   batch, expandable to the lines inside it. Matches the shipped modal: Date /
   Record type / per-source option groups in the filter card, then a
   Select all + Expand all / Collapse all toolbar above the list.

   Kept separate from the combined Estimate/Change Orders/Selections view
   (AddFromAllModal) since costs price off builder cost, and bills and time
   clock each carry their own import options.

   Recommendations (US #283497, research #284248): the service hands back
   EVERYTHING eligible, each record flagged with whether the builder's own
   history says they normally bill that job + cost code. The flag drives
   default checked state and emphasis only — the client never filters on it,
   because a wrong exclusion is invisible and loses revenue while a wrong
   recommendation is one click to undo.
   ───────────────────────────────────────────────────────────────────────── */

export type RecordKind = 'Bill' | 'Time Clock' | 'QuickBooks';
export const KIND_ORDER: RecordKind[] = ['Bill', 'Time Clock', 'QuickBooks'];
/* Menu / chip wording. The type name is singular and internal; what the builder
   reads is the plural source ("Bills"), and QuickBooks costs says which costs —
   "QuickBooks" alone reads as the integration rather than a cost source. */
export const KIND_LABEL: Record<RecordKind, string> = {
  Bill: 'Bills',
  'Time Clock': 'Time clock',
  QuickBooks: 'QuickBooks costs',
};

/* Three states, from the prior-invoicing rate on this job + cost code:
   'recommended'    — rate ≥80%; these get invoiced 88.2% of the time
   'no-history'     — nothing comparable billed before; invoiced 34.3%
   'never-invoiced' — this cost code has never been billed here; invoiced 0.8%
   Rule measures 82.1% precision / 66.4% recall, so roughly one in five
   pre-checked rows is something the builder wouldn't have billed — which is
   why the review list has to make what's checked obvious. */
type Recommendation = 'recommended' | 'no-history' | 'never-invoiced';
const REC_RANK: Record<Recommendation, number> = { recommended: 0, 'no-history': 1, 'never-invoiced': 2 };

/* The list shows two groups, not three. 'no-history' and 'never-invoiced' both
   arrive unchecked, so they belong under one heading; the difference between
   them is carried by de-emphasis, not by a separate section. */
const groupOf = (r: { recommendation: Recommendation }) =>
  r.recommendation === 'recommended' ? 'recommended' : 'other';

interface CostLine {
  id: string;
  name: string;
  costCode: string;
  costType: string;
  amount: number;
  /** Bills: line description. Time clock: shift note. Shown when the
      matching "descriptions & notes" / "internal notes" option is on. */
  note?: string;
}

export interface CostRecord {
  id: string;
  kind: RecordKind;
  title: string;
  /** Cost code (bills) or pay type (time clock) — the row's subtitle. */
  subtitle: string;
  /** "Bill date: …" for bills, "Shift date(s): …" for time clock. */
  dateLabel: string;
  approved: boolean;
  /** Builder cost of the record — what "Bill total" / "Time Clock total" shows. */
  total: number;
  /** Owner price already agreed for this work, where there is one. Drives the
      "Include builder variance" option. */
  ownerPrice?: number;
  attachments?: number;
  /** What the builder's history says about billing this job + cost code.
      Sets the default checked state and the row's emphasis — never whether
      the row renders at all. */
  recommendation: Recommendation;
  /** Why, in the builder's own terms. The endpoint returns this alongside the
      flag, but it is deliberately NOT rendered per row: it names cost codes the
      collapsed row doesn't show. Kept so a future surface (an expanded-row
      detail, say) has it without changing the contract. */
  reason: string;
  lines: CostLine[];
}

const COST_RECORDS: CostRecord[] = [
  {
    id: 'bill-0004', kind: 'Bill', title: '0004 - Site Preparation', subtitle: 'Buildertrend Misc.',
    dateLabel: 'Bill date: Oct 29, 2024', approved: true, total: 344, ownerPrice: 400, attachments: 1,
    recommendation: 'recommended', reason: "You've billed Sitework on all 9 invoices for this job",
    lines: [
      { id: 'bill-0004-a', name: 'Lot clearing & grading', costCode: '02.20 - Sitework', costType: 'Subcontractor', amount: 264, note: 'Includes haul-off of brush' },
      { id: 'bill-0004-b', name: 'Silt fence', costCode: '02.20 - Sitework', costType: 'Material', amount: 80 },
    ],
  },
  {
    id: 'bill-0009', kind: 'Bill', title: '0009 - Tile', subtitle: 'Buildertrend Misc.',
    dateLabel: 'Bill date: Oct 29, 2024', approved: true, total: 122, ownerPrice: 122,
    recommendation: 'recommended', reason: 'Tile has been billed on 5 of the last 5 invoices for this job',
    lines: [
      { id: 'bill-0009-a', name: 'Porcelain tile — guest bath', costCode: '9070 - Tile', costType: 'Material', amount: 122 },
    ],
  },
  {
    id: 'bill-0011', kind: 'Bill', title: '0011 - Paint', subtitle: 'Buildertrend Misc.',
    dateLabel: 'Bill date: Nov 21, 2025', approved: false, total: 25000, ownerPrice: 23800, attachments: 2,
    recommendation: 'no-history', reason: 'No billing history for Painting on this job yet',
    lines: [
      { id: 'bill-0011-a', name: 'Interior paint — whole house', costCode: '09.30 - Painting', costType: 'Subcontractor', amount: 18500, note: 'Two coats, walls + ceilings' },
      { id: 'bill-0011-b', name: 'Exterior paint', costCode: '09.30 - Painting', costType: 'Subcontractor', amount: 6500 },
    ],
  },
  {
    id: 'bill-misc', kind: 'Bill', title: 'bill', subtitle: 'Buildertrend Misc.',
    dateLabel: 'Bill date: Nov 21, 2025', approved: false, total: 46798,
    recommendation: 'never-invoiced', reason: 'Cabinets and Appliances have never been billed on this job',
    lines: [
      { id: 'bill-misc-a', name: 'Cabinetry deposit', costCode: '9040 - Cabinets', costType: 'Material', amount: 31798 },
      { id: 'bill-misc-b', name: 'Appliance package', costCode: '9060 - Appliances', costType: 'Material', amount: 15000 },
    ],
  },
  {
    id: 'tc-electrical', kind: 'Time Clock', title: 'Labor', subtitle: 'Electrical',
    dateLabel: 'Shift date: Dec 3, 2025', approved: true, total: 650,
    recommendation: 'recommended', reason: 'Electrical labor is billed on almost every invoice for this job',
    lines: [
      { id: 'tc-electrical-a', name: 'M. Reyes — 8.0 hrs @ $52.00', costCode: 'Electrical', costType: 'Labor', amount: 416, note: 'Rough-in, second floor' },
      { id: 'tc-electrical-b', name: 'J. Alvarez — 4.5 hrs @ $52.00', costCode: 'Electrical', costType: 'Labor', amount: 234 },
    ],
  },
  {
    id: 'tc-flatrate', kind: 'Time Clock', title: 'Labor', subtitle: 'Buildertrend Flat Rate',
    dateLabel: 'Shift dates: Nov 13, 2025 - Nov 26, 2025', approved: true, total: 12029,
    recommendation: 'recommended', reason: "You've billed Rough Carpentry labor on 11 of 12 past invoices",
    lines: [
      { id: 'tc-flatrate-a', name: 'Crew — week of Nov 13', costCode: '06.10 - Rough Carpentry', costType: 'Labor', amount: 6180 },
      { id: 'tc-flatrate-b', name: 'Crew — week of Nov 20', costCode: '06.10 - Rough Carpentry', costType: 'Labor', amount: 5849, note: 'Short week — holiday' },
    ],
  },
  /* Costs entered in QuickBooks and synced back to the job — the third source
     the Auto fill banner already names ("accounting costs"). They arrive as
     posted expenses, so there is no approval state and no attachments. */
  {
    id: 'qb-1042', kind: 'QuickBooks', title: 'Expense 1042 - Lumber yard', subtitle: 'QuickBooks Online',
    dateLabel: 'Posted: Nov 18, 2025', approved: true, total: 8460, ownerPrice: 9100,
    recommendation: 'recommended', reason: "You've billed Rough Carpentry material on 10 of 12 past invoices",
    lines: [
      { id: 'qb-1042-a', name: 'Framing lumber package', costCode: '06.10 - Rough Carpentry', costType: 'Material', amount: 8460 },
    ],
  },
  {
    id: 'qb-1067', kind: 'QuickBooks', title: 'Expense 1067 - Dumpster rental', subtitle: 'QuickBooks Online',
    dateLabel: 'Posted: Dec 1, 2025', approved: true, total: 725,
    recommendation: 'no-history', reason: 'No billing history for General Conditions on this job yet',
    lines: [
      { id: 'qb-1067-a', name: '30 yd roll-off — 2 hauls', costCode: '01.50 - General Conditions', costType: 'Other', amount: 725 },
    ],
  },
];

/* One invoice line per record, at the record's builder cost. Descriptions /
   internal notes ride along when their source's option is on.

   Shared with the invoice page's "Auto fill" button so the one-click path and
   the reviewed path produce byte-identical lines. If they diverge, a builder
   who auto fills gets different numbers than one who reviews, which is the
   worst possible outcome for a money surface. */
export function recordsToLineItems(
  records: CostRecord[],
  { billDescs = true, tcInternalNotes = true }: { billDescs?: boolean; tcInternalNotes?: boolean } = {},
) {
  return records.map(r => {
    // QuickBooks expenses carry no notes of their own, so they ride with the
    // bill option rather than needing a third checkbox for nothing.
    const wantNotes = r.kind === 'Time Clock' ? tcInternalNotes : billDescs;
    const notes = wantNotes ? r.lines.map(l => l.note).filter(Boolean).join(' · ') : '';
    return {
      id: getNextId(),
      description: notes ? `${r.title}: ${notes}` : r.title,
      costCode: r.lines[0]?.costCode ?? r.subtitle,
      // Must be a member of COST_TYPES or the row's select falls back to "None".
      costType: r.kind === 'Time Clock' ? 'Labor' : (r.lines[0]?.costType ?? 'Material'),
      unitCost: r.total,
      quantity: 1,
      unit: '--',
      markup: 0,
      // Traceability back to the source record, so a builder reviewing the
      // invoice can see which bill or time-clock batch a line came from.
      // Time clock records are all titled "Labor" and only tell apart by pay
      // type, so the tag uses the subtitle or every one reads the same.
      relatedItem: r.kind === 'Time Clock'
        ? { type: 'timeClock' as const, name: r.subtitle, groupId: r.id }
        : r.kind === 'QuickBooks'
        ? { type: 'quickBooks' as const, name: r.title, groupId: r.id }
        : { type: 'bill' as const, name: r.title, groupId: r.id },
    };
  });
}

/* What "Auto fill" puts on the invoice: the recommended records only, exactly
   the set the modal arrives with pre-checked. Callers must treat an empty
   result as "hide the trigger" rather than opening an empty flow. */
export const autoFillRecords = () => COST_RECORDS.filter(r => r.recommendation === 'recommended');
export const autoFillLineItems = () => recordsToLineItems(autoFillRecords());
export const autoFillTotal = () => autoFillRecords().reduce((s, r) => s + r.total, 0);

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (lineItems: any[]) => void;
  /** Shown above the title, as the shipped modal does for the job / vendor. */
  jobName?: string;
  variant?: 'modal' | 'panel';
}

const KindIcon = ({ kind }: { kind: RecordKind }) => {
  const c = 'var(--bds-color-gray-60)';
  if (kind === 'QuickBooks') {
    // Ledger sheet with a currency mark — an accounting entry, not a bill.
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect x="2.4" y="2.4" width="11.2" height="11.2" rx="2" stroke={c} strokeWidth="1.2" />
        <path d="M8 4.9v6.2M9.7 6.3H7.3a1.15 1.15 0 0 0 0 2.3h1.4a1.15 1.15 0 0 1 0 2.3H6.2" stroke={c} strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'Bill') {
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <path d="M3.5 1.75h6.7l2.3 2.3v10.2H3.5z" stroke={c} strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M10 1.9V4.3h2.4M5.6 7.4h4.8M5.6 10h4.8" stroke={c} strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6.25" stroke={c} strokeWidth="1.2" />
      <path d="M8 4.6V8l2.4 1.6" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: 'var(--bds-color-gray-50)' }}>
    <rect x="2.25" y="3.25" width="11.5" height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M2.25 6.25h11.5M5.5 2v2.4M10.5 2v2.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/* Stand-in for BdsIconSparkle, which the real app already uses for this kind
   of "the product did some work for you" affordance. */
const SparkleIcon = ({ size = 15, color = 'var(--bds-color-info-foreground)' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
    <path d="M6.8 1.2 7.9 5.7 12.4 6.8 7.9 7.9 6.8 12.4 5.7 7.9 1.2 6.8 5.7 5.7Z" fill={color} />
    <path d="M12.2 9.6 12.8 11.6 14.8 12.2 12.8 12.8 12.2 14.8 11.6 12.8 9.6 12.2 11.6 11.6Z" fill={color} opacity="0.7" />
  </svg>
);

const InfoIcon = ({ title }: { title: string }) => (
  <span title={title} style={{ display: 'inline-flex', cursor: 'help' }}>
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--bds-color-gray-50)' }}>
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 7.1v4M8 5.1v.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  </span>
);

const CONTROL_H = 38;

/** Recommended records arrive checked. Everything else is listed and left for
    the builder — the flag never decides what shows up. */
const initialChecked = () =>
  Object.fromEntries(COST_RECORDS.filter(r => r.recommendation === 'recommended').map(r => [r.id, true]));

/* State + derived values for the costs list, in a hook so two surfaces can
   render the same content: this modal, and the "Combined view 2" wizard, which
   shows Estimate / Change Orders / Selections and these costs in one pass.
   Neither surface owns the logic, so they can't drift apart. */
export function useCostsState({ query = '' }: { query?: string } = {}) {
  const [checked, setChecked] = useState<Record<string, boolean>>(initialChecked);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [kinds, setKinds] = useState<Record<RecordKind, boolean>>({ Bill: true, 'Time Clock': true, QuickBooks: true });
  const [dateRange, setDateRange] = useState('All');
  const [approvedOnly, setApprovedOnly] = useState(false);
  // Bill options
  const [billDescs, setBillDescs] = useState(true);
  const [billAttachments, setBillAttachments] = useState(true);
  const [builderVariance, setBuilderVariance] = useState(false);
  // Time Clock options
  const [tcInternalNotes, setTcInternalNotes] = useState(true);

  // Recommended first, then no-history, then never-invoiced — so the review
  // list reads top-down from "we're confident" to "probably not, but here it is."
  const inScope = COST_RECORDS
    .filter(r => kinds[r.kind] && (!approvedOnly || r.kind !== 'Bill' || r.approved))
    .slice()
    .sort((a, b) => REC_RANK[a.recommendation] - REC_RANK[b.recommendation]);
  /* Search (only the combined wizard passes one) narrows what's LISTED, not
     what's selected: a record checked before you typed keeps counting toward
     the subtotal, so searching can't silently drop it from the invoice. */
  const q = query.trim().toLowerCase();
  const hit = (...vals: (string | undefined)[]) => vals.some(v => (v ?? '').toLowerCase().includes(q));
  const visible = !q ? inScope : inScope.filter(r =>
    hit(r.title, r.subtitle, r.dateLabel) || r.lines.some(l => hit(l.name, l.costCode, l.costType)));
  const visibleIds = visible.map(r => r.id);
  const checkedRecords = inScope.filter(r => checked[r.id]);
  const subtotal = checkedRecords.reduce((s, r) => s + r.total, 0);

  const recommended = inScope.filter(r => r.recommendation === 'recommended');
  const recommendedTotal = recommended.reduce((s, r) => s + r.total, 0);
  const isRecommendedSelection =
    recommended.length > 0 && checkedRecords.length === recommended.length &&
    recommended.every(r => checked[r.id]);
  const selectRecommended = () =>
    setChecked(() => Object.fromEntries(recommended.map(r => [r.id, true])));

  const allChecked = visibleIds.length > 0 && visibleIds.every(id => checked[id]);
  const someChecked = visibleIds.some(id => checked[id]);
  const toggleAll = () => {
    const v = !allChecked;
    setChecked(p => { const n = { ...p }; visibleIds.forEach(id => { n[id] = v; }); return n; });
  };

  const anyExpanded = visibleIds.some(id => expanded[id]);
  const allExpanded = visibleIds.length > 0 && visibleIds.every(id => expanded[id]);
  const setAllExpanded = (v: boolean) =>
    setExpanded(p => { const n = { ...p }; visibleIds.forEach(id => { n[id] = v; }); return n; });

  const toggleKind = (k: RecordKind) => setKinds(p => ({ ...p, [k]: !p[k] }));

  /* The invoice lines for whatever is currently checked. Callers add these on
     their own "Add" button, so both surfaces emit identical lines. */
  const toLineItems = () => recordsToLineItems(checkedRecords, { billDescs, tcInternalNotes });

  return {
    checked, setChecked, expanded, setExpanded, kinds, dateRange, setDateRange,
    approvedOnly, setApprovedOnly, billDescs, setBillDescs, billAttachments, setBillAttachments,
    builderVariance, setBuilderVariance, tcInternalNotes, setTcInternalNotes,
    query: q, inScope, visible, visibleIds, checkedRecords, subtotal, recommended, recommendedTotal,
    isRecommendedSelection, selectRecommended, allChecked, someChecked, toggleAll,
    anyExpanded, allExpanded, setAllExpanded, toggleKind, toLineItems,
  };
}

export type CostsState = ReturnType<typeof useCostsState>;

/* The costs content itself: why-we-pre-checked banner, filter card, records
   list. No header, footer or subtotal — the surface embedding it owns those.

   showBanner=false drops the recommendation banner. Combined view 2 turns it
   off: that wizard stacks four record types, and a banner explaining only the
   costs section read as a page-level announcement about the whole invoice. The
   "Recommended items to invoice" / "Other unbilled costs" headings and the
   pre-checked boxes still carry the defaults there. */
/* ─── shared bits, module-level so the filters and the list can be rendered in
       different places (Combined view 2 puts the filters in its header) ─── */
const cardStyle: React.CSSProperties = {
  background: 'var(--bds-color-base-background)',
  border: '1px solid var(--bds-color-gray-15)',
  borderRadius: 10,
};
const columnLabel = (label: string, info?: string) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
    <BdsText as="span" size="heavy-sm">{label}</BdsText>
    {info && <InfoIcon title={info} />}
  </div>
);
const check = (on: boolean, onToggle: () => void, label: string, info?: string) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', padding: '3px 0' }}>
    <input
      type="checkbox"
      checked={on}
      onChange={onToggle}
      style={{ width: 16, height: 16, accentColor: 'var(--bds-color-blue-60)', cursor: 'pointer', flexShrink: 0 }}
    />
    <BdsText as="span" size="normal-md" style={{ fontSize: 13 }}>{label}</BdsText>
    {info && <InfoIcon title={info} />}
  </label>
);
const toolbarBtn = (label: string, onClick: () => void, disabled: boolean) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      height: CONTROL_H, boxSizing: 'border-box', padding: '0 16px', borderRadius: 8,
      border: '1px solid var(--bds-color-gray-15)', background: 'var(--bds-color-base-background)',
      fontSize: 14, fontFamily: 'inherit', fontWeight: 500,
      color: disabled ? 'var(--bds-color-gray-30)' : 'var(--bds-color-gray-70)',
      cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap',
    }}
  >
    {label}
  </button>
);

/* The four filter / option columns — Date, Record type, Bill options, Time
   Clock options — as bare columns with no card around them. The costs modal
   wraps them in its filter card; Combined view 2 drops them straight into its
   own filter bar next to Search and Record type, so the costs list arrives
   with no filter card of its own.

   recordTypeLabel exists because Combined view 2 already has a control labeled
   "Record type" (the four record types) in that same bar. Two identical labels
   side by side, one filtering the whole wizard and one filtering only bills vs.
   time clock, is unreadable — so that surface says "Cost record type". */
export function CostsFilters({ s, recordTypeLabel = 'Record type' }: { s: CostsState; recordTypeLabel?: string }) {
  const {
    kinds, dateRange, setDateRange, approvedOnly, setApprovedOnly,
    billDescs, setBillDescs, billAttachments, setBillAttachments,
    builderVariance, setBuilderVariance, tcInternalNotes, setTcInternalNotes, toggleKind,
  } = s;
  return (
    <>
      <div style={{ minWidth: 180 }}>
        {columnLabel('Date', 'Filters records by their invoice or shift date.')}
        <select
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
          style={{
            height: CONTROL_H, boxSizing: 'border-box', width: '100%', padding: '0 10px', borderRadius: 8,
            border: '1px solid var(--bds-color-gray-15)', background: 'var(--bds-color-base-background)',
            fontSize: 14, fontFamily: 'inherit', color: 'var(--bds-color-gray-90)', cursor: 'pointer',
          }}
        >
          <option>All</option>
          <option>This month</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
      </div>

      <div>
        {columnLabel(recordTypeLabel)}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: 6, borderRadius: 8, border: '1px solid var(--bds-color-gray-15)', minHeight: CONTROL_H, boxSizing: 'border-box' }}>
          {KIND_ORDER.filter(k => kinds[k]).map(k => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', borderRadius: 20, border: '1px solid var(--bds-color-gray-15)', background: 'var(--bds-color-base-background)' }}>
              <KindIcon kind={k} />
              <BdsText as="span" size="normal-md" style={{ fontSize: 13 }}>{KIND_LABEL[k]}</BdsText>
              <button type="button" onClick={() => toggleKind(k)} aria-label={`Remove ${KIND_LABEL[k]}`} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'var(--bds-color-gray-50)' }}>
                <BdsIcon name="x" size={12} />
              </button>
            </span>
          ))}
          {/* Removing a type leaves a way to put it back. */}
          {KIND_ORDER.filter(k => !kinds[k]).map(k => (
            <button
              key={k}
              type="button"
              onClick={() => toggleKind(k)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, border: '1px dashed var(--bds-color-gray-20)', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: 'var(--bds-color-gray-50)' }}
            >
              + {KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 10 }}>
          {check(approvedOnly, () => setApprovedOnly(v => !v), 'Show approved bills only')}
        </div>
      </div>

      {kinds['Bill'] && (
        <div>
          {columnLabel('Bill options')}
          {check(billDescs, () => setBillDescs(v => !v), 'Include line item descriptions & notes')}
          {check(billAttachments, () => setBillAttachments(v => !v), 'Import attachments to invoice', 'Bill attachments are copied onto the invoice for the client.')}
          {check(builderVariance, () => setBuilderVariance(v => !v), 'Include builder variance')}
        </div>
      )}

      {kinds['Time Clock'] && (
        <div>
          {columnLabel('Time Clock options')}
          {check(tcInternalNotes, () => setTcInternalNotes(v => !v), 'Include internal notes')}
        </div>
      )}
    </>
  );
}

/* Combined view 2's version of the costs filters: two controls instead of four
   columns. Cost record type is gone — it's nested under "Costs" in that
   wizard's own Record type menu — and the Bill / Time Clock option columns
   collapse into one "Cost options" dropdown, so the whole costs filter set
   fits on the same header row as Search and Record type. Same state, same
   effects; only the packaging is denser. */
export interface ToggleOption { on: boolean; toggle: () => void; label: string; info?: string }

/* The costs import options as data, so Combined view 2 can fold them into one
   shared "Options" menu alongside its own wizard-level option instead of
   standing up a second dropdown. Only options whose source is showing are
   listed — a bill option with bills filtered out toggles nothing. */
export function costOptions(s: CostsState): ToggleOption[] {
  const {
    kinds, approvedOnly, setApprovedOnly, billDescs, setBillDescs,
    billAttachments, setBillAttachments, builderVariance, setBuilderVariance,
    tcInternalNotes, setTcInternalNotes,
  } = s;
  return [
    ...(kinds['Bill'] || kinds['QuickBooks'] ? [
      { on: billDescs, toggle: () => setBillDescs(v => !v), label: 'Include line item descriptions & notes' },
      { on: billAttachments, toggle: () => setBillAttachments(v => !v), label: 'Import attachments to invoice', info: 'Bill attachments are copied onto the invoice for the client.' },
      { on: builderVariance, toggle: () => setBuilderVariance(v => !v), label: 'Include builder variance' },
    ] : []),
    ...(kinds['Time Clock'] ? [
      { on: tcInternalNotes, toggle: () => setTcInternalNotes(v => !v), label: 'Include internal notes' },
    ] : []),
    ...(kinds['Bill'] ? [
      { on: approvedOnly, toggle: () => setApprovedOnly(v => !v), label: 'Show approved bills only' },
    ] : []),
  ];
}

/** One option row, so an embedding surface renders these the way the modal does. */
export const OptionCheck = ({ o }: { o: ToggleOption }) => <>{check(o.on, o.toggle, o.label, o.info)}</>;

/** Just the date filter, labeled for a bar where other sources sit beside it. */
export function CostsDateFilter({ s, label = 'Cost date' }: { s: CostsState; label?: string }) {
  const { dateRange, setDateRange } = s;
  return (
    <div style={{ minWidth: 150 }}>
      {columnLabel(label, 'Filters costs by their bill, shift or posted date.')}
      <select
        value={dateRange}
        onChange={e => setDateRange(e.target.value)}
        style={{
          height: CONTROL_H, boxSizing: 'border-box', width: '100%', padding: '0 10px', borderRadius: 8,
          border: '1px solid var(--bds-color-gray-15)', background: 'var(--bds-color-base-background)',
          fontSize: 14, fontFamily: 'inherit', color: 'var(--bds-color-gray-90)', cursor: 'pointer',
        }}
      >
        <option>All</option>
        <option>This month</option>
        <option>Last 30 days</option>
        <option>Last 90 days</option>
      </select>
    </div>
  );
}

/* The list card — Select all / Expand all toolbar, the two group headings, and
   the bill and time-clock records themselves.

   showReset=false drops "Reset to recommended". Combined view 2 turns it off:
   the banner that explains what "recommended" means isn't on that surface, so
   the button would name a concept the builder was never shown. The costs modal
   keeps both. */
export function CostsRecordsList({ s, showReset = true }: { s: CostsState; showReset?: boolean }) {
  const {
    checked, setChecked, expanded, setExpanded, kinds, billDescs, billAttachments,
    builderVariance, tcInternalNotes, query, visible, visibleIds, recommended,
    isRecommendedSelection, selectRecommended, allChecked, someChecked, toggleAll,
    anyExpanded, allExpanded, setAllExpanded,
  } = s;

  const recordRow = (r: CostRecord) => {
    const isOpen = !!expanded[r.id];
    // QuickBooks expenses carry no notes of their own, so they ride with the
    // bill option rather than needing a third checkbox for nothing.
    const wantNotes = r.kind === 'Time Clock' ? tcInternalNotes : billDescs;
    const variance = r.ownerPrice != null ? r.ownerPrice - r.total : null;
    const dimmed = r.recommendation === 'never-invoiced';
    return (
      <div
        key={r.id}
        /* Recommended rows get no fill, no badge and no per-row reason. The
           banner explains the pre-checking once; the checkbox state carries it
           from there. Tinting four of six rows made the list read as two
           different kinds of thing rather than one list with defaults, and the
           per-row reason cited cost codes ("Sitework") that the collapsed row
           never shows, so it explained a recommendation using a term the
           builder couldn't see. */
        style={{
          border: '1px solid var(--bds-color-gray-15)',
          background: 'var(--bds-color-base-background)',
          borderRadius: 8, overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', flexWrap: 'wrap' }}>
          <input
            type="checkbox"
            checked={!!checked[r.id]}
            onChange={() => setChecked(p => ({ ...p, [r.id]: !p[r.id] }))}
            style={{ width: 16, height: 16, accentColor: 'var(--bds-color-blue-60)', cursor: 'pointer', flexShrink: 0 }}
          />
          <button
            type="button"
            onClick={() => setExpanded(p => ({ ...p, [r.id]: !p[r.id] }))}
            aria-label={isOpen ? 'Collapse' : 'Expand'}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'var(--bds-color-gray-60)', flexShrink: 0 }}
          >
            <BdsIcon name={isOpen ? 'chevron-down' : 'chevron-right'} size={15} />
          </button>

          {/* Only the descriptive half is de-emphasized — never the checkbox or
              the amount, which stay fully legible so the row is still actionable.
              Fixed basis rather than flex-grow so the date chip starts at the
              same x on every row instead of drifting with title length. */}
          <div style={{ flex: '0 1 300px', minWidth: 150, opacity: dimmed ? 0.65 : 1 }}>
            <BdsText as="div" size="heavy-md">{r.title}</BdsText>
            <BdsText as="div" size="normal-sm" style={{ color: 'var(--bds-color-gray-50)', marginTop: 2 }}>{r.subtitle}</BdsText>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 20, background: 'var(--bds-color-gray-5)', flexShrink: 0 }}>
            <CalendarIcon />
            <BdsText as="span" size="normal-md" style={{ fontSize: 13, color: 'var(--bds-color-gray-70)' }}>{r.dateLabel}</BdsText>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <BdsText as="span" size="normal-md" style={{ fontSize: 13, color: 'var(--bds-color-gray-50)' }}>
              {r.kind === 'Bill' ? 'Bill total:' : r.kind === 'Time Clock' ? 'Time Clock total:' : 'Expense total:'}
            </BdsText>
            <BdsText as="span" size="heavy-md">${fmt(r.total)}</BdsText>
            <KindIcon kind={r.kind} />
          </div>
        </div>

        {isOpen && (
          <div style={{ borderTop: '1px solid var(--bds-color-gray-10)', background: 'var(--bds-color-base-background)', padding: '4px 16px 12px 54px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 12px 8px 0' }}><BdsText as="span" size="heavy-sm" style={{ color: 'var(--bds-color-gray-50)' }}>Line item</BdsText></th>
                  <th style={{ textAlign: 'left', padding: '8px 12px 8px 0' }}><BdsText as="span" size="heavy-sm" style={{ color: 'var(--bds-color-gray-50)' }}>Cost code</BdsText></th>
                  <th style={{ textAlign: 'left', padding: '8px 12px 8px 0' }}><BdsText as="span" size="heavy-sm" style={{ color: 'var(--bds-color-gray-50)' }}>Cost type</BdsText></th>
                  <th style={{ textAlign: 'right', padding: '8px 0 8px 12px' }}><BdsText as="span" size="heavy-sm" style={{ color: 'var(--bds-color-gray-50)' }}>Amount</BdsText></th>
                </tr>
              </thead>
              <tbody>
                {r.lines.map(l => (
                  <tr key={l.id} style={{ borderTop: '1px solid var(--bds-color-gray-15)' }}>
                    <td style={{ padding: '10px 12px 10px 0' }}>
                      <BdsText as="div" size="normal-md" style={{ fontSize: 13 }}>{l.name}</BdsText>
                      {wantNotes && l.note && (
                        <BdsText as="div" size="normal-sm" style={{ color: 'var(--bds-color-gray-50)', marginTop: 2 }}>{l.note}</BdsText>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px 10px 0' }}><BdsText as="span" size="normal-md" style={{ fontSize: 13 }}>{l.costCode}</BdsText></td>
                    <td style={{ padding: '10px 12px 10px 0' }}><BdsText as="span" size="normal-md" style={{ fontSize: 13, color: 'var(--bds-color-gray-50)' }}>{l.costType}</BdsText></td>
                    <td style={{ padding: '10px 0 10px 12px', textAlign: 'right' }}><BdsText as="span" size="normal-md" style={{ fontSize: 13 }}>${fmt(l.amount)}</BdsText></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Builder variance = owner price already agreed vs. what the cost
                came in at. Shown only with the option on and both figures known. */}
            {builderVariance && variance != null && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 10 }}>
                <BdsText as="span" size="normal-md" style={{ fontSize: 13, color: 'var(--bds-color-gray-50)' }}>Builder variance:</BdsText>
                <BdsText as="span" size="heavy-md" style={{ color: variance < 0 ? 'var(--bds-color-red-60)' : 'var(--bds-color-green-70)' }}>
                  {variance < 0 ? '-' : ''}${fmt(Math.abs(variance))}
                </BdsText>
              </div>
            )}
            {billAttachments && r.kind === 'Bill' && !!r.attachments && (
              <BdsText as="div" size="normal-sm" style={{ color: 'var(--bds-color-gray-50)', paddingTop: 8 }}>
                {r.attachments} attachment{r.attachments > 1 ? 's' : ''} will be imported to the invoice
              </BdsText>
            )}
          </div>
        )}
      </div>
    );
  };

  // List card — Select all · Reset to recommended · Expand all / Collapse all.
  return (
      <div style={{ ...cardStyle, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={allChecked}
              ref={el => { if (el) el.indeterminate = !allChecked && someChecked; }}
              onChange={toggleAll}
              style={{ width: 16, height: 16, accentColor: 'var(--bds-color-blue-60)', cursor: 'pointer' }}
            />
            <BdsText as="span" size="normal-md">Select all</BdsText>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {showReset && recommended.length > 0 && toolbarBtn('Reset to recommended', selectRecommended, isRecommendedSelection)}
            {toolbarBtn('Expand all', () => setAllExpanded(true), allExpanded || visibleIds.length === 0)}
            {toolbarBtn('Collapse all', () => setAllExpanded(false), !anyExpanded)}
          </div>
        </div>

        {visible.length === 0 ? (
          <div style={{ padding: '28px 0', textAlign: 'center' }}>
            <BdsText as="span" size="normal-md" style={{ color: 'var(--bds-color-gray-40)' }}>
              {KIND_ORDER.every(k => !kinds[k])
                ? 'No record types selected.'
                : query ? `No costs match \u201c${query}\u201d.` : 'No costs to add.'}
            </BdsText>
          </div>
        ) : visible.map((r, i) => (
          <div key={r.id} style={{ display: 'contents' }}>
            {/* Two groups, each with its own heading, so "why is this checked"
                and "why isn't this checked" are answered by position rather
                than by per-row annotation. */}
            {groupOf(r) !== (i > 0 ? groupOf(visible[i - 1]) : null) && (
              <BdsText as="h4" size="heavy-sm" style={{ color: 'var(--bds-color-gray-70)', margin: i > 0 ? '8px 0 0' : '2px 0 0' }}>
                {groupOf(r) === 'recommended' ? 'Recommended items to invoice' : 'Other unbilled costs'}
              </BdsText>
            )}
            {recordRow(r)}
          </div>
        ))}
      </div>
  );
}


/* The whole costs surface stacked the way the standalone costs modal shows it:
   recommendation banner, filter card, list card. Combined view 2 does not use
   this — it hosts CostsFilters in its own header and renders CostsRecordsList
   on its own, so the costs section there carries no banner and no filter card. */
export function CostsBody({ s }: { s: CostsState }) {
  const { recommended, recommendedTotal, inScope } = s;
  return (
    <>
      {/* Why anything is pre-checked. Built on the semantic info pair
          (info-background fill + info-foreground edge), the same pairing
          cs-filter-active and cs-card-expanded use — not a one-off blue.
          Deliberately does NOT promise a date window: the service applies no
          cutoff, and bills over 180 days old are invoiced more often than
          newer ones, so "since your last invoice" would be a lie.
          All copy sits at gray-70 or darker; gray-50 fails 4.5:1 against
          the info fill. */}
      {recommended.length > 0 && (
        <section
          aria-labelledby="costs-recommendation-heading"
          style={{
            border: '1px solid var(--bds-color-info-foreground)',
            background: 'var(--bds-color-info-background)',
            borderRadius: 'var(--bds-radius-lg)',
            padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start', flexShrink: 0,
          }}
        >
          <div style={{ paddingTop: 2 }}><SparkleIcon size={18} /></div>
          <div>
            <BdsText as="h3" size="heavy-md" id="costs-recommendation-heading" style={{ margin: 0 }}>
              These are the costs we think you should invoice
            </BdsText>
            <BdsText as="p" size="normal-md" style={{ fontSize: 13, color: 'var(--bds-color-gray-70)', margin: '4px 0 0', lineHeight: 1.5 }}>
              We pre-checked <strong>{recommended.length} of {inScope.length} records</strong> (${fmt(recommendedTotal)}) because you've
              billed this work on past invoices for this job. Everything else on the job is listed below, unchecked,
              so you can add whatever belongs here.
            </BdsText>
            <BdsText as="p" size="normal-sm" style={{ color: 'var(--bds-color-gray-70)', margin: '6px 0 0', lineHeight: 1.45 }}>
              This is a starting point, not a decision. Review and adjust before you add. Older costs are included too,
              so nothing you skipped on an earlier invoice gets left behind.
            </BdsText>
          </div>
        </section>
      )}

      {/* Filter card — Date · Record type · Bill options · Time Clock options */}
      <div style={{ ...cardStyle, padding: '20px 24px', display: 'flex', gap: 40, flexWrap: 'wrap', flexShrink: 0 }}>
        <CostsFilters s={s} />
      </div>

      <CostsRecordsList s={s} />
    </>
  );
}


export default function CostsModal({ open, onClose, onAdd, jobName, variant = 'modal' }: Props) {
  const s = useCostsState();

  if (!open) return null;

  const { visible, checkedRecords, subtotal, toLineItems } = s;

  const handleAdd = () => {
    const items = toLineItems();
    if (items.length > 0) onAdd(items);
    onClose();
  };

  const cardContent = (
    <>
      {/* Header */}
      <div style={{ padding: '20px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexShrink: 0 }}>
        <div>
          {jobName && <BdsText as="div" size="normal-sm" style={{ color: 'var(--bds-color-gray-50)', marginBottom: 2 }}>{jobName}</BdsText>}
          <BdsText as="div" size="distinct-lg">Add costs to invoice</BdsText>
        </div>
        <BdsButton displayType="tertiary" ariaLabel="Close" icon={<BdsIcon name="x" size={18} />} onClick={onClose} />
      </div>

      {/* Body */}
      <div style={{ padding: '4px 28px 20px', overflowY: 'auto', flex: 1, background: 'var(--bds-color-gray-5)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <CostsBody s={s} />
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 28px', background: 'var(--bds-color-base-background)', borderTop: '1px solid var(--bds-color-gray-15)', borderRadius: variant === 'panel' ? 0 : '0 0 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexShrink: 0 }}>
        <div>
          <BdsText as="div" size="normal-sm" style={{ color: 'var(--bds-color-gray-50)' }}>
            Invoice subtotal · {checkedRecords.length} of {visible.length} record{visible.length === 1 ? '' : 's'} selected
          </BdsText>
          <BdsText as="div" size="heavy-lg">${fmt(subtotal)}</BdsText>
        </div>
        <BdsButton displayType="primary" text="Add costs to invoice" disabled={checkedRecords.length === 0} onClick={handleAdd} />
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
      <div className="bds-scope bds-real-scope" style={{ background: 'var(--bds-color-base-background)', borderRadius: 12, width: 1440, maxWidth: '97vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        {cardContent}
      </div>
    </div>,
    document.body,
  );
}
