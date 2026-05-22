import { ReactNode } from 'react';

type Tone = 'neutral' | 'today' | 'hold' | 'pool' | 'force' | 'auto';

const toneStyles: Record<Tone, { card: string; chip: string; accent: string }> = {
  neutral: { card: 'bg-white border-slate-200',   chip: 'bg-slate-100 text-slate-700',   accent: 'text-slate-500' },
  today:   { card: 'bg-slate-50  border-slate-300', chip: 'bg-slate-200 text-slate-800',  accent: 'text-slate-600' },
  hold:    { card: 'bg-sky-50    border-sky-200',  chip: 'bg-sky-100 text-sky-800',      accent: 'text-sky-700' },
  pool:    { card: 'bg-violet-50 border-violet-200', chip: 'bg-violet-100 text-violet-800', accent: 'text-violet-700' },
  force:   { card: 'bg-amber-50  border-amber-200', chip: 'bg-amber-100 text-amber-800',   accent: 'text-amber-700' },
  auto:    { card: 'bg-emerald-50 border-emerald-200', chip: 'bg-emerald-100 text-emerald-800', accent: 'text-emerald-700' },
};

type Step = {
  label: string;
  body: ReactNode;
  branch?: { label: string; body: ReactNode }[];
};

type Column = {
  tone: Tone;
  title: string;
  subtitle: string;
  tag?: string;
  steps: Step[];
  takeaway: string;
};

const PHASES = [
  { label: 'Selection approved', hint: 'Allowance $50k · actual $49k' },
  { label: 'Where the $1k lives', hint: 'Mid-job state' },
  { label: 'Trigger for action', hint: 'What surfaces it?' },
  { label: 'Resolution', hint: 'How math reconciles' },
  { label: 'End-of-job', hint: 'Anything left over' },
];

const COLUMNS: Column[] = [
  {
    tone: 'today',
    title: 'Today',
    subtitle: 'Baseline — no underage tooling',
    tag: 'Status quo',
    steps: [
      { label: 'Selection closes at $49k', body: 'Invoice still bills the full $50k allowance to keep budget from looking under-invoiced.' },
      { label: 'Underage sits as a related line', body: '$1k attached to the allowance on the budget. No action, no prompt.' },
      { label: 'None', body: 'Builder has to remember the gap and chase it later.' },
      { label: 'Manual reconciliation', body: 'Builder audits reports to find the disparity and writes adjusting entries by hand.' },
      { label: 'Last draw cleanup', body: 'Anything still unresolved gets swept up — or missed.' },
    ],
    takeaway: 'John\'s pain point — math doesn\'t reconcile without manual work.',
  },
  {
    tone: 'hold',
    title: 'Option 1',
    subtitle: 'Hold on the allowance',
    tag: 'Local to allowance',
    steps: [
      { label: 'Selection closes at actual', body: 'Invoice posts $49k. Allowance retains $1k as "available to reallocate."' },
      { label: 'On the allowance row', body: 'Each allowance shows its own held underage. Reallocation tool lives inside the allowance.' },
      {
        label: 'Future overage on same or different allowance',
        body: 'Builder opens the allowance, picks a target overage to apply credit to.',
        branch: [
          { label: 'Overage exists', body: 'Reallocate $1k → covers part of overage.' },
          { label: 'No overage yet', body: 'Underage just keeps waiting on the allowance.' },
        ],
      },
      { label: 'Reallocate from source allowance to target', body: 'Source closes, target reduced. Both sides of the budget reconcile.' },
      { label: 'Settle remainder in last draw', body: 'Any allowances still holding underages auto-roll to the final draw line.' },
    ],
    takeaway: 'Lowest-magic option. Scales poorly when underages are scattered across many allowances.',
  },
  {
    tone: 'pool',
    title: 'Option 2',
    subtitle: 'Project-level reallocation pool',
    tag: 'Centralized bucket',
    steps: [
      { label: 'Selection closes at actual', body: 'Invoice posts $49k. $1k routes into a single project-level pool.' },
      { label: 'In a pool on the project header', body: 'Pool shows total underage available across all allowances. Visible everywhere relevant.' },
      { label: 'Builder spots an overage anywhere', body: 'Builder opens pool, picks which overage(s) to cover. Could be a many-to-many distribution.' },
      { label: 'Apply pool to one or more overages', body: 'Pool decrements. Source allowances marked "reallocated to pool."' },
      { label: 'Pool balance settles in last draw', body: 'Whatever\'s in the pool at job end rolls to the final draw.' },
    ],
    takeaway: 'Best aggregation, but loses 1:1 traceability from a specific underage to its target.',
  },
  {
    tone: 'force',
    title: 'Option 3',
    subtitle: 'Force a decision at selection',
    tag: 'Decide now',
    steps: [
      { label: 'Selection comes in under', body: 'Approval modal blocks until builder picks where the $1k goes.' },
      {
        label: 'Builder chooses immediately',
        body: 'No mid-state — must commit to one of three paths.',
        branch: [
          { label: 'Hold on allowance', body: 'Routes to Option 1 behavior.' },
          { label: 'Reallocate to specific allowance', body: 'Pick target now.' },
          { label: 'Apply to last draw', body: 'Defer to final settlement.' },
        ],
      },
      { label: 'Resolved at moment of approval', body: 'No mid-job ambiguity. State is always explicit.' },
      { label: 'Per builder\'s choice', body: 'Whichever path was selected fires immediately.' },
      { label: 'Last draw cleanup', body: 'Only items routed to "last draw" at approval show up here.' },
    ],
    takeaway: 'Most explicit, but pushes a decision before the builder has info (might not know future overages yet).',
  },
  {
    tone: 'auto',
    title: 'Option 4',
    subtitle: 'Default-hold + auto-prompt',
    tag: '★ Closest to John',
    steps: [
      { label: 'Selection closes at actual', body: 'No modal, no decision. BT silently holds $1k on the allowance.' },
      { label: 'Tracked silently by BT', body: '"Buildertrend should know." Held underages tallied in background.' },
      {
        label: 'BT detects a new overage anywhere',
        body: 'System auto-surfaces matching held underages and prompts the builder.',
        branch: [
          { label: 'One-click confirm', body: 'Builder accepts proposed reallocation. Done.' },
          { label: 'Edit before confirming', body: 'Builder tweaks source/target/amount, then confirms.' },
          { label: 'Dismiss', body: 'Underage stays held; will resurface on next overage.' },
        ],
      },
      { label: 'Apply reallocation on confirm', body: 'Source credit + target reduction posted to the next invoice automatically.' },
      { label: 'Auto-roll leftover to last draw', body: 'At job end, BT sweeps any remaining held underages into the final draw line — no manual close-out.' },
    ],
    takeaway: 'Most automation, most invisible state. Risk: builder loses trust if prompts are wrong or noisy.',
  },
];

function Connector() {
  return (
    <div className="flex justify-center my-1 text-slate-400 text-xs select-none" aria-hidden>
      <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
        <line x1="7" y1="0" x2="7" y2="14" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 13 L7 19 L12 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function StepBox({ step, tone }: { step: Step; tone: Tone }) {
  const t = toneStyles[tone];
  return (
    <div className={`rounded-lg border ${t.card} p-3 text-[13px] leading-snug`}>
      <div className="font-semibold text-slate-900 mb-1">{step.label}</div>
      <div className="text-slate-700">{step.body}</div>
      {step.branch && (
        <div className="mt-3 pl-3 border-l-2 border-slate-200 space-y-2">
          {step.branch.map((b, i) => (
            <div key={i} className="text-[12.5px]">
              <span className={`inline-block px-1.5 py-0.5 rounded mr-1.5 text-[11px] font-medium ${t.chip}`}>{b.label}</span>
              <span className="text-slate-700">{b.body}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ColumnCard({ col }: { col: Column }) {
  const t = toneStyles[col.tone];
  return (
    <div className="flex flex-col gap-0 min-w-[260px]">
      <div className={`rounded-lg border ${t.card} p-3 mb-2`}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{col.title}</div>
            <div className="text-[15px] font-semibold text-slate-900 leading-tight">{col.subtitle}</div>
          </div>
          {col.tag && (
            <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${t.chip}`}>{col.tag}</span>
          )}
        </div>
      </div>
      {col.steps.map((s, i) => (
        <div key={i}>
          <StepBox step={s} tone={col.tone} />
          {i < col.steps.length - 1 && <Connector />}
        </div>
      ))}
      <div className={`mt-3 rounded-lg border-dashed border ${t.card} p-3 text-[12.5px] text-slate-700`}>
        <span className={`font-semibold ${t.accent}`}>Takeaway · </span>
        {col.takeaway}
      </div>
    </div>
  );
}

export default function UnderageFlows() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Design exploration</div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Selections invoicing — underage workflow scenarios</h1>
        <p className="text-slate-700 text-[14px] max-w-3xl">
          Selection comes in <span className="font-semibold">under</span> the allowance by $1,000. Where does that money live, when does BT surface it,
          and how does it reconcile? Five paths, side by side, scored against John&apos;s ask: <em>&ldquo;I bill when I&apos;m over and I reallocate when I&apos;m under.&rdquo;</em>
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6 text-[13px] text-amber-900 max-w-3xl">
        <div className="font-semibold mb-1">The open question this maps</div>
        Mid-job, when a selection comes in under and <span className="font-semibold">no other allowance has gone over yet</span> — where does the $1,000 sit in the meantime?
      </div>

      <div className="hidden lg:grid grid-cols-[160px_repeat(5,minmax(240px,1fr))] gap-3 mb-3 sticky top-0 bg-white/95 backdrop-blur z-10 py-2 border-b border-slate-200">
        <div />
        {COLUMNS.map((c) => (
          <div key={c.title} className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold px-1">
            {c.title} · {c.subtitle}
          </div>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-[160px_repeat(5,minmax(240px,1fr))] lg:gap-3 lg:items-start space-y-8 lg:space-y-0">
        <div className="hidden lg:flex flex-col gap-3 pt-1">
          {PHASES.map((p, i) => (
            <div key={i} className="text-[12px] text-slate-700">
              <div className="font-semibold text-slate-900">{p.label}</div>
              <div className="text-slate-500">{p.hint}</div>
              {i < PHASES.length - 1 && <div className="h-20" />}
            </div>
          ))}
        </div>

        {COLUMNS.map((c) => (
          <ColumnCard key={c.title} col={c} />
        ))}
      </div>

      <div className="mt-10 grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Where to dig next</div>
          <ul className="text-[13px] text-slate-700 space-y-1.5 list-disc pl-5">
            <li>Where does the reallocation tool live? Inside the selection, the allowances tab, or the invoices page?</li>
            <li>At what moment does BT prompt? Selection approval, invoice creation, end-of-draw, or all three?</li>
            <li>What does &ldquo;settle at the last draw&rdquo; look like as an explicit BT artifact?</li>
            <li>What does the client see on an invoice where an underage has been reallocated or held?</li>
          </ul>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-[11px] uppercase tracking-wide text-emerald-700 font-semibold mb-1">Recommendation to pressure-test</div>
          <p className="text-[13px] text-emerald-900">
            Option 4 (default-hold + auto-prompt) is the only one that satisfies John&apos;s &ldquo;Buildertrend should know.&rdquo;
            The risks are prompt quality and invisible state. Worth prototyping the <span className="font-semibold">prompt moment</span> and the
            <span className="font-semibold"> held-underage surface</span> on the allowance row before committing.
          </p>
        </div>
      </div>
    </div>
  );
}
