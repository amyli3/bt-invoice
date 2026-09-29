import { useState, useRef, useEffect } from 'react';
import '../bds-tokens.css';
import { BdsButton, BdsText, BdsIcon } from '../bds';
import { type InvoiceTypeChoice as NewInvoiceChoice, INVOICE_TYPE_OPTIONS, INVOICE_TYPE_PREVIEW_MODE } from './InvoiceTypeModal';
import { type Job, type InvoicingMode } from '../types';
import InvoicePreviewPanel from './InvoicePreviewPanel';

/* The cadence question, in the two places it could be asked. Shared so the two
   placements can't drift into being two different questions: the only thing
   under comparison is where it appears, not what it says. */

export type Cadence = 'phase' | 'interval' | 'adhoc';

/* Cadence and document are not one to one, which is the whole reason this is
   two steps. Milestone billing can produce a draw schedule, a standard invoice
   or a pay application; a time interval can produce a standard invoice or a pay
   application. So the first answer narrows the second question, it doesn't
   answer it.

   That also means "Progress invoice (AIA style)" is not a cadence. It's a
   format available under either cadence, which matches how the data models it:
   invoiceFormat is a per-invoice flag (0 standard, 1 progress), not a mode. It
   was in this list because the mode picker treats it as a peer of the other
   two, and that's worth revisiting there too.

   Wording still comes from the product: the two cadences are named as the mode
   picker names them (INVOICING_MODE_LABELS). */
export const CADENCE_OPTIONS: {
  key: Cadence;
  question: string;
  /* The inline placement puts them all on one row, so it needs a short form. */
  short: string;
  detail: string;
  /* Which invoice types this cadence can produce. Drives what the second
     dialog offers, so the two can't disagree. */
  documents: NewInvoiceChoice[];
  /* Said on the card, so the first dialog promises a narrowing rather than a
     document it can't guarantee. */
  thenChoose: string;
  setup: string;
}[] = [
  {
    key: 'phase',
    question: 'Milestone',
    short: 'Milestone',
    detail: 'Bill fixed amounts as schedule phases are marked complete.',
    documents: ['payment-schedule', 'standard', 'progress'],
    thenChoose: 'Then choose a payment schedule, a standard invoice, or a progress invoice.',
    setup: 'Next: pick the invoice type.',
  },
  {
    key: 'interval',
    question: 'Interval based',
    short: 'Interval based',
    detail: 'Invoice on a regular schedule, covering the costs since the last one.',
    /* Invoice schedule first, mirroring how milestone leads with the payment
       schedule: the setup step is the answer this cadence usually wants, and
       the two invoice types stay available for a one-off in between. */
    documents: ['invoice-schedule', 'standard', 'progress'],
    thenChoose: 'Then set your invoice schedule, or choose a standard or progress invoice.',
    setup: 'Next: pick the invoice type.',
  },
  {
    key: 'adhoc',
    question: 'One-off invoice',
    short: 'One-off',
    detail: "Invoice what you're charging, line by line or as one flat fee. No pattern.",
    documents: ['standard'],
    thenChoose: 'Creates a standard invoice.',
    setup: 'Next: nothing to set up.',
  },
];

export const cadenceOption = (c: Cadence) => CADENCE_OPTIONS.find(o => o.key === c)!;

/* The four options as cards. Same list in both placements. */
function OptionList({ selected, onSelect, compact, omit = [] }: {
  selected: Cadence | null;
  onSelect: (c: Cadence) => void;
  compact?: boolean;
  /* Answers this placement doesn't need to offer, because something else on
     the same screen already covers them. */
  omit?: Cadence[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {CADENCE_OPTIONS.filter(o => !omit.includes(o.key)).map(opt => {
        const isSelected = opt.key === selected;
        return (
          <label
            key={opt.key}
            style={{
              display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', textAlign: 'left',
              border: isSelected ? '2px solid var(--bds-color-blue-70)' : '1px solid var(--bds-color-gray-25)',
              background: isSelected ? 'var(--bds-color-blue-5)' : '#fff',
              borderRadius: 'var(--bds-radius-lg)',
              padding: isSelected ? (compact ? '11px 13px' : '15px 17px') : (compact ? '12px 14px' : '16px 18px'),
            }}
          >
            <input
              type="radio" name="cadence-question" checked={isSelected}
              onChange={() => onSelect(opt.key)}
              style={{ width: 16, height: 16, accentColor: 'var(--bds-color-blue-70)', marginTop: 3, flexShrink: 0 }}
            />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 600, fontSize: 15, color: 'var(--bds-color-gray-90)' }}>{opt.question}</span>
              <span style={{ display: 'block', fontSize: 13, color: 'var(--bds-color-gray-60)', marginTop: 3, lineHeight: 1.45 }}>{opt.detail}</span>
              {/* The document named as a result, not as the question. A builder
                  who thinks in documents still sees which one they're getting. */}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/* Step 2's list, shared by the modal and the empty state for the same reason
   OptionList is: the two placements are being compared on where the question
   gets asked, so the answers have to be identical in both. */
function TypeOptionList({ cadence, selected, onSelect, onPreview, radioName }: {
  cadence: Cadence;
  selected: NewInvoiceChoice;
  onSelect: (t: NewInvoiceChoice) => void;
  onPreview: (mode: InvoicingMode) => void;
  radioName: string;
}) {
  const opt = cadenceOption(cadence);
  const options = INVOICE_TYPE_OPTIONS.filter(o => opt.documents.includes(o.key));
  return (
    <>
      {/* What they picked, carried forward as a plain line. Without it the
          narrowed list is unexplained: a builder seeing two types instead of
          three has no way to know why. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, color: 'var(--bds-color-gray-70)' }}>
        <span style={{ color: 'var(--bds-color-green-70, #15803d)', display: 'inline-flex' }}><BdsIcon name="check" size={14} /></span>
        <span>Invoiced on <strong style={{ color: 'var(--bds-color-gray-90)' }}>{opt.question}</strong></span>
      </div>

      {/* One column per type rather than a stack. Three documents read as
          three things to compare, and side by side the comparison is the
          layout: the labels sit on one line, the blurbs are the same shape,
          and the preview links land at the same height. Stacked, the same
          three cards were a list to scroll, which is a worse way to ask
          "which of these".

          Column count follows the options, so a cadence that offers two
          doesn't leave a gap where the third would be. */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`, gap: 12, alignItems: 'stretch' }}>
        {options.map(o => {
          const isSelected = o.key === selected;
          return (
            <label
              key={o.key}
              style={{
                display: 'flex', flexDirection: 'column', cursor: 'pointer', textAlign: 'left', minWidth: 0,
                border: isSelected ? '2px solid var(--bds-color-blue-70)' : '1px solid var(--bds-color-gray-25)',
                background: isSelected ? 'var(--bds-color-blue-5)' : '#fff',
                /* A pixel off the padding for the extra border pixel, so
                   selecting a card doesn't nudge the row. */
                borderRadius: 'var(--bds-radius-lg)', padding: isSelected ? '15px 15px' : '16px 16px',
              }}
            >
              <span style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <input
                  type="radio" name={radioName} checked={isSelected}
                  onChange={() => onSelect(o.key)}
                  style={{ width: 16, height: 16, accentColor: 'var(--bds-color-blue-70)', marginTop: 2, flexShrink: 0 }}
                />
                <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--bds-color-gray-90)', lineHeight: 1.3 }}>{o.label}</span>
              </span>
              {/* Takes the leftover height so the preview links line up across
                  the columns instead of floating at three heights. */}
              <span style={{ display: 'block', flex: 1, fontSize: 13, color: 'var(--bds-color-gray-60)', marginTop: 8, lineHeight: 1.45 }}>{o.blurb}</span>
              {/* Preview belongs here, where a document is being chosen,
                  rather than on step 1 where the cadence hasn't settled
                  which document it is. */}
              <button
                type="button"
                onClick={e => { e.preventDefault(); e.stopPropagation(); onPreview(INVOICE_TYPE_PREVIEW_MODE[o.key]); }}
                style={{ background: 'none', border: 'none', padding: 0, marginTop: 12, cursor: 'pointer', color: 'var(--bds-color-blue-70)', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', alignSelf: 'flex-start', textAlign: 'left' }}
              >
                Preview example →
              </button>
            </label>
          );
        })}
      </div>
    </>
  );
}

/* ── Placement A: a modal on "+ Invoice" ──────────────────────────────────
   Catches every builder, including one whose job already has invoices, which
   is also what makes it the intrusive option. "Just make an invoice" is the
   escape hatch: without it the question blocks the task it interrupted. */
export function CadenceModal({ initial = null, onClose, onChoose }: {
  initial?: Cadence | null;
  onClose: () => void;
  onChoose: (c: Cadence) => void;
}) {
  const [selected, setSelected] = useState<Cadence | null>(initial);
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(20, 24, 33, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bds-scope" style={{ background: '#fff', borderRadius: 'var(--bds-radius-lg)', width: 680, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--bds-color-gray-90)' }}>
            How should this job be invoiced?
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bds-color-gray-60)' }}>
            <BdsIcon name="x" size={20} />
          </button>
        </div>
        <p style={{ fontSize: 14, color: 'var(--bds-color-gray-70)', lineHeight: 1.6, marginBottom: 20 }}>
          Set once for this job. It decides which invoices Buildertrend creates for you, and you can change it any time.
        </p>

        <div style={{ marginBottom: 22 }}>
          <OptionList selected={selected} onSelect={setSelected} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--bds-color-gray-15)', paddingTop: 18 }}>
          <BdsButton text="Continue" displayType="primary" disabled={!selected} onClick={() => onChoose(selected!)} />
        </div>
      </div>

    </div>
  );
}


/* ── Placement A, as one modal with two steps ──────────────────────────────
   The two questions were two dialogs, which meant answering the first one
   dismissed a modal and raised another. As one modal that slides sideways it
   reads as one decision with two parts, and Back is a real affordance rather
   than "cancel and start again".

   Step 2 restates step 1's answer at the top. The narrowed list of invoice
   types is otherwise unexplained: a builder who sees two types instead of
   three has no way to know why without it. */
export function CadenceWizardModal({ job, onClose, onComplete }: {
  job: Job;
  onClose: () => void;
  onComplete: (cadence: Cadence, type: NewInvoiceChoice) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [cadence, setCadence] = useState<Cadence | null>(null);
  const [type, setType] = useState<NewInvoiceChoice>('standard');
  const [previewMode, setPreviewMode] = useState<InvoicingMode | null>(null);
  /* Both steps sit side by side on the track, so without this the modal is
     always as tall as the taller step and step 1 shows dead space under its
     last option. Measuring the active panel lets the frame shrink to fit, and
     animating the height means it resizes with the slide rather than snapping. */
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const [trackHeight, setTrackHeight] = useState<number>();

  useEffect(() => {
    const measure = () => {
      const el = step === 1 ? step1Ref.current : step2Ref.current;
      /* Rounded up, not offsetHeight: that rounds down, and the track clips
         overflow, so a fractional height shaved the last card's bottom border
         off. */
      if (el) setTrackHeight(Math.ceil(el.getBoundingClientRect().height));
    };
    measure();
    /* A single measure on mount catches the first layout pass, where the track
       is 200% of a width that hasn't resolved yet: the panels are momentarily
       narrow, the copy wraps, and the height comes back several times too big.
       Observing instead re-measures once the real width lands, and again if the
       content or window changes. */
    const observer = new ResizeObserver(measure);
    if (step1Ref.current) observer.observe(step1Ref.current);
    if (step2Ref.current) observer.observe(step2Ref.current);
    return () => observer.disconnect();
    // cadence is in here because it changes how many types step 2 lists.
  }, [step, cadence]);

  /* The types this cadence can produce. Read in two places: what step 2
     would ask, and whether step 1 has anything left to ask at all. */
  const docsFor = (c: Cadence) => cadenceOption(c).documents;
  /* One document means step 1 is the last step, so the button has to say
     "Create": "Continue" promises a question that never comes, and a one-off
     invoice opens the moment it's pressed. */
  const step1IsLastStep = !!cadence && docsFor(cadence).length === 1;

  const continueFromStep1 = () => {
    if (!cadence) return;
    const docs = docsFor(cadence);
    // Nothing left to ask: the invoice opens straight away.
    if (docs.length === 1) { onComplete(cadence, docs[0]); return; }
    // Land on the type this cadence most often produces, still changeable.
    setType(docs[0]);
    setStep(2);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(20, 24, 33, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Wider on step 2, where three columns need the room, and back to a
          question's width on step 1, where three full-width cadence cards
          would just be sparse. The width snaps rather than animating: a
          growing frame re-flows the columns the whole way across, so the
          cards visibly rewrap and the measured height overshoots. Only the
          height animates, which is what carries the slide. */}
      <div className="bds-scope" style={{ background: '#fff', borderRadius: 'var(--bds-radius-lg)', width: step === 2 ? 880 : 720, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <div>
            {/* "of 2" only while there are two. A one-off invoice has nothing
                to ask on step 2, so counting to it is the same wrong promise
                the button used to make. */}
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--bds-color-gray-50)', marginBottom: 4 }}>
              Step {step} of {step1IsLastStep ? 1 : 2}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--bds-color-gray-90)' }}>
              {step === 1 ? 'How should this job be invoiced?' : 'What invoices do you want to create for this job?'}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bds-color-gray-60)' }}>
            <BdsIcon name="x" size={20} />
          </button>
        </div>

        {/* Two panels on a track. The modal keeps the height of the taller step
            so the frame doesn't jump mid-transition. */}
        <div style={{ overflow: 'hidden', marginTop: 14, height: trackHeight, transition: 'height 260ms ease' }}>
          <div style={{
            display: 'flex', width: '200%', alignItems: 'flex-start',
            transform: step === 2 ? 'translateX(-50%)' : 'translateX(0)',
            transition: 'transform 260ms ease',
          }}>
            <div ref={step1Ref} style={{ width: '50%', flexShrink: 0, paddingRight: 2, paddingBottom: 2 }} aria-hidden={step !== 1}>
              <p style={{ fontSize: 14, color: 'var(--bds-color-gray-70)', lineHeight: 1.6, marginTop: 0, marginBottom: 18 }}>
                Set once for this job. It decides which invoices Buildertrend creates for you, and you can change it any time.
              </p>
              <OptionList selected={cadence} onSelect={setCadence} />
            </div>

            <div ref={step2Ref} style={{ width: '50%', flexShrink: 0, paddingLeft: 2, paddingBottom: 2 }} aria-hidden={step !== 2}>
              {cadence && (
                <TypeOptionList
                  cadence={cadence}
                  selected={type}
                  onSelect={setType}
                  onPreview={setPreviewMode}
                  radioName="wizard-invoice-type"
                />
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--bds-color-gray-15)', paddingTop: 18, marginTop: 20 }}>
          {step === 2 && (
            <button
              type="button" onClick={() => setStep(1)}
              style={{ marginRight: 'auto', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--bds-color-blue-70)', fontFamily: 'inherit' }}
            >
              ← Back
            </button>
          )}
          {step === 1 && (
            <BdsButton text={step1IsLastStep ? 'Create' : 'Continue'} displayType="primary" disabled={!cadence} onClick={continueFromStep1} />
          )}
          {step === 2 && (
            /* "Create" only when this really is the last step. A payment
               schedule opens the draw setup next, so nothing is created yet
               and the button says so. */
            <BdsButton
              text={type === 'payment-schedule' || type === 'invoice-schedule' ? 'Continue' : 'Create'}
              displayType="primary"
              onClick={() => onComplete(cadence!, type)}
            />
          )}
        </div>
      </div>

      {previewMode && (
        <InvoicePreviewPanel mode={previewMode} job={job} onClose={() => setPreviewMode(null)} />
      )}
    </div>
  );
}

/* ── Placement C: an inline questionnaire above the grid ──────────────────
   One question at a time, in a single row, answered by clicking. It reads as a
   short questionnaire rather than a form: no modal, no Continue button, no
   fields. Each answer replaces the row with the next question, so the whole
   thing occupies the same strip of page from start to finish.

   Two steps at most, and the second one is only asked because the first
   answer makes it answerable. Any longer and it stops being a strip above a
   grid and becomes a wizard, at which point it may as well be the modal.

   Nothing is blocked at any step: "+ Invoice" is right there, and the row can
   be dismissed outright. */

/* The one useful follow-up per cadence. Deliberately not a setup form: it
   captures the single fact that decides what Buildertrend does next, and the
   detail belongs in the real setup step. */
const FOLLOW_UPS: Record<Cadence, { question: string; options: string[] } | null> = {
  phase: { question: 'How many draws?', options: ['3', '4', '5', '6 or more'] },
  interval: { question: 'How often?', options: ['Weekly', 'Every 2 weeks', 'Monthly', 'Quarterly'] },
  adhoc: null,
};

/* Radios rather than pills. Pills read as filters, which is the wrong promise
   on a row that's asking a question. A radio says "these are the answers, pick
   one", which is what makes the strip read as a questionnaire.

   Selecting advances immediately, so it stays a one-click answer: a Continue
   button next to four radios on one row would be the modal again, in less
   space. */
function RadioChoice({ label, name, onSelect }: { label: string; name: string; onSelect: () => void }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: 'var(--bds-color-gray-80)', whiteSpace: 'nowrap' }}>
      <input
        type="radio" name={name} checked={false} onChange={onSelect}
        style={{ width: 15, height: 15, accentColor: 'var(--bds-color-blue-70)', margin: 0, cursor: 'pointer' }}
      />
      {label}
    </label>
  );
}

/* Dismissed, not answered. A sleek strip that can be waved away leaves the job
   with no pattern set, which is the state the question existed to prevent. So
   dismissing doesn't remove it, it collapses it to one line that names the
   consequence and stays clickable. The builder still isn't blocked, but they
   also can't end up somewhere nobody chose. */
export function CadenceSkippedLine({ onReopen }: { onReopen: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 0 18px', fontSize: 13, color: 'var(--bds-color-gray-60)' }}>
      <span>No invoicing mode set for this job. You'll pick an invoice type each time.</span>
      <button
        type="button" onClick={onReopen}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--bds-color-blue-70)', fontFamily: 'inherit' }}
      >
        Set it up
      </button>
    </div>
  );
}

export function CadenceAnsweredEmptyState({ answered, onChange }: { answered: Cadence; onChange: () => void }) {
  const opt = cadenceOption(answered);
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ color: 'var(--bds-color-green-70, #15803d)', display: 'inline-flex' }}><BdsIcon name="check" size={16} /></span>
        <BdsText as="span" size="heavy-md" style={{ color: 'var(--bds-color-gray-90)' }}>
          Invoiced on {opt.question}
        </BdsText>
      </div>
      <BdsText as="div" size="normal-md" style={{ color: 'var(--bds-color-gray-60)', lineHeight: 1.6, marginBottom: 16 }}>
        {opt.thenChoose} Use <strong style={{ color: 'var(--bds-color-gray-80)' }}>+ Invoice</strong> when you're ready,
        or <strong style={{ color: 'var(--bds-color-gray-80)' }}>+ Payment schedule</strong> to set the draws up first.
      </BdsText>
      <button
        type="button" onClick={onChange}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--bds-color-blue-70)', fontFamily: 'inherit' }}
      >
        Change how this job is invoiced
      </button>
    </div>
  );
}

export function CadenceInlineQuestionnaire({ answered, onAnswer, onDismiss, onReopen }: {
  answered: Cadence | null;
  onAnswer: (c: Cadence) => void;
  onDismiss: () => void;
  onReopen: () => void;
}) {
  /* Held here rather than lifted: the follow-up is a detail of the
     questionnaire, and the job-level fact the page cares about is the cadence. */
  const [pending, setPending] = useState<Cadence | null>(null);
  const [followUp, setFollowUp] = useState<string | null>(null);

  // Answered: the strip becomes a status line, editable in one click.
  if (answered) {
    const opt = cadenceOption(answered);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 0 18px', fontSize: 13, color: 'var(--bds-color-gray-70)' }}>
        <span style={{ color: 'var(--bds-color-green-70, #15803d)', display: 'inline-flex' }}><BdsIcon name="check" size={14} /></span>
        <span>
          Invoicing this job on <strong style={{ color: 'var(--bds-color-gray-90)' }}>{opt.short}</strong>
          {followUp ? <>, <strong style={{ color: 'var(--bds-color-gray-90)' }}>{followUp.toLowerCase()}</strong></> : null}. {opt.thenChoose}
        </span>
        <button
          type="button"
          onClick={() => { setPending(null); setFollowUp(null); onReopen(); }}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--bds-color-blue-70)', fontFamily: 'inherit' }}
        >
          Change
        </button>
      </div>
    );
  }

  const step2 = pending ? FOLLOW_UPS[pending] : null;
  const onStep2 = !!step2;
  const totalSteps = pending ? (FOLLOW_UPS[pending] ? 2 : 1) : 2;

  return (
    <div style={{
      border: '1px solid var(--bds-color-gray-15)', borderRadius: 'var(--bds-radius-lg)',
      padding: '12px 16px', marginBottom: 20, background: 'var(--bds-color-gray-3, #f8fafc)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Step count is what makes it read as a questionnaire rather than a
            toolbar: it says how much more there is, which is the thing a
            builder is deciding whether to spend attention on. */}
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--bds-color-gray-50)', whiteSpace: 'nowrap' }}>
          {onStep2 ? `Question 2 of ${totalSteps}` : `Question 1 of ${totalSteps}`}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-90)' }}>
          {onStep2 ? step2!.question : 'How should this job be invoiced?'}
        </span>
        {!onStep2 && (
          /* An unanswered strip does nothing for the builder, so it has to say
             what answering gets them. Without this it's a question with no
             stated payoff, which is what makes it skippable. */
          <span style={{ fontSize: 12, color: 'var(--bds-color-gray-60)', whiteSpace: 'nowrap' }}>
            Set it once and Buildertrend drafts them for you
          </span>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {onStep2
            ? step2!.options.map(o => (
                <RadioChoice key={o} name="cadence-q2" label={o} onSelect={() => { setFollowUp(o); onAnswer(pending!); }} />
              ))
            : CADENCE_OPTIONS.map(opt => (
                <RadioChoice
                  key={opt.key}
                  name="cadence-q1"
                  label={opt.short}
                  onSelect={() => {
                    // No follow-up worth asking means the questionnaire is done.
                    if (FOLLOW_UPS[opt.key]) setPending(opt.key);
                    else onAnswer(opt.key);
                  }}
                />
              ))}
        </div>
        <button
          type="button" onClick={onDismiss}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, color: 'var(--bds-color-gray-60)', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
        >
          Not now
        </button>
      </div>

      {onStep2 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--bds-color-gray-15)' }}>
          <button
            type="button" onClick={() => setPending(null)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--bds-color-blue-70)', fontFamily: 'inherit' }}
          >
            Back
          </button>
          <span style={{ fontSize: 12, color: 'var(--bds-color-gray-60)' }}>
            {cadenceOption(pending!).short} · {cadenceOption(pending!).thenChoose}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Placement B: the invoices grid's empty state ──────────────────────────
   An empty grid is already a dead end, so a setup question costs nothing here.
   It also self-limits: once the job has invoices this state is gone, so the
   question can't reach a builder who's mid-task. The tradeoff is reach. A
   builder who lands on the invoice builder another way never sees it. */
export function CadenceEmptyState({ job, onComplete, onSkip }: {
  job: Job;
  /* Both answers arrive together, same as the wizard modal: the cadence alone
     doesn't say which document to open, so the caller shouldn't have to guess. */
  onComplete: (c: Cadence, type: NewInvoiceChoice) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [cadence, setCadence] = useState<Cadence | null>(null);
  const [type, setType] = useState<NewInvoiceChoice>('standard');
  const [previewMode, setPreviewMode] = useState<InvoicingMode | null>(null);

  /* Selecting a cadence used to be the whole answer here, which meant the
     empty state committed to a document the builder never picked. It now asks
     the same second question the "+ Invoice" modal asks, so the two placements
     differ only in where they appear. */
  const choose = (c: Cadence) => {
    setCadence(c);
    const docs = cadenceOption(c).documents;
    // One document means there's nothing to ask: the answer is the whole flow.
    if (docs.length === 1) { onComplete(c, docs[0]); return; }
    // Land on the type this cadence most often produces, still changeable.
    setType(docs[0]);
    setStep(2);
  };

  return (
    <div style={{ maxWidth: step === 2 ? 880 : 620, margin: '0 auto', textAlign: 'left' }}>
      {step === 1 ? (
        <>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--bds-color-gray-50)', marginBottom: 6 }}>
              Step 1 of 2
            </div>
            <BdsText as="div" size="distinct-lg" style={{ color: 'var(--bds-color-gray-90)', marginBottom: 6 }}>
              How should this job be invoiced?
            </BdsText>
            <BdsText as="div" size="normal-md" style={{ color: 'var(--bds-color-gray-60)' }}>
              Set once for this job. It decides which invoices Buildertrend creates for you. For a one-off, use
              <strong style={{ color: 'var(--bds-color-gray-80)' }}> + Invoice</strong> instead.
            </BdsText>
          </div>

          <OptionList selected={cadence} onSelect={choose} compact omit={['adhoc']} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
            <button
              type="button" onClick={onSkip}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--bds-color-blue-70)', fontFamily: 'inherit' }}
            >
              Skip, I'll decide per invoice
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--bds-color-gray-50)', marginBottom: 6 }}>
              Step 2 of 2
            </div>
            <BdsText as="div" size="distinct-lg" style={{ color: 'var(--bds-color-gray-90)' }}>
              What invoices do you want to create for this job?
            </BdsText>
          </div>

          <TypeOptionList
            cadence={cadence!}
            selected={type}
            onSelect={setType}
            onPreview={setPreviewMode}
            radioName="empty-state-invoice-type"
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
            <button
              type="button" onClick={() => setStep(1)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--bds-color-blue-70)', fontFamily: 'inherit' }}
            >
              ← Back
            </button>
            {/* "Create" only when this really is the last step. A payment
                schedule opens the draw setup next, so nothing is created yet
                and the button says so. */}
            <div style={{ marginLeft: 'auto' }}>
              <BdsButton
                text={type === 'payment-schedule' || type === 'invoice-schedule' ? 'Continue' : 'Create'}
                displayType="primary"
                onClick={() => onComplete(cadence!, type)}
              />
            </div>
          </div>
        </>
      )}

      {previewMode && (
        <InvoicePreviewPanel mode={previewMode} job={job} onClose={() => setPreviewMode(null)} />
      )}
    </div>
  );
}
