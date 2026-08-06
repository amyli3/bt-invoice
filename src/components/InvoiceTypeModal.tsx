import { useState } from 'react';
import '../bds-tokens.css';
import { BdsButton, BdsBadge } from '../bds';
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
    blurb: 'Split the contract price into draws by percentage. Buildertrend creates an invoice for each draw, ready to send as each phase completes.',
  },
  {
    key: 'progress',
    label: 'Progress invoice',
    blurb: 'Bill a percent of each contract line against a schedule of values. Pay application (G702/G703) format.',
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
  /* A template is a fourth way to answer this question, not a fourth type: it
     carries its own billing type and line items. Kept out of the radio group
     for that reason, and off to the side so the three types stay the choice. */
  onImportTemplate?: () => void;
}

export default function InvoiceTypeModal({ job, onClose, onChoose, onImportTemplate }: Props) {
  const recommendation = recommendedChoice(job);
  const [selected, setSelected] = useState<InvoiceTypeChoice>(recommendation.key);
  const [makeDefault, setMakeDefault] = useState(false);
  const recommendedLabel = OPTIONS.find(o => o.key === recommendation.key)!.label;

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="est-modal bds-scope" style={{ maxWidth: 860 }} onClick={(e) => e.stopPropagation()}>
        <div className="est-modal-hdr">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--bds-color-gray-90)', margin: 0 }}>How do you want to invoice this job?</h2>
          <button className="est-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="est-modal-body">
          {/* Above the options: it's the reason one of them is already
              selected, which is unreadable as a footnote after the fact. */}
          <div style={{
            padding: 14, marginTop: 4, marginBottom: 20,
            background: 'var(--bds-color-info-background, #EEF5FF)', borderRadius: 'var(--bds-radius-md)',
            fontSize: 13, color: 'var(--bds-color-gray-80)', lineHeight: 1.5,
          }}>
            <strong>Why we recommend {recommendedLabel}: </strong>{recommendation.reason}
          </div>

          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 16, marginBottom: 18 }}>
            {/* Radios rather than a "Selected" check line: three mutually
                exclusive answers read as a radio group, and the control says so
                before it's clicked. The whole card is still the hit target. */}
            {OPTIONS.map(opt => {
              const isRecommended = opt.key === recommendation.key;
              const isSelected = opt.key === selected;
              return (
                <label
                  key={opt.key}
                  style={{
                    textAlign: 'left', cursor: 'pointer', borderRadius: 'var(--bds-radius-lg)',
                    border: isSelected ? '2px solid var(--bds-color-blue-70)' : '1px solid var(--bds-color-gray-25)',
                    background: isSelected ? 'var(--bds-color-blue-5)' : '#fff',
                    padding: '22px 18px 18px', display: 'flex', gap: 10, alignItems: 'flex-start', position: 'relative',
                  }}
                >
                  {isRecommended && (
                    <div style={{ position: 'absolute', top: -11, left: 14 }}>
                      <BdsBadge text="Recommended" displayType="info" />
                    </div>
                  )}
                  <input
                    type="radio"
                    name="invoice-type"
                    checked={isSelected}
                    onChange={() => setSelected(opt.key)}
                    style={{ marginTop: 3, width: 16, height: 16, accentColor: 'var(--bds-color-blue-70)', flexShrink: 0 }}
                  />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: 15, color: 'var(--bds-color-gray-90)' }}>{opt.label}</span>
                    <span style={{ display: 'block', fontSize: 13, color: 'var(--bds-color-gray-60)', lineHeight: 1.45, marginTop: 4 }}>{opt.blurb}</span>
                  </span>
                </label>
              );
            })}
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

        <div className="est-modal-footer" style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
          {onImportTemplate && (
            <button
              type="button"
              onClick={onImportTemplate}
              style={{ marginRight: 'auto', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--bds-color-blue-70)', fontFamily: 'inherit' }}
            >
              Import from template
            </button>
          )}
          <BdsButton text="Cancel" displayType="secondary" onClick={onClose} />
          <BdsButton text="Continue" displayType="primary" onClick={() => onChoose(selected, makeDefault && selected !== 'payment-schedule')} />
        </div>
      </div>
    </div>
  );
}
