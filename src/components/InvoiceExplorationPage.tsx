import '../bds-tokens.css';
import { BdsText, BdsBadge } from '../bds';
import { cadenceOption, type Cadence } from './CadenceQuestion';

/* Scratch surface for invoice concepts that aren't a route yet. Lives under
   Financial > Invoice so an exploration can be clicked to rather than
   described, without landing in one of the loops a stakeholder walks through.

   ── Exploration 1: where the cadence question gets asked ─────────────────
   Today "+ Invoice" asks which document to create: Standard, Payment
   schedule, Progress. That asks the builder to pick a format before they've
   said anything about how the job bills, and the format is the part they can
   least picture.

   The reframe asks how often they invoice instead, which is a fact about the
   job they already know, and lets the document fall out of the answer. It's
   per job, so it can differ from one job to the next.

   Where it gets asked is the open question, because the same question is
   helpful on a job with nothing set up and an interruption on a job whose
   builder knows exactly what they're billing today. Three placements, one
   question, switchable below. */

export type CadencePlacement = 'plus-invoice' | 'empty-state' | 'inline';

const PLACEMENTS: { key: CadencePlacement; label: string; note: string }[] = [
  { key: 'plus-invoice', label: 'On "+ Invoice"', note: 'Reaches everyone, including a builder who is mid-task. The answer narrows the invoice type dialog that follows it.' },
  { key: 'empty-state', label: 'In the empty state', note: 'Interrupts nothing: the page already had nothing on it, and it is gone once the job has invoices. "+ Invoice" keeps its split button, so a builder can go straight to a standard or progress invoice without answering.' },
  { key: 'inline', label: 'Inline above the grid', note: 'One row, one question at a time, answered by radio. Least intrusive, and the easiest to never notice.' },
];

export default function InvoiceExplorationPage({ placement, onPlacementChange, answer, onReset }: {
  placement: CadencePlacement;
  onPlacementChange: (p: CadencePlacement) => void;
  answer: Cadence | null;
  onReset: () => void;
}) {
  const active = PLACEMENTS.find(p => p.key === placement)!;

  return (
    <div className="bds-scope" style={{ padding: '20px 32px 0', width: '100%', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--bds-color-gray-90)' }}>Exploration</h1>
        <BdsText as="span" size="normal-sm" style={{ color: 'var(--bds-color-gray-60)' }}>
          A copy of the fixed price invoices page. Nothing here affects the other routes.
        </BdsText>
      </div>

      {/* What's being tested, stated plainly, so the page doesn't read as a
          proposed design. */}
      <div style={{
        border: '1px solid var(--bds-color-blue-20, #bfdbfe)', background: 'var(--bds-color-blue-5, #eff6ff)',
        borderRadius: 'var(--bds-radius-lg)', padding: '16px 18px', maxWidth: 860, marginBottom: 28,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <BdsBadge text="Exploration 1" displayType="info" />
          <BdsText as="span" size="heavy-md" style={{ color: 'var(--bds-color-gray-90)' }}>
            "+ Invoice" asks for the cadence
          </BdsText>
        </div>
        <BdsText as="div" size="normal-md" style={{ color: 'var(--bds-color-gray-80)', lineHeight: 1.6, marginBottom: 12 }}>
          Today the button asks which document to create: Standard, Payment schedule, or Progress. That asks for a
          format before the builder has said anything about how the job bills, and the format is the hardest part to
          picture. Here the question is how often they invoice, which they already know, and the document follows from
          the answer.
        </BdsText>
        {/* The switcher is the exploration. Same question in all three, so
            what's being compared is where it interrupts. */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {PLACEMENTS.map(p => {
            const isActive = p.key === placement;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => { onPlacementChange(p.key); onReset(); }}
                style={{
                  padding: '7px 14px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                  border: isActive ? '1px solid var(--bds-color-blue-70)' : '1px solid var(--bds-color-gray-25)',
                  background: isActive ? 'var(--bds-color-blue-70)' : '#fff',
                  color: isActive ? '#fff' : 'var(--bds-color-gray-80)',
                  borderRadius: 16, fontWeight: isActive ? 600 : 400,
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <BdsText as="div" size="normal-md" style={{ color: 'var(--bds-color-gray-70)', lineHeight: 1.55, marginBottom: answer ? 10 : 0 }}>
          {active.note}
        </BdsText>
        {answer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderTop: '1px solid var(--bds-color-blue-20, #bfdbfe)', paddingTop: 10 }}>
            <BdsText as="span" size="normal-md" style={{ color: 'var(--bds-color-gray-80)' }}>
              Answered: <strong>{cadenceOption(answer).question}</strong>. {cadenceOption(answer).thenChoose}
            </BdsText>
            <button
              type="button" onClick={onReset}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--bds-color-blue-70)', fontFamily: 'inherit' }}
            >
              Reset
            </button>
          </div>
        )}
        </div>
    </div>
  );
}