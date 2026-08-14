import '../bds-tokens.css';
import { BdsButton, BdsIcon } from '../bds';

/* Sending to budget locks the contract price, which is the one thing a draw
   schedule can't be built without, so this is the right moment to build one
   while the number is fresh.

   That is the only billing question here. Draws split a locked contract price,
   so the section is absent on an open-book job, where there's no fixed price to
   split (the caller decides). And the invoicing mode isn't asked: "bill as
   costs come in" configures nothing (it's what a standard invoice does when you
   press Auto fill), and progress/AIA is a per-invoice document rather than a
   property of the job. 93.5% of builders who send progress invoices also send
   standard ones, so a job-level answer here would be wrong most of the time
   it's used, and wrong invisibly. Both are asked at "+ Invoice", where the
   builder can see what the answer does. */

export default function SendToBudgetModal({
  builderCost,
  profit,
  totalOwnerPrice,
  margin,
  hasDrawSchedule,
  showDrawSchedule = true,
  onCancel,
  onOpenDrawSchedule,
  onConfirm,
}: {
  builderCost: number;
  profit: number;
  totalOwnerPrice: number;
  margin: number;
  hasDrawSchedule?: boolean;
  /* Whether draws apply to this job at all. Open book has nothing to split, so
     the section comes off rather than sitting there inert. */
  showDrawSchedule?: boolean;
  onCancel: () => void;
  onOpenDrawSchedule: () => void;
  onConfirm: () => void;
}) {
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const rows: [string, string][] = [
    ['Builder cost', fmt(builderCost)],
    ['Profit', fmt(profit)],
    ['Total owner price', fmt(totalOwnerPrice)],
    ['Margin', `${margin.toFixed(0)}%`],
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(20, 24, 33, 0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Scrolls rather than running off the top and bottom of a short window,
          which would take the Send to Budget button with it. */}
      <div className="bds-scope" style={{ background: '#fff', borderRadius: 'var(--bds-radius-lg)', width: 480, maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: 'var(--bds-color-gray-90)' }}>Send to the Budget</h2>
          <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bds-color-gray-70)' }}>
            <BdsIcon name="x" size={20} />
          </button>
        </div>

        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bds-color-gray-90)', marginBottom: 12 }}>
          Price summary
        </div>

        <p style={{ fontSize: 14, color: 'var(--bds-color-gray-80)', lineHeight: 1.5, marginBottom: 12 }}>
          The contract price will be set to <strong>{fmt(totalOwnerPrice)}</strong> and locked once the Estimate worksheet is sent to Budget.{' '}
          <a href="#" onClick={e => e.preventDefault()} style={{ color: 'var(--bds-color-blue-70)' }}>Learn why.</a>
        </p>
        <p style={{ fontSize: 14, color: 'var(--bds-color-gray-80)', lineHeight: 1.5, marginBottom: 20 }}>
          Review the numbers below and make any edits to your estimate to ensure that the contract price and profit is accurate.
        </p>

        <div>
          {rows.map(([label, value], i) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', padding: '14px 0',
              borderTop: i === 0 ? '1px solid var(--bds-color-gray-15)' : undefined,
              borderBottom: '1px solid var(--bds-color-gray-15)',
              color: 'var(--bds-color-gray-90)', fontSize: 14,
            }}>
              <span>{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>

        {showDrawSchedule && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bds-color-gray-90)', marginBottom: 8 }}>
              Draw schedule
            </div>
            <p style={{ fontSize: 14, color: 'var(--bds-color-gray-80)', lineHeight: 1.5, marginBottom: 12 }}>
              {hasDrawSchedule
                ? 'This job has a draw schedule. Review or update it against the contract price before sending to budget.'
                : `Optional. Split ${fmt(totalOwnerPrice)} into draws and Buildertrend creates an invoice for each one, ready to send as its phase is marked complete. You can also do this later from the job's Invoices page.`}
            </p>
            <BdsButton
              text={hasDrawSchedule ? 'Edit draw schedule' : '+ Draw schedule'}
              displayType="secondary"
              onClick={onOpenDrawSchedule}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <BdsButton text="Cancel" displayType="secondary" onClick={onCancel} />
          <BdsButton text="Send to Budget" displayType="primary" onClick={onConfirm} />
        </div>
      </div>
    </div>
  );
}
