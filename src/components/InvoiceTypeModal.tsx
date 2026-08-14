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
  /* 'switch' is the same modal reopened from inside an invoice. The builder
     already made this call once, so the recommendation and its reasoning come
     off: what's left is the three options and which one is on now. */
  variant?: 'new' | 'switch';
  /* What to open on. Defaults to the recommendation, which is right for a new
     invoice; switching passes the type the invoice already is, so Continue
     without a change is a no-op rather than a silent switch. */
  initialChoice?: InvoiceTypeChoice;
  /* Which of the three this caller offers. A flow that sets its cadence
     elsewhere (or doesn't have one) passes the documents it can actually
     create, so the modal never shows an answer that leads nowhere. */
  choices?: InvoiceTypeChoice[];
}

export default function InvoiceTypeModal({ job, onClose, onChoose, onImportTemplate, variant = 'new', initialChoice, choices }: Props) {
  const options = choices ? OPTIONS.filter(o => choices.includes(o.key)) : OPTIONS;
  const recommendation = recommendedChoice(job);
  /* The recommender answers across all three documents, so it can land on one
     this caller doesn't offer. Rather than redirect it to a second-best answer
     and state a reason that no longer matches, the recommendation comes off
     entirely and the first option is simply what's selected. */
  const showRecommendation = variant === 'new' && options.some(o => o.key === recommendation.key);
  const [selected, setSelected] = useState<InvoiceTypeChoice>(
    initialChoice ?? (showRecommendation ? recommendation.key : options[0].key)
  );
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
          {showRecommendation && (
            <div style={{
              padding: 14, marginTop: 4, marginBottom: 20,
              background: 'var(--bds-color-info-background, #EEF5FF)', borderRadius: 'var(--bds-radius-md)',
              fontSize: 13, color: 'var(--bds-color-gray-80)', lineHeight: 1.5,
            }}>
              <strong>Why we recommend {recommendedLabel}: </strong>{recommendation.reason}
            </div>
          )}

          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: `repeat(${options.length}, 1fr)`, marginTop: showRecommendation ? 16 : 4, marginBottom: 18 }}>
            {/* Radios rather than a "Selected" check line: mutually exclusive
                answers read as a radio group, and the control says so before
                it's clicked. The whole card is still the hit target. */}
            {options.map(opt => {
              const isRecommended = showRecommendation && opt.key === recommendation.key;
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
              nothing for it to default to and nothing to say in its place:
              the schedule modal it opens explains itself. */}
          {selected !== 'payment-schedule' && (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13, color: 'var(--bds-color-gray-80)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={makeDefault}
                onChange={e => setMakeDefault(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: 'var(--bds-color-blue-70)', margin: 0 }}
              />
              Always invoice this job this way. Skip this step on new invoices.
            </label>
          )}
        </div>

        <div className="est-modal-footer" style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
          {onImportTemplate && variant === 'new' && (
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
