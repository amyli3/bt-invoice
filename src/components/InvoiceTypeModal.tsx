import { useState } from 'react';
import '../bds-tokens.css';
import { BdsButton, BdsBadge } from '../bds';
import { Job, InvoicingMode } from '../types';
import { recommendInvoicingMode } from '../mockData';
import InvoicePreviewPanel from './InvoicePreviewPanel';

export type InvoiceTypeChoice = 'standard' | 'payment-schedule' | 'progress';

/* "+ Invoice" from the invoices grid. The three options are three different
   documents, not three settings, so the question is asked once here rather
   than left to be discovered inside the builder.

   Recommendation reuses recommendInvoicingMode, the same job signals the
   Invoices page uses (commercial sector, a signed draw schedule, contract
   type), so a builder can't get one answer here and a different one there.
   It preselects rather than decides: the reason is stated in full and any
   card can be picked over it. */

export const INVOICE_TYPE_OPTIONS: { key: InvoiceTypeChoice; label: string; blurb: string }[] = [
  {
    key: 'standard',
    label: 'Standard invoice',
    /* The use-case sentence that used to follow ("for costs as they're logged,
       or a one-off charge") is gone. It described a cost-plus habit, and on a
       fixed-price job it pointed at the wrong model: the client owes contract
       value, not what the job spent. The other cards state mechanics in one
       line, so this one now does too. */
    blurb: "Invoice the amount you're charging, line by line or as one flat fee.",
  },
  {
    key: 'payment-schedule',
    label: 'Payment schedule',
    blurb: 'Split the contract price into draws by percentage. Buildertrend creates an invoice for each draw, ready to send as each phase completes.',
  },
  {
    key: 'progress',
    label: 'Progress invoice',
    /* Names where the lines come from. "A schedule of values" told a builder
       what the document is called without telling them what would be in it,
       which is the thing they can't picture before opening it. The G702/G703
       reference stays: it's what upmarket builders scan for. */
    blurb: 'Invoice percent complete against a scope of work pulled from your estimate line items. Pay application (G702/G703) format.',
  },
];

/* The preview panel is keyed by billing mode, and these cards are documents.
   Same three answers seen from the other side, so a builder who previews here
   sees exactly what the Invoices page picker would have shown them. */
export const INVOICE_TYPE_PREVIEW_MODE: Record<InvoiceTypeChoice, InvoicingMode> = {
  standard: 'time-interval',
  'payment-schedule': 'milestone-draws',
  progress: 'aia-percent-complete',
};

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
  /* Set when something upstream already answered how this job bills, so this
     modal opens as a consequence of that answer rather than as a fresh
     question. Additive and optional: callers that don't pass it are unchanged. */
  answeredContext?: { answer: string };
}

export default function InvoiceTypeModal({ job, onClose, onChoose, onImportTemplate, variant = 'new', initialChoice, choices, answeredContext }: Props) {
  const options = choices ? INVOICE_TYPE_OPTIONS.filter(o => choices.includes(o.key)) : INVOICE_TYPE_OPTIONS;
  const recommendation = recommendedChoice(job);
  /* The recommender answers across all three documents, so it can land on one
     this caller doesn't offer. Rather than redirect it to a second-best answer
     and state a reason that no longer matches, the recommendation comes off
     entirely and the first option is simply what's selected. */
  const showRecommendation = !answeredContext && variant === 'new' && options.some(o => o.key === recommendation.key);
  const [selected, setSelected] = useState<InvoiceTypeChoice>(
    initialChoice ?? (showRecommendation ? recommendation.key : options[0].key)
  );
  const [makeDefault, setMakeDefault] = useState(false);
  const [previewChoice, setPreviewChoice] = useState<InvoiceTypeChoice | null>(null);
  const recommendedLabel = INVOICE_TYPE_OPTIONS.find(o => o.key === recommendation.key)!.label;

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
          {/* Carries the previous answer forward, so the second dialog reads as
              the result of the first rather than the same question again. */}
          {answeredContext && (
            <div style={{
              padding: 14, marginTop: 4, marginBottom: 20,
              background: 'var(--bds-color-info-background, #EEF5FF)', borderRadius: 'var(--bds-radius-md)',
              fontSize: 13, color: 'var(--bds-color-gray-80)', lineHeight: 1.5,
            }}>
              <strong>This job is invoiced on {answeredContext.answer}. </strong>
              These are the invoice types that fit, so the list below is shorter than usual.
            </div>
          )}

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
                    {/* A blurb describes the document; this shows it. Picking
                        between three formats you've never seen is the actual
                        difficulty here, and it's the same example the Invoices
                        page picker offers. preventDefault as well as
                        stopPropagation: the card is a label, so the click would
                        otherwise fall through and select the radio it wraps. */}
                    <button
                      type="button"
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setPreviewChoice(opt.key); }}
                      style={{ background: 'none', border: 'none', padding: 0, marginTop: 10, cursor: 'pointer', color: 'var(--bds-color-blue-70)', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', textAlign: 'left' }}
                    >
                      Preview example →
                    </button>
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

        {previewChoice && (
          <InvoicePreviewPanel mode={INVOICE_TYPE_PREVIEW_MODE[previewChoice]} job={job} onClose={() => setPreviewChoice(null)} />
        )}

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
