import { Fragment, useState, type ReactNode } from 'react';
import { fmt } from '../utils';

interface SovLine {
  id: string;
  description: string;
  costCode: string;
  /** Cost code's name, so a cost-code group reads as a phase and not a number. */
  costCodeName: string;
  /** The estimate group this line came from. Deliberately cross-cuts cost code:
      the two groupings have to disagree or the picker demonstrates nothing. */
  estimateGroup: string;
  scheduledValue: number;
  fromPrevious: number;
  thisPeriod: number;
}

/* The two grouping strategies BTNet actually supports. Per Epic 284004,
   LineItemGroupStrategy is CostCode = 0 or Estimate = 1 (Global.Core/Enums/
   CustomerInvoices/CustomerInvoices.cs), and there is no custom ordering and no
   cost-category level. So this picker offers exactly two options, on purpose:
   adding a third here would prototype something the platform can't express.
   Cost code is the default because that is what the builder-level preference
   (GroupLineItemsByCostCode) defaults to. */
type GroupBy = 'costCode' | 'estimate';

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'costCode', label: 'Group by cost code' },
  { value: 'estimate', label: 'Group by estimate' },
];

// Schedule of values for the reimagined page's progress-invoice path. Column
// names match the standalone Progress Invoice (AIA) page so the two read as the
// same concept, trimmed to the essential set that fits inline in the form.
export const INITIAL_LINES: SovLine[] = [
  { id: 'sov-1', description: 'Framing labor', costCode: '2100', costCodeName: 'Rough Carpentry', estimateGroup: 'Structure', scheduledValue: 42000, fromPrevious: 21000, thisPeriod: 12500 },
  { id: 'sov-2', description: 'Framing lumber package', costCode: '2100', costCodeName: 'Rough Carpentry', estimateGroup: 'Structure', scheduledValue: 16800, fromPrevious: 8400, thisPeriod: 5200 },
  { id: 'sov-3', description: 'Rough plumbing', costCode: '2200', costCodeName: 'Plumbing', estimateGroup: 'Mechanicals', scheduledValue: 18000, fromPrevious: 9000, thisPeriod: 6800 },
  { id: 'sov-4', description: 'Electrical rough-in', costCode: '2300', costCodeName: 'Electrical', estimateGroup: 'Mechanicals', scheduledValue: 16000, fromPrevious: 4000, thisPeriod: 5400 },
  { id: 'sov-5', description: 'Cabinet hardware materials', costCode: '6090', costCodeName: 'Cabinets', estimateGroup: 'Kitchen', scheduledValue: 9500, fromPrevious: 0, thisPeriod: 1700 },
  { id: 'sov-6', description: 'Kitchen countertop allowance', costCode: '6200', costCodeName: 'Countertops', estimateGroup: 'Kitchen', scheduledValue: 14000, fromPrevious: 0, thisPeriod: 4200 },
  { id: 'sov-7', description: 'Tile backsplash', costCode: '9070', costCodeName: 'Tile', estimateGroup: 'Kitchen', scheduledValue: 6400, fromPrevious: 0, thisPeriod: 2100 },
  { id: 'sov-8', description: 'Tile, guest bath', costCode: '9070', costCodeName: 'Tile', estimateGroup: 'Baths', scheduledValue: 5200, fromPrevious: 2600, thisPeriod: 1300 },
];

const money = (n: number) => `$${fmt(n)}`;

interface Totals { scheduledValue: number; fromPrevious: number; thisPeriod: number; toDate: number; balance: number }

const sum = (ls: SovLine[]): Totals =>
  ls.reduce(
    (acc, l) => {
      const toDate = l.fromPrevious + l.thisPeriod;
      return {
        scheduledValue: acc.scheduledValue + l.scheduledValue,
        fromPrevious: acc.fromPrevious + l.fromPrevious,
        thisPeriod: acc.thisPeriod + l.thisPeriod,
        toDate: acc.toDate + toDate,
        balance: acc.balance + (l.scheduledValue - toDate),
      };
    },
    { scheduledValue: 0, fromPrevious: 0, thisPeriod: 0, toDate: 0, balance: 0 },
  );

interface Props {
  /** Appended to the LEFT cluster, after the group-by picker. Mode-setting
      controls live here so they read as a group: what shape is this invoice,
      how is it grouped. The billing type switch goes here, in the same relative
      slot it occupies on the line-items path, so it doesn't move between paths. */
  toolbarLeft?: ReactNode;
  /** Right side of the toolbar row, for actions. "Add from" goes here, matching
      where it sits above the line-items grid. */
  toolbarRight?: ReactNode;
}

export default function ProgressInvoiceGrid({ toolbarLeft, toolbarRight }: Props) {
  const [lines, setLines] = useState<SovLine[]>(INITIAL_LINES);
  const [groupBy, setGroupBy] = useState<GroupBy>('costCode');

  const setThisPeriod = (id: string, value: number) =>
    setLines(ls => ls.map(l => (l.id === id ? { ...l, thisPeriod: value } : l)));

  const totals = sum(lines);

  /* Groups keep first-appearance order rather than sorting alphabetically, so a
     builder who has ordered their estimate sees that order preserved. */
  const groupKey = (l: SovLine) => (groupBy === 'costCode' ? `${l.costCode} - ${l.costCodeName}` : l.estimateGroup);
  const groups: { key: string; lines: SovLine[] }[] = [];
  lines.forEach(l => {
    const key = groupKey(l);
    const existing = groups.find(g => g.key === key);
    if (existing) existing.lines.push(l);
    else groups.push({ key, lines: [l] });
  });

  const th: React.CSSProperties = { textAlign: 'right', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { textAlign: 'right', whiteSpace: 'nowrap' };

  const lineRow = (l: SovLine) => {
    const toDate = l.fromPrevious + l.thisPeriod;
    const pct = l.scheduledValue > 0 ? (toDate / l.scheduledValue) * 100 : 0;
    return (
      <tr key={l.id}>
        <td>
          {/* Indented under its group header, and the subtitle drops whichever
              field the current grouping already shows in that header. */}
          <div style={{ paddingLeft: 16 }}>
            <div style={{ fontWeight: 500, color: 'var(--g800)' }}>{l.description}</div>
            <div style={{ fontSize: 12, color: 'var(--g500)' }}>
              {groupBy === 'costCode' ? l.estimateGroup : `${l.costCode} - ${l.costCodeName}`}
            </div>
          </div>
        </td>
        <td style={td}>{money(l.scheduledValue)}</td>
        <td style={td}>{money(l.fromPrevious)}</td>
        <td style={td}>
          <input
            type="number"
            className="fi"
            style={{ width: 110, textAlign: 'right', padding: '6px 8px' }}
            value={l.thisPeriod || ''}
            placeholder="0.00"
            onChange={e => setThisPeriod(l.id, parseFloat(e.target.value) || 0)}
          />
        </td>
        <td style={td}>{money(toDate)}</td>
        <td style={{ ...td, textAlign: 'center' }}>{pct.toFixed(0)}%</td>
        <td style={td}>{money(l.scheduledValue - toDate)}</td>
      </tr>
    );
  };

  /* Group subtotals, in the same columns as the lines. A schedule of values gets
     read by the client, so a group whose amounts don't add up in place is worse
     than no grouping at all. */
  const groupRow = (key: string, ls: SovLine[]) => {
    const t = sum(ls);
    const pct = t.scheduledValue > 0 ? (t.toDate / t.scheduledValue) * 100 : 0;
    const cell: React.CSSProperties = { ...td, fontWeight: 600, background: 'var(--g50)' };
    return (
      <tr key={'g-' + key} style={{ borderTop: '1px solid var(--g200)' }}>
        <td style={{ fontWeight: 700, color: 'var(--g800)', background: 'var(--g50)' }}>{key}</td>
        <td style={cell}>{money(t.scheduledValue)}</td>
        <td style={cell}>{money(t.fromPrevious)}</td>
        <td style={cell}>{money(t.thisPeriod)}</td>
        <td style={cell}>{money(t.toDate)}</td>
        <td style={{ ...cell, textAlign: 'center' }}>{pct.toFixed(0)}%</td>
        <td style={cell}>{money(t.balance)}</td>
      </tr>
    );
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <select
          className="fi"
          /* Extra right padding so the native chevron doesn't sit on the label's
             last character, which it does at width:auto. */
          style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: 13, cursor: 'pointer' }}
          value={groupBy}
          onChange={e => setGroupBy(e.target.value as GroupBy)}
          aria-label="Group line items by"
        >
          {GROUP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {toolbarLeft}
        </div>
        {toolbarRight && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>{toolbarRight}</div>
        )}
      </div>

      <div className="lt-scroll liv2-lt-scroll">
        <table className="lt">
          <thead>
            <tr>
              <th style={{ minWidth: 220 }}>Description</th>
              <th style={th}>Scheduled value</th>
              <th style={th}>From previous application</th>
              <th style={th}>This period</th>
              <th style={th}>Total completed to date</th>
              <th style={{ ...th, textAlign: 'center' }}>% complete</th>
              <th style={th}>Balance to finish</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(g => (
              <Fragment key={g.key}>
                {groupRow(g.key, g.lines)}
                {g.lines.map(lineRow)}
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--g200)', background: 'var(--g50)' }}>
              <td style={{ fontWeight: 700, fontSize: 14, padding: '20px 16px' }}>Total</td>
              <td style={{ ...td, fontWeight: 700, padding: '20px 16px' }}>{money(totals.scheduledValue)}</td>
              <td style={{ ...td, fontWeight: 700, padding: '20px 16px' }}>{money(totals.fromPrevious)}</td>
              <td style={{ ...td, fontWeight: 700, padding: '20px 16px' }}>{money(totals.thisPeriod)}</td>
              <td style={{ ...td, fontWeight: 700, padding: '20px 16px' }}>{money(totals.toDate)}</td>
              <td style={{ padding: '20px 16px' }}></td>
              <td style={{ ...td, fontWeight: 700, padding: '20px 16px' }}>{money(totals.balance)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 0' }}>
        <div style={{ minWidth: 260 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 13, color: 'var(--g700)', marginBottom: 4 }}>
            <span>Completed to date</span><span>{money(totals.toDate)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 13, color: 'var(--g700)' }}>
            <span>Less previous applications</span><span>−{money(totals.fromPrevious)}</span>
          </div>
          <div style={{ borderTop: '1px solid var(--g200)', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 16, fontWeight: 700, color: 'var(--bt-midnight)' }}>
            <span>Amount due this period</span><span>{money(totals.thisPeriod)}</span>
          </div>
          <div style={{ textAlign: 'right', marginTop: 6 }}>
            <button type="button" className="btn-g" style={{ fontSize: 13, textDecoration: 'underline' }}>See full price breakdown</button>
          </div>
        </div>
      </div>
    </>
  );
}
