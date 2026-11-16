import { useEffect, useRef, useState } from 'react';
import { BdsIcon, BdsButton, BdsBadge, BdsText } from '../bds';
import { SparkIcon, Sections, type FactSection, type Highlight } from './BudgetAssistant';
import type { BudgetRow } from '../jcbMockData';

/* Extra AI explorations for the Job Costing Budget:
   - Cell explain (popover on an over-budget cell + expandable row breakdown)
   - Insight strip (AI speaks first)
   - AI view bar (describe a view, the grid reshapes) */

export const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

export type ExplainLine = { label: string; value: string; note: string; bad?: boolean };
export type Explain = { title: string; summary: string; lines: ExplainLine[]; hl: Highlight[]; ask: string };

export function explainRow(r: BudgetRow): Explain {
  const over = r.projectedCosts - r.revisedBudgetCosts;
  const left = r.revisedBudgetCosts - r.actualCosts;
  const remaining = r.projectedCosts - r.actualCosts;
  const pct = r.revisedBudgetCosts ? Math.round((r.actualCosts / r.revisedBudgetCosts) * 100) : 0;
  const lines: ExplainLine[] = [
    { label: 'Spent so far', value: fmt(r.actualCosts), note: `${pct}% of the ${fmt(r.revisedBudgetCosts)} revised budget`, bad: r.actualCosts > r.revisedBudgetCosts },
    { label: 'Still to spend', value: fmt(remaining), note: left >= 0 ? `Forecast vs ${fmt(left)} of budget left` : 'Budget is already used up', bad: remaining > Math.max(left, 0) },
  ];
  if (r.builderVariance) lines.push({ label: 'Builder variance', value: fmt(r.builderVariance), note: 'Absorbed by you, not passed to the client', bad: true });
  const pastBudget = r.actualCosts - r.revisedBudgetCosts;
  const summary = over <= 0
    ? 'On track. Projected cost matches the revised budget.'
    : pastBudget > 0
      ? `Already past budget by ${fmt(pastBudget)}, and the forecast adds ${fmt(remaining)} more.`
      : `Spending is on budget so far, but the forecast to finish is ${fmt(over)} above it.`;
  const hl: Highlight[] = [{ code: r.code, col: 'rev' }, { code: r.code, col: 'proj' }, { code: r.code, col: 'rvp' }];
  if (pastBudget > 0) hl.push({ code: r.code, col: 'act' });
  if (r.builderVariance) hl.push({ code: r.code, col: 'bv' });
  return { title: `${r.code} ${r.name}`, summary, lines, hl, ask: `Why is ${r.code} ${r.name} over budget?` };
}

export function explainCategory(category: string, rows: BudgetRow[]): Explain {
  const over = rows.filter(r => r.category === category && r.projectedCosts > r.revisedBudgetCosts);
  const total = over.reduce((a, r) => a + r.projectedCosts - r.revisedBudgetCosts, 0);
  return {
    title: `${category} category`,
    summary: `${fmt(total)} over budget, driven by ${over.length} cost code${over.length === 1 ? '' : 's'}.`,
    lines: over.map(r => ({
      label: `${r.code} ${r.name}`,
      value: `+${fmt(r.projectedCosts - r.revisedBudgetCosts)}`,
      note: r.actualCosts > r.revisedBudgetCosts ? 'Actuals already above budget' : 'Forecast to finish above budget',
      bad: true,
    })),
    hl: [{ code: `cat:${category}`, col: 'rvp' }, ...over.map(r => ({ code: r.code, col: 'rvp' }))],
    ask: `Why is ${category} over budget?`,
  };
}

/* ── Insights ── */

export type Insight = { id: string; tone: 'red' | 'amber' | 'blue'; kicker: string; title: string; body: string; hl: Highlight[]; ask: string };

export function buildInsights(rows: BudgetRow[]): Insight[] {
  const over = rows.map(r => ({ r, d: r.projectedCosts - r.revisedBudgetCosts })).filter(x => x.d > 0).sort((a, b) => b.d - a.d);
  const totalOver = over.reduce((a, x) => a + x.d, 0);
  const out: Insight[] = [];
  if (over.length) {
    const top3 = over.slice(0, 3);
    const share = Math.round((top3.reduce((a, x) => a + x.d, 0) / totalOver) * 100);
    out.push({
      id: 'over', tone: 'red', kicker: 'Cost overrun',
      title: `${over.length} cost codes are projected over budget`,
      body: `${fmt(totalOver)} above plan. ${top3.map(x => x.r.name).join(', ')} make up ${share}% of it.`,
      hl: over.map(x => ({ code: x.r.code, col: 'rvp' })),
      ask: 'Which cost codes are over budget?',
    });
  }
  // On-budget codes only: over-budget codes already have the overrun card.
  const gaps = rows
    .filter(r => r.actualCosts > 0 && r.revisedBudgetCosts && r.revisedOwnerPrice && r.projectedCosts <= r.revisedBudgetCosts)
    .map(r => ({ r, gap: r.actualCosts / r.revisedBudgetCosts - r.amountInvoiced / r.revisedOwnerPrice, left: r.revisedOwnerPrice - r.amountInvoiced }))
    .filter(x => x.gap > 0.2)
    .sort((a, b) => b.left - a.left);
  if (gaps.length) {
    const g = gaps[0];
    out.push({
      id: 'bill', tone: 'blue', kicker: 'Billing behind work',
      title: `${gaps.length} code${gaps.length === 1 ? ' is' : 's are'} invoiced behind what you've spent`,
      body: `${g.r.name}: ${Math.round((g.r.actualCosts / g.r.revisedBudgetCosts) * 100)}% of budget spent, ${Math.round((g.r.amountInvoiced / g.r.revisedOwnerPrice) * 100)}% invoiced. ${fmt(g.left)} left to bill.`,
      hl: gaps.flatMap(x => [{ code: x.r.code, col: 'ai' }, { code: x.r.code, col: 'act' }]),
      ask: 'How much is left to invoice?',
    });
  }
  return out;
}

/* ── Cell popover ── */

export type PopPos = { left: number; top?: number; bottom?: number };

export function CellPopover({ spec, pos, onClose, onShow, onAsk }: { spec: Explain; pos: PopPos; onClose: () => void; onShow: () => void; onAsk: () => void }) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = window.setTimeout(() => setLoading(false), 650); return () => window.clearTimeout(t); }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const down = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('.ba-pop, .jcb-ai-cell')) onClose(); };
    document.addEventListener('keydown', key);
    document.addEventListener('mousedown', down);
    window.addEventListener('scroll', onClose, true);
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('mousedown', down); window.removeEventListener('scroll', onClose, true); };
  }, [onClose]);
  return (
    <div className="ba-pop" role="dialog" aria-label="AI explanation" style={{ left: pos.left, top: pos.top, bottom: pos.bottom }}>
      <div className="ba-pop-head">
        <span className="ba-pop-kicker"><SparkIcon size={13} /> Why is this over budget?</span>
        <button type="button" className="ba-x" onClick={onClose} aria-label="Close"><BdsIcon name="x" size={14} /></button>
      </div>
      <div className="ba-pop-title">{spec.title}</div>
      {loading ? (
        <div className="ba-pop-skel"><i /><i /><i /></div>
      ) : (
        <>
          <p className="ba-pop-summary">{spec.summary}</p>
          <ul className="ba-pop-lines">
            {spec.lines.map(l => (
              <li key={l.label}>
                <div><span className="ba-pop-label">{l.label}</span><span className="ba-pop-note">{l.note}</span></div>
                <span className={`ba-pop-val ${l.bad ? 'is-bad' : ''}`}>{l.value}</span>
              </li>
            ))}
          </ul>
          <div className="ba-pop-actions">
            <button type="button" className="ba-pop-btn" onClick={onShow}>Show in table</button>
            <button type="button" className="ba-link" onClick={onAsk}>Ask a follow-up</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Expanded row breakdown ── */

export function RowBreakdown({ row, onAsk }: { row: BudgetRow; onAsk: (q: string) => void }) {
  const spec = explainRow(row);
  const max = Math.max(row.revisedBudgetCosts, row.projectedCosts, row.actualCosts, 1);
  const bars = [
    { label: 'Revised budget', v: row.revisedBudgetCosts, cls: 'is-budget' },
    { label: 'Actual so far', v: row.actualCosts, cls: row.actualCosts > row.revisedBudgetCosts ? 'is-bad' : 'is-actual' },
    { label: 'Projected', v: row.projectedCosts, cls: row.projectedCosts > row.revisedBudgetCosts ? 'is-bad' : 'is-actual' },
  ];
  return (
    <div className="ba-expand">
      <div className="ba-expand-text">
        <div className="ba-pop-kicker"><SparkIcon size={13} /> AI breakdown</div>
        <p className="ba-pop-summary">{spec.summary}</p>
        <ul className="ba-pop-lines">
          {spec.lines.map(l => (
            <li key={l.label}>
              <div><span className="ba-pop-label">{l.label}</span><span className="ba-pop-note">{l.note}</span></div>
              <span className={`ba-pop-val ${l.bad ? 'is-bad' : ''}`}>{l.value}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="ba-link" onClick={() => onAsk(spec.ask)}>Ask a follow-up</button>
      </div>
      <div className="ba-expand-bars" aria-label="Budget versus actual versus projected">
        {bars.map(b => (
          <div key={b.label} className="ba-bar-row">
            <span className="ba-bar-label">{b.label}</span>
            <span className="ba-bar-track"><span className={`ba-bar-fill ${b.cls}`} style={{ width: `${(b.v / max) * 100}%` }} /></span>
            <span className="ba-bar-val">{fmt(b.v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Insight strip ── */

export function InsightStrip({ insights, onShow, onAsk, onHide }: { insights: Insight[]; onShow: (i: Insight) => void; onAsk: (q: string) => void; onHide: () => void }) {
  return (
    <section className="ba-insights" aria-label="Insights">
      <div className="ba-insights-head">
        <span className="ba-insights-title"><SparkIcon size={14} /> {insights.length} insight{insights.length === 1 ? '' : 's'} on this budget</span>
        <BdsButton displayType="tertiary" text="Hide" onClick={onHide} />
      </div>
      <div className="ba-insights-grid">
        {insights.map(i => (
          <article key={i.id} className={`ba-insight ba-insight-${i.tone}`}>
            <BdsBadge text={i.kicker} displayType="info" />
            <BdsText as="div" size="heavy-md" className="ba-insight-title">{i.title}</BdsText>
            <BdsText as="p" size="normal-md" className="ba-insight-body">{i.body}</BdsText>
            <div className="ba-insight-actions">
              <BdsButton displayType="secondary" text="Show in table" onClick={() => onShow(i)} />
              <BdsButton displayType="tertiary" icon={<SparkIcon size={14} />} text="Ask AI" onClick={() => onAsk(i.ask)} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* Right-aligned in the summary bar: a compact trigger that opens the insights as an overlay, so the page layout never grows. */
export function InsightsFlyout({ insights, onShow, onAsk }: { insights: Insight[]; onShow: (i: Insight) => void; onAsk: (q: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [open]);
  return (
    <div className="ba-flyout" ref={ref}>
      <button type="button" className={`ba-flyout-btn ${open ? 'is-open' : ''}`} aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <SparkIcon size={14} />
        <span><b>{insights.length}</b> insight{insights.length === 1 ? '' : 's'}</span>
        <BdsIcon name={open ? 'chevron-up' : 'chevron-down'} size={14} />
      </button>
      {open && (
        <div className="ba-flyout-pop" role="dialog" aria-label="Insights">
          {insights.map(i => (
            <article key={i.id} className={`ba-insight ba-insight-${i.tone}`}>
              <BdsBadge text={i.kicker} displayType="info" />
              <BdsText as="div" size="heavy-md" className="ba-insight-title">{i.title}</BdsText>
              <BdsText as="p" size="normal-md" className="ba-insight-body">{i.body}</BdsText>
              <div className="ba-insight-actions">
                <BdsButton displayType="secondary" text="Show in table" onClick={() => { setOpen(false); onShow(i); }} />
                <BdsButton displayType="tertiary" icon={<SparkIcon size={14} />} text="Ask AI" onClick={() => { setOpen(false); onAsk(i.ask); }} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── AI view bar ── */

export type ViewChip = { label: string; onRemove: () => void };

export function AiViewBar({ onSubmit, busy, chips, result, onClearResult, suggestions }: {
  onSubmit: (q: string) => void; busy: boolean; chips: ViewChip[];
  result: { q: string; text: string; hl: number; sections?: FactSection[]; hint?: string } | null; onClearResult: () => void; suggestions: string[];
}) {
  const [v, setV] = useState('');
  const [focus, setFocus] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const submit = (q = v) => { if (q.trim() && !busy) { onSubmit(q); setV(''); setFocus(true); } };
  useEffect(() => {
    if (!focus) return;
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setFocus(false); };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [focus]);
  const showSuggest = focus && !v && !busy && !result;
  const showResult = busy || (!!result && focus);
  return (
    <div className="ba-viewai-inline" ref={ref} aria-label="AI view bar">
      <div className="ba-composer">
        <span className="ba-viewai-spark"><SparkIcon size={12} /></span>
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onFocus={() => setFocus(true)}
          onClick={() => setFocus(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setFocus(false); }}
          placeholder="Ask AI or describe a view"
          aria-label="Describe the view you want"
        />
        <button type="button" className="ba-send" onClick={() => submit()} disabled={!v.trim() || busy} aria-label="Apply"><BdsIcon name="arrow-up" size={14} /></button>
      </div>
      {chips.length > 0 && (
        <div className="ba-viewai-chips">
          {chips.map(c => (
            <span key={c.label} className="ba-filter-chip">{c.label}<button type="button" onClick={c.onRemove} aria-label={`Remove ${c.label}`}>×</button></span>
          ))}
        </div>
      )}
      {(showSuggest || showResult) && (
        <div className="ba-viewai-drop">
          {showSuggest && (
            <div className="ba-chips ba-chips-inline">
              {suggestions.map(s => <button key={s} type="button" className="ba-chip" onClick={() => submit(s)}>{s}</button>)}
            </div>
          )}
          {showResult && (
            <div className="ba-inline-card">
              {result && !busy && <div className="ba-inline-q">{result.q}</div>}
              {busy ? <div className="ba-typing"><i /><i /><i /></div> : (
                <div className="ba-inline-a">
                  <div className={result?.sections?.length ? 'ba-lead' : ''}>{result?.text}</div>
                  <Sections sections={result?.sections} />
                  {result?.hint && <div className="ba-hint">{result.hint}</div>}
                  {result && result.hl > 0 && <div className="ba-hl-note"><span className="ba-hl-swatch" />{result.hl} cell{result.hl === 1 ? '' : 's'} highlighted in the grid</div>}
                </div>
              )}
              {!busy && <button type="button" className="ba-link" onClick={onClearResult}>Dismiss</button>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Job picker rail (prototype stand-in for the real left-hand job picker) ── */

export function JobRail({ jobs, currentId, overIds, open, onToggle, onSelect, allLabel, allSelected, onSelectAll }: {
  jobs: { id: string; name: string }[]; currentId: string; overIds: Set<string>; open: boolean; onToggle: () => void; onSelect: (id: string) => void;
  /** Row at the top of the list that scopes the assistant to every job. */
  allLabel?: string; allSelected?: boolean; onSelectAll?: () => void;
}) {
  if (!open) {
    return (
      <aside className="jcb-rail is-collapsed" aria-label="Job picker">
        <button type="button" className="jcb-rail-toggle" onClick={onToggle} aria-label="Show job picker" title="Show job picker"><BdsIcon name="chevron-right" size={14} /></button>
      </aside>
    );
  }
  return (
    <aside className="jcb-rail" aria-label="Job picker">
      <div className="jcb-rail-head">
        <span>Jobs</span>
        <button type="button" className="jcb-rail-toggle" onClick={onToggle} aria-label="Hide job picker" title="Hide job picker"><BdsIcon name="chevron-left" size={14} /></button>
      </div>
      <ul className="jcb-rail-list">
        {onSelectAll && (
          <li>
            <button type="button" className={`jcb-rail-job jcb-rail-all ${allSelected ? 'is-on' : ''}`} aria-current={allSelected} onClick={onSelectAll}>
              <span>{allLabel ?? 'All open jobs'}</span>
            </button>
          </li>
        )}
        {jobs.map(j => (
          <li key={j.id}>
            <button type="button" className={`jcb-rail-job ${j.id === currentId && !allSelected ? 'is-on' : ''}`} aria-current={j.id === currentId && !allSelected} onClick={() => onSelect(j.id)}>
              <span>{j.name}</span>
              {overIds.has(j.id) && <i className="jcb-rail-dot" title="Projected over budget" />}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
