import { useState } from 'react';
import '../bds-tokens.css';
import { BdsAlert, BdsButton, BdsIcon, BdsPill } from '../bds';
import type { DrawScheduleLine } from '../types';

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

/* ── Invoice preview ────────────────────────────────────────────────────────
   Send to Budget generates one invoice per draw as a side effect. The count is
   already shown in production ("we'll automatically generate 5 invoices"), but
   it is the raw draw count: it says nothing about what those invoices will be
   worth, or whether they duplicate invoices the job already has.

   What counts as "already billed" is the whole question, and draft is the line:

     - Released (sent or paid) invoices have actually billed the owner, so the
       remaining contract price is what is left to invoice. Contract 15,000 with
       5,000 released means the new invoices total 10,000.
     - Draft invoices have billed nobody. They do not reduce what is left, so a
       re-send creates a full set again. That is correct, but it means the drafts
       from the previous send are now duplicates and the builder has to delete
       them, which is what the existing warning is for.
     - Fully released means nothing is left, no invoices are created, and the
       builder needs telling rather than silence.

   NOTE: the engine does not implement this rule yet. GetInvoicedOwnerPriceByRelatedLineItem
   filters only on VoidedByDate IS NULL, so drafts are counted as billed today. */
export interface DrawInvoicePreview {
  /** Draws that will actually produce an invoice. */
  willCreate: number;
  /** Draws configured in the schedule. */
  configured: number;
  /** What those invoices will total: the contract price less what is released. */
  total: number;
}

export function previewDrawInvoices(
  draws: DrawScheduleLine[],
  contractPrice: number,
  /** Owner price on invoices that have actually been sent or paid. Drafts excluded. */
  releasedAmount: number,
): DrawInvoicePreview {
  /* The draws define the split, the contract price defines the amount. The
     engine is percent-driven (each draw bills `percent x line value`, with the
     last draw taking the remainder), so netting is a scale on the percentage
     rather than a dollar subtraction. Clamped at 0 so an over-released job drops
     every draw instead of emitting a negative correction. */
  const remainingRatio = contractPrice > 0
    ? Math.max(0, (contractPrice - releasedAmount) / contractPrice)
    : 0;
  return {
    willCreate: remainingRatio > 0 ? draws.length : 0,
    configured: draws.length,
    total: contractPrice * remainingRatio,
  };
}

export default function SendToBudgetModal({
  builderCost,
  profit,
  totalOwnerPrice,
  margin,
  hasDrawSchedule,
  showDrawSchedule = true,
  draws = [],
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
  /* The draw schedule this send will generate invoices from. Needed to say how
     many invoices are actually coming, which is the whole point of the preview. */
  draws?: DrawScheduleLine[];
  onCancel: () => void;
  onOpenDrawSchedule: () => void;
  onConfirm: () => void;
}) {
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  /* Prototype-only scenario switcher. In production these come from the job's
     existing invoices: `releasedAmount` from invoices with a released/sent date,
     `draftCount` from those without one. Remove with the switcher below. */
  const [scenario, setScenario] = useState<'first' | 'drafts' | 'partly-paid' | 'fully-paid'>('first');
  /* Only released invoices reduce what is left to bill. Drafts are counted
     separately because they drive a duplicate warning, not the netting. */
  const releasedAmount =
    scenario === 'partly-paid' ? 5000
    : scenario === 'fully-paid' ? totalOwnerPrice
    : 0;
  const draftCount = scenario === 'drafts' ? draws.length : 0;
  const preview = previewDrawInvoices(draws, totalOwnerPrice, releasedAmount);
  const nothingToInvoice = preview.willCreate === 0;
  const isReduced = releasedAmount > 0 && !nothingToInvoice;

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

        {/* One section, one heading. A draw schedule and a payment schedule are
            the same object: the schedule is the payment schedule, the rows in it
            are draws. */}
        {showDrawSchedule && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bds-color-gray-90)', marginBottom: 8 }}>
              Payment schedule
            </div>

            {/* Any warning sits directly under the heading, ahead of the
                descriptive copy. It is the thing that changes what the builder
                does next, so it should not be reachable only by reading past a
                paragraph that says everything is fine. */}
            {hasDrawSchedule && draftCount > 0 && (
              /* Draft invoices do not reduce what is left to bill, so a re-send
                 creates a full set alongside them and the old ones become
                 duplicates. Production's existing wording, kept verbatim. */
              <BdsAlert
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                message="Delete any existing invoices before sending to budget to avoid duplicates"
              />
            )}

            {hasDrawSchedule && nothingToInvoice && (
              /* Fully released. The builder pulled the budget back, changed
                 something that did not move the contract price, and is sending
                 again. Nothing is left to bill, and silence would read as a bug. */
              <BdsAlert
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                title="We won't create any invoices"
                message={<>You've invoiced the full contract price and been paid, so there's nothing
                  left to bill. Sending to budget still locks the contract price.</>}
              />
            )}

            {!hasDrawSchedule ? (
              <p style={{ fontSize: 14, color: 'var(--bds-color-gray-80)', lineHeight: 1.5, marginBottom: 12 }}>
                Optional. Split {fmt(totalOwnerPrice)} into draws and Buildertrend creates an invoice
                for each one, ready to send as its phase is marked complete. You can also do this
                later from the job's Invoices page.
              </p>
            ) : !nothingToInvoice && (
              <p style={{ fontSize: 14, color: 'var(--bds-color-gray-80)', lineHeight: 1.5, marginBottom: 12 }}>
                After you send the Estimate to the Budget, we'll automatically generate{' '}
                <strong>{preview.configured} {preview.configured === 1 ? 'invoice' : 'invoices'}</strong>{' '}
                totaling <strong>{fmt(preview.total)}</strong>.{' '}
                {isReduced
                  ? `That's the contract price minus the ${fmt(releasedAmount)} you've already been paid.`
                  : 'Each invoice will include a percentage of all line items in the Estimate.'}
              </p>
            )}

            <BdsButton
              text={hasDrawSchedule ? 'Edit payment schedule' : '+ Payment schedule'}
              displayType="secondary"
              onClick={onOpenDrawSchedule}
            />
          </div>
        )}

        {/* ── Prototype-only scenario switcher ──────────────────────────────
            Stands in for the job's existing invoices. Delete alongside the
            `scenario` state when productionizing. */}
        {showDrawSchedule && hasDrawSchedule && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--bds-color-gray-30)' }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--bds-color-gray-70)', marginBottom: 8 }}>
              Prototype: invoices already on this job
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <BdsPill text="None" selected={scenario === 'first'} onClick={() => setScenario('first')} />
              <BdsPill text="All draft" selected={scenario === 'drafts'} onClick={() => setScenario('drafts')} />
              <BdsPill text="$5,000 paid" selected={scenario === 'partly-paid'} onClick={() => setScenario('partly-paid')} />
              <BdsPill text="Fully paid" selected={scenario === 'fully-paid'} onClick={() => setScenario('fully-paid')} />
            </div>
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
