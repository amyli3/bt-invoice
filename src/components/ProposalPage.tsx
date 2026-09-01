import { useState } from 'react';
import { allAllowances, allSelections } from '../allowanceMockData';
import { JOB_SCHEDULE_ITEMS } from '../mockData';
import { BdsButton, BdsIcon } from '../bds';
import PaymentScheduleModal from './PaymentScheduleModal';
import { type DrawScheduleLine } from '../types';

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Flatten the same allowance/selection mock data the Estimate page uses, so
// whatever's on the estimate is what shows up on the proposal.
type ProposalItem = { id: string; name: string; costCode: string; vendor: string; qty: number; unit: string; unitPrice: number; price: number };
const proposalItems: ProposalItem[] = allAllowances.flatMap(allowance => {
  const selections = allSelections.filter(s => allowance.selectionIds.includes(s.id));
  return selections.flatMap(sel =>
    sel.options.map(opt => {
      const unitPrice = opt.unitCost * (1 + opt.markup / 100);
      return {
        id: opt.id,
        name: opt.name,
        costCode: `${opt.costCode.code} - ${opt.costCode.label}`,
        vendor: opt.vendor,
        qty: opt.quantity,
        unit: opt.unit,
        unitPrice,
        price: unitPrice * opt.quantity,
      };
    })
  );
});
const proposalSubtotal = proposalItems.reduce((s, i) => s + i.price, 0);

/* Open book has no contract price to break into milestones, so the thing a
   client signs up to is a cadence: how often they'll be billed and starting
   when. Builders already write this into their proposals in prose, so the
   proposal is where it's captured, and the summary line is the sentence they
   would have typed. */
/* Net terms answer a different question than the milestone triggers do. A
   trigger says what event earns the payment ("upon signing"); the terms say how
   long the client has to pay once that invoice goes out. Both models need it,
   so it sits above the fixed/open book split, and it's the field that gives an
   invoice a deadline instead of a blank Due date. */
type Terms = 'Not specified' | 'Due on receipt' | 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60' | 'Custom';
const TERMS_OPTIONS: Terms[] = ['Not specified', 'Due on receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Custom'];

type Repeat = 'Weekly' | 'Every 2 weeks' | 'Monthly' | 'Quarterly';
const REPEATS: Repeat[] = ['Weekly', 'Every 2 weeks', 'Monthly', 'Quarterly'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ORDINALS = ['First', 'Second', 'Third', 'Fourth', 'Last'];
const DAY_ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '13th', '14th', '15th', '16th', '17th', '18th', '19th', '20th', '21st', '22nd', '23rd', '24th', '25th', '26th', '27th', '28th', '29th', '30th', '31st'];

interface Props {
  onBack: () => void;
  clientName?: string;
  jobCode?: string;
  /* Open book swaps the milestone payment schedule for an invoicing cadence:
     there are no fixed amounts to promise, only when the bills arrive. */
  billingModel?: 'fixed' | 'open-book';
  /* Contract type is settable here, not just inherited from the estimate: the
     proposal is where the builder is deciding what to promise the client, and
     the answer is the same field Job Details records. Passing a handler is what
     turns the selector on; without one the page reads whatever it was given. */
  onBillingModelChange?: (model: 'fixed' | 'open-book') => void;
  /* Whether a construction loan funds this job. The same field Job Details
     writes, not a second copy: two places to set one fact is how the
     invoicing-mode recommendation ends up disagreeing with the proposal. The
     proposal is simply the earlier of the two surfaces, and it's where the
     answer changes what the client reads. */
  fundedByLoan?: boolean;
  onFundedByLoanChange?: (funded: boolean) => void;
}

export default function ProposalPage({ onBack, clientName = 'Amy', jobCode = 'BWF-26', billingModel = 'fixed', onBillingModelChange, fundedByLoan, onFundedByLoanChange }: Props) {
  const isOpenBook = billingModel === 'open-book';
  const [collectSignatures, setCollectSignatures] = useState(true);
  const [title, setTitle] = useState(`Proposal for ${clientName} (${jobCode})`);
  const [approvalDeadline, setApprovalDeadline] = useState('');
  const [introText, setIntroText] = useState('');
  const [closingText, setClosingText] = useState('');

  /* Net 30 rather than blank: leaving it unset is how invoices end up with no
     deadline, which is the case builders are trying to get out of. "Not
     specified" is still there for whoever writes terms into the contract. */
  const [terms, setTerms] = useState<Terms>('Net 30');
  const [customNetDays, setCustomNetDays] = useState(30);

  /* Whether this client's invoices have to arrive as certified pay
     applications. Local to the proposal for now: nothing else in the prototype
     records it per job yet, and the answer's job is to set what the first
     invoice opens as. */
  const [requiresPayApps, setRequiresPayApps] = useState(false);

  const [requestDeposit, setRequestDeposit] = useState(false);
  const [depositType, setDepositType] = useState<'percent' | 'flat'>('percent');
  const [depositPercent, setDepositPercent] = useState(10);
  const [depositFlat, setDepositFlat] = useState(Math.round(proposalSubtotal * 0.1));

  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  /* The same draw schedule the Invoices grid edits, in the same shape, so the
     proposal isn't a second place that models this differently. */
  const [draws, setDraws] = useState<DrawScheduleLine[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Open book's cadence, mirroring the recurring-invoice setup.
  const [cadenceEnabled, setCadenceEnabled] = useState(true);
  const [repeat, setRepeat] = useState<Repeat>('Monthly');
  const [cadenceStart, setCadenceStart] = useState('');
  /* A cadence usually starts when work does, and the job's schedule already
     says when that is. Linking beats typing a date twice: if the phase moves,
     the first invoice moves with it instead of going out against a date that
     is no longer true. Same "Link to schedule item" pattern the invoice date
     uses, so it's one idea in two places rather than two. */
  const [startMode, setStartMode] = useState<'date' | 'schedule'>('date');
  const [startScheduleId, setStartScheduleId] = useState(JOB_SCHEDULE_ITEMS[0].id);
  const [onMode, setOnMode] = useState<'day' | 'weekday'>('day');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [ordinal, setOrdinal] = useState('First');
  const [weekday, setWeekday] = useState('Friday');
  const usesDayOfMonth = repeat === 'Monthly' || repeat === 'Quarterly';
  const startScheduleItem = JOB_SCHEDULE_ITEMS.find(i => i.id === startScheduleId) ?? JOB_SCHEDULE_ITEMS[0];
  /* One start date, whichever way it was set, so everything downstream (the
     summary line, the client's paragraph) reads from the same value. */
  const effectiveStart = startMode === 'schedule' ? startScheduleItem.start : cadenceStart;
  const fmtStart = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: '2-digit', year: 'numeric' });
  const startLabel = effectiveStart ? fmtStart(effectiveStart) : null;
  /* The linked version names the phase rather than only the date: that's the
     promise the client is being given, and the date is what it works out to
     today. */
  const startPhrase = startMode === 'schedule'
    ? `when ${startScheduleItem.name} starts (${fmtStart(startScheduleItem.start)})`
    : startLabel;
  /* One sentence, assembled from whatever is set, so the builder reads the
     promise the client will read rather than inferring it from four controls. */
  const cadenceSentence = (() => {
    const every = repeat === 'Monthly' ? 'every month'
      : repeat === 'Quarterly' ? 'every quarter'
      : repeat === 'Weekly' ? 'every week'
      : 'every 2 weeks';
    const when = usesDayOfMonth
      ? (onMode === 'day' ? `${DAY_ORDINALS[dayOfMonth - 1]} of ${every}` : `${ordinal.toLowerCase()} ${weekday} of ${every}`)
      : `${weekday} of ${every}`;
    return { when, startLabel: startPhrase };
  })();

  const netDays = terms === 'Custom' ? customNetDays : Number(terms.replace('Net ', '')) || 0;
  /* The sentence the client will read, assembled here so the builder sees the
     same words in the setup and in the preview. */
  const termsSentence = terms === 'Not specified' ? null
    : terms === 'Due on receipt' ? 'Invoices are due upon receipt.'
    : `Invoices are due within ${netDays} days of the invoice date.`;

  const depositAmount = depositType === 'percent' ? proposalSubtotal * depositPercent / 100 : depositFlat;

  /* A deposit and Draw #1 are the same payment, so the deposit owns that row
     rather than being scheduled twice. Derived on read instead of copied into
     state, so changing the deposit can't leave a stale draw behind. */
  const depositPercentOfTotal = proposalSubtotal > 0 ? (depositAmount / proposalSubtotal) * 100 : 0;
  const depositOwnsFirstDraw = requestDeposit && depositAmount > 0;
  const scheduleDraws: DrawScheduleLine[] = depositOwnsFirstDraw
    ? draws.map((d, i) => i === 0
      ? { ...d, title: 'Deposit', milestone: 'Project Start', amount: Math.round(depositAmount) }
      : d)
    : draws;

  const scheduledTotal = scheduleDraws.reduce((s, d) => s + d.amount, 0);
  const unscheduled = proposalSubtotal - scheduledTotal;
  const isFullyAllocated = Math.abs(unscheduled) < 0.01;

  return (
    /* Split screen: what the builder fills in on the left, what the client will
       receive on the right, updating as they type. The old Details / Client
       preview tabs made the document something you went and checked; side by
       side it's the thing being edited. */
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f1f5f9', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ background: 'white', flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>{title || `Proposal for ${clientName} (${jobCode})`}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Job Proposal</h1>
                <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 10, fontWeight: 500, background: '#f1f5f9', color: '#64748b' }}>New</span>
              </div>
              <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#0065db', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2.5l-4 3.5 4 3.5" stroke="#0065db" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ width: 34, height: 34, border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#334155', fontSize: 16, lineHeight: 1 }}>&#8943;</button>
              <button style={{ padding: '8px 16px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#334155', fontFamily: 'inherit' }}>Save</button>
              <BdsButton text="Send" displayType="primary" icon={<BdsIcon name="send" size={14} />} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* Left: the form. Its own scroll, so a long form never pushes the
            document out of view. */}
        <div style={{
          width: 'clamp(400px, 42%, 640px)', flexShrink: 0, background: 'white',
          borderRight: '1px solid #e2e8f0', overflowY: 'auto',
        }}>
          <div style={{ padding: '24px 28px' }}>
            {/* Signatures */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#0f172a', cursor: 'pointer', marginBottom: 12 }}>
                <input type="checkbox" checked={collectSignatures} onChange={e => setCollectSignatures(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#0065db' }} />
                Collect signatures
              </label>
              {collectSignatures && (
                <div style={{ maxWidth: 480 }}>
                  <label style={lbl}>Select users to sign</label>
                  <input style={inp} placeholder="Choose signers…" />
                </div>
              )}
            </div>

            {/* Title / deadline */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Title *</label>
                <input style={inp} value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div style={{ width: 200 }}>
                <label style={lbl}>Approval deadline</label>
                <input type="date" style={inp} value={approvalDeadline} onChange={e => setApprovalDeadline(e.target.value)} />
              </div>
            </div>

            {/* Payment */}
            <div style={{ marginBottom: 28, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Payment</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                Set up how and when the client pays for this job. Contract total: <strong style={{ color: '#0f172a' }}>${fmt(proposalSubtotal)}</strong>
              </div>

              {/* Contract type ahead of everything else in this section:
                  fixed price promises amounts, open book promises a cadence, so
                  it decides which of the two setups below is even shown. */}
              {onBillingModelChange && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ ...lbl, marginBottom: 8 }}>Contract type <span style={{ color: '#dc2626' }}>*</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 560 }}>
                    {([
                      { key: 'fixed', label: 'Fixed price', blurb: 'You set the price for the owner' },
                      { key: 'open-book', label: 'Open book', blurb: 'Actual costs plus markup/margin (i.e. Cost Plus and Time & Materials)' },
                    ] as const).map(opt => (
                      <label key={opt.key} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
                        border: billingModel === opt.key ? '2px solid #0065db' : '1px solid #e2e8f0',
                        background: billingModel === opt.key ? '#eff6ff' : 'white',
                      }}>
                        <input
                          type="radio" name="proposal-contract-type"
                          checked={billingModel === opt.key}
                          onChange={() => onBillingModelChange(opt.key)}
                          style={{ width: 16, height: 16, marginTop: 2, accentColor: '#0065db' }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{opt.label}</div>
                          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{opt.blurb}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Funding first, because it changes what the rest of this
                  section means. A lender disburses after inspection, so on a
                  loan-funded job the net terms below are not what decides when
                  the money actually lands. */}
              {onFundedByLoanChange && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ ...lbl, marginBottom: 8 }}>Funded by construction loan</div>
                  <div style={{ display: 'flex', gap: 20 }}>
                    {([['yes', true], ['no', false]] as const).map(([label, val]) => (
                      <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
                        <input
                          type="radio" name="proposal-funded-by-loan"
                          checked={fundedByLoan === val}
                          onChange={() => onFundedByLoanChange(val)}
                          style={{ width: 16, height: 16, accentColor: '#0065db' }}
                        />
                        {label === 'yes' ? 'Yes' : 'No'}
                      </label>
                    ))}
                  </div>
                  {/* Sub-question, because the lender is usually who hands
                      the builder the form: a loan-funded or commercial job is
                      where G702/G703 gets required. Asked here rather than
                      discovered at the first invoice, since it decides what
                      every invoice on this job looks like. Vocabulary stays as
                      the AIA forms name it. */}
                  <div style={{ marginTop: 14, marginLeft: 24, paddingLeft: 14, borderLeft: '2px solid #e2e8f0' }}>
                    <div style={{ ...lbl, marginBottom: 8 }}>Does this client require pay applications (G702/G703)?</div>
                    <div style={{ display: 'flex', gap: 20 }}>
                      {([['Yes', true], ['No', false]] as const).map(([label, val]) => (
                        <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
                          <input
                            type="radio" name="proposal-pay-apps"
                            checked={requiresPayApps === val}
                            onChange={() => setRequiresPayApps(val)}
                            style={{ width: 16, height: 16, accentColor: '#0065db' }}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, maxWidth: 540, lineHeight: 1.5 }}>
                      {requiresPayApps
                        ? 'Invoices on this job open as progress invoices: percent complete against a schedule of values pulled from your estimate, in G702/G703 format.'
                        : fundedByLoan
                          ? 'Lenders and their inspectors often require them. Worth confirming before the first draw.'
                          : 'Invoices on this job open as standard invoices.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Terms first: it frames every invoice the job will send, where
                  the deposit and the schedule are each one payment. Fixed and
                  open book both get it. */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                  <div style={{ width: 180 }}>
                    <label style={lbl}>Payment terms</label>
                    <select style={inp} value={terms} onChange={e => setTerms(e.target.value as Terms)}>
                      {TERMS_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {terms === 'Custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: '#64748b' }}>Net</span>
                      <input
                        type="number" min={1} style={{ ...inp, width: 80 }}
                        value={customNetDays} onChange={e => setCustomNetDays(Number(e.target.value))}
                      />
                      <span style={{ fontSize: 13, color: '#64748b' }}>days</span>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, maxWidth: 560, lineHeight: 1.5 }}>
                  {/* Terms are job-level, not per document: every invoice this
                      job sends gets its due date from here, including ones
                      created outside this proposal. */}
                  {termsSentence
                    ? <>{termsSentence} Buildertrend applies this to every invoice on this job.</>
                    : <>No terms will appear on the proposal, and invoices for this job will go out without a due date.</>}
                </div>
              </div>

              {/* Deposit / payment upon approval */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                <input type="checkbox" checked={requestDeposit} onChange={e => setRequestDeposit(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#0065db' }} />
                Request payment upon approval
              </label>

              {requestDeposit && (
                <div style={{ marginTop: 12, marginLeft: 24, maxWidth: 620, background: 'var(--g50)', border: '1px solid var(--g200)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                  {/* Flat fee first, matching the order the deposit dialog uses
                      elsewhere. Copy is the contract-price vocabulary rather
                      than "% of total", since that's the number being cut. */}
                  <div style={{ display: 'inline-flex', marginBottom: 14, border: '1px solid #B1B4B5', borderRadius: 5, overflow: 'hidden' }}>
                    {(['flat', 'percent'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setDepositType(t)}
                        style={{
                          padding: '6px 14px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                          border: depositType === t ? '1px solid #0763FB' : '1px solid transparent',
                          borderRadius: depositType === t ? 4 : 0,
                          background: 'white',
                          color: depositType === t ? '#004FD6' : '#26292E',
                          fontWeight: depositType === t ? 500 : 400,
                          margin: depositType === t ? -1 : 0,
                          position: 'relative', zIndex: depositType === t ? 1 : 0,
                        }}
                      >
                        {t === 'percent' ? '% of contract price' : 'Flat fee'}
                      </button>
                    ))}
                  </div>

                  {/* Percent needs its arithmetic shown: what it's a cut of,
                      the cut, what that comes to, read across one line. A flat
                      fee is already the answer, so it's just the field. */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
                    {depositType === 'percent' && (
                      <div>
                        <div style={fieldLbl}>Contract price</div>
                        <div style={fieldVal}>${fmt(proposalSubtotal)}</div>
                      </div>
                    )}

                    <div>
                      <div style={fieldLbl}>
                        {depositType === 'percent' ? '% of contract price' : 'Flat fee'} <span style={{ color: '#dc2626' }}>*</span>
                      </div>
                      {/* Longhand borders on every side: mixing the `border`
                          shorthand with a single-side longhand drops the
                          shorthand on the others, and the UA's 2px inset border
                          shows through where the seam should be. */}
                      <div style={{ display: 'flex', alignItems: 'stretch', width: 140 }}>
                        {depositType === 'flat' && <span style={affix}>$</span>}
                        <input
                          type="number"
                          style={{
                            ...inpNoBorder,
                            flex: 1, minWidth: 0,
                            borderTop: FIELD_BORDER,
                            borderBottom: FIELD_BORDER,
                            borderLeft: depositType === 'flat' ? 'none' : FIELD_BORDER,
                            borderRight: depositType === 'percent' ? 'none' : FIELD_BORDER,
                            borderRadius: depositType === 'flat' ? '0 6px 6px 0' : '6px 0 0 6px',
                          }}
                          value={depositType === 'percent' ? depositPercent : depositFlat}
                          /* Same rule as the draws: a payment on approval is a
                             cut of the contract price, so it stops at the whole
                             thing. */
                          onChange={e => {
                            const v = Number(e.target.value);
                            if (depositType === 'percent') setDepositPercent(Math.max(0, Math.min(v, 100)));
                            else setDepositFlat(Math.max(0, Math.min(v, Math.round(proposalSubtotal))));
                          }}
                        />
                        {depositType === 'percent' && <span style={{ ...affix, borderRadius: '0 6px 6px 0' }}>%</span>}
                      </div>
                    </div>

                    {depositType === 'percent' && (
                      <div>
                        <div style={fieldLbl}>Amount</div>
                        <div style={fieldVal}>${fmt(depositAmount)}</div>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 12 }}>
                    Due when the client approves the proposal.
                  </div>
                </div>
              )}

              {/* Invoicing cadence, open book only. There are no fixed amounts
                  to schedule, so what the client is agreeing to is when the
                  invoices arrive and what period each one covers. */}
              {isOpenBook && (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#0f172a', cursor: 'pointer', marginTop: 20 }}>
                    <input type="checkbox" checked={cadenceEnabled} onChange={e => setCadenceEnabled(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#0065db' }} />
                    Include the invoicing cadence on this proposal
                  </label>

                  {cadenceEnabled && (
                    <div style={{ marginTop: 12, marginLeft: 24, maxWidth: 620 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '12px 14px', alignItems: 'center' }}>
                        <label style={{ ...lbl, marginBottom: 0 }}>Repeat</label>
                        <select style={{ ...inp, maxWidth: 320 }} value={repeat} onChange={e => setRepeat(e.target.value as Repeat)}>
                          {REPEATS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>

                        <label style={{ ...lbl, marginBottom: 0, alignSelf: 'start', paddingTop: 8 }}>Start</label>
                        <div style={{ maxWidth: 320 }}>
                          {/* Date or schedule item, the same two answers the
                              invoice date offers. */}
                          <div style={{ display: 'inline-flex', marginBottom: 8, border: '1px solid #B1B4B5', borderRadius: 5, overflow: 'hidden' }}>
                            {([['date', 'Date'], ['schedule', 'Schedule item']] as const).map(([key, label]) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setStartMode(key)}
                                style={{
                                  padding: '6px 14px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                                  border: startMode === key ? '1px solid #0763FB' : '1px solid transparent',
                                  borderRadius: startMode === key ? 4 : 0,
                                  background: 'white',
                                  color: startMode === key ? '#004FD6' : '#26292E',
                                  fontWeight: startMode === key ? 500 : 400,
                                  margin: startMode === key ? -1 : 0,
                                  position: 'relative', zIndex: startMode === key ? 1 : 0,
                                }}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          {startMode === 'date' ? (
                            <input type="date" style={inp} value={cadenceStart} onChange={e => setCadenceStart(e.target.value)} />
                          ) : (
                            <>
                              <select style={inp} value={startScheduleId} onChange={e => setStartScheduleId(e.target.value)}>
                                {JOB_SCHEDULE_ITEMS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                              </select>
                              {/* What the link resolves to today, and what
                                  happens if the schedule moves. */}
                              <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 1.5 }}>
                                Starts {fmtStart(startScheduleItem.start)}. If the phase moves, the first invoice moves with it.
                              </div>
                            </>
                          )}
                        </div>

                        <label style={{ ...lbl, marginBottom: 0, alignSelf: usesDayOfMonth ? 'start' : 'center', paddingTop: usesDayOfMonth ? 8 : 0 }}>On</label>
                        {usesDayOfMonth ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* Day of the month, or the nth weekday. Radios
                                because a month has exactly one of these two
                                shapes, never both. */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <input type="radio" name="cadence-on" checked={onMode === 'day'} onChange={() => setOnMode('day')} style={{ width: 16, height: 16, accentColor: '#0065db' }} />
                              <select style={{ ...inp, width: 150 }} value={dayOfMonth} onChange={e => { setOnMode('day'); setDayOfMonth(Number(e.target.value)); }}>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                              <span style={{ ...inp, width: 150, color: '#94a3b8', background: '#f8fafc' }}>Day</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <input type="radio" name="cadence-on" checked={onMode === 'weekday'} onChange={() => setOnMode('weekday')} style={{ width: 16, height: 16, accentColor: '#0065db' }} />
                              <select style={{ ...inp, width: 150 }} value={ordinal} onChange={e => { setOnMode('weekday'); setOrdinal(e.target.value); }}>
                                {ORDINALS.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                              <select style={{ ...inp, width: 150 }} value={weekday} onChange={e => { setOnMode('weekday'); setWeekday(e.target.value); }}>
                                {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            </div>
                          </div>
                        ) : (
                          <select style={{ ...inp, maxWidth: 320 }} value={weekday} onChange={e => setWeekday(e.target.value)}>
                            {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        )}

                        <label style={{ ...lbl, marginBottom: 0, alignSelf: 'start' }}>Invoice schedule</label>
                        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                          Billing occurs on the <strong style={{ color: '#0f172a' }}>{cadenceSentence.when}</strong>
                          {cadenceSentence.startLabel ? <> starting {cadenceSentence.startLabel}</> : <span style={{ color: '#b45309' }}>. Set a start date to finish the schedule.</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Payment schedule */}
              {!isOpenBook && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#0f172a', cursor: 'pointer', marginTop: 20 }}>
                <input
                  type="checkbox" checked={scheduleEnabled}
                  onChange={e => setScheduleEnabled(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#0065db' }}
                />
                Include a payment schedule on this proposal
              </label>
              )}

              {!isOpenBook && scheduleEnabled && (
                <div style={{ marginTop: 12, marginLeft: 24 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, maxWidth: 620 }}>
                    The schedule is appended to the proposal so the client can see how payments break down over the
                    course of the project. It's the same schedule the Invoices page uses to create a draft per draw.
                  </div>

                  {/* Nothing set yet: one button into the same editor the grid
                      opens, rather than a second inline table that models draws
                      its own way. */}
                  {scheduleDraws.length === 0 ? (
                    <BdsButton
                      text="Payment schedule" displayType="secondary" icon={<BdsIcon name="plus" size={14} />}
                      onClick={() => setShowScheduleModal(true)}
                    />
                  ) : (
                    <>
                      {/* What was set, read-only. Editing happens in the modal,
                          so there's one editor for a draw schedule. */}
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: 12, maxWidth: 620 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                              <th style={{ ...th, width: 80 }}></th>
                              <th style={th}>Invoice title</th>
                              <th style={th}>Schedule item</th>
                              <th style={{ ...th, textAlign: 'right' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scheduleDraws.map((d, i) => (
                              <tr key={d.drawNumber} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ ...td, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>Draw #{i + 1}</td>
                                <td style={td}>
                                  {d.title || '—'}
                                  {i === 0 && depositOwnsFirstDraw && (
                                    <span style={{ fontSize: 11, color: '#64748b' }}> · from payment upon approval</span>
                                  )}
                                </td>
                                <td style={td}>{d.milestone}</td>
                                <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>${fmt(d.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <BdsButton text="Edit payment schedule" displayType="secondary" onClick={() => setShowScheduleModal(true)} />
                        <div style={{ fontSize: 12, fontWeight: 500, color: isFullyAllocated ? '#15803d' : '#b45309' }}>
                          {isFullyAllocated
                            ? `✓ Fully allocated. $${fmt(scheduledTotal)} scheduled`
                            : unscheduled > 0
                              ? `$${fmt(unscheduled)} of the proposal total is not yet scheduled`
                              : `Schedule exceeds the proposal total by $${fmt(-unscheduled)}`}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Introductory text */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Introductory text</div>
              <textarea style={textarea} value={introText} onChange={e => setIntroText(e.target.value)} />
            </div>

            {/* Closing text */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Closing text</div>
              <textarea style={textarea} value={closingText} onChange={e => setClosingText(e.target.value)} />
            </div>

            {/* Attachments */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Attachments</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ fontSize: 13, padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#334155', fontFamily: 'inherit' }}>Add</button>
                <button style={{ fontSize: 13, padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#334155', fontFamily: 'inherit' }}>Create new doc</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: the document, on the gray canvas that reads as paper. Scrolls
            independently of the form. */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: '#f1f5f9' }}>
          <div style={{ padding: '20px 24px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, maxWidth: 700, margin: '0 auto 12px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 }}>Client preview</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Updates as you edit</div>
            </div>

            {/* Document preview */}
            <div style={{ maxWidth: 700, margin: '0 auto', border: '1px solid #e2e8f0', borderRadius: 8, padding: '32px 40px', background: 'white' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 0.5, color: '#0f172a' }}>BOOGIE CONSTRUCTION</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>3700 Georgia Ave NW · Washington, DC 20010 · (202) 555-0142</div>
              </div>

              <div style={{ fontSize: 13, color: '#334155', marginBottom: 4 }}>Job Address:</div>
              <div style={{ fontSize: 13, color: '#334155', marginBottom: 16 }}>{jobCode}</div>

              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{title || `Proposal for ${clientName} (${jobCode})`}</div>

              {introText && <div style={{ fontSize: 13, color: '#334155', marginBottom: 20, whiteSpace: 'pre-wrap' }}>{introText}</div>}

              <div style={{ borderTop: '1px solid #e2e8f0', marginBottom: 12 }} />
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 }}>
                <thead>
                  <tr>
                    <th style={{ ...th, borderBottom: '1px solid #e2e8f0' }}>Items</th>
                    <th style={{ ...th, borderBottom: '1px solid #e2e8f0' }}>Description</th>
                    <th style={{ ...th, borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Qty/Unit</th>
                    <th style={{ ...th, borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Unit price</th>
                    <th style={{ ...th, borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {proposalItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={td}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.costCode}</div>
                      </td>
                      <td style={td}>{item.vendor}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{item.qty} {item.unit}</td>
                      <td style={{ ...td, textAlign: 'right' }}>${fmt(item.unitPrice)}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>${fmt(item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                <div style={{ textAlign: 'right', fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, padding: '3px 0', color: '#64748b' }}>
                    <span>Subtotal</span><span style={{ fontWeight: 500, color: '#0f172a' }}>${fmt(proposalSubtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, padding: '3px 0', color: '#64748b' }}>
                    <span>Tax</span><span style={{ fontWeight: 500, color: '#0f172a' }}>$0.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, padding: '6px 0', borderTop: '2px solid #0f172a', marginTop: 4, fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                    <span>Total price</span><span>${fmt(proposalSubtotal)}</span>
                  </div>
                </div>
              </div>

              {/* Hidden when the schedule below already opens with this same
                  payment as Draw #1: stating it twice reads as owing it twice. */}
              {requestDeposit && !(scheduleEnabled && scheduleDraws.length > 0 && depositOwnsFirstDraw) && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e3a8a' }}>Payment due upon approval</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1e3a8a' }}>${fmt(depositAmount)}</span>
                </div>
              )}

              {/* The cadence is the thing the client is agreeing to on an open
                  book job, so it reads as a stated term, not a table. */}
              {isOpenBook && cadenceEnabled && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Invoicing</div>
                  <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                    This project is billed on actual costs. Invoices are issued on the{' '}
                    <strong style={{ color: '#0f172a' }}>{cadenceSentence.when}</strong>
                    {cadenceSentence.startLabel ? <> starting {cadenceSentence.startLabel}</> : null}, covering the
                    costs incurred since the previous invoice.
                    {/* The cadence says when the bill arrives; the terms say how
                        long they have to pay it. Same paragraph, because the
                        client reads them as one promise. */}
                    {termsSentence && <> {termsSentence}</>}
                  </div>
                </div>
              )}

              {!isOpenBook && scheduleEnabled && scheduleDraws.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Payment schedule</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, borderBottom: '1px solid #e2e8f0' }}>Draw</th>
                        <th style={{ ...th, borderBottom: '1px solid #e2e8f0' }}>Invoiced on</th>
                        <th style={{ ...th, borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleDraws.map((d, i) => (
                        <tr key={d.drawNumber} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={td}>Draw #{i + 1}{d.title ? `: ${d.title}` : ''}</td>
                          <td style={td}>{d.milestone}</td>
                          <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>${fmt(d.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Stated on the document because it's a term of the deal: the
                  client (or their lender) is the one who asked for the format,
                  and this is where they confirm they'll get it. */}
              {requiresPayApps && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Pay applications</div>
                  <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                    Invoices for this project are submitted as certified pay applications in AIA G702/G703 format,
                    billed on percent of work completed.
                  </div>
                </div>
              )}

              {/* Fixed price states the terms on their own, since the
                  schedule table above says what is owed but not by when. Open
                  book already carries it inside the Invoicing paragraph. */}
              {!isOpenBook && termsSentence && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Payment terms</div>
                  <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                    {terms === 'Due on receipt'
                      ? 'Payments are due upon receipt of each invoice.'
                      : <>Each invoice is due within <strong style={{ color: '#0f172a' }}>{netDays} days</strong> of its invoice date.</>}
                  </div>
                </div>
              )}

              {closingText && <div style={{ fontSize: 13, color: '#334155', marginBottom: 20, whiteSpace: 'pre-wrap' }}>{closingText}</div>}

              {collectSignatures && (
                <>
                  <div style={{ fontSize: 12, color: '#334155', marginBottom: 16 }}>I confirm that my action here represents my electronic signature and is binding.</div>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <div style={{ flex: 1, borderTop: '1px solid #94a3b8', paddingTop: 4, fontSize: 11, color: '#64748b' }}>Signature</div>
                    <div style={{ flex: 1, borderTop: '1px solid #94a3b8', paddingTop: 4, fontSize: 11, color: '#64748b' }}>Name</div>
                    <div style={{ flex: 1, borderTop: '1px solid #94a3b8', paddingTop: 4, fontSize: 11, color: '#64748b' }}>Date</div>
                  </div>
                </>
              )}
            </div>
            <div style={{ maxWidth: 700, margin: '12px auto 0', fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
              Clients access this proposal through the emailed link or the client site while it's released, and can sign it digitally.
            </div>
          </div>
        </div>
      </div>

      {showScheduleModal && (
        <PaymentScheduleModal
          existingDraws={scheduleDraws.length > 0 ? scheduleDraws : undefined}
          defaultTotal={Math.round(proposalSubtotal)}
          /* A new schedule opens at a single Draw #1, and if a deposit was
             requested that draw is already spoken for. */
          initialRows={[{
            percent: depositOwnsFirstDraw ? Math.round(depositPercentOfTotal) : 100,
            title: depositOwnsFirstDraw ? 'Deposit' : '',
            scheduleItem: 'Project Start',
          }]}
          lockFirstRow={depositOwnsFirstDraw}
          description="Split the contract price into draws. The schedule is appended to the proposal, and Buildertrend uses it to create one draft invoice per draw once the job is running."
          onSave={next => { setDraws(next); setShowScheduleModal(false); }}
          onDelete={() => { setDraws([]); setShowScheduleModal(false); }}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 4 };
/* Label over value, so the three parts of the deposit calculation line up on a
   single baseline whether they're an input or a read-only figure. */
const fieldLbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 6, whiteSpace: 'nowrap' };
const fieldVal: React.CSSProperties = { fontSize: 14, color: '#0f172a', padding: '7px 0', whiteSpace: 'nowrap' };
const FIELD_BORDER = '1px solid #e2e8f0';
const affix: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 10px', fontSize: 13, color: '#64748b', background: '#f8fafc', border: FIELD_BORDER, borderRadius: '6px 0 0 6px' };
/* `inp` without any border or radius, for fields whose sides are set
   individually. Spelled out rather than spread from `inp` so there's no
   shorthand left to conflict with the longhands. */
const inpNoBorder: React.CSSProperties = { padding: '7px 10px', fontSize: 13, boxSizing: 'border-box', outline: 'none', color: '#0f172a', fontFamily: 'inherit' };
const inp: React.CSSProperties = { padding: '7px 10px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, width: '100%', boxSizing: 'border-box', outline: 'none', color: '#0f172a', fontFamily: 'inherit' };
const textarea: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, resize: 'vertical', minHeight: 80, outline: 'none', color: '#0f172a', fontFamily: 'inherit' };
const th: React.CSSProperties = { padding: '10px 12px', fontSize: 12, fontWeight: 500, color: '#64748b', textAlign: 'left', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '10px 12px', fontSize: 13, color: '#334155' };
