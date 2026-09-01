import { useState } from 'react';
import '../bds-tokens.css';
import { BdsButton, BdsIcon } from '../bds';
import { DrawScheduleLine } from '../types';

const SCHEDULE_ITEM_OPTIONS = ['Project Start', 'Inspection', 'Removal', 'Installation', 'Final Inspection', 'Final Draw'];
/* Row label, percent, the dollars that percent comes to, then the two text
   columns. Shared by the header and the rows so they can't drift apart. */
const GRID_COLS = '80px 90px 110px 1fr 1fr';
const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface DraftRow {
  percent: number;
  title: string;
  scheduleItem: string;
  // carried over from the existing schedule line at this index, if any, so
  // editing a schedule doesn't silently reset progress already made.
  phaseComplete?: boolean;
  invoiced?: boolean;
}

function draftsFromExisting(draws: DrawScheduleLine[]): DraftRow[] {
  const total = draws.reduce((s, d) => s + d.amount, 0) || 1;
  /* Rounding each draw independently makes an even split miss 100 (six draws
     of 16.67% each round to 102%), so the modal would open already complaining
     about a schedule the builder never touched. The last draw absorbs the
     remainder instead. */
  const rows = draws.map(d => ({
    percent: Math.round((d.amount / total) * 100),
    title: d.title,
    scheduleItem: d.milestone,
    phaseComplete: d.phaseComplete,
    invoiced: d.invoiced,
  }));
  if (rows.length > 0) {
    const head = rows.slice(0, -1).reduce((s, r) => s + r.percent, 0);
    rows[rows.length - 1].percent = 100 - head;
  }
  return rows;
}

function evenSplitDrafts(count: number): DraftRow[] {
  const base = Math.floor(100 / count);
  return Array.from({ length: count }, (_, i) => ({
    percent: i === count - 1 ? 100 - base * (count - 1) : base,
    title: i === 0 ? 'Deposit' : SCHEDULE_ITEM_OPTIONS[Math.min(i, SCHEDULE_ITEM_OPTIONS.length - 1)],
    scheduleItem: SCHEDULE_ITEM_OPTIONS[Math.min(i, SCHEDULE_ITEM_OPTIONS.length - 1)],
  }));
}

export type DrawSeed = { percent: number; title: string; scheduleItem: string };

export default function PaymentScheduleModal({
  existingDraws,
  defaultTotal = 40000,
  initialRows,
  lockFirstRow,
  description,
  onSave,
  onCreate,
  onDelete,
  onClose,
}: {
  existingDraws?: DrawScheduleLine[];
  defaultTotal?: number;
  /* What a brand-new schedule starts as, when the caller knows better than an
     even four-way split: the proposal opens at a single Draw #1. */
  initialRows?: DrawSeed[];
  /* Callers whose surface isn't the Invoices grid say what saving means there;
     the estimate-to-budget wording is wrong on a proposal. */
  description?: string;
  /* Set when Draw #1 isn't the builder's to type here, because it's already
     been set somewhere upstream (the deposit on the proposal). The row shows
     the number and says where it came from instead of letting it drift. */
  /* Draw #1 is set upstream (a requested deposit owns it), so its percent
     reads as a figure rather than a field the builder can fight with. */
  lockFirstRow?: boolean;
  onSave: (draws: DrawScheduleLine[]) => void;
  /* Financial > Invoice only. Save keeps the schedule and leaves the invoices
     to be created draw by draw; Create writes all of them at once, which is
     what a builder wants when the whole schedule is already agreed. */
  onCreate?: (draws: DrawScheduleLine[]) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const isEditing = !!existingDraws && existingDraws.length > 0;
  const [rows, setRows] = useState<DraftRow[]>(
    isEditing ? draftsFromExisting(existingDraws!) : (initialRows ?? evenSplitDrafts(4)),
  );
  /* An edited schedule keeps the price it was built against; a new one bills
     against whatever the caller says the job is worth. */
  const total = isEditing ? existingDraws!.reduce((s, d) => s + d.amount, 0) : defaultTotal;
  const drawAmount = (percent: number) => Math.round(total * (percent / 100));

  const setDrawCount = (count: number) => {
    if (count < 1 || count > 12) return;
    setRows(prev => {
      if (count === prev.length) return prev;
      if (count < prev.length) return prev.slice(0, count).map((r, i, arr) => i === arr.length - 1 ? { ...r, percent: 100 - arr.slice(0, -1).reduce((s, x) => s + x.percent, 0) } : r);
      /* Added draws split what's left, not another even share of the whole:
         adding a draw to a schedule that already allocates the contract price
         can't be a way to promise more than the contract is worth. */
      const remaining = Math.max(0, 100 - prev.reduce((s, r) => s + r.percent, 0));
      const added = count - prev.length;
      const base = Math.floor(remaining / added);
      const extra = Array.from({ length: added }, (_, i) => ({
        percent: i === added - 1 ? remaining - base * (added - 1) : base,
        title: SCHEDULE_ITEM_OPTIONS[Math.min(prev.length + i, SCHEDULE_ITEM_OPTIONS.length - 1)],
        scheduleItem: SCHEDULE_ITEM_OPTIONS[Math.min(prev.length + i, SCHEDULE_ITEM_OPTIONS.length - 1)],
      }));
      return [...prev, ...extra];
    });
  };

  /* The draws split the contract price, so they can't add up to more than it.
     A percent is capped at whatever the other rows leave rather than accepted
     and flagged afterwards: a schedule that promises 120% of the job is not a
     state worth letting a builder type their way into, and the amount beside
     the field would be quietly wrong the whole time. */
  const updateRow = (i: number, patch: Partial<DraftRow>) => {
    setRows(prev => prev.map((r, idx) => {
      if (idx !== i) return r;
      const next = { ...r, ...patch };
      if (patch.percent !== undefined) {
        const others = prev.reduce((s, x, xi) => (xi === i ? s : s + x.percent), 0);
        next.percent = Math.max(0, Math.min(patch.percent, 100 - others));
      }
      return next;
    }));
  };

  const percentTotal = rows.reduce((s, r) => s + r.percent, 0);

  const buildDraws = (): DrawScheduleLine[] => rows.map((r, i) => ({
    drawNumber: i + 1,
    milestone: r.scheduleItem,
    title: r.title,
    amount: Math.round(total * (r.percent / 100)),
    phaseComplete: r.phaseComplete ?? false,
    invoiced: r.invoiced ?? false,
  }));

  const handleSave = () => onSave(buildDraws());
  const handleCreate = () => onCreate?.(buildDraws());

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(20, 24, 33, 0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="bds-scope" style={{ background: '#fff', borderRadius: 'var(--bds-radius-lg)', width: 800, maxWidth: '94vw', maxHeight: '88vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--bds-color-gray-90)' }}>
            {isEditing ? 'Edit payment schedule' : 'Create payment schedule'}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bds-color-gray-60)' }}>
            <BdsIcon name="x" size={20} />
          </button>
        </div>
        {/* Says what the button will do, not what a payment schedule is. The
            builder is one click from a job's worth of invoices appearing, and
            finding that out afterwards reads as the prototype having run away
            with itself. */}
        <p style={{ fontSize: 14, color: 'var(--bds-color-gray-70)', marginBottom: 20 }}>
          {description
            ?? (onCreate && !isEditing
              ? 'Split the contract price into draws. Buildertrend creates one draft invoice per draw on the Invoices page, ready to send as each phase completes. Nothing goes to the client until you send it.'
              : 'Create a payment schedule to auto-generate invoices based on a percentage of all estimated line items once Estimate is sent to Budget.')}
        </p>
        <div style={{ borderTop: '1px solid var(--bds-color-gray-15)', paddingTop: 20 }}>
          {/* Same grid as the draw rows below, so the count sits in the Percent
              column instead of floating between it and the row labels. */}
          <div style={{ display: 'grid', gridTemplateColumns: GRID_COLS, gap: 12, alignItems: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-80)' }}>Draw numbers</div>
            <input
              type="number" min={1} max={12} value={rows.length}
              onChange={e => setDrawCount(Number(e.target.value))}
              className="bds-r-input" style={{ width: '100%' }}
            />
          </div>
          {(
            <>
              <div style={{ display: 'grid', gridTemplateColumns: GRID_COLS, gap: 12, marginBottom: 10 }}>
                <div />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-80)' }}>Percent</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-80)' }}>Amount</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-80)' }}>Invoice title</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-80)' }}>Schedule item</div>
              </div>
              {rows.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: GRID_COLS, gap: 12, alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-70)', whiteSpace: 'nowrap' }}>Draw #{i + 1}</div>
                  {/* A locked Draw #1 is set upstream, so it reads as a figure
                      rather than a field a builder can fight with. */}
                  {i === 0 && lockFirstRow ? (
                    <div style={{ fontSize: 13, color: 'var(--bds-color-gray-70)', padding: '8px 0' }}>{row.percent}%</div>
                  ) : (
                    <input
                      type="number" value={row.percent} onChange={e => updateRow(i, { percent: Number(e.target.value) })}
                      className="bds-r-input" style={{ width: '100%' }}
                    />
                  )}
                  <div style={{ fontSize: 13, color: 'var(--bds-color-gray-80)', whiteSpace: 'nowrap' }}>
                    {money(drawAmount(row.percent))}
                  </div>
                  <input
                    value={row.title} onChange={e => updateRow(i, { title: e.target.value })}
                    className="bds-r-input" style={{ width: '100%' }}
                  />
                  <select
                    value={row.scheduleItem} onChange={e => updateRow(i, { scheduleItem: e.target.value })}
                    className="bds-r-input" style={{ width: '100%' }}
                  >
                    {SCHEDULE_ITEM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              {percentTotal !== 100 && (
                <div style={{ fontSize: 12, color: 'var(--bds-color-danger-70, #c53030)', marginBottom: 8 }}>
                  Draws total {percentTotal}%. {100 - percentTotal}% of the contract price is still unscheduled.
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20, borderTop: '1px solid var(--bds-color-gray-15)', paddingTop: 20 }}>
          {/* Delete only once there's a saved schedule to delete: on the way in
              from "+ Payment schedule" there's nothing behind this modal yet. */}
          {isEditing && onDelete && <BdsButton text="Delete" displayType="secondary" onClick={onDelete} />}
          {/* One way out when the schedule is new. Splitting this into Save and
              Create asked the builder to distinguish keeping the schedule from
              using it, which is not a distinction they have: they typed a draw
              schedule because they want the invoices. Editing an existing
              schedule keeps Save, since the invoices already exist and
              regenerating them would throw away their progress. */}
          {(!onCreate || isEditing)
            ? <BdsButton text="Save" displayType="primary" onClick={handleSave} />
            : <BdsButton text="Create payment schedule" displayType="primary" onClick={handleCreate} />}
        </div>
      </div>
    </div>
  );
}
