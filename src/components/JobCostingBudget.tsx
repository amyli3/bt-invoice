import { useState, useMemo } from 'react';
import '../bds-tokens.css';
import { BdsBadge, BdsButton, BdsIcon, BdsText } from '../bds';

/* ── Mock Data ──
   Modeled on the real BTNet JobCostingBudget (Open Book variant).
   References:
     BTNet/Clients.App/src/entity/budget/JobCostingBudget/
       JobCostingBudget.tsx  (top-level layout)
       BudgetContainer/JobCostingBudgetContainer.api.types.tsx  (column headers)
       JobCostingBudgetCostBreakdown/JobCostingBudgetCostBreakdown.tsx  (insights row)

   Cost-code totals reconcile with JobPriceSummary.tsx Slice 4 v5:
     Revised total          = $70,000
     Projected total        = $77,300
     Builder Variance       = $1,200
     Revised vs Projected   = −$7,300
     Customer-payable (cv)  = $6,100
     With 15% markup        = $7,015
*/

interface BudgetRow {
  code: string;
  name: string;
  costType: 'Labor' | 'Material' | 'Subcontractor' | 'Other';
  category: string;
  originalBudgetCosts: number;
  revisedBudgetCosts: number;
  committedCosts: number;
  actualCosts: number;
  builderVariance: number;
  projectedCosts: number;
  originalOwnerPrice: number;
  revisedOwnerPrice: number;
  amountInvoiced: number;
}

const ROWS: BudgetRow[] = [
  { code: '4100', name: 'Framing',             costType: 'Subcontractor', category: 'Structural', originalBudgetCosts: 25000, revisedBudgetCosts: 25000, committedCosts: 0,    actualCosts: 26500, builderVariance: 1200, projectedCosts: 28200, originalOwnerPrice: 28750, revisedOwnerPrice: 31050, amountInvoiced: 21000 },
  { code: '4500', name: 'HVAC',                costType: 'Subcontractor', category: 'Mechanical', originalBudgetCosts: 15000, revisedBudgetCosts: 15000, committedCosts: 0,    actualCosts: 14500, builderVariance: 0,    projectedCosts: 16100, originalOwnerPrice: 17250, revisedOwnerPrice: 18515, amountInvoiced: 10000 },
  { code: '7400', name: 'Plumbing rough-in',   costType: 'Subcontractor', category: 'Mechanical', originalBudgetCosts: 12000, revisedBudgetCosts: 12000, committedCosts: 0,    actualCosts: 11200, builderVariance: 0,    projectedCosts: 12200, originalOwnerPrice: 13800, revisedOwnerPrice: 14030, amountInvoiced: 9000 },
  { code: '7500', name: 'Electrical rough-in', costType: 'Subcontractor', category: 'Mechanical', originalBudgetCosts: 18000, revisedBudgetCosts: 18000, committedCosts: 0,    actualCosts: 19600, builderVariance: 0,    projectedCosts: 20800, originalOwnerPrice: 20700, revisedOwnerPrice: 23920, amountInvoiced: 14000 },
];

const MARKUP_PCT = 0.15;

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtSigned = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n));
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

/* ── Component ── */

export default function JobCostingBudget({ onBack, onOpenJPS }: { onBack?: () => void; onOpenJPS?: () => void }) {
  const [search, setSearch] = useState('');
  const [showRollup, setShowRollup] = useState(false);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ROWS;
    return ROWS.filter(r =>
      r.code.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.costType.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  }, [search]);

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

  // Insights — match real DifferenceFooter logic
  const projectedVsBudgetPct = totals.originalBudgetCosts ? ((totals.projectedCosts / totals.originalBudgetCosts) - 1) * 100 : 0;
  const profitVsEstimatedPct = totals.originalOwnerPrice ? ((totals.revisedOwnerPrice / totals.originalOwnerPrice) - 1) * 100 : 0;
  const actualPct = totals.projectedCosts ? (totals.actualCosts / totals.projectedCosts) * 100 : 0;
  const invoicedPct = totals.revisedOwnerPrice ? (totals.amountInvoiced / totals.revisedOwnerPrice) * 100 : 0;

  const rvpFor = (r: BudgetRow) => r.revisedBudgetCosts - r.projectedCosts;
  const cttFor = (r: BudgetRow) => r.projectedCosts - r.actualCosts;

  return (
    <div className="jcb-page">
      {/* ─── Page header ─── */}
      <div className="jcb-header">
        <div className="jcb-header-left">
          {onBack && (
            <button type="button" className="jcb-back" onClick={onBack}>
              <BdsIcon name="chevron-left" size={14} /> Back
            </button>
          )}
          <div>
            <BdsText as="h1" size="heavy-lg" className="jcb-title">Job Costing Budget</BdsText>
            <div className="jcb-sub">Sample Job · Open Book contract · 15% markup</div>
          </div>
        </div>
        <div className="jcb-header-right">
          <BdsButton displayType="tertiary" icon={<BdsIcon name="search" size={14} />} ariaLabel="Search" />
          <BdsButton displayType="tertiary" text="Print" />
          <BdsButton displayType="tertiary" text="Export" />
          <BdsButton displayType="primary" text="Edit budget" />
        </div>
      </div>

      {/* ─── Insights row (Open Book variant) ─── */}
      <div className="jcb-insights">
        {/* Card 1 — Projected Total Costs */}
        <div className="jcb-insight-card">
          <div className="jcb-insight-title">Projected Total Costs</div>
          <div className="jcb-insight-big">{fmt(totals.projectedCosts)}</div>
          <div className="jcb-insight-footer">
            {projectedVsBudgetPct > 0 ? (
              <>
                <BdsIcon name="arrow-up" size={12} className="jcb-icon-red" />
                <span className="jcb-neg">{fmtPct(Math.abs(projectedVsBudgetPct))}</span>
                <span className="jcb-insight-label">MORE THAN BUDGETED</span>
              </>
            ) : projectedVsBudgetPct < 0 ? (
              <>
                <BdsIcon name="arrow-down" size={12} className="jcb-icon-green" />
                <span className="jcb-pos">{fmtPct(Math.abs(projectedVsBudgetPct))}</span>
                <span className="jcb-insight-label">LESS THAN BUDGETED</span>
              </>
            ) : (
              <span className="jcb-insight-label">EQUAL TO BUDGETED</span>
            )}
          </div>
          <div className="jcb-pbar">
            <div className="jcb-pbar-track">
              <div className="jcb-pbar-fill jcb-pbar-teal" style={{ width: `${actualPct}%` }} />
              <div className="jcb-pbar-fill jcb-pbar-teal-striped" style={{ width: `${100 - actualPct}%` }} />
            </div>
            <div className="jcb-pbar-legend">
              <div>
                <span className="jcb-pbar-dot jcb-pbar-teal" />
                <strong>Actual costs</strong>
                <span>{fmt(totals.actualCosts)}</span>
              </div>
              <div>
                <span className="jcb-pbar-dot jcb-pbar-teal-striped" />
                <strong>Cost to complete</strong>
                <span>{fmt(totals.costToComplete)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 — Revised Client Price */}
        <div className="jcb-insight-card">
          <div className="jcb-insight-title">Revised Client Price</div>
          <div className="jcb-insight-big">{fmt(totals.revisedOwnerPrice)}</div>
          <div className="jcb-insight-footer">
            {profitVsEstimatedPct > 0 ? (
              <>
                <BdsIcon name="arrow-up" size={12} className="jcb-icon-green" />
                <span className="jcb-pos">{fmtPct(Math.abs(profitVsEstimatedPct))}</span>
                <span className="jcb-insight-label">HIGHER THAN ESTIMATED</span>
              </>
            ) : profitVsEstimatedPct < 0 ? (
              <>
                <BdsIcon name="arrow-down" size={12} className="jcb-icon-red" />
                <span className="jcb-neg">{fmtPct(Math.abs(profitVsEstimatedPct))}</span>
                <span className="jcb-insight-label">LOWER THAN ESTIMATED</span>
              </>
            ) : (
              <span className="jcb-insight-label">EQUAL TO ESTIMATED</span>
            )}
          </div>
          <div className="jcb-pbar">
            <div className="jcb-pbar-track">
              <div className="jcb-pbar-fill jcb-pbar-blue" style={{ width: `${invoicedPct}%` }} />
              <div className="jcb-pbar-fill jcb-pbar-blue-striped" style={{ width: `${100 - invoicedPct}%` }} />
            </div>
            <div className="jcb-pbar-legend">
              <div>
                <span className="jcb-pbar-dot jcb-pbar-blue" />
                <strong>Amount invoiced</strong>
                <span>{fmt(totals.amountInvoiced)}</span>
              </div>
              <div>
                <span className="jcb-pbar-dot jcb-pbar-blue-striped" />
                <strong>Left to invoice</strong>
                <span>{fmt(totals.remainingToInvoice)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Toolbar ─── */}
      <div className="jcb-toolbar">
        <div className="jcb-toolbar-left">
          <label className="jcb-control jcb-control-search">
            <BdsIcon name="search" size={14} />
            <input type="text" placeholder="Search cost codes" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
        </div>
        <div className="jcb-toolbar-right">
          <BdsBadge text={`${rows.length} cost codes`} displayType="default" textOnly />
        </div>
      </div>

      {/* ─── Spreadsheet ─── */}
      <div className="jcb-table-wrap">
        <table className="jcb-table">
          <thead>
            <tr>
              <th className="jcb-col-code">Cost codes</th>
              <th className="jcb-num">Original budget costs</th>
              <th className="jcb-num jcb-emph">Revised budget costs</th>
              <th className="jcb-num">Committed costs</th>
              <th className="jcb-num">Actual costs</th>
              <th className="jcb-num">Builder variance</th>
              <th className="jcb-num">Projected costs</th>
              <th className="jcb-num">Cost to complete</th>
              <th className="jcb-num jcb-emph">Revised vs projected</th>
              <th className="jcb-num">Revised client price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const rvp = rvpFor(r);
              const ctt = cttFor(r);
              return (
                <tr key={r.code}>
                  <td className="jcb-col-code">
                    <div className="jcb-col-code-inner">
                      <span className="jcb-code-num">{r.code}</span>
                      <span className="jcb-code-name">{r.name}</span>
                      <span className="jcb-cost-type">{r.costType}</span>
                    </div>
                  </td>
                  <td className="jcb-num">{fmt(r.originalBudgetCosts)}</td>
                  <td className="jcb-num jcb-emph">{fmt(r.revisedBudgetCosts)}</td>
                  <td className="jcb-num jcb-muted">{r.committedCosts === 0 ? '—' : fmt(r.committedCosts)}</td>
                  <td className="jcb-num">{fmt(r.actualCosts)}</td>
                  <td className="jcb-num">{r.builderVariance === 0 ? <span className="jcb-muted">—</span> : fmt(r.builderVariance)}</td>
                  <td className="jcb-num">{fmt(r.projectedCosts)}</td>
                  <td className="jcb-num">{fmt(ctt)}</td>
                  <td className={`jcb-num jcb-emph ${rvp < 0 ? 'jcb-neg' : rvp > 0 ? 'jcb-pos' : ''}`}>
                    {rvp === 0 ? fmt(0) : fmtSigned(rvp)}
                  </td>
                  <td className="jcb-num">{fmt(r.revisedOwnerPrice)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th className="jcb-col-code">Totals</th>
              <td className="jcb-num">{fmt(totals.originalBudgetCosts)}</td>
              <td className="jcb-num jcb-emph">{fmt(totals.revisedBudgetCosts)}</td>
              <td className="jcb-num">{totals.committedCosts === 0 ? '—' : fmt(totals.committedCosts)}</td>
              <td className="jcb-num">{fmt(totals.actualCosts)}</td>
              <td className="jcb-num">{fmt(totals.builderVariance)}</td>
              <td className="jcb-num">{fmt(totals.projectedCosts)}</td>
              <td className="jcb-num">{fmt(totals.costToComplete)}</td>
              <td className={`jcb-num jcb-emph ${totals.revisedVsProjected < 0 ? 'jcb-neg' : 'jcb-pos'}`}>
                {fmtSigned(totals.revisedVsProjected)}
              </td>
              <td className="jcb-num">{fmt(totals.revisedOwnerPrice)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ─── Prototype-only: rollup to JPS v5 ─── */}
      <div className="jcb-rollup">
        <button
          type="button"
          className="jcb-rollup-toggle"
          onClick={() => setShowRollup(s => !s)}
          aria-expanded={showRollup}
        >
          <BdsIcon name={showRollup ? 'chevron-down' : 'chevron-right'} size={12} />
          How this rolls up to Job Price Summary
          <span className="jcb-rollup-tag">prototype</span>
        </button>
        {showRollup && (
          <div className="jcb-rollup-body">
            <div className="jcb-rollup-math">
              <div className="jcb-math-line"><span>Revised vs projected</span><span>{fmtSigned(totals.revisedVsProjected)}</span></div>
              <div className="jcb-math-line"><span>Less: Builder variance (absorbed)</span><span>{fmtSigned(-totals.builderVariance)}</span></div>
              <div className="jcb-math-line jcb-math-sub">
                <span>Customer-payable cost change</span>
                <span className={totals.customerPayable > 0 ? 'jcb-neg' : 'jcb-pos'}>{fmtSigned(totals.customerPayable)}</span>
              </div>
              <div className="jcb-math-line"><span>Markup ({(MARKUP_PCT * 100).toFixed(0)}%)</span><span>{fmtSigned(totals.customerPayableWithMarkup - totals.customerPayable)}</span></div>
              <div className="jcb-math-line jcb-math-total">
                <span>Total to client price</span>
                <span className={totals.customerPayableWithMarkup > 0 ? 'jcb-neg' : 'jcb-pos'}>{fmtSigned(totals.customerPayableWithMarkup)}</span>
              </div>
            </div>
            {onOpenJPS && (
              <button type="button" className="jcb-rollup-link" onClick={onOpenJPS}>
                View on Job Price Summary <BdsIcon name="arrow-right" size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
