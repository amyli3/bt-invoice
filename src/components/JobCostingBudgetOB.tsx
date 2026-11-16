import { useState, useLayoutEffect, useMemo, useEffect, useRef } from 'react';
import '../bds-tokens.css';
import { BdsButton, BdsIcon } from '../bds';
import { JobRail, InsightsFlyout, type Insight } from './BudgetAiVariants';
import { ChatSurface, ScopeChip, SparkIcon, useBudgetChat, type Scope, type AiReply, type Highlight, type FactSection } from './BudgetAssistant';
import { JOBS as BASE_JOBS, statsForJob } from '../jcbJobs';

// The test job from the real page comes first, then the sample jobs the rest of the prototype uses.
const JOBS = [{ id: 'amy', name: 'Amy - selections test job', scale: 1 }, ...BASE_JOBS];
const OVER_IDS = new Set(BASE_JOBS.filter(j => statsForJob(j).overBy > 0).map(j => j.id));

/**
 * Job Costing Budget, open book version. Open book jobs bill the builder's
 * costs, so the page leads with cost: two summary cards (cost, then price and
 * invoicing) and a cost-only grid. The markup/margin columns of the fixed
 * price page do not apply. The fixed price version is JobCostingBudget.tsx;
 * the Review panel's Contract toggle chooses between them.
 */

type Line = {
  code: string; name: string;
  orig: number; rev: number; pending: number; committed: number; actual: number; bv: number; projected: number;
  ref: 'Current costs' | 'Budgeted costs';
  origPrice: number; revPrice: number; invoiced: number;
};
type Group = { code: string; name: string; lines: Line[] };

// Line items are chosen so the grid adds up to the totals on the real page:
// $81,001 original, $80,382 revised, $70,682.26 projected, $73,582.26 revised price.
const L = (code: string, name: string, orig: number, rev: number, projected: number, revPrice: number, o: Partial<Line> = {}): Line =>
  ({ code, name, orig, rev, pending: 0, committed: 0, actual: 0, bv: 0, projected, ref: 'Budgeted costs', origPrice: orig, revPrice, invoiced: 0, ...o });

const GROUPS: Group[] = [
  { code: '1000 - 1999', name: 'Preparation Preliminaries', lines: [
    L('1010', 'Building permits', 9000, 10500, 0, 0, { ref: 'Current costs' }),
    L('1030', 'Warranty fees', 0, 98, 98, 98, { origPrice: 0 }),
    L('1120', 'Surveys', 0, 123, 123, 123, { origPrice: 0 }),
    L('1210', 'Lot clearing', 20044, 21044, 21044, 21044),
    L('1220', 'Fill dirt and material', 0, 50, 50, 50, { origPrice: 0 }),
    L('1430', 'Water service', 401, 401, 401, 401),
    L('', 'Blueprint', 2944, 2944, 2944, 2944),
  ] },
  { code: '2000 - 2999', name: 'Excavation and Foundation', lines: [
    L('2010-A', 'Plumbing', 800, 800, 800, 1200, { origPrice: 1200 }),
  ] },
  { code: '3000 - 3999', name: 'Rough Structure', lines: [
    L('3150', 'Miscellaneous lumber', 592, 592, 592, 592, { actual: 500 }),
    L('3500', 'Flatwork material', 7777, 7777, 7777, 7777),
    L('', 'Walls', 555, 555, 555, 555),
  ] },
  { code: '4000 - 4999', name: 'Full Enclosure', lines: [
    L('', 'Electrical', 8000, 4055, 4055, 4055, { origPrice: 8000 }),
  ] },
  { code: '5000 - 5999', name: 'Finishing Trades', lines: [
    L('5520', 'Special flooring', 20000, 20000, 20000, 20000),
    L('5610', 'Hardware', 10000, 10000, 10000, 12500, { actual: 100, origPrice: 12500 }),
  ] },
  { code: '6000 - 6999', name: 'Completion and Inspection', lines: [
    L('6100', 'Clean-up', 888, 888, 888, 888),
  ] },
  { code: '', name: 'Buildertrend Default', lines: [
    L('', 'Buildertrend Flat Rate', 0, 555, 1355.26, 1355.26, { actual: 1355.26, origPrice: 0, ref: 'Current costs' }),
  ] },
];

type Col = { id: string; label: string; group: 'job' | 'client' | 'profit'; kind: 'money' | 'pct' | 'ref' | 'bar'; zero?: boolean; get: (l: Line) => number };
const COLS: Col[] = [
  { id: 'orig', label: 'Original budget costs', group: 'job', kind: 'money', get: l => l.orig },
  { id: 'rev', label: 'Revised budget costs', group: 'job', kind: 'money', get: l => l.rev },
  { id: 'pending', label: 'Pending costs', group: 'job', kind: 'money', get: l => l.pending },
  { id: 'committed', label: 'Committed costs', group: 'job', kind: 'money', get: l => l.committed },
  { id: 'actual', label: 'Actual costs', group: 'job', kind: 'money', get: l => l.actual },
  { id: 'bv', label: 'Builder variance', group: 'job', kind: 'money', get: l => l.bv },
  { id: 'projected', label: 'Projected costs', group: 'job', kind: 'money', get: l => l.projected },
  { id: 'ref', label: 'Projection reference', group: 'job', kind: 'ref', get: () => 0 },
  { id: 'ctc', label: 'Cost to complete', group: 'job', kind: 'money', zero: true, get: l => l.projected - l.actual },
  { id: 'rvp', label: 'Revised vs projected', group: 'job', kind: 'money', zero: true, get: l => l.rev - l.projected },
  { id: 'origPrice', label: 'Total original price', group: 'client', kind: 'money', get: l => l.origPrice },
  { id: 'revPrice', label: 'Total revised price', group: 'client', kind: 'money', get: l => l.revPrice },
  { id: 'invoiced', label: 'Amount invoiced', group: 'client', kind: 'money', get: l => l.invoiced },
  { id: 'remaining', label: 'Remaining to invoice', group: 'client', kind: 'money', get: l => l.revPrice - l.invoiced },
  { id: 'pctInv', label: '% invoiced', group: 'client', kind: 'bar', get: l => (l.revPrice ? l.invoiced / l.revPrice : 0) },
  { id: 'profit', label: 'Projected profit', group: 'profit', kind: 'money', zero: true, get: l => l.revPrice - l.projected },
  { id: 'margin', label: 'Projected margin %', group: 'profit', kind: 'pct', get: l => (l.revPrice ? (l.revPrice - l.projected) / l.revPrice : 0) },
];
const COL_INFO: Record<string, { desc: string; formula?: string }> = {
  orig: { desc: 'Planned job cost baseline from the signed estimate.', formula: 'Taken from the signed proposal.' },
  rev: { desc: 'Approved working budget after scope and change adjustments.', formula: 'Original budget costs + approved change orders + approved selections.' },
  pending: { desc: 'Costs entered but not yet approved.', formula: 'Pending purchase orders + pending bills.' },
  committed: { desc: 'Total approved cost commitments to date.', formula: 'Approved purchase orders + approved variance POs.' },
  actual: { desc: 'Total costs incurred and officially recorded.', formula: 'Open and paid bills. Accounting method set to accrual.' },
  bv: { desc: 'Costs absorbed by the builder, not passed to the client.', formula: 'Bills marked as variance.' },
  projected: { desc: 'Forecasted total expected cost at completion.', formula: 'Based on projection reference. Adjustments are added after the initial calculation.' },
  ref: { desc: 'Which cost the projection is built from for each line.', formula: 'Current costs or budgeted costs.' },
  ctc: { desc: 'Remaining forecasted spend required to complete this code.', formula: 'Projected costs − Actual costs.' },
  rvp: { desc: 'Indicates whether you are trending over or under budget.', formula: 'Revised budget costs − Projected costs.' },
  origPrice: { desc: 'Original client contract price, pre-tax.', formula: 'Taken from the signed proposal.' },
  revPrice: { desc: 'Current approved client contract price (excl. tax).', formula: 'Original price + approved change orders + approved selections.' },
  invoiced: { desc: 'Total amount invoiced to client to date.', formula: 'Sent invoices.' },
  remaining: { desc: 'Contract value remaining to invoice to client.', formula: 'Total revised price − Amount invoiced.' },
  pctInv: { desc: 'Share of the revised price that has been invoiced.', formula: 'Amount invoiced ÷ Total revised price.' },
  profit: { desc: 'Forecasted profit based on projected total costs.', formula: 'Total revised price − Projected costs.' },
  margin: { desc: 'Forecasted profit percentage on contract value.', formula: 'Projected profit ÷ Total revised price.' },
};
const GROUP_LABEL = { job: 'Job costing', client: 'Client pricing', profit: 'Profit' } as const;

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const sumLines = (lines: Line[], get: (l: Line) => number) => lines.reduce((a, l) => a + get(l), 0);


/** Totals for a set of lines. Percent columns are ratios of the summed lines, not sums of ratios. */
function valueFor(c: Col, lines: Line[]): number {
  if (c.id === 'pctInv') { const p = sumLines(lines, l => l.revPrice); return p ? sumLines(lines, l => l.invoiced) / p : 0; }
  if (c.id === 'margin') { const p = sumLines(lines, l => l.revPrice); return p ? (p - sumLines(lines, l => l.projected)) / p : 0; }
  return sumLines(lines, c.get);
}
function fmtCell(c: Col, v: number): string {
  if (c.kind === 'pct' || c.kind === 'bar') return `${Math.round(v * 100)}%`;
  if (c.kind === 'money') return !v && !c.zero ? '--' : money(v);
  return '';
}
function cellClass(c: Col, v: number): string {
  if (c.id === 'rvp') return v > 0.005 ? ' ob-rvp-up' : v < -0.005 ? ' ob-rvp-down' : '';
  return '';
}

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16.5" /><circle cx="12" cy="7.8" r=".6" fill="currentColor" /></svg>
);

export default function JobCostingBudgetOB() {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [jobId, setJobId] = useState('amy');
  const [railOpen, setRailOpen] = useState(true);
  const [navH, setNavH] = useState(48);
  useLayoutEffect(() => {
    const measure = () => { const n = document.querySelector('.topnav'); if (n) setNavH(Math.round(n.getBoundingClientRect().bottom)); };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  const job = JOBS.find(j => j.id === jobId)!;
  const jobName = job.name;
  // Other jobs are scaled copies of the sample numbers, like the fixed price page.
  const groups = useMemo(() => GROUPS.map(g => ({ ...g, lines: g.lines.map(l => ({ ...l, orig: l.orig * job.scale, rev: l.rev * job.scale, actual: l.actual * job.scale, bv: l.bv * job.scale, projected: l.projected * job.scale, origPrice: l.origPrice * job.scale, revPrice: l.revPrice * job.scale })) })), [job.scale]);
  const all = groups.flatMap(g => g.lines);
  const projected = sumLines(all, l => l.projected);
  const actual = sumLines(all, l => l.actual);
  const toComplete = projected - actual;
  const revisedPrice = sumLines(all, l => l.revPrice);
  const invoiced = 0;
  const remaining = revisedPrice - invoiced;
  const underPct = Math.round((1 - projected / sumLines(all, l => l.rev)) * 100);
  // Profit now vs the estimate (original price minus original cost).
  const estProfit = sumLines(all, l => l.origPrice) - sumLines(all, l => l.orig);
  const curProfit = revisedPrice - projected;
  const profitDelta = estProfit ? Math.round(((curProfit - estProfit) / Math.abs(estProfit)) * 100) : 0;
  const profitLower = profitDelta < 0;
  // Column title popover: closes on any click outside its title or card, or on Escape.
  const [openCol, setOpenCol] = useState<string | null>(null);
  useEffect(() => {
    if (!openCol) return;
    const onDown = (e: MouseEvent) => { if (!(e.target as Element | null)?.closest('.ob-col-btn, .ob-col-pop')) setOpenCol(null); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenCol(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [openCol]);
  // Ask AI: same docked assistant as the fixed price page, answering from the open book numbers.
  const [aiOpen, setAiOpen] = useState(false);
  const [scope, setScope] = useState<Scope>({ kind: 'job' });
  const scopeJobs = scope.kind === 'all' ? JOBS : null;
  const switchJob = (id: string) => { setJobId(id); setScope({ kind: 'job' }); setManualHl([]); };
  // ── What the assistant knows about this job ──
  const keyOf = (l: Line) => l.code || l.name;
  const rowName = (l: Line) => `${l.code ? l.code + ' ' : ''}${l.name}`;
  const pct1 = (x: number) => `${(x * 100).toFixed(1)}%`;
  const totalRev = sumLines(all, l => l.rev);
  const savings = totalRev - projected;
  const over = all.map(l => ({ l, d: l.projected - l.rev })).filter(x => x.d > 0.005).sort((a, b) => b.d - a.d);
  const totalOver = over.reduce((a, x) => a + x.d, 0);
  // Codes projected at $0 only because nothing has been entered yet (projection reference is Current costs).
  const zeroProj = all.filter(l => l.rev > 0 && l.projected === 0);
  const zeroRev = sumLines(zeroProj, l => l.rev);
  const uninv = all.map(l => ({ l, d: l.actual - l.invoiced })).filter(x => x.d > 0.005).sort((a, b) => b.d - a.d);
  const uninvTotal = uninv.reduce((a, x) => a + x.d, 0);
  const names = (ls: Line[]) => ls.length <= 2 ? ls.map(l => l.name).join(' and ') : `${ls[0].name} and ${ls.length - 1} others`;
  const insights: Insight[] = [];
  if (over.length) insights.push({
    id: 'over', tone: 'red', kicker: 'Cost overrun',
    title: `${over.length} cost code${over.length === 1 ? ' is' : 's are'} projected over budget`,
    body: `${money(totalOver)} above plan. ${names(over.map(x => x.l))}${over.length === 1 ? ' is' : ' are'} the cause.`,
    hl: over.map(x => ({ code: keyOf(x.l), col: 'rvp' })), ask: 'Which cost codes are over budget?',
  });
  if (zeroProj.length) {
    const without = savings - zeroRev;
    insights.push({
      id: 'proj', tone: 'amber', kicker: 'Projection',
      title: `Your savings rely on ${zeroProj.length} code${zeroProj.length === 1 ? '' : 's'} with no costs yet`,
      body: `${names(zeroProj)} ${zeroProj.length === 1 ? 'is' : 'are'} projected at $0 against ${money(zeroRev)} of budget. Without ${zeroProj.length === 1 ? 'it' : 'them'} the job is ${without < 0 ? `${money(-without)} over` : `${money(without)} under`} budget.`,
      hl: zeroProj.flatMap(l => [{ code: keyOf(l), col: 'projected' }, { code: keyOf(l), col: 'rvp' }]), ask: 'Why is my projected cost lower than my budget?',
    });
  }
  if (uninv.length) insights.push({
    id: 'inv', tone: 'blue', kicker: 'Costs not invoiced',
    title: `${uninv.length} code${uninv.length === 1 ? ' has' : 's have'} costs that are not invoiced yet`,
    body: `${uninv[0].l.name}: ${money(uninv[0].l.actual)} of cost, ${money(uninv[0].l.invoiced)} invoiced. ${money(uninvTotal)} in all is waiting to be billed.`,
    hl: uninv.flatMap(x => [{ code: keyOf(x.l), col: 'actual' }, { code: keyOf(x.l), col: 'invoiced' }]), ask: 'How much is left to invoice?',
  });
  const [manualHl, setManualHl] = useState<Highlight[]>([]);
  const [hlDismissedAt, setHlDismissedAt] = useState(-1);
  const tableRef = useRef<HTMLTableElement>(null);

  const answer = (q: string): AiReply => {
    const low = q.toLowerCase();
    if (scopeJobs) {
      const label = scope.kind === 'all' ? `Based on all ${JOBS.length} open jobs` : `Based on ${scopeJobs.length} selected jobs`;
      const actions = [{ label: `Ask about ${jobName} only`, run: () => setScope({ kind: 'job' }) }];
      const rows = scopeJobs.map(j => { const ls = GROUPS.flatMap(g => g.lines); const sum = (f: (l: Line) => number) => sumLines(ls, f) * j.scale; const price = sum(l => l.revPrice), invoiced = sum(l => l.invoiced); return { id: j.id, name: j.name, values: { price, invoiced, profit: price - sum(l => l.projected) } }; });
      if (/invoice|bill|price/.test(low)) {
        const list = [...rows].sort((a, b) => (b.values.price - b.values.invoiced) - (a.values.price - a.values.invoiced));
        return { text: `${money(list.reduce((a, r) => a + r.values.price - r.values.invoiced, 0))} is left to bill across ${list.length} jobs.`, hint: 'Select a job to open it.', scope: label, actions, jobs: list.map(r => ({ id: r.id, name: r.name, value: money(r.values.price - r.values.invoiced) })) };
      }
      const list = [...rows].sort((a, b) => b.values.profit - a.values.profit);
      return { text: `Projected profit is ${money(list.reduce((a, r) => a + r.values.profit, 0))} across ${list.length} jobs.`, hint: 'Select a job to open it.', scope: label, actions, jobs: list.map(r => ({ id: r.id, name: r.name, value: money(r.values.profit) })) };
    }
    if (/\b(jobs|every job|all jobs|across)\b/.test(low)) return { text: `That sounds like a question about more than one job, and I only looked at ${jobName}. I can look across all ${JOBS.length} open jobs instead.`, scope: `Based on ${jobName}`, actions: [{ label: `Ask across all ${JOBS.length} open jobs`, run: () => { setScope({ kind: 'all' }); chat.send(q); } }] };
    const t = low;
    const scopeLbl = `Based on ${jobName}`;
    const rowFacts = (l: Line): FactSection => ({ rows: [
      { label: 'Revised budget costs', value: money(l.rev) }, { label: 'Actual costs', value: money(l.actual) },
      { label: 'Projected costs', value: money(l.projected), strong: true }, { label: 'Projection reference', value: l.ref }, { label: 'Amount invoiced', value: money(l.invoiced) },
    ] });
    // A specific cost code
    const named = all.find(l => t.includes(l.name.toLowerCase()) || (l.code && t.includes(l.code.toLowerCase())) || l.name.toLowerCase().split(' ').some(w => w.length >= 6 && t.includes(w)));
    if (named && !/jobs?\b/.test(t)) {
      const d = named.projected - named.rev;
      const text = d > 0.005 ? `${rowName(named)} is projected ${money(d)} over its budget.` : d < -0.005 ? `${rowName(named)} is projected ${money(-d)} under its budget.` : `${rowName(named)} is projected right on budget.`;
      let why = '';
      const suggest: string[] = [];
      if (named.ref === 'Current costs' && named.projected === 0 && named.rev > 0) { why = `Its projection reference is Current costs and nothing has been entered on it yet, so it projects to $0 until a bill or PO arrives. That makes ${money(named.rev)} of budget look like savings.`; suggest.push('If you still expect to spend this budget, set the projection reference to Budgeted costs.'); }
      else if (d > 0.005 && named.actual > named.rev) { why = `Costs entered so far (${money(named.actual)}) are already above the ${money(named.rev)} budget before anything else is counted.`; suggest.push('Review the bills on this code for duplicates or work that belongs on another code.', 'If the work is approved, raise the budget so the code stops showing as over.'); }
      else if (d > 0.005) { why = `Projected cost is above the ${money(named.rev)} budget even though spent costs are still under it, so the rest comes from work still expected to cost more than what is left.`; suggest.push('Re-check what is still to be spent on this code.'); }
      return { text, scope: scopeLbl, sections: [rowFacts(named)], why: why || undefined, suggest: suggest.length ? suggest : undefined, highlights: [{ code: keyOf(named), col: 'projected' }, { code: keyOf(named), col: 'rvp' }] };
    }
    // Breakdowns
    if (/\bmake.? ?up\b|\bbreakdown\b|\bby category\b|\bwhat is in\b/.test(t)) {
      const isPrice = /price/.test(t);
      return { text: isPrice ? `Your client price is ${money(revisedPrice)}.` : `Your projected cost is ${money(projected)}.`, scope: scopeLbl,
        sections: [{ title: 'By category', rows: groups.map(g => ({ label: g.name, value: money(sumLines(g.lines, l => isPrice ? l.revPrice : l.projected)) })) }, { rows: [{ label: isPrice ? 'Client price' : 'Projected cost', value: money(isPrice ? revisedPrice : projected), strong: true }] }] };
    }
    // Over budget
    if (/\b(over|overrun|overruns|exceed|exceeds)\b/.test(t)) {
      if (!over.length) return { text: 'No cost codes are over budget right now.', scope: scopeLbl };
      const top = over[0];
      const why = top.l.actual > top.l.rev ? `${rowName(top.l)} is the driver. Costs entered so far (${money(top.l.actual)}) are already above its ${money(top.l.rev)} budget.` : `${rowName(top.l)} is the driver at ${money(top.d)}.`;
      return { text: `${over.length} cost code${over.length === 1 ? ' is' : 's are'} over budget, ${money(totalOver)} in all.`, scope: scopeLbl,
        sections: [{ title: 'Over budget', rows: over.map(x => ({ label: rowName(x.l), value: '+' + money(x.d), bad: true })) }],
        highlights: over.map(x => ({ code: keyOf(x.l), col: 'rvp' })), why,
        suggest: ['Review the bills on this code for duplicates or work that belongs on another code.', 'If the work is approved, raise the budget so the code stops showing as over.'] };
    }
    // Invoicing
    if (/\b(invoice|invoiced|invoicing|bill|billed|owed|collect)\b/.test(t)) {
      const sections: FactSection[] = [{ rows: [{ label: 'Total revised price', value: money(revisedPrice) }, { label: 'Invoiced so far', value: money(invoiced) }, { label: 'Left to invoice', value: money(remaining), strong: true }] }];
      if (uninv.length) sections.push({ title: 'Costs not invoiced yet', rows: uninv.map(x => ({ label: rowName(x.l), value: money(x.d) })) });
      return { text: `${money(remaining)} is left to invoice.`, scope: scopeLbl, sections,
        hint: uninv.length ? 'On open book the client pays your costs, so cost without an invoice is money you have not asked for yet.' : undefined,
        highlights: uninv.flatMap(x => [{ code: keyOf(x.l), col: 'actual' }, { code: keyOf(x.l), col: 'invoiced' }]) };
    }
    // Spent / to complete
    if (/\b(spent|spend|complete|actual)\b/.test(t)) {
      const withActual = all.filter(l => l.actual > 0);
      return { text: `${money(actual)} is spent so far and ${money(toComplete)} is still to complete.`, scope: scopeLbl,
        sections: [{ rows: [{ label: 'Projected cost', value: money(projected) }, { label: 'Actual cost', value: money(actual) }, { label: 'Cost to complete', value: money(toComplete), strong: true }] }, ...(withActual.length ? [{ title: 'Where it was spent', rows: withActual.map(l => ({ label: rowName(l), value: money(l.actual) })) }] : [])],
        highlights: withActual.map(l => ({ code: keyOf(l), col: 'actual' })) };
    }
    // Profit
    if (/\b(profit|margin|earn)\b/.test(t)) {
      const profit = revisedPrice - projected;
      return { text: `You're projected to make ${money(profit)}, a ${pct1(revisedPrice ? profit / revisedPrice : 0)} margin. The estimate was ${money(estProfit)}.`, scope: scopeLbl,
        sections: [{ rows: [{ label: 'Client price', value: money(revisedPrice) }, { label: 'Projected cost', value: '−' + money(projected) }, { label: 'Projected profit', value: money(profit), strong: true }, { label: 'Estimated profit', value: money(estProfit) }] }, ...(over.length ? [{ title: 'Working against it', rows: over.map(x => ({ label: rowName(x.l), value: '+' + money(x.d), bad: true })) }] : [])],
        highlights: over.map(x => ({ code: keyOf(x.l), col: 'rvp' })) };
    }
    // What changed
    if (/\b(change|changed|original|since)\b/.test(t)) {
      const moved = all.filter(l => Math.abs(l.rev - l.orig) > 0.005);
      return { text: `${moved.length} cost code${moved.length === 1 ? ' has' : 's have'} a revised budget that differs from the original.`, scope: scopeLbl,
        sections: [{ title: 'Budget changes', rows: moved.map(l => ({ label: rowName(l), value: (l.rev - l.orig > 0 ? '+' : '−') + money(Math.abs(l.rev - l.orig)) })) }],
        highlights: moved.map(l => ({ code: keyOf(l), col: 'rev' })) };
    }
    // Projected vs budget (savings)
    if (/\b(under|saving|savings|lower|projected|budget|why|explain)\b/.test(t)) {
      const sections: FactSection[] = [{ rows: [{ label: 'Revised budget costs', value: money(totalRev) }, { label: 'Projected costs', value: money(projected) }, { label: 'Projected savings', value: money(savings), strong: true }] }];
      if (zeroProj.length) sections.push({ title: 'Projected at $0', rows: zeroProj.map(l => ({ label: rowName(l), value: money(l.rev) })) });
      const without = savings - zeroRev;
      return { text: `You are projected ${underPct}% under budget, ${money(savings)} in total.`, scope: scopeLbl, sections,
        why: zeroProj.length ? `${names(zeroProj)} ${zeroProj.length === 1 ? 'is' : 'are'} projected at $0 because ${zeroProj.length === 1 ? 'its' : 'their'} projection reference is Current costs and nothing has been entered yet. That counts ${money(zeroRev)} of budget as savings. Without ${zeroProj.length === 1 ? 'it' : 'them'} the job is ${without < 0 ? `${money(-without)} over` : `${money(without)} under`} budget.` : undefined,
        suggest: zeroProj.length ? ['Check each of these codes. If you still expect to spend the budget, set the projection reference to Budgeted costs.'] : undefined,
        highlights: zeroProj.flatMap(l => [{ code: keyOf(l), col: 'projected' }, { code: keyOf(l), col: 'rvp' }]) };
    }
    return { text: `Projected total cost is ${money(projected)}. ${money(actual)} is spent so far and ${money(toComplete)} is still to complete. Try asking about over-budget codes, what is left to invoice, or any cost code by name.`, scope: scopeLbl };
  };
  const askAi = (q: string) => { setAiOpen(true); chat.send(q); };
  const showHighlights = () => {
    setCollapsed(new Set());
    setManualHl([]);
    setHlDismissedAt(-1);
    if (window.innerWidth <= 768) setAiOpen(false);
    window.setTimeout(() => { const c = document.querySelector('.ob-table .ob-hl'); if (c) c.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' }); }, 120);
  };
  const chat = useBudgetChat(answer, showHighlights, {
    leading: <ScopeChip jobs={JOBS} currentName={jobName} scope={scope} />,
    selectJob: switchJob,
    hlDismissedAt,
  });
  const lastAi = [...chat.messages].reverse().find(m => m.role === 'ai');
  const highlights: Highlight[] = manualHl.length ? manualHl : hlDismissedAt === chat.messages.length ? [] : (lastAi?.hl ?? []);
  // Apply highlight classes to the grid cells the answer is about.
  useEffect(() => {
    const t = tableRef.current;
    if (!t) return;
    t.querySelectorAll('.ob-hl').forEach(el => el.classList.remove('ob-hl'));
    let first: Element | null = null;
    for (const h of highlights) {
      const td = t.querySelector(`tr[data-code="${CSS.escape(h.code)}"] td[data-col="${h.col}"]`);
      if (td) { td.classList.add('ob-hl'); first = first ?? td; }
    }
    if (first) first.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.messages.length, hlDismissedAt, manualHl, collapsed, jobId]);
  const toggle = (code: string) => setCollapsed(prev => { const n = new Set(prev); if (n.has(code)) n.delete(code); else n.add(code); return n; });

  return (
    <div className={`jcb-shell ${aiOpen ? 'has-panel' : ''}`} style={{ '--jcb-nav-h': `${navH}px` } as React.CSSProperties}>
    <JobRail jobs={JOBS} currentId={jobId} overIds={OVER_IDS} open={railOpen} onToggle={() => setRailOpen(o => !o)} onSelect={switchJob}
      allLabel={`All ${JOBS.length} open jobs`} allSelected={scope.kind === 'all'} onSelectAll={() => setScope({ kind: 'all' })} />
    <div className="ob-page">
      <div className="ob-header">
        <div>
          <div className="ob-job">{scope.kind === 'all' ? `All ${JOBS.length} open jobs` : jobName}</div>
          <h1 className="ob-title">Job Costing Budget</h1>
        </div>
        <div className="ob-header-right">
          <button type="button" className="ob-icon-btn" aria-label="Help"><InfoIcon /></button>
          <button type="button" className="ob-icon-btn" aria-label="Share"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3" /><polyline points="8 7 12 3 16 7" /><path d="M5 12v8h14v-8" /></svg></button>
          <button type="button" className="ob-icon-btn" aria-label="Home"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" /></svg></button>
          <button type="button" className="ba-ask-btn" onClick={() => { setAiOpen(o => !o); }} aria-pressed={aiOpen}>
            <SparkIcon size={16} /> Ask AI
          </button>
          <BdsButton displayType="primary" text="Add" icon={<BdsIcon name="plus" size={14} />} iconRight={<BdsIcon name="chevron-down" size={14} />} />
        </div>
      </div>

      {scope.kind === 'all' ? (
        <div className="jcb-empty">
          <h2 className="ob-title" style={{ fontSize: 20 }}>No job selected</h2>
          <p>Pick a single job to see its budget. The assistant can compare across all jobs.</p>
        </div>
      ) : (<>
      <div className="ob-cards">
        <section className="ob-card">
          <div className="ob-stat ob-stat-lead">
            <button type="button" className="ob-tap" title="Ask AI about this" onClick={() => askAi('What makes up my projected cost?')}>
              <span className="ob-label">Projected total cost</span>
              <span className="ob-value">{money(projected)}</span>
            </button>
            <button type="button" className="ob-chip ob-chip-teal ob-tap-chip" title="Ask AI why" onClick={() => askAi('Why is my projected cost lower than my budget?')}><BdsIcon name="arrow-down" size={14} /> {underPct}% under budget</button>
          </div>
          <div className="ob-stat ob-stat-bar">
            <div className="ob-bar-top">
              <button type="button" className="ob-tap" title="Ask AI about this" onClick={() => askAi('How much have I spent so far?')}><span className="ob-label">Actual cost</span><span className="ob-value-sm">{money(actual)}</span></button>
              <button type="button" className="ob-tap ob-right" title="Ask AI about this" onClick={() => askAi('How much is left to complete?')}><span className="ob-label">Cost to complete</span><span className="ob-value-sm">{money(toComplete)}</span></button>
            </div>
            <div className="ob-track"><div className="ob-fill" style={{ width: `${(actual / projected) * 100}%` }} /></div>
          </div>
        </section>

        <section className="ob-card">
          <div className="ob-stat ob-stat-lead">
            <span className="ob-label">Total revised price</span>
            <span className="ob-value-row"><button type="button" className="ob-tap" title="Ask AI what makes this up" onClick={() => askAi('What makes up my client price?')}><span className="ob-value">{money(revisedPrice)}</span></button><button type="button" className="ob-info" aria-label="How this is calculated"><InfoIcon /></button></span>
            {profitDelta !== 0 ? <button type="button" className={`ob-chip ${profitLower ? 'ob-chip-red' : 'ob-chip-teal'} ob-tap-chip`} title="Ask AI why" onClick={() => askAi(`Why is my profit ${profitLower ? 'lower' : 'higher'} than estimated?`)}><BdsIcon name={profitLower ? 'arrow-down' : 'arrow-up'} size={14} /> {Math.abs(profitDelta)}% {profitLower ? 'lower' : 'higher'} profit</button> : <button type="button" className="ob-chip ob-chip-teal ob-tap-chip" title="Ask AI about profit" onClick={() => askAi('Why is my profit what it is?')}>Profit on estimate</button>}
          </div>
          <div className="ob-stat ob-stat-bar">
            <div className="ob-bar-top">
              <button type="button" className="ob-tap" title="Ask AI about this" onClick={() => askAi('How much is left to invoice?')}><span className="ob-label">Amount invoiced</span><span className="ob-value-sm">{money(invoiced)}</span></button>
              <button type="button" className="ob-tap ob-right" title="Ask AI about this" onClick={() => askAi('How much is left to invoice?')}><span className="ob-label">Remaining to invoice</span><span className="ob-value-sm">{money(remaining)}</span></button>
            </div>
            <div className="ob-track"><div className="ob-fill" style={{ width: `${(invoiced / revisedPrice) * 100}%` }} /></div>
          </div>
        </section>
      </div>

      <div className="ob-viewbar">
        <span className="ob-view-label">View</span>
        <div className="ob-select">
          <select aria-label="View" defaultValue="all"><option value="all">All columns</option><option value="cost">Costs only</option></select>
          <BdsIcon name="chevron-down" size={14} />
        </div>
        <button type="button" className="ob-icon-btn" aria-label="Filter"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><polygon points="3 4 21 4 14 12.5 14 20 10 18 10 12.5 3 4" /></svg></button>
        <button type="button" className="ob-icon-btn" aria-label="Search"><BdsIcon name="search" size={18} /></button>
        {highlights.length > 0 && (
          <span className="jcb-hl-chip">
            <SparkIcon size={13} /> AI highlighted {highlights.length} cell{highlights.length === 1 ? '' : 's'}
            <button type="button" onClick={() => { setManualHl([]); setHlDismissedAt(chat.messages.length); }}>Clear</button>
          </span>
        )}
        {insights.length > 0 && <InsightsFlyout insights={insights} onShow={(i) => { setCollapsed(new Set()); setManualHl(i.hl); }} onAsk={askAi} />}
      </div>

      <div className="ob-table-wrap">
        <table className="ob-table" ref={tableRef}>
          <thead>
            <tr className="ob-group-row">
              <th className="ob-sticky ob-group-h">Cost categories</th>
              {(['job', 'client', 'profit'] as const).map(gk => (
                <th key={gk} colSpan={COLS.filter(c => c.group === gk).length} className={`ob-group-h ob-group-${gk}`}>{GROUP_LABEL[gk]}</th>
              ))}
            </tr>
            <tr>
              <th className="ob-sticky"><span className="ob-code-head"><input type="checkbox" aria-label="Select all" /><BdsIcon name="chevron-down" size={14} className="ob-blue" />Cost codes</span></th>
              {COLS.map(c => (
                <th key={c.id} className={c.kind === 'ref' ? 'ob-ref-h' : 'ob-num'}>
                  <button type="button" className={`ob-col-btn${openCol === c.id ? ' is-active' : ''}`} aria-expanded={openCol === c.id} onClick={() => setOpenCol(o => o === c.id ? null : c.id)}>{c.label}</button>
                  {openCol === c.id && (
                    <div className="ob-col-pop" role="dialog">
                      <div className="ob-col-pop-title">{c.label}</div>
                      <div className="ob-col-pop-body">{COL_INFO[c.id].desc}</div>
                      {COL_INFO[c.id].formula && <div className="ob-col-pop-formula">{COL_INFO[c.id].formula}</div>}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(g => (
              <GroupRows key={g.name} g={g} collapsed={collapsed.has(g.name)} onToggle={() => toggle(g.name)} />
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th className="ob-sticky ob-totals-label">Totals</th>
              {COLS.map(c => <CellTd key={c.id} c={c} lines={all} totals />)}
            </tr>
          </tfoot>
        </table>
      </div>
      </>)}
    </div>
    {aiOpen && <ChatSurface chat={chat} mode="panel" onClose={() => setAiOpen(false)} />}
    </div>
  );
}

function CellTd({ c, lines, totals }: { c: Col; lines: Line[]; totals?: boolean }) {
  const dc = c.id;
  if (c.kind === 'ref') {
    const ref = lines.length === 1 ? lines[0].ref : null;
    return <td className="ob-ref" data-col={dc}>{ref && <span className={`ob-refpill${ref === 'Current costs' ? ' is-on' : ''}`}><i />{ref}</span>}</td>;
  }
  const v = valueFor(c, lines);
  if (c.kind === 'bar') return <td className="ob-num" data-col={dc}><span className="ob-pctcell"><b>{Math.round(v * 100)}%</b><span className="ob-pbar"><i style={{ width: `${Math.min(100, v * 100)}%` }} /></span></span></td>;
  return <td data-col={dc} className={`ob-num${totals ? ' ob-totals' : ''}${cellClass(c, v)}`}>{fmtCell(c, v)}</td>;
}

function GroupRows({ g, collapsed, onToggle }: { g: Group; collapsed: boolean; onToggle: () => void }) {
  const label = g.code ? `${g.code} ${g.name}` : g.name;
  return (
    <>
      <tr className="ob-cat-row">
        <th className="ob-sticky">
          <span className="ob-code-cell">
            <input type="checkbox" aria-label={`Select ${g.name}`} />
            <button type="button" className="ob-chev" onClick={onToggle} aria-expanded={!collapsed} aria-label={collapsed ? 'Expand' : 'Collapse'}>
              <BdsIcon name={collapsed ? 'chevron-right' : 'chevron-down'} size={14} />
            </button>
            {label}
          </span>
        </th>
        {COLS.map(c => c.kind === 'ref' ? <td key={c.id} /> : <CellTd key={c.id} c={c} lines={g.lines} />)}
      </tr>
      {!collapsed && g.lines.map(l => (
        <tr key={l.code + l.name} data-code={l.code || l.name}>
          <th className="ob-sticky">
            <span className="ob-code-cell ob-indent">
              <input type="checkbox" aria-label={`Select ${l.name}`} />
              <BdsIcon name="chevron-right" size={14} className="ob-blue" />
              {l.code ? `${l.code} - ${l.name}` : l.name}
            </span>
          </th>
          {COLS.map(c => <CellTd key={c.id} c={c} lines={[l]} />)}
        </tr>
      ))}
    </>
  );
}
