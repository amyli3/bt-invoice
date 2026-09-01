import { useState } from 'react';
import { BdsButton, BdsIcon } from '../bds';

/* Open book's answer to the draw schedule. A fixed-price job breaks a contract
   price into amounts; an open book job has no amounts to promise, so the thing
   that generates its invoices is a cadence: how often they go out and starting
   when. Same toolbar slot on the grid, different object, so it carries the name
   Buildertrend already uses for this dialog rather than "payment schedule". */

export type Repeat = 'Weekly' | 'Every 2 weeks' | 'Monthly' | 'Quarterly';
export const REPEATS: Repeat[] = ['Weekly', 'Every 2 weeks', 'Monthly', 'Quarterly'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ORDINALS = ['First', 'Second', 'Third', 'Fourth', 'Last'];
const DAY_ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '13th', '14th', '15th', '16th', '17th', '18th', '19th', '20th', '21st', '22nd', '23rd', '24th', '25th', '26th', '27th', '28th', '29th', '30th', '31st'];

export type InvoiceCadence = {
  repeat: Repeat;
  start: string;
  onMode: 'day' | 'weekday';
  dayOfMonth: number;
  ordinal: string;
  weekday: string;
  reminderDays: number;
  requestFrom: string;
};

export const DEFAULT_CADENCE: InvoiceCadence = {
  repeat: 'Monthly', start: '', onMode: 'day', dayOfMonth: 1,
  ordinal: 'First', weekday: 'Friday', reminderDays: 1, requestFrom: 'Rebecca Willis (Owner)',
};

/* The sentence the builder is really writing, assembled from the controls. Also
   what the client reads on the proposal, so both surfaces phrase it the same. */
export function cadenceSentence(c: InvoiceCadence) {
  const every = c.repeat === 'Monthly' ? 'every month'
    : c.repeat === 'Quarterly' ? 'every quarter'
    : c.repeat === 'Weekly' ? 'every week'
    : 'every 2 weeks';
  const usesDayOfMonth = c.repeat === 'Monthly' || c.repeat === 'Quarterly';
  const when = usesDayOfMonth
    ? (c.onMode === 'day' ? `${DAY_ORDINALS[c.dayOfMonth - 1]} of ${every}` : `${c.ordinal.toLowerCase()} ${c.weekday} of ${every}`)
    : `${c.weekday} of ${every}`;
  const startLabel = c.start
    ? new Date(c.start + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: '2-digit', year: 'numeric' })
    : null;
  return { when, startLabel };
}

interface Props {
  onClose: () => void;
  onSave: (cadence: InvoiceCadence) => void;
  onDelete?: () => void;
  cadence?: InvoiceCadence | null;
  /* Set when the cadence came from the signed proposal. The client already
     agreed to a billing rhythm, so changing it here is a change to what was
     sold, not a blank setup, and the modal says so. */
  fromProposal?: boolean;
}

export default function InvoiceScheduleModal({ onClose, onSave, onDelete, cadence, fromProposal }: Props) {
  const isEditing = !!cadence;
  const [c, setC] = useState<InvoiceCadence>(cadence ?? DEFAULT_CADENCE);
  const set = (patch: Partial<InvoiceCadence>) => setC(prev => ({ ...prev, ...patch }));
  const usesDayOfMonth = c.repeat === 'Monthly' || c.repeat === 'Quarterly';
  const { when, startLabel } = cadenceSentence(c);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(20, 24, 33, 0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="bds-scope" style={{ background: '#fff', borderRadius: 'var(--bds-radius-lg)', width: 660, maxWidth: '94vw', maxHeight: '88vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--bds-color-gray-90)' }}>
            {isEditing ? 'Invoice schedule' : 'Create invoice schedule'}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bds-color-gray-60)' }}>
            <BdsIcon name="x" size={20} />
          </button>
        </div>

        {/* Says what saving does. This job bills actual costs, so the schedule
            decides when a draft appears, never what it's worth. */}
        <p style={{ fontSize: 14, color: 'var(--bds-color-gray-70)', marginBottom: 20 }}>
          This job bills actual costs, so the schedule sets how often you invoice rather than fixed amounts.
          Buildertrend creates a draft on each billing date covering the costs since the last invoice. Nothing
          goes to the client until you send it.
        </p>

        {fromProposal && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--bds-color-blue-5, #eff6ff)', border: '1px solid var(--bds-color-blue-20, #bfdbfe)', borderRadius: 'var(--bds-radius)', padding: '10px 14px', marginBottom: 20, fontSize: 13, color: 'var(--bds-color-gray-80)' }}>
            <span aria-hidden="true">💡</span>
            <span>This cadence came from the signed proposal. Changing it changes when the client is billed, so let them know if you move it.</span>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--bds-color-gray-15)', paddingTop: 20, display: 'grid', gridTemplateColumns: '150px 1fr', gap: '14px 16px', alignItems: 'center' }}>
          <label style={lbl}>Repeat</label>
          <select className="bds-r-input" style={{ maxWidth: 320 }} value={c.repeat} onChange={e => set({ repeat: e.target.value as Repeat })}>
            {REPEATS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <label style={lbl}>Start</label>
          <input type="date" className="bds-r-input" style={{ maxWidth: 320 }} value={c.start} onChange={e => set({ start: e.target.value })} />

          <label style={{ ...lbl, alignSelf: usesDayOfMonth ? 'start' : 'center', paddingTop: usesDayOfMonth ? 8 : 0 }}>On</label>
          {usesDayOfMonth ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* A month has one of these two shapes, never both, so radios. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="radio" name="inv-cadence-on" checked={c.onMode === 'day'} onChange={() => set({ onMode: 'day' })} style={{ width: 16, height: 16, accentColor: '#0065db' }} />
                <select className="bds-r-input" style={{ width: 150 }} value={c.dayOfMonth} onChange={e => set({ onMode: 'day', dayOfMonth: Number(e.target.value) })}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <span className="bds-r-input" style={{ width: 150, color: 'var(--bds-color-gray-50)', background: 'var(--bds-color-gray-3, #f8fafc)' }}>Day</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="radio" name="inv-cadence-on" checked={c.onMode === 'weekday'} onChange={() => set({ onMode: 'weekday' })} style={{ width: 16, height: 16, accentColor: '#0065db' }} />
                <select className="bds-r-input" style={{ width: 150 }} value={c.ordinal} onChange={e => set({ onMode: 'weekday', ordinal: e.target.value })}>
                  {ORDINALS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select className="bds-r-input" style={{ width: 150 }} value={c.weekday} onChange={e => set({ onMode: 'weekday', weekday: e.target.value })}>
                  {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <select className="bds-r-input" style={{ maxWidth: 320 }} value={c.weekday} onChange={e => set({ weekday: e.target.value })}>
              {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}

          <label style={{ ...lbl, alignSelf: 'start' }}>Invoice schedule</label>
          <div style={{ fontSize: 13, color: 'var(--bds-color-gray-80)', lineHeight: 1.5 }}>
            Billing occurs on the <strong style={{ color: 'var(--bds-color-gray-90)' }}>{when}</strong>
            {startLabel ? <> starting {startLabel}</> : <span style={{ color: '#b45309' }}>. Set a start date to finish the schedule.</span>}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--bds-color-gray-15)', marginTop: 20, paddingTop: 20, display: 'grid', gridTemplateColumns: '150px 1fr', gap: '14px 16px', alignItems: 'center' }}>
          <label style={lbl}>Payment reminder</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select className="bds-r-input" style={{ width: 120 }} value={c.reminderDays} onChange={e => set({ reminderDays: Number(e.target.value) })}>
              {[1, 2, 3, 5, 7, 14].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <span style={{ fontSize: 13, color: 'var(--bds-color-gray-70)' }}>Day(s) before due date</span>
          </div>

          <label style={{ ...lbl, alignSelf: 'start', paddingTop: 8 }}>Request payment from</label>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid var(--bds-color-gray-15)', borderRadius: 'var(--bds-radius)', padding: '6px 10px', width: 'fit-content', fontSize: 13, color: 'var(--bds-color-gray-80)' }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bds-color-gray-10)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--bds-color-gray-70)' }}>RW</span>
            {c.requestFrom}
            <button type="button" onClick={() => set({ requestFrom: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bds-color-gray-50)', padding: 0, display: 'inline-flex' }}>
              <BdsIcon name="x" size={14} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, borderTop: '1px solid var(--bds-color-gray-15)', paddingTop: 20 }}>
          {isEditing && onDelete && <BdsButton text="Delete" displayType="secondary" onClick={onDelete} />}
          <BdsButton text="Save" displayType="primary" onClick={() => onSave(c)} />
        </div>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-80)', marginBottom: 0 };
