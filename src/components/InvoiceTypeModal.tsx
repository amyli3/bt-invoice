import { useState } from 'react';
import '../bds-tokens.css';
import { BdsButton, BdsBadge, BdsIcon } from '../bds';
import { Job } from '../types';
import { recommendInvoicingMode } from '../mockData';

export type InvoiceTypeChoice = 'standard' | 'payment-schedule' | 'progress';

/* "+ Invoice" from the invoices grid. The three options are three different
   documents, not three settings, so the question is asked once here rather
   than left to be discovered inside the builder.

   Recommendation reuses recommendInvoicingMode, the same job signals the
   Invoices page uses (commercial sector, a signed draw schedule, contract
   type), so a builder can't get one answer here and a different one there.
   It preselects rather than decides: the reason is stated in full and any
   card can be picked over it. */

const OPTIONS: { key: InvoiceTypeChoice; label: string; blurb: string }[] = [
  {
    key: 'standard',
    label: 'Standard invoice',
    blurb: "Bill the amounts you're charging, line by line or as one flat fee. Use it for costs as they're logged, or a one-off charge.",
  },
  {
    key: 'payment-schedule',
    label: 'Payment schedule',
    blurb: 'Bill fixed draw amounts from the schedule agreed at signing, as each phase is marked complete.',
  },
  {
    key: 'progress',
    label: 'Progress invoice',
    blurb: 'Bill a percent of each contract line against a schedule of values. Certified pay application (G702/G703) format.',
  },
];

// The recommender speaks in billing modes; these are documents. Same three
// answers, mapped once here.
function recommendedChoice(job: Job): { key: InvoiceTypeChoice; reason: string } {
  const rec = recommendInvoicingMode(job);
  const key: InvoiceTypeChoice =
    rec.mode === 'aia-percent-complete' ? 'progress'
    : rec.mode === 'milestone-draws' ? 'payment-schedule'
    : 'standard';
  return { key, reason: rec.reason };
}

interface Props {
  job: Job;
  onClose: () => void;
  onChoose: (choice: InvoiceTypeChoice, makeDefault: boolean) => void;
}

export default function InvoiceTypeModal({ job, onClose, onChoose }: Props) {
  const recommendation = recommendedChoice(job);
  const [selected, setSelected] = useState<InvoiceTypeChoice>(recommendation.key);
  const [makeDefault, setMakeDefault] = useState(false);
  const selectedLabel = OPTIONS.find(o => o.key === selected)!.label;
  const recommendedLabel = OPTIONS.find(o => o.key === recommendation.key)!.label;

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="est-modal bds-scope" style={{ maxWidth: 860 }} onClick={(e) => e.stopPropagation()}>
        <div className="est-modal-hdr">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--bds-color-gray-90)', margin: 0 }}>How do you want to invoice this job?</h2>
          <button className="est-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="est-modal-body">
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 8, marginBottom: 20 }}>
            {OPTIONS.map(opt => {
              const isRecommended = opt.key === recommendation.key;
              const isSelected = opt.key === selected;
              return (
                <div
                  key={opt.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(opt.key)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelected(opt.key); }}
                  style={{
                    textAlign: 'left', cursor: 'pointer', borderRadius: 'var(--bds-radius-lg)',
                    border: isSelected ? '2px solid var(--bds-color-blue-70)' : '1px solid var(--bds-color-gray-25)',
                    background: isSelected ? 'var(--bds-color-blue-5)' : '#fff',
                    padding: '22px 18px 18px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative',
                  }}
                >
                  {isRecommended && (
                    <div style={{ position: 'absolute', top: -11, left: 14 }}>
                      <BdsBadge text="Recommended" displayType="info" />
                    </div>
                  )}
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--bds-color-gray-90)' }}>{opt.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--bds-color-gray-60)', lineHeight: 1.45 }}>{opt.blurb}</div>
                  {isSelected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto', paddingTop: 6, color: 'var(--bds-color-blue-70)', fontSize: 13, fontWeight: 500 }}>
                      <BdsIcon name="check" size={14} /> Selected
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{
            display: 'flex', gap: 12, alignItems: 'flex-start', padding: 14,
            background: 'var(--bds-color-info-background, #EEF5FF)', borderRadius: 'var(--bds-radius-md)',
          }}>
            <div style={{ fontSize: 16, lineHeight: 1.2 }}>💡</div>
            <div style={{ fontSize: 13, color: 'var(--bds-color-gray-80)', lineHeight: 1.5 }}>
              <strong>Why we recommend {recommendedLabel}: </strong>{recommendation.reason}
            </div>
          </div>

          {/* Payment schedule is a setup step, not a document type, so there's
              nothing for it to default to. The checkbox only appears for the
              two that map to the job's Default invoice type. */}
          {selected !== 'payment-schedule' ? (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13, color: 'var(--bds-color-gray-80)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={makeDefault}
                onChange={e => setMakeDefault(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: 'var(--bds-color-blue-70)', margin: 0 }}
              />
              Always invoice this job this way. Skip this step on new invoices.
            </label>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--bds-color-gray-60)', marginTop: 14 }}>
              This applies to this invoice. You can invoice a different way next time.
            </div>
          )}
        </div>

        <div className="est-modal-footer" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <BdsButton text="Cancel" displayType="secondary" onClick={onClose} />
          <BdsButton text={`Continue with ${selectedLabel}`} displayType="primary" onClick={() => onChoose(selected, makeDefault && selected !== 'payment-schedule')} />
        </div>
      </div>
    </div>
  );
}
