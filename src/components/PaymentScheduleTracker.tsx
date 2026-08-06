import '../bds-tokens.css';
import { BdsButton, BdsBadge, BdsIcon } from '../bds';
import { DrawScheduleLine } from '../types';

/* The schedule as the client sees it: what's been paid, what's next, what's
   still coming, in order. Read-only on purpose — editing lives in the schedule
   modal, and mixing the two turned a status check into a fear of breaking
   something. Opens as a side panel so the invoice list stays visible behind it,
   which is how a builder answers "which draw is this row?".

   Dates aren't stored on a draw (the schedule phase moves, the draw follows),
   so they're projected from today's date at a steady cadence and the
   disclaimer says so rather than presenting them as commitments. */

const DAY = 24 * 60 * 60 * 1000;

function fmt(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type DrawState = 'paid' | 'due-soon' | 'upcoming';

function stateFor(draw: DrawScheduleLine, index: number, firstUnpaid: number): DrawState {
  if (draw.invoiced) return 'paid';
  return index === firstUnpaid ? 'due-soon' : 'upcoming';
}

export default function PaymentScheduleTracker({
  draws,
  jobName,
  onClose,
}: {
  draws: DrawScheduleLine[];
  jobName: string;
  onClose: () => void;
}) {
  const firstUnpaid = draws.findIndex(d => !d.invoiced);
  const today = new Date();
  const total = draws.reduce((s, d) => s + d.amount, 0);

  return (
    <div
      className="bds-scope"
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, maxWidth: '92vw',
        background: '#fff', borderLeft: '1px solid var(--bds-color-gray-15)',
        boxShadow: '-8px 0 32px rgba(16,24,40,0.12)', zIndex: 900,
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '22px 24px 12px' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--bds-color-gray-90)' }}>Payment schedule</h2>
          <div style={{ fontSize: 13, color: 'var(--bds-color-gray-60)', marginTop: 2 }}>
            {jobName} · {draws.length} draws · ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bds-color-gray-60)', padding: 4 }}>
          <BdsIcon name="x" size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 24px' }}>
        {draws.map((draw, i) => {
          const state = stateFor(draw, i, firstUnpaid);
          // Paid draws sit behind today, the next one lands in two weeks, and
          // the rest follow it three weeks apart.
          const offset = state === 'paid' ? -((firstUnpaid < 0 ? draws.length : firstUnpaid) - i) * 21 : (i - firstUnpaid) * 21 + 14;
          const date = new Date(today.getTime() + offset * DAY);
          const isLast = i === draws.length - 1;
          return (
            <div key={draw.drawNumber} style={{ display: 'grid', gridTemplateColumns: '104px 20px 1fr', columnGap: 12, alignItems: 'start' }}>
              <div style={{ textAlign: 'right', paddingTop: 1 }}>
                {state === 'paid' && <BdsBadge text="Paid" displayType="success" />}
                {state === 'due-soon' && <BdsBadge text="Due soon" displayType="warning" />}
                {state === 'upcoming' && <BdsBadge text="Upcoming" displayType="default" />}
                <div style={{ fontSize: 12, color: 'var(--bds-color-gray-60)', marginTop: 4 }}>{fmt(date)}</div>
              </div>

              {/* Dot plus the connector to the next row: the rail is what makes
                  this read as a sequence rather than a list. */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch' }}>
                <span style={{
                  width: 12, height: 12, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                  background: state === 'upcoming' ? 'var(--bds-color-gray-30)' : 'var(--bds-color-blue-70)',
                  outline: state === 'paid' ? '3px solid var(--bds-color-blue-10, #dbeafe)' : 'none',
                }} />
                {!isLast && <span style={{ flex: 1, width: 2, background: 'var(--bds-color-gray-15)', marginTop: 4 }} />}
              </div>

              <div style={{ paddingBottom: isLast ? 0 : 26 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--bds-color-gray-90)' }}>{draw.title}</div>
                <div style={{ fontSize: 13, color: 'var(--bds-color-gray-60)', marginTop: 2 }}>
                  Amount: ${draw.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid var(--bds-color-gray-15)', padding: '14px 24px 18px' }}>
        <div style={{ fontSize: 12, color: 'var(--bds-color-gray-60)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 12 }}>
          <strong style={{ fontStyle: 'normal' }}>Disclaimer:</strong> Due dates listed in this payment schedule are subject to change based on the actual job progress and timeline.
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <BdsButton text="Share" displayType="primary" />
        </div>
      </div>
    </div>
  );
}
