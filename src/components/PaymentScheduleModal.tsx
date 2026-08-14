import { useState } from 'react';
import '../bds-tokens.css';
import { BdsButton, BdsIcon } from '../bds';
import { DrawScheduleLine } from '../types';

const SCHEDULE_ITEM_OPTIONS = ['Project Start', 'Inspection', 'Removal', 'Installation', 'Final Inspection', 'Final Draw'];

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
  return draws.map(d => ({
    percent: Math.round((d.amount / total) * 100),
    title: d.title,
    scheduleItem: d.milestone,
    phaseComplete: d.phaseComplete,
    invoiced: d.invoiced,
  }));
}

function evenSplitDrafts(count: number): DraftRow[] {
  const base = Math.floor(100 / count);
  return Array.from({ length: count }, (_, i) => ({
    percent: i === count - 1 ? 100 - base * (count - 1) : base,
    title: i === 0 ? 'Deposit' : SCHEDULE_ITEM_OPTIONS[Math.min(i, SCHEDULE_ITEM_OPTIONS.length - 1)],
    scheduleItem: SCHEDULE_ITEM_OPTIONS[Math.min(i, SCHEDULE_ITEM_OPTIONS.length - 1)],
  }));
}

export default function PaymentScheduleModal({
  existingDraws,
  defaultTotal = 40000,
  onSave,
  onCreate,
  onDelete,
  onClose,
}: {
  existingDraws?: DrawScheduleLine[];
  defaultTotal?: number;
  onSave: (draws: DrawScheduleLine[]) => void;
  /* Financial > Invoice only. Save keeps the schedule and leaves the invoices
     to be created draw by draw; Create writes all of them at once, which is
     what a builder wants when the whole schedule is already agreed. */
  onCreate?: (draws: DrawScheduleLine[]) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const isEditing = !!existingDraws && existingDraws.length > 0;
  const [rows, setRows] = useState<DraftRow[]>(isEditing ? draftsFromExisting(existingDraws!) : evenSplitDrafts(4));
  const total = isEditing ? existingDraws!.reduce((s, d) => s + d.amount, 0) : defaultTotal;

  const setDrawCount = (count: number) => {
    if (count < 1 || count > 12) return;
    setRows(prev => {
      if (count === prev.length) return prev;
      if (count < prev.length) return prev.slice(0, count).map((r, i, arr) => i === arr.length - 1 ? { ...r, percent: 100 - arr.slice(0, -1).reduce((s, x) => s + x.percent, 0) } : r);
      const base = Math.floor(100 / count);
      const extra = Array.from({ length: count - prev.length }, (_, i) => ({
        percent: base,
        title: SCHEDULE_ITEM_OPTIONS[Math.min(prev.length + i, SCHEDULE_ITEM_OPTIONS.length - 1)],
        scheduleItem: SCHEDULE_ITEM_OPTIONS[Math.min(prev.length + i, SCHEDULE_ITEM_OPTIONS.length - 1)],
      }));
      return [...prev, ...extra];
    });
  };

  const updateRow = (i: number, patch: Partial<DraftRow>) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));
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
          {onCreate && !isEditing
            ? 'Split the contract price into draws. Buildertrend creates one draft invoice per draw on the Invoices page, ready to send as each phase completes. Nothing goes to the client until you send it.'
            : 'Create a payment schedule to auto-generate invoices based on a percentage of all estimated line items once Estimate is sent to Budget.'}
        </p>
        <div style={{ borderTop: '1px solid var(--bds-color-gray-15)', paddingTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-80)', width: 90 }}>Draw numbers</div>
            <input
              type="number" min={1} max={12} value={rows.length}
              onChange={e => setDrawCount(Number(e.target.value))}
              className="bds-r-input" style={{ width: 100 }}
            />
          </div>
          {(
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 90px 1fr 1fr', gap: 12, marginBottom: 8 }}>
                <div />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-80)' }}>Percent</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-80)' }}>Invoice title</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-80)' }}>Schedule item</div>
              </div>
              {rows.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 90px 1fr 1fr', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-70)', whiteSpace: 'nowrap' }}>Draw #{i + 1}</div>
                  <input
                    type="number" value={row.percent} onChange={e => updateRow(i, { percent: Number(e.target.value) })}
                    className="bds-r-input" style={{ width: '100%' }}
                  />
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
                  Draws total {percentTotal}% — should add up to 100%.
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
