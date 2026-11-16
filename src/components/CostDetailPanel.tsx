import { useEffect } from 'react';
import { BdsIcon } from '../bds';
import { SparkIcon } from './BudgetAssistant';
import type { BudgetRow } from '../jcbMockData';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const whole = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

type Insight = { tone: 'bad' | 'warn' | 'good'; text: string };

/** Scripted insights derived from one cost code's numbers. */
function insightsFor(r: BudgetRow): { headline: string; tone: Insight['tone']; items: Insight[]; questions: string[] } {
  const over = r.projectedCosts - r.revisedBudgetCosts;
  const burn = r.projectedCosts ? (r.actualCosts / r.projectedCosts) * 100 : 0;
  const items: Insight[] = [];
  if (r.actualCosts > r.revisedBudgetCosts) items.push({ tone: 'bad', text: `Actual costs (${whole(r.actualCosts)}) have already passed the revised budget by ${whole(r.actualCosts - r.revisedBudgetCosts)}.` });
  if (r.builderVariance) items.push({ tone: 'warn', text: `${whole(r.builderVariance)} of bills are marked builder variance, so you absorb them instead of billing the client.` });
  if (r.committedCosts > r.revisedBudgetCosts) items.push({ tone: 'warn', text: `Committed POs (${whole(r.committedCosts)}) are above the revised budget.` });
  const adj = r.projectedCosts - r.revisedBudgetCosts - r.builderVariance;
  if (adj > 0) items.push({ tone: 'warn', text: `The forecast includes ${whole(adj)} above revised budget plus variance, from adjustments or the projection reference.` });
  if (!items.length && over <= 0) items.push({ tone: 'good', text: `${Math.round(burn)}% of the projected cost has been spent and nothing is trending over.` });
  if (!items.length) items.push({ tone: 'warn', text: 'Projected cost is above budget with no bills or POs explaining it yet. Check the projection reference.' });
  const label = `${r.code} ${r.name}`;
  return {
    tone: over > 0 ? 'bad' : 'good',
    headline: over > 0 ? `${whole(over)} over budget` : over < 0 ? `${whole(-over)} under budget` : 'On budget',
    items,
    questions: over > 0
      ? [`Why is ${label} over budget?`, `Should I pass the ${r.code} overage to the client?`, `What changed in ${label} since the original budget?`]
      : [`Is ${label} on track to finish on budget?`, `What changed in ${label} since the original budget?`],
  };
}

/** Right-side detail for one cost code's projected costs, with an AI insight block. */
export default function CostDetailPanel({ row, onClose, onAsk }: { row: BudgetRow; onClose: () => void; onAsk: (q: string) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const ins = insightsFor(row);
  const adjustments = row.projectedCosts - row.revisedBudgetCosts - row.builderVariance;
  return (
    <aside className="cdp" aria-label={`Projected costs for ${row.code}`}>
      <header className="cdp-head">
        <div>
          <div className="cdp-crumb">{row.category} • {row.code} - {row.name}</div>
          <h2 className="cdp-title">Projected costs</h2>
        </div>
        <button type="button" className="ba-x" onClick={onClose} aria-label="Close"><BdsIcon name="x" size={18} /></button>
      </header>

      <div className="cdp-body">
        <div className="cdp-total">{money(row.projectedCosts)}</div>

        {/* AI insight block */}
        <section className="cdp-ai" aria-label="AI insight">
          <div className="cdp-ai-head">
            <span className="cdp-ai-title"><SparkIcon size={14} /> AI insight</span>
            <span className={`cdp-pill cdp-pill-${ins.tone}`}>{ins.headline}</span>
          </div>
          <ul className="cdp-ai-list">
            {ins.items.map((it, i) => <li key={i} className={`cdp-dot-${it.tone}`}>{it.text}</li>)}
          </ul>
          <div className="cdp-ai-ask">Ask about this code</div>
          <div className="ba-chips">
            {ins.questions.map(q => <button key={q} type="button" className="ba-chip" onClick={() => onAsk(q)}>{q}</button>)}
          </div>
        </section>

        <div className="cdp-field-label">Projection reference</div>
        <div className="cdp-select"><span className="cdp-radio" /> Budgeted costs <BdsIcon name="chevron-down" size={14} /></div>
        <p className="cdp-note">The budget is looking at <b>revised budget costs + builder variance</b> for this cost code.</p>

        <div className="cdp-row">
          <div>
            <div className="cdp-row-title">Revised budget</div>
            <div className="cdp-row-sub">Original budget costs + change orders + approved selections &amp; choices marked "include in budget"</div>
          </div>
          <div className="cdp-row-val">{money(row.revisedBudgetCosts)}</div>
        </div>
        <div className="cdp-row">
          <div className="cdp-row-title">Builder variance bills</div>
          <div className="cdp-row-val">{row.builderVariance ? money(row.builderVariance) : '--'}</div>
        </div>
        <div className="cdp-row">
          <div>
            <div className="cdp-row-title">Adjustments</div>
            <div className="cdp-row-sub">Temporarily adjust projections until costs are finalized</div>
          </div>
          <div className="cdp-row-val">{adjustments > 0 ? money(adjustments) : <button type="button" className="cdp-adj">+ Adjustment</button>}</div>
        </div>
        <div className="cdp-row cdp-row-total">
          <div className="cdp-row-title">Projected cost total</div>
          <div className="cdp-row-val">{money(row.projectedCosts)}</div>
        </div>
      </div>
    </aside>
  );
}
