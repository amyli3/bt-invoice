import { useState } from 'react';
import '../bds-tokens.css';
import { BdsButton, BdsBadge, BdsIcon, BdsTabs } from '../bds';
import { Job, InvoicingMode } from '../types';
import { recommendInvoicingMode, INVOICING_MODE_LABELS } from '../mockData';
import InvoicePreviewPanel from './InvoicePreviewPanel';

const MODE_ORDER: InvoicingMode[] = ['time-interval', 'milestone-draws', 'aia-percent-complete'];

/* ── Variant 1: the flat card picker we already had ── */
function CardPicker({ job, onContinue }: { job: Job; onContinue: (mode: InvoicingMode) => void }) {
  const recommendation = recommendInvoicingMode(job);
  const [selected, setSelected] = useState<InvoicingMode>(recommendation.mode);
  const [previewMode, setPreviewMode] = useState<InvoicingMode | null>(null);

  return (
    <div>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        {MODE_ORDER.map(mode => {
          const meta = INVOICING_MODE_LABELS[mode];
          const isRecommended = mode === recommendation.mode;
          const isSelected = mode === selected;
          return (
            <div
              key={mode}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(mode)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelected(mode); }}
              style={{
                textAlign: 'left', cursor: 'pointer', borderRadius: 'var(--bds-radius-lg)',
                border: isSelected ? '2px solid var(--bds-color-blue-70)' : '1px solid var(--bds-color-gray-25)',
                background: isSelected ? 'var(--bds-color-blue-5)' : '#fff',
                padding: '24px 20px 20px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative',
              }}
            >
              {isRecommended && (
                <div style={{ position: 'absolute', top: -11, left: 16 }}>
                  <BdsBadge text="Recommended" displayType="info" />
                </div>
              )}
              <div style={{ fontWeight: 600, color: 'var(--bds-color-gray-90)' }}>{meta.label}</div>
              <div style={{ fontSize: 13, color: 'var(--bds-color-gray-60)', lineHeight: 1.4 }}>{meta.blurb}</div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setPreviewMode(mode); }}
                style={{ background: 'none', border: 'none', padding: 0, marginTop: 2, cursor: 'pointer', color: 'var(--bds-color-blue-70)', fontSize: 13, fontWeight: 500, textAlign: 'left' }}
              >
                Preview example →
              </button>
              {isSelected && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: 'var(--bds-color-blue-70)', fontSize: 13, fontWeight: 500 }}>
                  <BdsIcon name="check" size={14} /> Selected
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        display: 'flex', gap: 12, alignItems: 'flex-start', padding: 16,
        background: 'var(--bds-color-info-background, #EEF5FF)', borderRadius: 'var(--bds-radius-md)', marginBottom: 24,
      }}>
        <div style={{ fontSize: 18 }}>💡</div>
        <div style={{ fontSize: 14, color: 'var(--bds-color-gray-80)' }}>
          <strong>Why we recommend {INVOICING_MODE_LABELS[recommendation.mode].label}: </strong>{recommendation.reason}
        </div>
      </div>

      <BdsButton text={`Continue with ${INVOICING_MODE_LABELS[selected].label}`} displayType="primary" onClick={() => onContinue(selected)} />

      {previewMode && (
        <InvoicePreviewPanel mode={previewMode} job={job} onClose={() => setPreviewMode(null)} />
      )}
    </div>
  );
}

/* ── Variant 2: the decision-tree experiment ──
   Contract type and cadence are already known by the time a builder gets
   here (set on Job Details at proposal signing), so instead of asking about
   them again, they're assumed using the same signals the Cards recommendation
   uses: commercial sector and a signed draw schedule / loan funding force a
   specific cadence outright; everything else is a genuine open question of
   display format — standard vs. a certified progress invoice — which a
   builder can preview either side of before committing. */
type DisplayFormat = 'standard' | 'progress';
type Cadence = 'milestone' | 'time-interval';

interface CadenceDecision {
  /** Set only when the job's requirements force the format too (certified commercial billing) — nothing to ask at all. */
  forcedMode?: InvoicingMode;
  /** The assumed cadence when format isn't forced — still not asked, but standard-vs-progress format remains a real choice either way. */
  cadence?: Cadence;
  reason: string;
}

function deriveCadence(job: Job): CadenceDecision {
  if (job.sector === 'commercial') {
    return {
      forcedMode: 'aia-percent-complete',
      reason: `${job.name} is a commercial job — these are typically billed on certified AIA pay applications, so this is a fit regardless of contract type.`,
    };
  }
  if (job.drawSchedule && job.drawSchedule.length > 0) {
    return {
      cadence: 'milestone',
      reason: `The signed proposal for ${job.name} set up a ${job.drawSchedule.length}-draw payment schedule tied to schedule phases, from Job Details — invoicing follows that schedule.`,
    };
  }
  if (job.contractType === 'fixed-price' && job.fundedByConstructionLoan) {
    return {
      cadence: 'milestone',
      reason: `${job.name} is fixed-price and financed by a construction loan (per Job Details) — lenders typically require draw-based disbursements tied to inspected progress.`,
    };
  }
  if (job.contractType === 'cost-plus' || job.contractType === 'time-and-materials') {
    return {
      cadence: 'time-interval',
      reason: `${job.name} is billed ${job.contractType === 'cost-plus' ? 'cost-plus' : 'on time & materials'} (per Job Details) — invoices are built from bills and time entries as they're logged, on whatever interval you choose below.`,
    };
  }
  return {
    cadence: 'time-interval',
    reason: `${job.name} is fixed-price with no draw schedule or construction loan on file — nothing forces a milestone structure, so pick the invoice format below.`,
  };
}

const CONTRACT_TYPE_LABEL = (job: Job) => (job.contractType === 'fixed-price' ? 'Fixed price' : 'Open book');

const CADENCE_WORD: Record<InvoicingMode, string> = {
  'milestone-draws': 'Milestone',
  'time-interval': 'Time interval',
  'aia-percent-complete': 'Progress',
};

function ChoiceCard({ label, sublabel, selected, onClick, onPreview }: {
  label: string; sublabel?: string; selected: boolean; onClick: () => void; onPreview?: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      style={{
        flex: 1, cursor: 'pointer', borderRadius: 'var(--bds-radius-lg)', textAlign: 'left',
        border: selected ? '2px solid var(--bds-color-blue-70)' : '1px solid var(--bds-color-gray-25)',
        background: selected ? 'var(--bds-color-blue-5)' : '#fff', padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--bds-color-gray-90)' }}>{label}</div>
      {sublabel && <div style={{ fontSize: 12, color: 'var(--bds-color-gray-60)' }}>{sublabel}</div>}
      {onPreview && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onPreview(); }}
          style={{ background: 'none', border: 'none', padding: 0, marginTop: 2, cursor: 'pointer', color: 'var(--bds-color-blue-70)', fontSize: 13, fontWeight: 500, textAlign: 'left', alignSelf: 'flex-start' }}
        >
          Preview example →
        </button>
      )}
    </div>
  );
}

function CadenceSummary({ label, reason, onOpenJobDetails }: { label: string; reason: string; onOpenJobDetails?: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
      border: '1px solid var(--bds-color-gray-15)', borderRadius: 'var(--bds-radius-md)',
      background: '#fff', padding: '12px 16px', marginBottom: 20,
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--bds-color-gray-90)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--bds-color-gray-60)', marginTop: 2, maxWidth: 480 }}>{reason}</div>
      </div>
      {onOpenJobDetails && (
        <button
          type="button"
          onClick={onOpenJobDetails}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--bds-color-blue-70)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          Not right? Edit in Job Details →
        </button>
      )}
    </div>
  );
}

function DecisionTreePicker({ job, onContinue, onOpenJobDetails }: { job: Job; onContinue: (mode: InvoicingMode) => void; onOpenJobDetails?: () => void }) {
  const decision = deriveCadence(job);
  const [display, setDisplay] = useState<DisplayFormat>(
    job.fundedByConstructionLoan ? 'progress' : 'standard'
  );
  const [previewMode, setPreviewMode] = useState<InvoicingMode | null>(null);

  // Fully forced, including format: commercial jobs require certified AIA
  // billing outright — nothing left to ask.
  if (decision.forcedMode) {
    const mode = decision.forcedMode;
    return (
      <div>
        <CadenceSummary label={`${CONTRACT_TYPE_LABEL(job)} - ${CADENCE_WORD[mode]}`} reason={decision.reason} onOpenJobDetails={onOpenJobDetails} />
        <div style={{ display: 'flex', gap: 12 }}>
          <BdsButton text="Preview example" displayType="secondary" onClick={() => setPreviewMode(mode)} />
          <BdsButton text={`Continue with ${INVOICING_MODE_LABELS[mode].label}`} displayType="primary" onClick={() => onContinue(mode)} />
        </div>
        {previewMode && <InvoicePreviewPanel mode={previewMode} job={job} onClose={() => setPreviewMode(null)} />}
      </div>
    );
  }

  // Cadence (milestone vs. time interval) is assumed from Job Details either
  // way, but standard-vs-certified-progress display is always a real choice
  // on top of it — a milestone job can still want certified documentation,
  // and vice versa. Either format can be previewed before committing.
  const cadence = decision.cadence!;
  const mode: InvoicingMode = display === 'progress' ? 'aia-percent-complete' : (cadence === 'milestone' ? 'milestone-draws' : 'time-interval');

  return (
    <div>
      <CadenceSummary label={`${CONTRACT_TYPE_LABEL(job)} - ${CADENCE_WORD[cadence === 'milestone' ? 'milestone-draws' : 'time-interval']}`} reason={decision.reason} onOpenJobDetails={onOpenJobDetails} />

      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bds-color-gray-60)', marginBottom: 8 }}>
        Which invoice format do you want to use?
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <ChoiceCard
          label="Standard invoice"
          sublabel={cadence === 'milestone' ? 'Bill the fixed draw amount as each milestone is completed' : 'Just the amount requested for each invoice'}
          selected={display === 'standard'} onClick={() => setDisplay('standard')}
          onPreview={() => setPreviewMode(cadence === 'milestone' ? 'milestone-draws' : 'time-interval')}
        />
        <ChoiceCard
          label="Progress invoice" sublabel="Amount against total scope, and what's been invoiced so far — required with many bank loans"
          selected={display === 'progress'} onClick={() => setDisplay('progress')}
          onPreview={() => setPreviewMode('aia-percent-complete')}
        />
      </div>

      <BdsButton text={`Continue with ${INVOICING_MODE_LABELS[mode].label}`} displayType="primary" onClick={() => onContinue(mode)} />

      {previewMode && <InvoicePreviewPanel mode={previewMode} job={job} onClose={() => setPreviewMode(null)} />}
    </div>
  );
}

export default function InvoicingModePicker({ job, onContinue, onOpenJobDetails }: { job: Job; onContinue: (mode: InvoicingMode) => void; onOpenJobDetails?: () => void }) {
  const [variant, setVariant] = useState<'cards' | 'tree'>('cards');

  return (
    <div className="bds-scope" style={{ padding: 32, maxWidth: 880, margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: 'var(--bds-color-gray-90)' }}>How should this job be invoiced?</h1>
      <p style={{ color: 'var(--bds-color-gray-70)', marginBottom: 16, maxWidth: 560 }}>
        Based on what's already known about this job, we have a recommendation below — you can pick a different mode any time.
      </p>

      <div style={{ marginBottom: 24 }}>
        <BdsTabs
          ariaLabel="Invoicing mode picker variant"
          activeKey={variant}
          onChange={k => setVariant(k as 'cards' | 'tree')}
          tabs={[
            { key: 'cards', label: 'Cards' },
            { key: 'tree', label: 'Decision tree (experiment)' },
          ]}
        />
      </div>

      {variant === 'cards'
        ? <CardPicker job={job} onContinue={onContinue} />
        : <DecisionTreePicker job={job} onContinue={onContinue} onOpenJobDetails={onOpenJobDetails} />}
    </div>
  );
}
