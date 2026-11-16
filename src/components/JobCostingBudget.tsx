import { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback, Fragment, type MouseEvent as ReactMouseEvent } from 'react';
import '../bds-tokens.css';
import { BdsButton, BdsIcon, BdsText } from '../bds';
import { ChatSurface, FloatingBar, FloatingLauncher, ScopeChip, SparkIcon, useBudgetChat, AI_VARIANTS, type AiVariant, type AiReply, type Highlight, type Scope, type Thread, type ChatUi, type FactRow, type FactSection } from './BudgetAssistant';
import CostDetailPanel from './CostDetailPanel';
import { AiViewBar, CellPopover, JobRail, InsightsFlyout, RowBreakdown, buildInsights, explainCategory, explainRow, type Explain, type Insight, type PopPos } from './BudgetAiVariants';
import { MARKUP_PCT, type BudgetRow } from '../jcbMockData';
import { JOBS, rowsForJob, statsForJob } from '../jcbJobs';

const JOB_STATS = Object.fromEntries(JOBS.map(j => [j.id, statsForJob(j)]));

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtSigned = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n));
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

const VIEWS = [
  { id: 'all', label: 'All columns' },
  { id: 'job', label: 'Job costing' },
  { id: 'client', label: 'Client pricing' },
  { id: 'invoicing', label: 'Invoicing' },
  { id: 'profit', label: 'Profit' },
] as const;
type ViewId = typeof VIEWS[number]['id'];

// Prototype-only: credit memos applied to this job, subtracted from projected profit.
const APPLIED_CREDIT_MEMOS = 4200;

const svgProps = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const InfoIcon = ({ className = '' }: { className?: string }) => (
  <svg {...svgProps} className={className}><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16.5" /><circle cx="12" cy="7.8" r="0.6" fill="currentColor" /></svg>
);
const ShareIcon = () => (
  <svg {...svgProps}><path d="M12 15V3" /><polyline points="8 7 12 3 16 7" /><path d="M5 12v8h14v-8" /></svg>
);
const HomeIcon = () => (
  <svg {...svgProps}><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" /></svg>
);
const FilterIcon = () => (
  <svg {...svgProps}><polygon points="3 4 21 4 14 12.5 14 20 10 18 10 12.5 3 4" /></svg>
);

/** Scroll a highlighted cell into view, keeping it clear of the sticky cost-code column. */
function revealCell(cell: Element) {
  const wrap = document.querySelector('.jcb-table-wrap') as HTMLElement | null;
  if (wrap) {
    const sticky = (wrap.querySelector('th.jcb-col-code') as HTMLElement | null)?.getBoundingClientRect().width ?? 0;
    const w = wrap.getBoundingClientRect();
    const c = cell.getBoundingClientRect();
    const left = w.left + sticky + 8;
    if (c.left < left || c.right > w.right - 8) wrap.scrollTo({ left: wrap.scrollLeft + (c.left - left), behavior: 'smooth' });
  }
  cell.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
}

/* ── Component ── */

export default function JobCostingBudget({ onBack }: { onBack?: () => void; onOpenJPS?: () => void }) {
  const [jobId, setJobId] = useState('sample');
  const currentJob = JOBS.find(j => j.id === jobId)!;
  const ROWS = useMemo(() => rowsForJob(currentJob), [currentJob]);
  const [railOpen, setRailOpen] = useState(true);
  // The docked panel and job rail sit below the top nav, whatever height it renders at.
  const [navH, setNavH] = useState(48);
  useLayoutEffect(() => {
    const measure = () => { const n = document.querySelector('.topnav'); if (n) setNavH(Math.round(n.getBoundingClientRect().bottom)); };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  const [scope, setScope] = useState<Scope>({ kind: 'job' });
  const [search, setSearch] = useState('');
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [aiVariant, setAiVariant] = useState<AiVariant>('cell');
  const [aiOpen, setAiOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<BudgetRow | null>(null);
  const [view, setView] = useState<ViewId>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [aiFilter, setAiFilter] = useState<{ over: boolean; category: string | null }>({ over: false, category: null });
  const [viewBusy, setViewBusy] = useState(false);
  const [viewResult, setViewResult] = useState<{ q: string; text: string; hl: number; sections?: FactSection[]; hint?: string } | null>(null);
  const [manualHl, setManualHl] = useState<Highlight[]>([]);
  const [hlDismissedAt, setHlDismissedAt] = useState(-1);
  const [cellPop, setCellPop] = useState<{ spec: Explain; pos: PopPos } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const closeCellPop = useCallback(() => setCellPop(null), []);
  const toggleExpanded = (code: string) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(code)) next.delete(code); else next.add(code);
    return next;
  });
  // The AI view bar only becomes a docked panel once a question has been asked.
  const usesPanel = aiVariant === 'cell' || ((aiVariant === 'view' || aiVariant === 'bar') && aiOpen);
  const toggleCat = (cat: string) => setCollapsedCats(prev => {
    const next = new Set(prev);
    if (next.has(cat)) next.delete(cat); else next.add(cat);
    return next;
  });
  const togglePopover = (id: string) => setOpenPopover(prev => prev === id ? null : id);
  // A column popover closes on any click outside its title button and card, or on Escape.
  useEffect(() => {
    if (!openPopover) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as Element | null)?.closest('.jcb-col-title-btn, .jcb-col-popover')) setOpenPopover(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenPopover(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [openPopover]);

  const COL_INFO: Record<string, { label: string; desc: string; formula?: string }> = {
    code: { label: 'Cost codes', desc: 'Buildertrend cost code, name, and cost type. Cost codes group related budget lines.' },
    orig: { label: 'Original budget costs', desc: 'Planned job cost baseline from the signed estimate.', formula: 'Taken from the signed proposal.' },
    rev: { label: 'Revised budget costs', desc: 'Approved working budget after scope and change adjustments.', formula: 'Original budget costs + approved change orders + approved selections.' },
    com: { label: 'Committed costs', desc: 'Total approved cost commitments to date.', formula: 'Approved purchase orders + approved variance POs.' },
    act: { label: 'Actual costs', desc: 'Total costs incurred and officially recorded.', formula: 'Open and paid bills. Accounting method set to accrual.' },
    bv: { label: 'Builder variance', desc: 'Costs absorbed by the builder, not passed to the client.', formula: 'Bills marked as variance.' },
    proj: { label: 'Projected costs', desc: 'Forecasted total expected cost at completion.', formula: 'Based on projection reference. Adjustments are added after the initial calculation.' },
    ctt: { label: 'Cost to complete', desc: 'Remaining forecasted spend required to complete this code.', formula: 'Projected costs − Actual costs.' },
    rvp: { label: 'Revised vs projected', desc: 'Indicates whether you are trending over or under budget.', formula: 'Revised budget costs − Projected costs.' },
    ocp: { label: 'Original client price', desc: 'Original client contract price, pre-tax.', formula: 'Original budget costs + markup/margin.' },
    rcp: { label: 'Revised client price', desc: 'Current approved client contract price (excl. tax).', formula: 'Projected costs − Builder variance + markup/margin.' },
    ai: { label: 'Amount invoiced', desc: 'Total amount invoiced to client to date.', formula: 'Sent invoices.' },
    rti: { label: 'Remaining to invoice', desc: 'Contract value remaining to invoice to client.', formula: 'Revised client price − Amount invoiced.' },
    pp: { label: 'Projected profit', desc: 'Forecasted profit based on projected total costs.', formula: 'Revised client price − Projected costs − applied credit memos.' },
    pm: { label: 'Projected margin %', desc: 'Forecasted profit percentage on contract value.', formula: 'Projected profit ÷ Revised client price.' },
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ROWS.filter(r =>
      (!aiFilter.over || r.projectedCosts > r.revisedBudgetCosts) &&
      (!aiFilter.category || r.category === aiFilter.category) &&
      (!q ||
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.costType.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q))
    );
  }, [search, aiFilter]);

  const totals = useMemo(() => {
    const t = rows.reduce(
      (acc, r) => {
        acc.originalBudgetCosts += r.originalBudgetCosts;
        acc.revisedBudgetCosts += r.revisedBudgetCosts;
        acc.committedCosts += r.committedCosts;
        acc.actualCosts += r.actualCosts;
        acc.builderVariance += r.builderVariance;
        acc.projectedCosts += r.projectedCosts;
        acc.originalOwnerPrice += r.originalOwnerPrice;
        acc.revisedOwnerPrice += r.revisedOwnerPrice;
        acc.amountInvoiced += r.amountInvoiced;
        return acc;
      },
      { originalBudgetCosts: 0, revisedBudgetCosts: 0, committedCosts: 0, actualCosts: 0, builderVariance: 0, projectedCosts: 0, originalOwnerPrice: 0, revisedOwnerPrice: 0, amountInvoiced: 0 }
    );
    const costToComplete = t.projectedCosts - t.actualCosts;
    const revisedVsProjected = t.revisedBudgetCosts - t.projectedCosts;
    const remainingToInvoice = t.revisedOwnerPrice - t.amountInvoiced;
    const customerPayable = -revisedVsProjected - t.builderVariance;
    const customerPayableWithMarkup = customerPayable * (1 + MARKUP_PCT);
    return { ...t, costToComplete, revisedVsProjected, remainingToInvoice, customerPayable, customerPayableWithMarkup };
  }, [rows]);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, BudgetRow[]>();
    for (const r of rows) {
      if (!byCategory.has(r.category)) byCategory.set(r.category, []);
      byCategory.get(r.category)!.push(r);
    }
    return Array.from(byCategory.entries()).map(([category, items]) => {
      const sub = items.reduce(
        (acc, r) => {
          acc.originalBudgetCosts += r.originalBudgetCosts;
          acc.revisedBudgetCosts += r.revisedBudgetCosts;
          acc.committedCosts += r.committedCosts;
          acc.actualCosts += r.actualCosts;
          acc.builderVariance += r.builderVariance;
          acc.projectedCosts += r.projectedCosts;
          acc.originalOwnerPrice += r.originalOwnerPrice;
          acc.revisedOwnerPrice += r.revisedOwnerPrice;
          acc.amountInvoiced += r.amountInvoiced;
          return acc;
        },
        { originalBudgetCosts: 0, revisedBudgetCosts: 0, committedCosts: 0, actualCosts: 0, builderVariance: 0, projectedCosts: 0, originalOwnerPrice: 0, revisedOwnerPrice: 0, amountInvoiced: 0 }
      );
      const costToComplete = sub.projectedCosts - sub.actualCosts;
      const revisedVsProjected = sub.revisedBudgetCosts - sub.projectedCosts;
      const remainingToInvoice = sub.revisedOwnerPrice - sub.amountInvoiced;
      const projectedProfit = sub.revisedOwnerPrice - sub.projectedCosts;
      const projectedMargin = sub.revisedOwnerPrice ? (projectedProfit / sub.revisedOwnerPrice) * 100 : 0;
      return { category, items, sub: { ...sub, costToComplete, revisedVsProjected, remainingToInvoice, projectedProfit, projectedMargin } };
    });
  }, [rows]);

  // Headline summary always reflects the whole job, not the filtered grid.
  const job = useMemo(() => {
    const revised = ROWS.reduce((a, r) => a + r.revisedOwnerPrice, 0);
    const original = ROWS.reduce((a, r) => a + r.originalOwnerPrice, 0);
    const projected = ROWS.reduce((a, r) => a + r.projectedCosts, 0);
    const p = revised - projected - APPLIED_CREDIT_MEMOS;
    return { revised, projected, profit: p, margin: revised ? (p / revised) * 100 : 0, vsEstimatedPct: original ? ((revised / original) - 1) * 100 : 0 };
  }, [ROWS]);
  const profit = totals.revisedOwnerPrice - totals.projectedCosts - APPLIED_CREDIT_MEMOS;
  const margin = totals.revisedOwnerPrice ? (profit / totals.revisedOwnerPrice) * 100 : 0;

  // Insights — match real DifferenceFooter logic

  // Written explanation and next steps for an over-budget cost code, built only from the row's own numbers.
  const overrunNarrative = (r: BudgetRow): { why: string; suggest: string[] } => {
    const over = r.projectedCosts - r.revisedBudgetCosts;
    const parts: string[] = [];
    const suggest: string[] = [];
    const raised = r.revisedBudgetCosts - r.originalBudgetCosts;
    if (r.actualCosts > r.revisedBudgetCosts) {
      parts.push(`Bills already paid or entered total ${fmt(r.actualCosts)}, which is ${fmt(r.actualCosts - r.revisedBudgetCosts)} past the ${fmt(r.revisedBudgetCosts)} budget before anything else is counted.`);
      suggest.push('Review the bills on this code for duplicates or work that belongs on another code.');
    } else if (r.committedCosts > r.revisedBudgetCosts) {
      parts.push(`Purchase orders and subcontracts commit you to ${fmt(r.committedCosts)}, already above the ${fmt(r.revisedBudgetCosts)} budget, so the overage is locked in even though less has been billed so far.`);
      suggest.push('Check whether the PO amount was agreed at a higher price than the estimate. If it was, the budget needs to move with it.');
    } else {
      parts.push(`Projected cost of ${fmt(r.projectedCosts)} is above the ${fmt(r.revisedBudgetCosts)} budget, but spent and committed amounts are still under it. The rest comes from remaining work expected to cost more than what was left in the budget.`);
      suggest.push('Re-check the remaining work on this code. If the estimate for it is stale, update the projected cost.');
    }
    if (r.builderVariance) parts.push(`${fmt(r.builderVariance)} of it is marked as builder variance.`);
    if (raised > 0) parts.push(`The budget was already raised by ${fmt(raised)} from the original ${fmt(r.originalBudgetCosts)}, so this is on top of an earlier increase.`);
    else if (raised === 0) parts.push('The budget has not been changed since the original estimate, so nothing was added to cover it.');
    if (r.revisedOwnerPrice <= r.originalOwnerPrice) suggest.push(`The client price has not gone up with this cost. If the extra work was the client's request, a change order of about ${fmt(over)} plus markup would recover it.`);
    if (r.builderVariance) suggest.push('If the variance is a one-time mistake, leave it marked so it stays out of future estimates. If it will repeat, raise the unit cost in your catalog.');
    else suggest.push('If this code runs over on every job, raise its price in your estimate template.');
    return { why: parts.join(' '), suggest };
  };

  const answer = (q: string): AiReply => {
    const t = q.toLowerCase();
    const minus = (n: number) => '−' + fmt(n);
    const hit = ROWS.find(r => t.includes(r.code.toLowerCase()));
    if (hit) {
      const d = hit.projectedCosts - hit.revisedBudgetCosts;
      const hl: Highlight[] = [{ code: hit.code, col: 'rev' }, { code: hit.code, col: 'proj' }, { code: hit.code, col: 'rvp' }];
      if (hit.actualCosts > hit.revisedBudgetCosts) hl.push({ code: hit.code, col: 'act' });
      if (hit.builderVariance) hl.push({ code: hit.code, col: 'bv' });
      if (hit.committedCosts > hit.revisedBudgetCosts) hl.push({ code: hit.code, col: 'com' });
      const why: FactRow[] = [];
      if (hit.actualCosts > hit.revisedBudgetCosts) why.push({ label: 'Spent so far is already over budget', value: fmt(hit.actualCosts), bad: true });
      if (hit.builderVariance) why.push({ label: 'Marked as builder variance', value: fmt(hit.builderVariance), bad: true });
      if (hit.committedCosts > hit.revisedBudgetCosts) why.push({ label: 'Committed to vendors', value: fmt(hit.committedCosts), bad: true });
      const sections: FactSection[] = [{ rows: [
        { label: 'Revised budget', value: fmt(hit.revisedBudgetCosts) },
        { label: 'Projected cost', value: fmt(hit.projectedCosts) },
        { label: d > 0 ? 'Over budget by' : 'Under budget by', value: fmt(Math.abs(d)), bad: d > 0, strong: true },
      ] }];
      if (why.length) sections.push({ title: 'Why', rows: why });
      return {
        text: d > 0 ? `${hit.code} ${hit.name} is ${fmt(d)} over budget.` : `${hit.code} ${hit.name} is on track.`,
        sections, highlights: hl,
        ...(d > 0 ? overrunNarrative(hit) : {}),
      };
    }
    const catsList = [...new Set(ROWS.map(r => r.category))];
    const byCat = (pick: (r: BudgetRow) => number): FactRow[] => catsList.map(c => ({ label: c, value: fmt(ROWS.filter(r => r.category === c).reduce((a, r) => a + pick(r), 0)) }));
    if (t.includes('revised price')) {
      const original = ROWS.reduce((a, r) => a + r.originalOwnerPrice, 0);
      const diff = job.revised - original;
      const moved = ROWS.map(r => ({ r, d: r.revisedOwnerPrice - r.originalOwnerPrice })).filter(x => x.d !== 0).sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
      const sections: FactSection[] = [{ rows: [
        { label: 'Original estimate', value: fmt(original) },
        { label: 'Revised price', value: fmt(job.revised) },
        { label: 'Change', value: fmtSigned(diff), strong: true },
      ] }];
      if (moved.length) sections.push({ title: 'Biggest changes', rows: moved.slice(0, 4).map(x => ({ label: `${x.r.code} ${x.r.name}`, value: fmtSigned(x.d), bad: x.d < 0 })) });
      return {
        text: diff === 0 ? 'Your price matches the original estimate.' : `Your revised price is ${fmt(Math.abs(diff))} ${diff > 0 ? 'higher' : 'lower'} than the estimate.`,
        sections, hint: 'Price changes come from approved change orders and selections.',
        highlights: moved.slice(0, 4).map(x => ({ code: x.r.code, col: 'rcp' })),
      };
    }
    if (t.includes('client price')) {
      return {
        text: `Your client price is ${fmt(job.revised)}, with a ${fmtPct(job.margin)} profit margin.`,
        sections: [{ title: 'By category', rows: byCat(r => r.revisedOwnerPrice) }, { rows: [{ label: 'Client price', value: fmt(job.revised), strong: true }] }],
        hint: 'Client price is your projected cost plus markup or margin.',
      };
    }
    if (t.includes('projected cost')) {
      const spent = ROWS.reduce((a, r) => a + r.actualCosts, 0);
      return {
        text: `You're projected to spend ${fmt(job.projected)} to finish this job.`,
        sections: [
          { rows: [{ label: 'Spent so far', value: fmt(spent) }, { label: 'Still to spend', value: fmt(job.projected - spent) }, { label: 'Projected cost', value: fmt(job.projected), strong: true }] },
          { title: 'By category', rows: byCat(r => r.projectedCosts) },
        ],
      };
    }
    if (t.includes('credit memo')) {
      return {
        text: `${fmt(APPLIED_CREDIT_MEMOS)} in credit memos are applied to this job.`,
        sections: [{ rows: [
          { label: 'Profit before credit memos', value: fmt(job.profit + APPLIED_CREDIT_MEMOS) },
          { label: 'Credit memos', value: minus(APPLIED_CREDIT_MEMOS) },
          { label: 'Projected profit', value: fmt(job.profit), strong: true },
        ] }],
        hint: 'Credit memos reduce your projected profit dollar for dollar.',
      };
    }
    const cat = [...new Set(ROWS.map(r => r.category))].find(c => t.includes(c.toLowerCase()));
    if (cat) {
      const items = ROWS.filter(r => r.category === cat && r.projectedCosts > r.revisedBudgetCosts);
      if (!items.length) return `${cat} is within budget.`;
      const total = items.reduce((a, r) => a + r.projectedCosts - r.revisedBudgetCosts, 0);
      return {
        text: `${cat} is ${fmt(total)} over budget.`,
        sections: [{ title: 'Cost codes over budget', rows: items.map(r => ({ label: `${r.code} ${r.name}`, value: '+' + fmt(r.projectedCosts - r.revisedBudgetCosts), bad: true })) }],
        highlights: [{ code: `cat:${cat}`, col: 'rvp' }, ...items.map(r => ({ code: r.code, col: 'rvp' }))],
      };
    }
    const over = [...rows].map(r => ({ r, d: r.projectedCosts - r.revisedBudgetCosts })).filter(x => x.d > 0).sort((a, b) => b.d - a.d);
    const overRows = (n: number): FactRow[] => over.slice(0, n).map(x => ({ label: `${x.r.code} ${x.r.name}`, value: '+' + fmt(x.d), bad: true }));
    if (t.includes('over') || t.includes('budget')) {
      if (!over.length) return 'No cost codes are over budget right now.';
      return {
        text: `${over.length} cost code${over.length === 1 ? ' is' : 's are'} over budget, ${fmt(over.reduce((a, x) => a + x.d, 0))} in all.`,
        sections: [
          { title: over.length > 5 ? 'Biggest overruns' : 'Over budget', rows: overRows(5) },
          { title: 'By category', rows: (() => { const m = new Map<string, number>(); over.forEach(x => m.set(x.r.category, (m.get(x.r.category) ?? 0) + x.d)); return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([c, d]) => ({ label: c, value: '+' + fmt(d), bad: true })); })() },
        ],
        highlights: over.map(x => ({ code: x.r.code, col: 'rvp' })),
        ...(() => {
          const top = over[0], e = overrunNarrative(top.r);
          const total = over.reduce((a, x) => a + x.d, 0);
          const share = Math.round((top.d / total) * 100);
          return { why: `${top.r.code} ${top.r.name} is the biggest driver at ${fmt(top.d)}, about ${share}% of the total. ${e.why}`, suggest: [`Start with ${top.r.code} ${top.r.name}. ${e.suggest[0]}`, ...e.suggest.slice(1, 3)] };
        })(),
      };
    }
    if (t.includes('profit') || t.includes('why') || t.includes('margin') || t.includes('explain')) {
      const sections: FactSection[] = [{ rows: [
        { label: 'Client price', value: fmt(totals.revisedOwnerPrice) },
        { label: 'Projected cost', value: minus(totals.projectedCosts) },
        { label: 'Credit memos', value: minus(APPLIED_CREDIT_MEMOS) },
        { label: 'Projected profit', value: fmt(profit), strong: true },
      ] }];
      if (over.length) sections.push({ title: 'Biggest overruns', rows: overRows(3) });
      return {
        text: `You're projected to make ${fmt(profit)}, a ${fmtPct(margin)} margin.`,
        sections,
        highlights: over.slice(0, 3).flatMap(x => [{ code: x.r.code, col: 'proj' }, { code: x.r.code, col: 'rvp' }]),
      };
    }
    if (t.includes('invoice') || t.includes('bill')) {
      return {
        text: `${fmt(totals.remainingToInvoice)} is left to invoice.`,
        sections: [{ rows: [
          { label: 'Client price', value: fmt(totals.revisedOwnerPrice) },
          { label: 'Invoiced so far', value: fmt(totals.amountInvoiced) },
          { label: 'Left to invoice', value: fmt(totals.remainingToInvoice), strong: true },
        ] }],
      };
    }
    if (t.includes('change') || t.includes('original')) {
      const change = totals.revisedBudgetCosts - totals.originalBudgetCosts;
      return {
        text: change === 0 ? 'Your budget hasn’t changed since the original.' : `Your budget is ${fmt(Math.abs(change))} ${change > 0 ? 'higher' : 'lower'} than the original.`,
        sections: [{ rows: [
          { label: 'Original budget', value: fmt(totals.originalBudgetCosts) },
          { label: 'Revised budget', value: fmt(totals.revisedBudgetCosts) },
          { label: 'Change', value: fmtSigned(change), strong: true },
        ] }],
        hint: 'Changes come from approved change orders and selections.',
      };
    }
    return 'I can help with costs, profit, invoicing and changes on this budget. Try one of the suggestions.';
  };
  const scrollToHl = () => { const c = document.querySelector('.jcb-table .jcb-hl'); if (c) revealCell(c); };
  // "Show me" re-applies the answer's highlights (they may have been cleared or hidden in a collapsed category) and scrolls to them.
  const showHighlights = () => {
    setCollapsedCats(new Set());
    setManualHl([]);
    setHlDismissedAt(-1);
    // On a phone the assistant covers the grid, so close it to reveal the highlighted cells.
    if (window.innerWidth <= 768) setAiOpen(false);
    window.setTimeout(scrollToHl, 120);
  };
  const fmtOver = (n: number) => '−' + fmt(n);
  const scopeJobs = scope.kind === 'all' ? JOBS : null;
  const answerScoped = (q: string): AiReply => {
    const t = q.toLowerCase();
    if (scopeJobs) {
      const label = scope.kind === 'all' ? `Based on all ${JOBS.length} open jobs` : `Based on ${scopeJobs.length} selected job${scopeJobs.length === 1 ? '' : 's'}`;
      const actions = [{ label: `Ask about ${currentJob.name} only`, run: () => { setScope({ kind: 'job' }); chat.addDivider(`Asking about ${currentJob.name}`); } }];
      if (/invoice|bill/.test(t)) {
        const list = [...scopeJobs].sort((a, b) => JOB_STATS[b.id].remainingToInvoice - JOB_STATS[a.id].remainingToInvoice);
        const total = list.reduce((a, j) => a + JOB_STATS[j.id].remainingToInvoice, 0);
        return { text: `${fmt(total)} is left to invoice across ${list.length} job${list.length === 1 ? '' : 's'}.`, hint: 'Select a job to open it.', scope: label, actions, jobs: list.map(j => ({ id: j.id, name: j.name, value: fmt(JOB_STATS[j.id].remainingToInvoice) })) };
      }
      if (/over|budget|profit|why|margin|cost|variance|job/.test(t)) {
        const list = scopeJobs.filter(j => JOB_STATS[j.id].overBy > 0).sort((a, b) => JOB_STATS[b.id].overBy - JOB_STATS[a.id].overBy);
        if (!list.length) return { text: `None of the ${scopeJobs.length} ${scope.kind === 'all' ? 'open ' : ''}jobs are over budget right now.`, scope: label, actions };
        const total = list.reduce((a, j) => a + JOB_STATS[j.id].overBy, 0);
        return { text: `${list.length} of ${scopeJobs.length} ${scope.kind === 'all' ? 'open ' : ''}jobs are over budget, ${fmt(total)} in all.`, hint: 'Select a job to open it.', scope: label, actions, jobs: list.map(j => ({ id: j.id, name: j.name, value: fmtOver(JOB_STATS[j.id].overBy), bad: true })) };
      }
      return { text: 'Across several jobs I can compare budget variance and what is left to invoice. Try one of the suggestions.', scope: label, actions };
    }
    if (/\b(jobs|every job|all jobs|across)\b/.test(t)) {
      return { text: `That sounds like a question about more than one job, and I only looked at ${currentJob.name}. I can look across all ${JOBS.length} open jobs instead.`, scope: `Based on ${currentJob.name}`, actions: [{ label: `Ask across all ${JOBS.length} open jobs`, run: () => { setScope({ kind: 'all' }); chat.send(q); } }] };
    }
    const r = answer(q);
    const o = typeof r === 'string' ? { text: r } : r;
    return { ...o, scope: `Based on ${currentJob.name}` };
  };

  // Switching jobs (picker or an answer row) keeps the thread, marks the change, and drops stale highlights.
  const switchJob = (id: string, announce: boolean) => {
    const next = JOBS.find(j => j.id === id);
    if (!next || (id === jobId && scope.kind !== 'all')) return;
    setJobId(id);
    setScope({ kind: 'job' });
    setAiFilter({ over: false, category: null });
    setViewResult(null); setManualHl([]); setCellPop(null); setExpanded(new Set()); setSearch(''); setDetailRow(null);
    if (announce && chat.messages.length > 0) { chat.addDivider(`Now asking about ${next.name}`); }
    setHlDismissedAt(chat.messages.length + 1);
  };

  // Chat history. Starting a new chat archives the current one; opening an old chat restores its job and scope.
  const [threads, setThreads] = useState<Thread[]>(() => {
    const bigmac = JOBS.find(j => j.id === 'bigmac')!;
    const st = statsForJob(bigmac);
    const over = JOBS.filter(j => statsForJob(j).overBy > 0).sort((a, b) => statsForJob(b).overBy - statsForJob(a).overBy);
    return [
      { id: 'seed-1', title: 'Why is 3100 Framing over budget?', scope: JOBS[0].name, jobId: 'sample', when: 'Yesterday', messages: [
        { role: 'user', text: 'Why is 3100 Framing over budget?' },
        { role: 'ai', scope: `Based on ${JOBS[0].name}`, text: '3100 Framing is $3,200 over budget.', sections: [
          { rows: [{ label: 'Revised budget', value: '$25,000' }, { label: 'Projected cost', value: '$28,200' }, { label: 'Over budget by', value: '$3,200', bad: true, strong: true }] },
          { title: 'Why', rows: [{ label: 'Spent so far is already over budget', value: '$26,500', bad: true }, { label: 'Marked as builder variance', value: '$1,200', bad: true }] },
        ] },
      ] },
      { id: 'seed-2', title: 'Which jobs are over budget?', scope: `All ${JOBS.length} open jobs`, jobId: '*', when: 'Yesterday', messages: [
        { role: 'user', text: 'Which jobs are over budget?' },
        { role: 'ai', scope: `Based on all ${JOBS.length} open jobs`, text: `${over.length} of ${JOBS.length} open jobs are over budget.`, hint: 'Select a job to open it.', jobs: over.map(j => ({ id: j.id, name: j.name, value: fmtOver(statsForJob(j).overBy), bad: true })) },
      ] },
      { id: 'seed-3', title: 'How much is left to invoice?', scope: bigmac.name, jobId: 'bigmac', when: 'Earlier', messages: [
        { role: 'user', text: 'How much is left to invoice?' },
        { role: 'ai', scope: `Based on ${bigmac.name}`, text: `You have invoiced ${fmt(st.invoiced)} of ${fmt(st.revisedPrice)}. ${fmt(st.remainingToInvoice)} is left to invoice.` },
      ] },
    ];
  });
  const archiveCurrent = () => {
    if (!chat.messages.some(m => m.role === 'user')) return;
    const title = chat.messages.find(m => m.role === 'user')!.text;
    const multi = scope.kind !== 'job';
    setThreads(t => [{ id: `t-${Date.now()}`, title, scope: multi ? (scope.kind === 'all' ? `All ${JOBS.length} open jobs` : `${scope.ids.length} jobs`) : currentJob.name, jobId: multi ? '*' : jobId, when: 'Today', messages: chat.messages }, ...t]);
  };
  const newChat = () => {
    archiveCurrent();
    chat.reset();
    setScope({ kind: 'job' });
    setManualHl([]);
    setHlDismissedAt(-1);
  };
  const restoreChat = (id: string) => {
    const t = threads.find(x => x.id === id);
    if (!t) return;
    archiveCurrent();
    setThreads(ts => ts.filter(x => x.id !== id));
    if (t.jobId !== '*' && t.jobId !== jobId) switchJob(t.jobId, false);
    setScope(t.jobId === '*' ? { kind: 'all' } : { kind: 'job' });
    chat.load(t.messages);
    setManualHl([]);
    setHlDismissedAt(t.messages.length);
  };
  const chatUi: ChatUi = {
    leading: <ScopeChip jobs={JOBS} currentName={currentJob.name} scope={scope} />,
    selectJob: (id) => switchJob(id, true),
    hlDismissedAt,
    history: { threads, currentJobId: jobId, newChat, restore: restoreChat, remove: (id) => setThreads(ts => ts.filter(x => x.id !== id)) },
  };
  const chat = useBudgetChat(answerScoped, showHighlights, chatUi);
  const lastAi = [...chat.messages].reverse().find(m => m.role === 'ai');
  const highlights: Highlight[] = manualHl.length ? manualHl : hlDismissedAt === chat.messages.length ? [] : (lastAi?.hl ?? []);
  const tableRef = useRef<HTMLTableElement>(null);
  const COL_INDEX: Record<string, number> = { orig: 2, rev: 3, com: 4, act: 5, bv: 6, proj: 7, ctt: 8, rvp: 9, ocp: 10, rcp: 11, ai: 12, rti: 13 };
  useEffect(() => {
    const t = tableRef.current;
    if (!t) return;
    t.querySelectorAll('.jcb-hl').forEach(el => el.classList.remove('jcb-hl'));
    let first: Element | null = null;
    for (const h of highlights) {
      const tr = t.querySelector(`tr[data-code="${CSS.escape(h.code)}"]`);
      const td = tr?.children[COL_INDEX[h.col] - 1];
      if (td) { td.classList.add('jcb-hl'); first = first ?? td; }
    }
    if (first) revealCell(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.messages.length, hlDismissedAt, manualHl, view, collapsedCats, search, aiFilter]);
  const CATS = [...new Set(ROWS.map(r => r.category))];
  const runView = (q: string) => {
    const t = q.toLowerCase();
    const isQuestion = /^(why|what|how|which|who|when|is|are|do|does)\b/.test(t);
    const over = /\b(over|above|overrun|overruns|trouble|problem)/.test(t);
    const category = CATS.find(c => t.includes(c.toLowerCase())) ?? null;
    const nextView: ViewId | null = /invoic|bill/.test(t) ? 'invoicing' : /profit|margin/.test(t) ? 'profit' : /client|price/.test(t) ? 'client' : null;
    const reset = /\b(reset|clear|everything|show all|all codes)\b/.test(t);
    const isViewCommand = !isQuestion && (reset || over || category || nextView);
    // A question needs room to answer: the bar hands off to the side panel chat.
    if (!isViewCommand) {
      setViewResult(null);
      setAiOpen(true);
      chat.send(q);
      return;
    }
    setViewBusy(true);
    setViewResult(null);
    window.setTimeout(() => {
      if (isViewCommand) {
        const f = reset ? { over: false, category: null } : { over, category };
        setAiFilter(f);
        setManualHl([]);
        if (reset) setView('all'); else if (nextView) setView(nextView);
        const n = ROWS.filter(r => (!f.over || r.projectedCosts > r.revisedBudgetCosts) && (!f.category || r.category === f.category)).length;
        const bits = [f.over ? 'over budget' : '', f.category ? `in ${f.category}` : ''].filter(Boolean).join(' ');
        const viewLabel = nextView ? VIEWS.find(v => v.id === nextView)!.label : '';
        setViewResult({ q, text: reset ? 'Showing all cost codes again.' : `Showing ${n} of ${ROWS.length} cost codes${bits ? ' ' + bits : ''}${viewLabel ? `, switched to the ${viewLabel} view` : ''}.`, hl: 0 });
      }
      setViewBusy(false);
    }, 700);
  };
  const panelOpen = usesPanel && aiOpen;
  const railBefore = useRef(true);
  const prevPanel = useRef(false);
  useEffect(() => {
    if (panelOpen && !prevPanel.current) { railBefore.current = railOpen; setRailOpen(false); }
    if (!panelOpen && prevPanel.current) setRailOpen(railBefore.current);
    prevPanel.current = panelOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen]);
  const askAi = (q: string) => {
    if (aiVariant === 'view') { runView(q); return; }
    setAiOpen(true);
    chat.send(q);
  };
  const showInsight = (i: Insight) => { setView('all'); setManualHl(i.hl); };
  const openCellPop = (spec: Explain) => (e: ReactMouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - 372));
    const flip = rect.bottom + 330 > window.innerHeight;
    setCellPop({ spec, pos: flip ? { left, bottom: window.innerHeight - rect.top + 6 } : { left, top: rect.bottom + 6 } });
  };
  const insights = useMemo(() => buildInsights(ROWS), [ROWS]);
  const viewChips = [
    ...(aiFilter.over ? [{ label: 'Over budget', onRemove: () => setAiFilter(f => ({ ...f, over: false })) }] : []),
    ...(aiFilter.category ? [{ label: aiFilter.category, onRemove: () => setAiFilter(f => ({ ...f, category: null })) }] : []),
  ];

  // Over-budget cells get a red highlight and an AI icon that asks why.
  const rvpCell = (value: number, _question: string, extra = '', explain?: Explain) => {
    const cls = extra.includes('jcb-nohl') ? '' : value < 0 ? 'jcb-flag' : value > 0 ? 'jcb-flag-good' : '';
    const text = value === 0 ? fmt(0) : fmtSigned(value);
    return (
      <td className={`jcb-num ${cls} ${extra}`}>
        {aiVariant === 'cell' && explain && value < 0 ? (
          <button type="button" className="jcb-ai-cell" title="Why is this over budget?" aria-expanded={cellPop?.spec.title === explain.title} onClick={openCellPop(explain)}>
            <span className="jcb-ai-spark"><SparkIcon size={11} /></span>{text}
          </button>
        ) : text}
      </td>
    );
  };

  const rvpFor = (r: BudgetRow) => r.revisedBudgetCosts - r.projectedCosts;
  const cttFor = (r: BudgetRow) => r.projectedCosts - r.actualCosts;

  return (
    <div className={`jcb-shell ${usesPanel && aiOpen ? 'has-panel' : ''}`} style={{ '--jcb-nav-h': `${navH}px` } as React.CSSProperties}>
    <JobRail
      jobs={JOBS}
      currentId={jobId}
      overIds={new Set(JOBS.filter(j => JOB_STATS[j.id].overBy > 0).map(j => j.id))}
      open={railOpen}
      onToggle={() => setRailOpen(o => !o)}
      onSelect={(id) => switchJob(id, true)}
      allLabel={`All ${JOBS.length} open jobs`}
      allSelected={scope.kind === 'all'}
      onSelectAll={() => { if (scope.kind !== 'all') { setScope({ kind: 'all' }); setManualHl([]); setCellPop(null); if (chat.messages.length > 0) chat.addDivider(`Now asking about all ${JOBS.length} open jobs`); } }}
    />
    <div className="jcb-page">
      {/* Phone: the job rail is replaced by a native job dropdown */}
      <label className="jcb-jobpick">
        <span className="jcb-jobpick-label">Job</span>
        <span className="jcb-jobpick-name">{scope.kind === 'all' ? `All ${JOBS.length} open jobs` : currentJob.name}</span>
        <select value={scope.kind === 'all' ? '__all' : jobId} onChange={(e) => { if (e.target.value === '__all') { setScope({ kind: 'all' }); setManualHl([]); setCellPop(null); } else switchJob(e.target.value, true); }} aria-label="Job">
          <option value="__all">All {JOBS.length} open jobs</option>
          {JOBS.map(j => <option key={j.id} value={j.id}>{j.name}{JOB_STATS[j.id].overBy > 0 ? ' · over budget' : ''}</option>)}
        </select>
        <BdsIcon name="chevron-down" size={14} />
      </label>
      {/* ─── Page header ─── */}
      <div className="jcb-header">
        <div className="jcb-header-left">
          <div>
            {onBack && (
              <button type="button" className="jcb-back" onClick={onBack}>
                <BdsIcon name="chevron-left" size={14} /> Back
              </button>
            )}
            <div className="jcb-job-name">{scope.kind === 'all' ? `All ${JOBS.length} open jobs` : currentJob.name}</div>
            <BdsText as="h1" size="heavy-lg" className="jcb-title">Job Costing Budget</BdsText>
          </div>
        </div>
        <div className="jcb-header-right">
          <button type="button" className="jcb-icon-btn" aria-label="Help"><InfoIcon /></button>
          <button type="button" className="jcb-icon-btn" aria-label="Share"><ShareIcon /></button>
          <button type="button" className="jcb-icon-btn" aria-label="Home"><HomeIcon /></button>
          {usesPanel && (
            <button type="button" className="ba-ask-btn" onClick={() => setAiOpen(o => !o)} aria-pressed={aiOpen}>
              <SparkIcon size={16} /> Ask AI
            </button>
          )}
          <BdsButton displayType="primary" text="Add" icon={<BdsIcon name="plus" size={14} />} iconRight={<BdsIcon name="chevron-down" size={14} />} />
        </div>
      </div>

      {/* ─── Prototype-only: AI entry point switcher ─── */}
      <div className="ba-switcher" role="radiogroup" aria-label="Prototype: AI entry point">
        <span className="ba-switcher-label">Prototype · AI entry point</span>
        {AI_VARIANTS.map(v => (
          <button key={v.id} type="button" role="radio" aria-checked={aiVariant === v.id} title={v.hint}
            className={aiVariant === v.id ? 'is-on' : ''}
            onClick={() => { setAiVariant(v.id); setAiOpen(false); chat.reset(); setAiFilter({ over: false, category: null }); setViewResult(null); setManualHl([]); setCellPop(null); setExpanded(new Set()); }}>
            {v.label}
          </button>
        ))}
      </div>

      {scope.kind === 'all' ? (
        <div className="jcb-empty">
          <BdsText as="div" size="heavy-lg">No job selected</BdsText>
          <BdsText as="div" size="normal-md">Pick a single job to see its budget. The assistant can compare across all jobs.</BdsText>
        </div>
      ) : (<>
      {/* ─── Summary equation: each figure opens the AI with a question about that number ─── */}
      <div className="jcb-summary">
        <div className="jcb-sum-group">
          <button type="button" className="jcb-sum-item ba-sum-tile" title="Ask AI why" onClick={() => askAi(`Why is my revised price ${job.vsEstimatedPct >= 0 ? 'higher' : 'lower'} than the estimate?`)}>
            <span className="ba-sum-spark"><SparkIcon size={11} /></span>
            <span className="jcb-sum-label">Total revised price</span>
            <span className="jcb-sum-value">{fmt(job.revised)}<InfoIcon className="jcb-sum-info" /></span>
            <span className={`jcb-sum-chip ${job.vsEstimatedPct >= 0 ? 'jcb-chip-green' : 'jcb-chip-red'}`}>
              <BdsIcon name={job.vsEstimatedPct >= 0 ? 'arrow-up' : 'arrow-down'} size={12} />
              {fmtPct(Math.abs(job.vsEstimatedPct))} {job.vsEstimatedPct >= 0 ? 'higher' : 'lower'} than estimated
            </span>
          </button>
        </div>
        <div className="jcb-sum-group jcb-sum-equation">
          <button type="button" className="jcb-sum-item ba-sum-tile" title="Ask AI what makes this up" onClick={() => askAi('What makes up my client price?')}>
            <span className="ba-sum-spark"><SparkIcon size={11} /></span>
            <span className="jcb-sum-label">Revised client price</span>
            <span className="jcb-sum-value">{fmt(job.revised)}</span>
            <span className="jcb-sum-chip jcb-chip-neutral">{fmtPct(job.margin)} profit margin</span>
          </button>
          <span className="jcb-sum-op">−</span>
          <button type="button" className="jcb-sum-item ba-sum-tile" title="Ask AI what makes this up" onClick={() => askAi('What makes up my projected cost?')}>
            <span className="ba-sum-spark"><SparkIcon size={11} /></span>
            <span className="jcb-sum-label">Projected cost</span>
            <span className="jcb-sum-value">{fmt(job.projected)}</span>
          </button>
          <span className="jcb-sum-op">−</span>
          <button type="button" className="jcb-sum-item ba-sum-tile" title="Ask AI about these" onClick={() => askAi('What are my applied credit memos?')}>
            <span className="ba-sum-spark"><SparkIcon size={11} /></span>
            <span className="jcb-sum-label">Applied credit memos</span>
            <span className="jcb-sum-value">{fmt(APPLIED_CREDIT_MEMOS)}</span>
          </button>
          <span className="jcb-sum-op">=</span>
          <button type="button" className="jcb-sum-item ba-sum-tile" title="Ask AI what is driving this" onClick={() => askAi('What is driving my projected profit?')}>
            <span className="ba-sum-spark"><SparkIcon size={11} /></span>
            <span className="jcb-sum-label">Projected profit</span>
            <span className="jcb-sum-value">{fmt(job.profit)}<InfoIcon className="jcb-sum-info" /></span>
          </button>
        </div>
        <p className="ba-tap-hint"><SparkIcon size={12} /> Tap any figure to ask AI about it.</p>
      </div>

      {/* ─── View bar ─── */}
      <div className="jcb-viewbar">
        <label className="jcb-view-label" htmlFor="jcb-view">View</label>
        <div className="jcb-view-select">
          <select id="jcb-view" value={view} onChange={(e) => setView(e.target.value as ViewId)}>
            {VIEWS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
          <BdsIcon name="chevron-down" size={14} />
        </div>
        <button type="button" className="jcb-icon-btn" aria-label="Filter"><FilterIcon /></button>
        <button type="button" className={`jcb-icon-btn ${searchOpen ? 'is-active' : ''}`} aria-label="Search" onClick={() => setSearchOpen(o => !o)}>
          <BdsIcon name="search" size={18} />
        </button>
        {highlights.length > 0 && (
          <span className="jcb-hl-chip">
            <SparkIcon size={13} /> AI highlighted {highlights.length} cell{highlights.length === 1 ? '' : 's'}
            <button type="button" onClick={() => { setManualHl([]); setHlDismissedAt(chat.messages.length); }}>Clear</button>
          </span>
        )}
        {aiVariant === 'view' && !aiOpen && (
          <AiViewBar
            onSubmit={runView}
            busy={viewBusy}
            chips={viewChips}
            result={viewResult}
            onClearResult={() => { setViewResult(null); setManualHl([]); }}
            suggestions={['Show only over-budget codes', 'Over-budget mechanical codes', 'Show invoicing by code', 'Which cost codes are over budget?']}
          />
        )}
        {(searchOpen || search) && (
          <label className="jcb-control jcb-control-search">
            <input type="text" autoFocus placeholder="Search cost codes" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
        )}
        {(aiVariant === 'cell' || aiVariant === 'view') && <InsightsFlyout insights={insights} onShow={showInsight} onAsk={askAi} />}
      </div>


      {/* ─── Spreadsheet ─── */}
      <div className="jcb-table-wrap">
        <table className="jcb-table" data-view={view} ref={tableRef}>
          <thead>
            <tr className="jcb-group-row">
              <th colSpan={1} className="jcb-group-header jcb-group-header-category">Cost categories</th>
              <th colSpan={8} className="jcb-group-header jcb-group-header-job">Job costing</th>
              <th colSpan={2} className="jcb-group-header jcb-group-header-client">Client pricing</th>
              <th colSpan={2} className="jcb-group-header jcb-group-header-invoicing">Invoicing</th>
              <th colSpan={2} className="jcb-group-header jcb-group-header-profit">Profit</th>
            </tr>
            <tr>
              {(['code','orig','rev','com','act','bv','proj','ctt','rvp','ocp','rcp','ai','rti','pp','pm'] as const).map((id) => {
                const c = COL_INFO[id];
                const cls = id === 'code' ? 'jcb-col-code' : (id === 'rev' || id === 'rvp') ? 'jcb-num jcb-emph' : 'jcb-num';
                if (id === 'code') {
                  return (
                    <th key={id} className={cls}>
                      <span className="jcb-code-head">
                        <input type="checkbox" className="jcb-check" aria-label="Select all" />
                        <BdsIcon name="chevron-down" size={14} className="jcb-blue" />
                        {c.label}
                      </span>
                    </th>
                  );
                }
                return (
                  <th key={id} className={cls}>
                    <button type="button" className={`jcb-col-title-btn ${openPopover === id ? 'is-active' : ''}`} onClick={() => togglePopover(id)} aria-expanded={openPopover === id}>
                      {c.label}
                    </button>
                    <span className="jcb-kebab" aria-hidden>⋮</span>
                    {openPopover === id && (
                      <div className="jcb-col-popover" role="dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="jcb-col-popover-title">{c.label}</div>
                        <div className="jcb-col-popover-body">{c.desc}</div>
                        {c.formula && <div className="jcb-col-popover-formula">{c.formula}</div>}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {grouped.map(({ category, items, sub }) => {
              const collapsed = collapsedCats.has(category);
              return (
              <Fragment key={category}>
                <tr className="jcb-category-row" data-code={`cat:${category}`}>
                  <th className="jcb-col-code">
                    <button type="button" className="jcb-category-toggle" onClick={() => toggleCat(category)} aria-expanded={!collapsed}>
                      <span className="jcb-category-sticky-content">
                        <input type="checkbox" className="jcb-check" aria-label={`Select ${category}`} onClick={(e) => e.stopPropagation()} />
                        <BdsIcon name={collapsed ? 'chevron-right' : 'chevron-down'} size={14} className="jcb-blue" />
                        {category}
                        <span className="jcb-category-count">({items.length})</span>
                      </span>
                    </button>
                  </th>
                  <td className="jcb-num">{fmt(sub.originalBudgetCosts)}</td>
                  <td className="jcb-num jcb-emph">{fmt(sub.revisedBudgetCosts)}</td>
                  <td className="jcb-num">{sub.committedCosts === 0 ? '--' : fmt(sub.committedCosts)}</td>
                  <td className="jcb-num">{fmt(sub.actualCosts)}</td>
                  <td className="jcb-num">{fmt(sub.builderVariance)}</td>
                  <td className="jcb-num">{fmt(sub.projectedCosts)}</td>
                  <td className="jcb-num">{fmt(sub.costToComplete)}</td>
                  {rvpCell(sub.revisedVsProjected, `Why is ${category} over budget?`, '', explainCategory(category, ROWS))}
                  <td className="jcb-num">{fmt(sub.originalOwnerPrice)}</td>
                  <td className="jcb-num">{fmt(sub.revisedOwnerPrice)}</td>
                  <td className="jcb-num">{fmt(sub.amountInvoiced)}</td>
                  <td className="jcb-num">{fmt(sub.remainingToInvoice)}</td>
                  <td className="jcb-num">{fmt(sub.projectedProfit)}</td>
                  <td className="jcb-num">{sub.revisedOwnerPrice ? fmtPct(sub.projectedMargin) : '--'}</td>
                </tr>
                {!collapsed && items.map(r => {
                  const rvp = rvpFor(r);
                  const ctt = cttFor(r);
                  return (
                    <Fragment key={r.code}>
                    <tr data-code={r.code}>
                      <td className="jcb-col-code">
                        <div className="jcb-col-code-inner jcb-col-code-nested">
                          <input type="checkbox" className="jcb-check" aria-label={`Select ${r.code}`} />
                          {aiVariant === 'cell' ? (
                            <button type="button" className="jcb-row-toggle" aria-expanded={expanded.has(r.code)} aria-label={`AI breakdown for ${r.code}`} onClick={() => toggleExpanded(r.code)}>
                              <BdsIcon name={expanded.has(r.code) ? 'chevron-down' : 'chevron-right'} size={14} className="jcb-blue" />
                            </button>
                          ) : <BdsIcon name="chevron-right" size={14} className="jcb-blue" />}
                          <span className="jcb-code-line"><span className="jcb-code-num">{r.code}</span> - <span className="jcb-code-name">{r.name}</span></span>
                        </div>
                      </td>
                      <td className="jcb-num">{fmt(r.originalBudgetCosts)}</td>
                      <td className="jcb-num jcb-emph">{fmt(r.revisedBudgetCosts)}</td>
                      <td className="jcb-num jcb-muted">{r.committedCosts === 0 ? '--' : fmt(r.committedCosts)}</td>
                      <td className="jcb-num">{fmt(r.actualCosts)}</td>
                      <td className="jcb-num">{r.builderVariance === 0 ? <span className="jcb-muted">--</span> : fmt(r.builderVariance)}</td>
                      <td className="jcb-num"><button type="button" className="jcb-cell-link" onClick={() => setDetailRow(r)}>{fmt(r.projectedCosts)}</button></td>
                      <td className="jcb-num">{fmt(ctt)}</td>
                      {rvpCell(rvp, `Why is ${r.code} ${r.name} over budget?`, '', explainRow(r))}
                      <td className="jcb-num">{fmt(r.originalOwnerPrice)}</td>
                      <td className="jcb-num">{fmt(r.revisedOwnerPrice)}</td>
                      <td className="jcb-num">{fmt(r.amountInvoiced)}</td>
                      <td className="jcb-num">{fmt(r.revisedOwnerPrice - r.amountInvoiced)}</td>
                      <td className="jcb-num">{fmt(r.revisedOwnerPrice - r.projectedCosts)}</td>
                      <td className="jcb-num">{r.revisedOwnerPrice ? fmtPct(((r.revisedOwnerPrice - r.projectedCosts) / r.revisedOwnerPrice) * 100) : '--'}</td>
                    </tr>
                    {aiVariant === 'cell' && expanded.has(r.code) && (
                      <tr className="jcb-expand-row">
                        <td colSpan={15}><RowBreakdown row={r} onAsk={askAi} /></td>
                      </tr>
                    )}
                    </Fragment>
                  );
                })}
              </Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th className="jcb-col-code">Totals</th>
              <td className="jcb-num">{fmt(totals.originalBudgetCosts)}</td>
              <td className="jcb-num jcb-emph">{fmt(totals.revisedBudgetCosts)}</td>
              <td className="jcb-num">{totals.committedCosts === 0 ? '--' : fmt(totals.committedCosts)}</td>
              <td className="jcb-num">{fmt(totals.actualCosts)}</td>
              <td className="jcb-num">{fmt(totals.builderVariance)}</td>
              <td className="jcb-num">{fmt(totals.projectedCosts)}</td>
              <td className="jcb-num">{fmt(totals.costToComplete)}</td>
              {rvpCell(totals.revisedVsProjected, 'Which cost codes are over budget?', 'jcb-nohl')}
              <td className="jcb-num">{fmt(totals.originalOwnerPrice)}</td>
              <td className="jcb-num">{fmt(totals.revisedOwnerPrice)}</td>
              <td className="jcb-num">{fmt(totals.amountInvoiced)}</td>
              <td className="jcb-num">{fmt(totals.remainingToInvoice)}</td>
              <td className="jcb-num">{fmt(profit)}</td>
              <td className="jcb-num">{totals.revisedOwnerPrice ? fmtPct(margin) : '--'}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      </>)}

    </div>
    {detailRow && (
      <CostDetailPanel
        row={detailRow}
        onClose={() => setDetailRow(null)}
        onAsk={(q) => { setDetailRow(null); askAi(q); }}
      />
    )}
    {usesPanel && aiOpen && <ChatSurface chat={chat} mode="panel" onClose={() => setAiOpen(false)} />}
    {cellPop && (
      <CellPopover
        key={cellPop.spec.title}
        spec={cellPop.spec}
        pos={cellPop.pos}
        onClose={closeCellPop}
        onShow={() => { setManualHl(cellPop.spec.hl); setCellPop(null); }}
        onAsk={() => { const q = cellPop.spec.ask; setCellPop(null); askAi(q); }}
      />
    )}
    {aiVariant === 'bar' && !aiOpen && <FloatingBar chat={chat} setOpen={setAiOpen} />}
    {aiVariant === 'floating' && (aiOpen
      ? <ChatSurface chat={chat} mode="floating" onClose={() => setAiOpen(false)} />
      : <FloatingLauncher onClick={() => setAiOpen(true)} />)}
    </div>
  );
}
