import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fmt } from '../utils';
import { BdsButton, BdsText, BdsIcon } from '../bds';
import { autoFillRecords, autoFillTotal, type CostRecord } from './CostsModal';

/* ─────────────────────────────────────────────────────────────────────────
   Confirmation step for the invoice page's "Auto fill" button.

   Auto fill skips the full "Add costs to invoice" review modal, so this is the
   only place the builder sees what is about to land before it lands. The
   research is blunt about why that matters: the recommendation rule measures
   82.1% precision, so roughly one in five lines is something the builder would
   not have billed, and populating without a visible review step turns that into
   silently over-billed customers (US #283497 risk surface).

   So this is deliberately not a bare "are you sure?" It itemizes every record
   with its amount and total, which is the smallest thing that still counts as a
   review. Confirming only writes unsaved form state.
   ───────────────────────────────────────────────────────────────────────── */

const Sparkle = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
    <path d="M6.8 1.2 7.9 5.7 12.4 6.8 7.9 7.9 6.8 12.4 5.7 7.9 1.2 6.8 5.7 5.7Z" fill="currentColor" />
    <path d="M12.2 9.6 12.8 11.6 14.8 12.2 12.8 12.8 12.2 14.8 11.6 12.8 9.6 12.2 11.6 11.6Z" fill="currentColor" opacity="0.7" />
  </svg>
);

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  /** Shown above the title, matching how the costs modal names the job. */
  jobName?: string;
}

export default function AutoFillConfirmModal({ open, onCancel, onConfirm, jobName }: Props) {
  const confirmRef = useRef<HTMLDivElement>(null);

  // Escape closes. Focus lands on Cancel, the first button in the footer, and
  // deliberately not on the confirm action: this dialog puts money on an
  // invoice, so a stray Enter should back out rather than commit.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    confirmRef.current?.querySelector('button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const records = autoFillRecords();
  const total = autoFillTotal();
  if (records.length === 0) return null;

  const row = (r: CostRecord) => (
    <div
      key={r.id}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
        borderTop: '1px solid var(--bds-color-gray-10)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <BdsText as="div" size="heavy-sm">{r.title}</BdsText>
        <BdsText as="div" size="normal-sm" style={{ color: 'var(--bds-color-gray-50)', marginTop: 1 }}>
          {r.kind === 'Bill' ? 'Bill' : 'Time clock'} · {r.subtitle}
        </BdsText>
      </div>
      <BdsText as="span" size="heavy-sm" style={{ whiteSpace: 'nowrap' }}>${fmt(r.total)}</BdsText>
    </div>
  );

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(14,15,16,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onCancel}
    >
      <div
        className="bds-scope bds-real-scope"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auto-fill-confirm-heading"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bds-color-base-background)', borderRadius: 12,
          width: 560, maxWidth: '100%', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--bds-color-info-foreground)', paddingTop: 3 }}><Sparkle /></span>
            <div>
              {jobName && (
                <BdsText as="div" size="normal-sm" style={{ color: 'var(--bds-color-gray-50)', marginBottom: 2 }}>{jobName}</BdsText>
              )}
              <BdsText as="h2" id="auto-fill-confirm-heading" size="distinct-lg" style={{ margin: 0 }}>
                Add line items from costs
              </BdsText>
            </div>
          </div>
          <BdsButton displayType="tertiary" ariaLabel="Close" icon={<BdsIcon name="x" size={18} />} onClick={onCancel} />
        </div>

        {/* Body */}
        <div style={{ padding: '0 24px 20px', overflowY: 'auto', flex: 1 }}>
          <BdsText as="p" size="normal-md" style={{ fontSize: 13, color: 'var(--bds-color-gray-70)', margin: '0 0 16px', lineHeight: 1.5 }}>
            Buildertrend is going to add {records.length} line {records.length === 1 ? 'item' : 'items'} to this invoice,
            based on the costs you usually bill on this job. Here is what will be added.
          </BdsText>

          <div style={{ border: '1px solid var(--bds-color-gray-15)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: 'var(--bds-color-gray-5)' }}>
              <BdsText as="span" size="heavy-sm" style={{ color: 'var(--bds-color-gray-70)' }}>
                {records.length} {records.length === 1 ? 'record' : 'records'}
              </BdsText>
            </div>
            {records.map(row)}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: '1px solid var(--bds-color-gray-15)', background: 'var(--bds-color-gray-5)' }}>
              <BdsText as="span" size="heavy-sm" style={{ color: 'var(--bds-color-gray-70)' }}>Total added to invoice</BdsText>
              <BdsText as="span" size="heavy-md">${fmt(total)}</BdsText>
            </div>
          </div>

          <BdsText as="p" size="normal-sm" style={{ color: 'var(--bds-color-gray-70)', margin: '12px 0 0', lineHeight: 1.45 }}>
            You can edit or remove any line after it is added, and nothing is billed to the client until you save this
            invoice. Other unbilled costs on this job stay available under Add from.
          </BdsText>
        </div>

        {/* Footer */}
        <div ref={confirmRef} style={{ padding: '14px 24px', borderTop: '1px solid var(--bds-color-gray-15)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <BdsButton displayType="secondary" text="Cancel" onClick={onCancel} />
          <BdsButton
            displayType="primary"
            text={`Add ${records.length} line ${records.length === 1 ? 'item' : 'items'}`}
            onClick={onConfirm}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
