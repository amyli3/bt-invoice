import { useState, useMemo } from 'react';
import BillsPage, { type BillStatus, type BillSeed } from './BillsPage';

/* The Bills grid: the inbox the workflow starts from.

   Tabs are the workflow stages, so a record moving through the detail page moves
   between tabs here. Receipts never appear under Ready for payment, because an
   already-paid receipt has nothing to queue. That gap is the point. */

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Row = {
  id: string;
  job: string;
  billNumber: string;
  title: string;
  type: 'Bill' | 'Receipt' | 'Vendor Credit';
  paidTo: string;
  amount: number;
  amountPaid: number;
  status: BillStatus;
  needsApproval?: boolean;
};

const INITIAL_ROWS: Row[] = [
  { id: 'b1', job: '', billNumber: '', title: '', type: 'Bill', paidTo: '', amount: 15000, amountPaid: 0, status: 'Draft' },
  { id: 'b2', job: 'Johnson Residence', billNumber: '12345', title: 'Electrical rough-in materials', type: 'Receipt', paidTo: 'Home Depot', amount: 604.30, amountPaid: 0, status: 'Draft' },
  { id: 'b3', job: 'Johnson Residence', billNumber: '12346', title: 'Lumber package, second floor', type: 'Bill', paidTo: 'Ferguson Supply', amount: 8420.00, amountPaid: 0, status: 'In review', needsApproval: true },
  { id: 'b4', job: 'Harrison Residence', billNumber: '12347', title: 'Fuel and site consumables', type: 'Receipt', paidTo: 'Home Depot', amount: 312.88, amountPaid: 0, status: 'In review', needsApproval: true },
  { id: 'b5', job: 'Johnson Residence', billNumber: '12348', title: 'Framing labor, week 12', type: 'Bill', paidTo: 'Rexel Electrical', amount: 6250.00, amountPaid: 0, status: 'Ready for payment' },
  { id: 'b6', job: 'Maple Street Remodel', billNumber: '12349', title: 'Tile and setting materials', type: 'Bill', paidTo: 'Ferguson Supply', amount: 2140.75, amountPaid: 0, status: 'Ready for payment' },
  { id: 'b7', job: 'Johnson Residence', billNumber: '12350', title: '15A decora receptacles', type: 'Receipt', paidTo: 'Home Depot', amount: 85.50, amountPaid: 85.50, status: 'Paid' },
  { id: 'b8', job: 'Harrison Residence', billNumber: '12351', title: 'Concrete pour, driveway', type: 'Bill', paidTo: 'Ferguson Supply', amount: 4800.00, amountPaid: 4800.00, status: 'Paid' },
];

/* Tab -> which statuses land in it. All Bills is everything. */
const TABS: { key: string; label: string; match: (r: Row) => boolean }[] = [
  { key: 'inbox', label: 'Inbox', match: r => r.status === 'Draft' },
  { key: 'review', label: 'In Review', match: r => r.status === 'In review' },
  { key: 'ready', label: 'Ready for Payment', match: r => r.status === 'Ready for payment' },
  { key: 'paid', label: 'Paid', match: r => r.status === 'Paid' },
  { key: 'all', label: 'All Bills', match: () => true },
];

const th: React.CSSProperties = {
  padding: '0 14px', fontSize: 14, fontWeight: 600, color: 'var(--g800)',
  textAlign: 'left', whiteSpace: 'nowrap', borderRight: '1px solid var(--g200)',
};

const td: React.CSSProperties = {
  padding: '14px', fontSize: 14, color: 'var(--g800)', whiteSpace: 'nowrap',
};

interface Props {
  jobName?: string;
}

export default function BillsGridPage({ jobName = 'Amy (BWF-26)' }: Props) {
  const [rows, setRows] = useState<Row[]>(INITIAL_ROWS);
  const [tab, setTab] = useState('inbox');
  const [openId, setOpenId] = useState<string | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const visible = useMemo(() => rows.filter(TABS.find(t => t.key === tab)!.match), [rows, tab]);
  const totals = visible.reduce(
    (acc, r) => ({ amount: acc.amount + r.amount, paid: acc.paid + r.amountPaid }),
    { amount: 0, paid: 0 },
  );
  const approvalCount = rows.filter(r => r.needsApproval && r.status === 'In review').length;
  const openRow = rows.find(r => r.id === openId) ?? null;
  const allChecked = visible.length > 0 && visible.every(r => checked.includes(r.id));

  const seedFor = (r: Row): BillSeed => ({
    title: r.title,
    type: r.type,
    status: r.status,
    paidTo: r.paidTo || 'Home Depot',
    billNumber: r.billNumber,
    job: r.job,
    /* A row's own amount has to be the one the detail totals to, otherwise the
       grid and the record disagree the moment you open it. */
    costs: r.id === 'b2' ? undefined : [
      {
        id: `${r.id}-1`, title: r.title || 'Item',
        costCode: '200.40 Electrical Rough-in', costType: 'Material',
        unit: 'ea', unitCost: r.amount, quantity: 1,
      },
    ],
  });

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: 'white', minHeight: '100%', padding: '20px 28px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <div style={{ fontSize: 15, color: 'var(--g700)' }}>{jobName}</div>
          <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--bt-midnight)', letterSpacing: '-0.02em', marginTop: 2 }}>Bills</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {[
            { label: 'Help', d: 'M10 13.5v.5M10 6.5a2 2 0 0 1 1.4 3.4c-.6.6-1.4 1-1.4 2', circle: true },
            { label: 'Filter', d: 'M3 5h14l-5.5 6.5V16l-3 1.5v-6L3 5Z' },
          ].map(icon => (
            <button key={icon.label} type="button" aria-label={icon.label} onClick={() => setToast(`${icon.label} is not wired up in the prototype`)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g700)', display: 'flex', padding: 2 }}>
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                {icon.circle && <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" />}
                <path d={icon.d} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
          <button type="button" aria-label="Export" onClick={() => setToast('Export is not wired up in the prototype')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g700)', display: 'flex', alignItems: 'center', gap: 2, padding: 2 }}>
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <path d="M10 13V3.5M6.5 6.5L10 3l3.5 3.5M3.5 13v3a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button className="btn btn-s" style={{ fontSize: 15, padding: '9px 18px' }} onClick={() => setToast('Forward a bill or receipt to your inbox address')}>
            Email to Inbox
          </button>
          {/* Split primary, matching the grid's own + Bill control */}
          <div style={{ display: 'flex' }}>
            <button
              className="btn btn-p"
              style={{ fontSize: 15, padding: '9px 18px', borderRadius: 'var(--radius) 0 0 var(--radius)' }}
              onClick={() => {
                const id = `b${Date.now()}`;
                setRows(rs => [{ id, job: '', billNumber: '', title: '', type: 'Bill', paidTo: '', amount: 0, amountPaid: 0, status: 'Draft' }, ...rs]);
                setTab('inbox');
                setOpenId(id);
              }}
            >
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M7 2.5v9M2.5 7h9" stroke="white" strokeWidth="1.7" strokeLinecap="round" /></svg>
              Bill
            </button>
            <span style={{ width: 1, background: 'rgba(255,255,255,0.35)' }} />
            <button className="btn btn-p" aria-label="More new options" style={{ borderRadius: '0 var(--radius) var(--radius) 0', padding: '9px 12px' }}
              onClick={() => setToast('New receipt, new vendor credit')}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Purchase Orders / Bills toggle, plus the approvals callout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 18 }}>
        <div style={{ display: 'inline-flex', border: '1px solid var(--g200)', borderRadius: 8, overflow: 'hidden' }}>
          {['Purchase Orders', 'Bills'].map(seg => {
            const active = seg === 'Bills';
            return (
              <button
                key={seg}
                type="button"
                onClick={() => { if (!active) setToast('Purchase orders are out of scope for this prototype'); }}
                style={{
                  padding: '10px 20px', fontSize: 15, fontFamily: 'inherit', cursor: 'pointer', border: 'none',
                  background: active ? 'var(--bt-blue-light)' : 'white',
                  color: active ? 'var(--bt-blue)' : 'var(--g800)', fontWeight: active ? 600 : 500,
                }}
              >{seg}</button>
            );
          })}
        </div>

        {approvalCount > 0 && (
          <button
            type="button"
            onClick={() => setTab('review')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px',
              background: 'var(--yellow-bg)', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 15, color: 'var(--yellow)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="3" y="2" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M6 6h6M6 9h6M6 12h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span><b>{approvalCount}</b> Bills need your approval</span>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}
      </div>

      {/* Stage tabs */}
      <div style={{ display: 'flex', gap: 0, marginTop: 20, borderBottom: '1px solid var(--g200)' }}>
        {TABS.map(t => {
          const active = t.key === tab;
          const count = rows.filter(t.match).length;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 20px', marginBottom: -1, background: 'none', border: 'none',
                borderBottom: `2px solid ${active ? 'var(--bt-blue)' : 'transparent'}`,
                color: active ? 'var(--bt-blue)' : 'var(--g700)', fontWeight: active ? 600 : 500,
                fontSize: 16, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              {t.label}
              <span style={{ marginLeft: 8, fontSize: 13, color: active ? 'var(--bt-blue)' : 'var(--g400)' }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid card */}
      <div style={{ border: '1px solid var(--g200)', borderTop: 'none', background: 'white' }}>
        {/* AI capture drop zone */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20, padding: '16px 20px',
          background: 'var(--g50)', borderBottom: '1px solid var(--g200)',
        }}>
          <span style={{
            padding: '3px 14px', borderRadius: 20, background: 'var(--bt-blue-light)',
            color: 'var(--bt-blue)', fontSize: 15, fontWeight: 600, flexShrink: 0,
          }}>New</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, color: 'var(--g800)' }}>
              Drop bills &amp; receipts anywhere on this page, AI Bill Capture will do the data entry
            </div>
            <div style={{ fontSize: 14, color: 'var(--g500)', marginTop: 2 }}>
              Supports .gif, .png, .jpg, .jpeg, .pdf, .heic
            </div>
          </div>
          <button className="btn btn-s" style={{ fontSize: 15, padding: '9px 18px' }} onClick={() => setToast('Pick a file to run through AI Bill Capture')}>
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
              <path d="M10 13V3.5M6.5 6.5L10 3l3.5 3.5M3.5 13v3a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Browse
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1180 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--g200)', height: 56 }}>
                <th style={{ ...th, width: 52, borderRight: 'none' }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={() => setChecked(allChecked ? [] : visible.map(r => r.id))}
                    style={{ width: 17, height: 17, accentColor: 'var(--bt-blue)' }}
                    aria-label="Select all bills"
                  />
                </th>
                <th style={{ ...th, width: 200 }}>Job</th>
                <th style={{ ...th, width: 130 }}>Bill #</th>
                <th style={{ ...th, minWidth: 260 }}>Bill title</th>
                <th style={{ ...th, width: 190 }}>Pay to</th>
                <th style={{ ...th, width: 150, textAlign: 'right' }}>Bill amount</th>
                <th style={{ ...th, width: 150, textAlign: 'right' }}>Amount paid</th>
                <th style={{ ...th, width: 180, textAlign: 'right', borderRight: 'none' }}>Remaining balance</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--g200)' }}>
                  <td style={{ ...td, paddingLeft: 14 }}>
                    <input
                      type="checkbox"
                      checked={checked.includes(r.id)}
                      onChange={() => setChecked(c => c.includes(r.id) ? c.filter(x => x !== r.id) : [...c, r.id])}
                      style={{ width: 17, height: 17, accentColor: 'var(--bt-blue)' }}
                      aria-label={`Select ${r.title || 'untitled bill'}`}
                    />
                  </td>
                  <td style={td}>{r.job || <span style={{ color: 'var(--g300)' }}>&mdash;</span>}</td>
                  <td style={td}>{r.billNumber || <span style={{ color: 'var(--g300)' }}>&mdash;</span>}</td>
                  <td style={td}>
                    {/* The title is the way in, matching the grid's own link */}
                    <button
                      type="button"
                      onClick={() => setOpenId(r.id)}
                      style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'var(--bt-blue)', textDecoration: 'underline', cursor: 'pointer', textAlign: 'left' }}
                    >
                      {r.title || '(No Title)'}
                    </button>
                    <span style={{
                      marginLeft: 10, padding: '1px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                      background: r.type === 'Receipt' ? 'var(--bt-blue-light)' : 'var(--g100)',
                      color: r.type === 'Receipt' ? 'var(--bt-blue)' : 'var(--g600)',
                    }}>{r.type}</span>
                  </td>
                  <td style={td}>{r.paidTo || 'Unassigned'}</td>
                  <td style={{ ...td, textAlign: 'right' }}>${fmt(r.amount)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>${fmt(r.amountPaid)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>${fmt(r.amount - r.amountPaid)}</td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={8} style={{ ...td, padding: '48px 14px', textAlign: 'center', color: 'var(--g500)' }}>
                  Nothing in {TABS.find(t => t.key === tab)!.label} right now.
                </td></tr>
              )}
              <tr style={{ background: 'var(--g50)' }}>
                <td colSpan={5} style={{ ...td, padding: '16px 14px' }} />
                <td style={{ ...td, padding: '16px 14px', textAlign: 'right', fontWeight: 700 }}>${fmt(totals.amount)}</td>
                <td style={{ ...td, padding: '16px 14px', textAlign: 'right', fontWeight: 700 }}>${fmt(totals.paid)}</td>
                <td style={{ ...td, padding: '16px 14px', textAlign: 'right', fontWeight: 700 }}>${fmt(totals.amount - totals.paid)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* The record, opened over the grid */}
      {openRow && (
        <BillsPage
          key={openRow.id}
          jobName={openRow.job || jobName}
          record={seedFor(openRow)}
          onRecordChange={patch => setRows(rs => rs.map(r => r.id === openRow.id
            ? {
                ...r,
                title: patch.title,
                type: patch.type as Row['type'],
                status: patch.status,
                /* Paid rows show the money as settled, matching the detail's own
                   amount paid and remaining balance lines. */
                amountPaid: patch.status === 'Paid' ? r.amount : 0,
                needsApproval: patch.status === 'In review' ? r.needsApproval : false,
              }
            : r))}
          onClose={() => setOpenId(null)}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bt-midnight)', color: 'white', padding: '10px 18px',
          borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 500, zIndex: 300,
          boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
        }}>{toast}</div>
      )}
    </div>
  );
}
