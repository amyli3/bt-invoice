import '../bds-tokens.css';
import { BdsButton, BdsBadge, BdsIcon } from '../bds';
import { Job, InvoicingMode } from '../types';
import { recommendInvoicingMode, INVOICING_MODE_LABELS } from '../mockData';

export default function SendToBudgetModal({
  job,
  builderCost,
  profit,
  totalOwnerPrice,
  margin,
  hasDrawSchedule,
  invoicingMode,
  onChangeInvoicingMode,
  onCancel,
  onOpenDrawSchedule,
  onConfirm,
}: {
  job: Job;
  builderCost: number;
  profit: number;
  totalOwnerPrice: number;
  margin: number;
  hasDrawSchedule?: boolean;
  invoicingMode?: InvoicingMode;
  onChangeInvoicingMode: () => void;
  onCancel: () => void;
  onOpenDrawSchedule: () => void;
  onConfirm: () => void;
}) {
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const recommendation = recommendInvoicingMode(job);
  const effectiveMode = invoicingMode ?? recommendation.mode;

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
      <div className="bds-scope" style={{ background: '#fff', borderRadius: 'var(--bds-radius-lg)', width: 480, maxWidth: '92vw', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
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

        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bds-color-gray-90)' }}>
              Invoicing mode
            </div>
            <BdsBadge
              text={invoicingMode ? `Billed as: ${INVOICING_MODE_LABELS[effectiveMode].label}` : `Recommended: ${INVOICING_MODE_LABELS[effectiveMode].label}`}
              displayType="info"
            />
          </div>
          <p style={{ fontSize: 14, color: 'var(--bds-color-gray-80)', lineHeight: 1.5, marginBottom: 12 }}>
            {invoicingMode ? INVOICING_MODE_LABELS[effectiveMode].blurb : recommendation.reason}
          </p>
          <BdsButton
            text={invoicingMode ? 'Change invoicing mode' : 'Choose invoicing mode'}
            displayType="secondary"
            onClick={onChangeInvoicingMode}
          />
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bds-color-gray-90)', marginBottom: 8 }}>
            Draw schedule
          </div>
          <p style={{ fontSize: 14, color: 'var(--bds-color-gray-80)', lineHeight: 1.5, marginBottom: 12 }}>
            {hasDrawSchedule
              ? 'This job already has a draw schedule. Review or update it before sending to budget.'
              : 'Create a draw schedule to automatically generate invoices based on a percentage of all estimated line items once Estimate is sent to Budget.'}
          </p>
          <BdsButton
            text={hasDrawSchedule ? 'Edit draw schedule' : '+ Draw schedule'}
            displayType="secondary"
            onClick={onOpenDrawSchedule}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <BdsButton text="Cancel" displayType="secondary" onClick={onCancel} />
          <BdsButton text="Send to Budget" displayType="primary" onClick={onConfirm} />
        </div>
      </div>
    </div>
  );
}
